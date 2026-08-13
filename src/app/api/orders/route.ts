import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token =
    req.cookies.get("admin_token")?.value ||
    req.cookies.get("shop_token")?.value ||
    req.cookies.get("customer_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (payload.type === "admin") {
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
      shippingMethod: body.shippingMethod,
      totalAmount: body.totalAmount,
      commissionAmount,
      items: body.items,
      status: "pending",
    })
    .returning();

  // Update shop earnings
  if (shop) {
    await db
      .update(shops)
      .set({
        totalEarnings: (shop.totalEarnings || 0) + commissionAmount,
      })
      .where(eq(shops.id, shop.id));
  }

  return NextResponse.json(result[0]);
}

export async function PUT(req: NextRequest) {
  const token =
    req.cookies.get("admin_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;
  const result = await db
    .update(orders)
    .set(data)
    .where(eq(orders.id, id))
    .returning();
  return NextResponse.json(result[0]);
}
