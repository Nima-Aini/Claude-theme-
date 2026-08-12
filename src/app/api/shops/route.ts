import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import * as bcryptjs from "bcryptjs";

export async function GET() {
  const allShops = await db
    .select({
      id: shops.id,
      name: shops.name,
      slug: shops.slug,
      image: shops.image,
      bannerImage: shops.bannerImage,
      commissionRate: shops.commissionRate,
      totalEarnings: shops.totalEarnings,
      paidEarnings: shops.paidEarnings,
    })
    .from(shops);
  return NextResponse.json(allShops);
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  body.password = await bcryptjs.hash(body.password, 10);
  const result = await db.insert(shops).values(body).returning();
  return NextResponse.json(result[0]);
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...data } = body;
  if (data.password) {
    data.password = await bcryptjs.hash(data.password, 10);
  } else {
    delete data.password;
  }
  const result = await db
    .update(shops)
    .set(data)
    .where(eq(shops.id, id))
    .returning();
  return NextResponse.json(result[0]);
}
