import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { orders, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import { sendOrderSMS } from "@/lib/sms";

async function ensureSchema() {
  const c = await pool.connect();
  try {
    await c.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_postal_code VARCHAR(10);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_link TEXT;
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

  // Calculate commission
  const shop = await db
    .select()
    .from(shops)
    .where(eq(shops.id, body.shopId))
    .then((r) => r[0]);

  const commissionRate = shop?.commissionRate || 10;
  const commissionAmount = Math.floor(
    (body.totalAmount * commissionRate) / 100
  );

  const result = await db
    .insert(orders)
    .values({
      customerId: payload.id as number,
      shopId: body.shopId,
      customerName: body.customerName,
      customerPhone: body.customerPhone,
      customerAddress: body.customerAddress,
      customerPostalCode: body.customerPostalCode || null,
      shippingMethod: body.shippingMethod,
      totalAmount: body.totalAmount,
      commissionAmount,
      items: body.items,
      status: "pending",
    })
    .returning();

  const order = result[0];
  const totalCommission = (shop?.totalEarnings || 0) + commissionAmount;

  // Update shop earnings
  if (shop) {
    await db.update(shops).set({ totalEarnings: totalCommission }).where(eq(shops.id, shop.id));
  }

  const origin = req.nextUrl.origin;
  const trackingLink = `${origin}/track/${order.id}`;
  await db.update(orders).set({ trackingLink }).where(eq(orders.id, order.id));

  // SMS failures must never make a successful order fail.
  await sendOrderSMS({
    customerPhone: body.customerPhone,
    shopPhone: shop?.phone,
    orderId: order.id,
    amount: body.totalAmount,
    commission: commissionAmount,
    totalCommission,
    trackingLink,
  });

  return NextResponse.json({ ...order, trackingLink, commissionAmount, totalCommission });
}

export async function PUT(req: NextRequest) {
  await ensureSchema();
  const token =
    req.cookies.get("admin_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin" && payload.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
