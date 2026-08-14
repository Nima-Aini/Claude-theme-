import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { sliderBanners, bottomBanners } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

async function ensureBannerSchema() {
  const c = await pool.connect();
  try { await c.query("CREATE TABLE IF NOT EXISTS slider_banners (id SERIAL PRIMARY KEY, image TEXT NOT NULL, sort_order INTEGER DEFAULT 0); CREATE TABLE IF NOT EXISTS bottom_banners (id SERIAL PRIMARY KEY, image TEXT NOT NULL, sort_order INTEGER DEFAULT 0);"); } finally { c.release(); }
}

export async function GET() {
  await ensureBannerSchema();
  const sliders = await db.select().from(sliderBanners).orderBy(asc(sliderBanners.sortOrder));
  const bottoms = await db.select().from(bottomBanners).orderBy(asc(bottomBanners.sortOrder));
  return NextResponse.json({ sliders, bottoms });
}

export async function POST(req: NextRequest) {
  await ensureBannerSchema();
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, image, sortOrder } = await req.json();
  if (type === "slider") {
    const result = await db.insert(sliderBanners).values({ image, sortOrder: sortOrder || 0 }).returning();
    return NextResponse.json(result[0]);
  } else {
    const result = await db.insert(bottomBanners).values({ image, sortOrder: sortOrder || 0 }).returning();
    return NextResponse.json(result[0]);
  }
}


export async function PUT(req: NextRequest) {
  await ensureBannerSchema();
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { type, id, image, sortOrder } = await req.json();
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || !image) return NextResponse.json({ error: "اطلاعات بنر نامعتبر است" }, { status: 400 });
    const data = { image: String(image), sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0 };
    const result = type === "slider"
      ? await db.update(sliderBanners).set(data).where(eq(sliderBanners.id, numericId)).returning()
      : await db.update(bottomBanners).set(data).where(eq(bottomBanners.id, numericId)).returning();
    if (!result[0]) return NextResponse.json({ error: "بنر پیدا نشد" }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error("PUT /api/banners", error);
    return NextResponse.json({ error: "خطا در ویرایش بنر", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  await ensureBannerSchema();
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id } = await req.json();
  if (type === "slider") {
    await db.delete(sliderBanners).where(eq(sliderBanners.id, id));
  } else {
    await db.delete(bottomBanners).where(eq(bottomBanners.id, id));
  }
  return NextResponse.json({ success: true });
}
