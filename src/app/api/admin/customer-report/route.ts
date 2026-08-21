import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { customerShopLogins, customers, orders, shops } from "@/db/schema";
import { desc, inArray } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

async function ensureSchema() {
  const c = await pool.connect();
  try {
    await c.query(`
      CREATE TABLE IF NOT EXISTS customer_shop_logins (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        shop_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_customer_shop_logins_customer ON customer_shop_logins(customer_id);
      CREATE INDEX IF NOT EXISTS idx_customer_shop_logins_shop ON customer_shop_logins(shop_id);
    `);
  } finally {
    c.release();
  }
}

export async function GET(req: NextRequest) {
  await ensureSchema();
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || (payload.type !== "admin" && payload.role !== "admin")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const param = req.nextUrl.searchParams.get("shopIds") || "all";
  const selectedShopIds = param === "all"
    ? (await db.select({ id: shops.id }).from(shops)).map((s) => s.id)
    : param.split(",").map(Number).filter(Number.isInteger);

  if (selectedShopIds.length === 0) return NextResponse.json({ shops: [], customers: [] });

  const selectedShops = await db.select({ id: shops.id, name: shops.name, slug: shops.slug })
    .from(shops)
    .where(inArray(shops.id, selectedShopIds));
  const selectedOrders = await db.select().from(orders)
    .where(inArray(orders.shopId, selectedShopIds))
    .orderBy(desc(orders.createdAt));
  const loginRows = await db.select({ customerId: customerShopLogins.customerId, shopId: customerShopLogins.shopId })
    .from(customerShopLogins)
    .where(inArray(customerShopLogins.shopId, selectedShopIds));

  const customerIds = Array.from(new Set([
    ...selectedOrders.map((o) => o.customerId),
    ...loginRows.map((r) => r.customerId),
  ]));
  if (customerIds.length === 0) return NextResponse.json({ shops: selectedShops, customers: [] });

  const customerRows = await db.select().from(customers).where(inArray(customers.id, customerIds));
  const customerMap = new Map(customerRows.map((c) => [c.id, c]));
  const shopMap = new Map(selectedShops.map((s) => [s.id, s]));

  const report = customerIds.map((customerId) => {
    const customer = customerMap.get(customerId);
    const customerOrders = selectedOrders.filter((o) => o.customerId === customerId);
    const loggedShopIds = Array.from(new Set(loginRows.filter((r) => r.customerId === customerId).map((r) => r.shopId)));
    const orderShopIds = Array.from(new Set(customerOrders.map((o) => o.shopId)));
    const shopIds = Array.from(new Set([...loggedShopIds, ...orderShopIds]));

    return {
      id: customerId,
      phone: customer?.phone || customerOrders[0]?.customerPhone || "-",
      name: customer?.name || customerOrders[0]?.customerName || "-",
      address: customer?.address || customerOrders[0]?.customerAddress || "-",
      shopIds,
      shops: shopIds.map((id) => shopMap.get(id)?.name).filter((name): name is string => Boolean(name)),
      orderCount: customerOrders.length,
      orders: customerOrders.map((o) => ({
        id: o.id,
        shopId: o.shopId,
        shopName: shopMap.get(o.shopId)?.name || "-",
        customerName: o.customerName,
        customerPhone: o.customerPhone,
        customerAddress: o.customerAddress,
        totalAmount: o.totalAmount,
        commissionAmount: o.commissionAmount || 0,
        status: o.status || "pending",
        trackingLink: o.trackingLink,
        shippingMethod: o.shippingMethod,
        items: o.items,
        createdAt: o.createdAt,
      })),
    };
  });

  report.sort((a, b) => b.orderCount - a.orderCount || a.name.localeCompare(b.name, "fa"));
  return NextResponse.json({ shops: selectedShops, customers: report });
}
