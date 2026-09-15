import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { discountCodes, orders, products, shops, stands } from "@/db/schema";
import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { requireAdmin, verifyToken } from "@/lib/auth";
import { sendOrderSMS } from "@/lib/sms";

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
      .where(eq(orders.shopId, payload.id as number))
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

  const grouped = new Map<string, { itemType: "product" | "stand"; id: number; quantity: number }>();
  for (const raw of requestedItems) {
    const itemType = raw?.itemType === "stand" ? "stand" : "product";
    const id = Number(itemType === "stand" ? raw?.standId ?? raw?.id : raw?.productId ?? raw?.id);
    const quantity = Number(raw?.quantity);
    if (!Number.isInteger(id) || id < 1 || !Number.isInteger(quantity) || quantity < 1 || quantity > 100)
      return NextResponse.json({ error: "یکی از اقلام سبد خرید نامعتبر است" }, { status: 400 });
    const key = `${itemType}:${id}`;
    const current = grouped.get(key);
    grouped.set(key, { itemType, id, quantity: (current?.quantity || 0) + quantity });
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
      if ((item.stock ?? 0) < requested.quantity) throw new Error(`موجودی «${item.name}» کافی نیست`);
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
  let totalAmount = subtotal;
  const discountCode = typeof body.discountCode === "string" ? body.discountCode.trim().toUpperCase() : "";
  if (discountCode) {
    const discount = await db.select().from(discountCodes).where(and(eq(discountCodes.code, discountCode), eq(discountCodes.isActive, true))).then((rows) => rows[0]);
    if (!discount) return NextResponse.json({ error: "کد تخفیف نامعتبر یا غیرفعال است" }, { status: 400 });
    const value = discount.value || discount.percentage || 0;
    const amount = discount.type === "amount" ? Math.min(value, subtotal) : Math.floor(subtotal * Math.min(value, 100) / 100);
    totalAmount = Math.max(0, subtotal - amount);
  }

  const commissionRate = shop?.commissionRate || 10;
  const commissionAmount = Math.floor((totalAmount * commissionRate) / 100);
  let order: typeof orders.$inferSelect;
  try {
    order = await db.transaction(async (tx) => {
      for (const item of canonicalItems) {
        const result = item.itemType === "stand"
          ? await tx.update(stands).set({ stock: sql`${stands.stock} - ${item.quantity}` }).where(and(eq(stands.id, item.standId!), eq(stands.isActive, true), gte(stands.stock, item.quantity))).returning({ id: stands.id })
          : await tx.update(products).set({ stock: sql`${products.stock} - ${item.quantity}` }).where(and(eq(products.id, item.productId!), gte(products.stock, item.quantity))).returning({ id: products.id });
        if (!result[0]) throw new Error(`موجودی «${item.name}» کافی نیست`);
      }
      const inserted = await tx.insert(orders).values({
      customerId: payload.id as number,
      shopId,
      customerName: String(body.customerName || "").trim(),
      customerPhone: String(body.customerPhone || "").trim(),
      customerAddress: String(body.customerAddress || "").trim(),
      customerPostalCode: body.customerPostalCode || null,
      shippingMethod: String(body.shippingMethod || "post"),
      totalAmount,
      commissionAmount,
      items: canonicalItems,
      status: "pending",
      createdAt: new Date(),
      }).returning();
      await tx.update(shops).set({ totalEarnings: sql`${shops.totalEarnings} + ${commissionAmount}` }).where(eq(shops.id, shop.id));
      return inserted[0];
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "ثبت سفارش انجام نشد" }, { status: 409 });
  }
  const totalCommission = (shop?.totalEarnings || 0) + commissionAmount;

  const origin = req.nextUrl.origin;
  const trackingLink = `${origin}/track/${order.id}`;
  await db.update(orders).set({ trackingLink }).where(eq(orders.id, order.id));

  // SMS failures must never make a successful order fail.
  await sendOrderSMS({
    customerPhone: body.customerPhone,
    shopPhone: shop?.phone,
    orderId: order.id,
    amount: totalAmount,
    commission: commissionAmount,
    totalCommission,
    trackingLink,
  });

  return NextResponse.json({ ...order, trackingLink, commissionAmount, totalCommission });
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

  const result = await db.update(orders).set(data).where(eq(orders.id, id)).returning();
  if (!result[0]) return NextResponse.json({ error: "سفارش پیدا نشد" }, { status: 404 });
  return NextResponse.json(result[0]);
}
