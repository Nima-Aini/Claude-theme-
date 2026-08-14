import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, shops, payouts, payoutRequests } from "@/db/schema";
import { eq, desc, count, sum } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("shop_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "shop")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const shopId = payload.id as number;

  const shop = await db.select().from(shops).where(eq(shops.id, shopId)).then(r => r[0]);
  const shopOrders = await db.select().from(orders).where(eq(orders.shopId, shopId)).orderBy(desc(orders.createdAt));
  const shopPayouts = await db.select().from(payouts).where(eq(payouts.shopId, shopId)).orderBy(desc(payouts.createdAt));
  const shopRequests = await db.select().from(payoutRequests).where(eq(payoutRequests.shopId, shopId)).orderBy(desc(payoutRequests.createdAt));

  const totalOrders = shopOrders.length;
  const pendingOrders = shopOrders.filter(o => o.status === "pending").length;
  const shippedOrders = shopOrders.filter(o => o.status === "shipped").length;
  const totalSales = shopOrders.reduce((s, o) => s + o.totalAmount, 0);
  const totalCommission = shopOrders.reduce((s, o) => s + (o.commissionAmount || 0), 0);
  const paidAmount = shop?.paidEarnings || 0;
  const unpaidAmount = totalCommission - paidAmount;

  return NextResponse.json({
    shop: { name: shop?.name, image: shop?.image, commissionRate: shop?.commissionRate },
    stats: { totalOrders, pendingOrders, shippedOrders, totalSales, totalCommission, paidAmount, unpaidAmount },
    orders: shopOrders,
    payouts: shopPayouts,
    requests: shopRequests,
  });
}
