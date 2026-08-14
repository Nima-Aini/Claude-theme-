import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import * as bcryptjs from "bcryptjs";

export async function GET() {
  const c = await pool.connect(); try { await c.query("ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone VARCHAR(20);"); } finally { c.release(); }
  const allShops = await db
    .select({
      id: shops.id,
      name: shops.name,
      slug: shops.slug,
      image: shops.image,
      bannerImage: shops.bannerImage,
      commissionRate: shops.commissionRate,
      phone: shops.phone,
      totalEarnings: shops.totalEarnings,
      paidEarnings: shops.paidEarnings,
    })
    .from(shops);
  return NextResponse.json(allShops);
}

export async function POST(req: NextRequest) {
  const c = await pool.connect(); try { await c.query("ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone VARCHAR(20);"); } finally { c.release(); }
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin" && payload.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const slug = String(body.slug || "").trim();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    if (!name || !slug || !username || !password)
      return NextResponse.json({ error: "نام، شناسه، نام کاربری و رمز عبور الزامی است" }, { status: 400 });
    const data = {
      name, slug, username,
      image: body.image || null,
      bannerImage: body.bannerImage || null,
      phone: body.phone || null,
      password: await bcryptjs.hash(password, 10),
      commissionRate: Number.isFinite(Number(body.commissionRate)) ? Number(body.commissionRate) : 10,
      totalEarnings: 0, paidEarnings: 0,
    };
    const result = await db.insert(shops).values(data).returning();
    return NextResponse.json(result[0]);
  } catch (error: any) {
    if (error?.code === "23505") return NextResponse.json({ error: "شناسه یا نام کاربری تکراری است" }, { status: 409 });
    console.error("POST /api/shops", error);
    return NextResponse.json({ error: "خطا در افزودن فروشگاه", details: error?.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const c = await pool.connect(); try { await c.query("ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone VARCHAR(20);"); } finally { c.release(); }
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin" && payload.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "شناسه فروشگاه نامعتبر است" }, { status: 400 });
    const data: Record<string, unknown> = {};
    for (const key of ["name", "slug", "username", "image", "bannerImage", "phone", "commissionRate"]) {
      if (body[key] !== undefined) data[key] = key === "commissionRate" ? Number(body[key]) : body[key];
    }
    if (body.password) data.password = await bcryptjs.hash(String(body.password), 10);
    const result = await db.update(shops).set(data).where(eq(shops.id, id)).returning();
    if (!result[0]) return NextResponse.json({ error: "فروشگاه پیدا نشد" }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error: any) {
    if (error?.code === "23505") return NextResponse.json({ error: "شناسه یا نام کاربری تکراری است" }, { status: 409 });
    console.error("PUT /api/shops", error);
    return NextResponse.json({ error: "خطا در ویرایش فروشگاه", details: error?.message }, { status: 500 });
  }
}
