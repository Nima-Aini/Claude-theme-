import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { sliderBanners, bottomBanners } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";

async function ensureBannerSchema() {
  const c = await pool.connect();
  try { await c.query("CREATE TABLE IF NOT EXISTS slider_banners (id SERIAL PRIMARY KEY, image TEXT NOT NULL, mobile_image TEXT, sort_order INTEGER DEFAULT 0); CREATE TABLE IF NOT EXISTS bottom_banners (id SERIAL PRIMARY KEY, image TEXT NOT NULL, mobile_image TEXT, sort_order INTEGER DEFAULT 0); ALTER TABLE slider_banners ADD COLUMN IF NOT EXISTS mobile_image TEXT; ALTER TABLE bottom_banners ADD COLUMN IF NOT EXISTS mobile_image TEXT;"); } finally { c.release(); }
}

export async function GET() {
  await ensureBannerSchema();
  const sliders = await db.select().from(sliderBanners).orderBy(asc(sliderBanners.sortOrder));
  const bottoms = await db.select().from(bottomBanners).orderBy(asc(bottomBanners.sortOrder));
  return NextResponse.json({ sliders, bottoms });
}

export async function POST(req: NextRequest) {
  await ensureBannerSchema();
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, image, mobileImage, sortOrder } = await req.json();
  if (!image) return NextResponse.json({ error: "تصویر دسکتاپ بنر الزامی است" }, { status: 400 });
  const values = { image: String(image), mobileImage: mobileImage ? String(mobileImage) : null, sortOrder: Number(sortOrder) || 0 };
  if (type === "slider") {
    const result = await db.insert(sliderBanners).values(values).returning();
    return NextResponse.json(result[0]);
  } else {
    const result = await db.insert(bottomBanners).values(values).returning();
    return NextResponse.json(result[0]);
  }
}


export async function PUT(req: NextRequest) {
  await ensureBannerSchema();
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { type, id, image, mobileImage, sortOrder } = await req.json();
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || !image) return NextResponse.json({ error: "اطلاعات بنر نامعتبر است" }, { status: 400 });
    const data = { image: String(image), mobileImage: mobileImage ? String(mobileImage) : null, sortOrder: Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0 };
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
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id } = await req.json();
  if (type === "slider") {
    await db.delete(sliderBanners).where(eq(sliderBanners.id, id));
  } else {
    await db.delete(bottomBanners).where(eq(bottomBanners.id, id));
  }
  return NextResponse.json({ success: true });
}
