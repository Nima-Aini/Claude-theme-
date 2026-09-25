import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { customers, discountCodes, orders, products, shops, stands } from "@/db/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { requireAdmin, verifyToken } from "@/lib/auth";
import { failPaymentRequest, reconcileExpiredReservations } from "@/lib/order-payment";
import { requestPayment, siteUrl } from "@/lib/zarinpal";

async function ensureSchema() {
  const c = await pool.connect();
  try {
    await c.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_postal_code VARCHAR(10);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_link TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      UPDATE orders SET created_at = NOW() WHERE created_at IS NULL;
    `);
  } finally { c.release(); }
}
export async function GET(req: NextRequest) {
  await ensureSchema();
  const token =
    req.cookies.get("admin_token")?.value ||
    req.cookies.get("shop_token")?.value ||
    req.cookies.get("customer_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (payload.type === "admin" || payload.role === "admin") {
    const allOrders = await db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt));
    return NextResponse.json(allOrders);
  }

  if (payload.type === "shop") {
    const shopOrders = await db
      .select()
      .from(orders)
      .where(and(eq(orders.shopId, payload.id as number), inArray(orders.paymentStatus, ["paid", "legacy"])))
      .orderBy(desc(orders.createdAt));
    return NextResponse.json(shopOrders);
  }

  if (payload.type === "customer") {
    const customerOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.customerId, payload.id as number))
      .orderBy(desc(orders.createdAt));
    return NextResponse.json(customerOrders);
  }

  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  await ensureSchema();
  try { siteUrl(); if (!process.env.ZARINPAL_MERCHANT_ID) throw new Error(); }
  catch { return NextResponse.json({ error: "درگاه پرداخت تنظیم نشده است" }, { status: 503 }); }
  const token = req.cookies.get("customer_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "customer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const shopId = Number(body.shopId);
  const requestedItems = Array.isArray(body.items) ? body.items : [];
  if (!Number.isInteger(shopId) || requestedItems.length < 1 || requestedItems.length > 100)
    return NextResponse.json({ error: "سبد خرید نامعتبر است" }, { status: 400 });

  const shop = await db
    .select()
    .from(shops)
    .where(eq(shops.id, shopId))
    .then((r) => r[0]);
  if (!shop) return NextResponse.json({ error: "فروشگاه پیدا نشد" }, { status: 404 });
  const customer = await db.select({ phone: customers.phone }).from(customers).where(eq(customers.id, payload.id as number)).then((rows) => rows[0]);
  if (!customer) return NextResponse.json({ error: "مشتری پیدا نشد" }, { status: 401 });
  const customerName = String(body.customerName || "").trim();
  const customerAddress = String(body.customerAddress || "").trim();
  const postalCode = String(body.customerPostalCode || "").trim();
  const shippingMethod = String(body.shippingMethod || "");
  if (!customerName || !customerAddress || !/^\d{10}$/.test(postalCode) || !["post", "tipax"].includes(shippingMethod)) {
    return NextResponse.json({ error: "اطلاعات ارسال نامعتبر است" }, { status: 400 });
  }
  try { await reconcileExpiredReservations(); }
  catch (error) { console.error("[payment] expired-reservation recovery failed", error); }

  const grouped = new Map<string, { itemType: "product" | "stand"; id: number; quantity: number }>();
  for (const raw of requestedItems) {
    if (raw?.itemType !== "stand" && raw?.itemType !== "product") return NextResponse.json({ error: "نوع کالا نامعتبر است" }, { status: 400 });
    const itemType = raw.itemType as "stand" | "product";
    const id = Number(itemType === "stand" ? raw?.standId ?? raw?.id : raw?.productId ?? raw?.id);
    const quantity = Number(raw?.quantity);
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 100)
      return NextResponse.json({ error: "یکی از اقلام سبد خرید نامعتبر است" }, { status: 400 });
    const key = `${itemType}:${id}`;
    const current = grouped.get(key);
    const combined = (current?.quantity || 0) + quantity;
    if (combined > 100) return NextResponse.json({ error: "تعداد کالا نامعتبر است" }, { status: 400 });
    grouped.set(key, { itemType, id, quantity: combined });
  }

  const productIds = [...grouped.values()].filter((i) => i.itemType === "product").map((i) => i.id);
  const standIds = [...grouped.values()].filter((i) => i.itemType === "stand").map((i) => i.id);
  const [productRows, standRows] = await Promise.all([
    productIds.length ? db.select().from(products).where(inArray(products.id, productIds)) : Promise.resolve([]),
    standIds.length ? db.select().from(stands).where(and(inArray(stands.id, standIds), eq(stands.isActive, true))) : Promise.resolve([]),
  ]);
  const productMap = new Map(productRows.map((item) => [item.id, item]));
  const standMap = new Map(standRows.map((item) => [item.id, item]));
  let canonicalItems: Array<{ itemType: "product" | "stand"; productId?: number; standId?: number; name: string; price: number; quantity: number; image: string | null }>;
  try {
    canonicalItems = [...grouped.values()].map((requested) => {
      const item = requested.itemType === "stand" ? standMap.get(requested.id) : productMap.get(requested.id);
      if (!item) throw new Error("یکی از اقلام سبد خرید دیگر در دسترس نیست");
      if ((item.stock ?? 0) - item.reservedStock < requested.quantity) throw new Error(`موجودی «${item.name}» کافی نیست`);
      return {
        itemType: requested.itemType,
        productId: requested.itemType === "product" ? item.id : undefined,
        standId: requested.itemType === "stand" ? item.id : undefined,
        name: item.name,
        price: item.price,
        quantity: requested.quantity,
        image: item.image,
      };
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "سبد خرید نامعتبر است" }, { status: 409 });
  }
  const subtotal = canonicalItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  if (!Number.isSafeInteger(subtotal)) return NextResponse.json({ error: "مبلغ سفارش نامعتبر است" }, { status: 400 });
  let totalAmount = subtotal;
  const discountCode = typeof body.discountCode === "string" ? body.discountCode.trim().toUpperCase() : "";
  if (discountCode) {
    const discount = await db.select().from(discountCodes).where(and(eq(discountCodes.code, discountCode), eq(discountCodes.isActive, true))).then((rows) => rows[0]);
    if (!discount) return NextResponse.json({ error: "کد تخفیف نامعتبر یا غیرفعال است" }, { status: 400 });
    const value = discount.value || discount.percentage || 0;
    const amount = discount.type === "amount" ? Math.min(value, subtotal) : Math.floor(subtotal * Math.min(value, 100) / 100);
    totalAmount = Math.max(0, subtotal - amount);
  }
  if (totalAmount <= 0) return NextResponse.json({ error: "مبلغ پرداخت باید بیشتر از صفر باشد" }, { status: 400 });

  const commissionRate = shop.commissionRate ?? 10;
  const commissionAmount = Math.floor((totalAmount * commissionRate) / 100);
  let order: typeof orders.$inferSelect;
  try {
    order = await db.transaction(async (tx) => {
      for (const item of canonicalItems) {
        const result = item.itemType === "stand"
          ? await tx.update(stands).set({ reservedStock: sql`${stands.reservedStock} + ${item.quantity}` }).where(and(eq(stands.id, item.standId!), eq(stands.isActive, true), eq(stands.price, item.price), sql`${stands.stock} - ${stands.reservedStock} >= ${item.quantity}`)).returning({ id: stands.id })
          : await tx.update(products).set({ reservedStock: sql`${products.reservedStock} + ${item.quantity}` }).where(and(eq(products.id, item.productId!), eq(products.price, item.price), sql`${products.stock} - ${products.reservedStock} >= ${item.quantity}`)).returning({ id: products.id });
        if (!result[0]) throw new Error(`موجودی «${item.name}» کافی نیست`);
      }
      const inserted = await tx.insert(orders).values({
      customerId: payload.id as number,
      shopId,
      customerName,
      customerPhone: customer.phone,
      customerAddress,
      customerPostalCode: postalCode,
      shippingMethod,
      totalAmount,
      commissionAmount: 0,
      commissionQuoteAmount: commissionAmount,
      paymentMethod: "zarinpal",
      paymentStatus: "pending",
      paymentExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
      reservationActive: true,
      items: canonicalItems,
      status: "pending_payment",
      createdAt: new Date(),
      }).returning();
      return inserted[0];
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ثبت سفارش انجام نشد" }, { status: 409 });
  }
  try {
    const payment = await requestPayment(order.id, order.totalAmount, customer.phone);
    await db.update(orders).set({ paymentAuthority: payment.authority }).where(and(eq(orders.id, order.id), eq(orders.paymentStatus, "pending")));
    return NextResponse.json({ orderId: order.id, paymentUrl: payment.paymentUrl });
  } catch (error) {
    await failPaymentRequest(order.id);
    console.error("[payment] request failed", { orderId: order.id, error: error instanceof Error ? error.message : "unknown" });
    return NextResponse.json({ error: "دریافت لینک پرداخت ناموفق بود؛ دوباره تلاش کنید" }, { status: 502 });
  }
}

export async function PUT(req: NextRequest) {
  await ensureSchema();
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = Number(body.id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "شناسه سفارش نامعتبر است" }, { status: 400 });

  const allowedStatuses = ["pending", "processing", "shipped", "delivered", "cancelled"];
  const status = typeof body.status === "string" && allowedStatuses.includes(body.status) ? body.status : undefined;
  const trackingLink = typeof body.trackingLink === "string" ? body.trackingLink.trim() || null : undefined;
  if (!status && trackingLink === undefined)
    return NextResponse.json({ error: "هیچ تغییری ارسال نشده است" }, { status: 400 });

  const data: { status?: string; trackingLink?: string | null } = {};
  if (status) data.status = status;
  if (trackingLink !== undefined) data.trackingLink = trackingLink;

  const existing = await db.select({ paymentStatus: orders.paymentStatus }).from(orders).where(eq(orders.id, id)).then((rows) => rows[0]);
  if (!existing) return NextResponse.json({ error: "سفارش پیدا نشد" }, { status: 404 });
  if (existing.paymentStatus !== "paid" && existing.paymentStatus !== "legacy") {
    return NextResponse.json({ error: "سفارش پرداخت‌نشده قابل ویرایش نیست" }, { status: 409 });
  }
  const result = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: "سفارش پیدا نشد" }, { status: 404 });
  return NextResponse.json(result[0]);
}
