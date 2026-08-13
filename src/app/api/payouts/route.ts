import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { payouts, payoutRequests, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import { sendPayoutSMS } from "@/lib/sms";

export async function GET(req: NextRequest) {
  const c=await pool.connect(); try { await c.query("ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone VARCHAR(20);"); } finally { c.release(); }
  const token =
    req.cookies.get("admin_token")?.value ||
    req.cookies.get("shop_token")?.value;
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (payload.type === "admin") {
    const allPayouts = await db.select().from(payouts).orderBy(desc(payouts.createdAt));
    const allRequests = await db.select().from(payoutRequests).orderBy(desc(payoutRequests.createdAt));
    return NextResponse.json({ payouts: allPayouts, requests: allRequests });
  }

  if (payload.type === "shop") {
    const shopPayouts = await db
      .select()
      .from(payouts)
      .where(eq(payouts.shopId, payload.id as number))
      .orderBy(desc(payouts.createdAt));
    const shopRequests = await db
      .select()
      .from(payoutRequests)
      .where(eq(payoutRequests.shopId, payload.id as number))
      .orderBy(desc(payoutRequests.createdAt));
    return NextResponse.json({ payouts: shopPayouts, requests: shopRequests });
  }

  return NextResponse.json({ payouts: [], requests: [] });
}

// Shop requests payout
export async function POST(req: NextRequest) {
  const token = req.cookies.get("shop_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "shop")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { amount } = await req.json();
  const result = await db
    .insert(payoutRequests)
    .values({ shopId: payload.id as number, amount })
    .returning();
  return NextResponse.json(result[0]);
}

// Admin processes payout
export async function PUT(req: NextRequest) {
  const c=await pool.connect(); try { await c.query("ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone VARCHAR(20);"); } finally { c.release(); }
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { shopId, amount, description } = await req.json();

  // Create payout record
  await db.insert(payouts).values({ shopId, amount, description });

  // Update shop paid earnings
  const shop = await db.select().from(shops).where(eq(shops.id, shopId)).then(r => r[0]);
  let totalPaid = amount;
  if (shop) {
    totalPaid = (shop.paidEarnings || 0) + amount;
    await db.update(shops).set({ paidEarnings: totalPaid }).where(eq(shops.id, shopId));
    await sendPayoutSMS(shop.phone, amount, totalPaid);
  }
  // Close a matching pending request when the admin pays it.
  await db.update(payoutRequests).set({ status: "paid" }).where(eq(payoutRequests.shopId, shopId));
  return NextResponse.json({ success: true });
}
