import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { and, eq, ne, or } from "drizzle-orm";
import { requireAdmin } from "@/lib/auth";
import { normalizeShopSlug } from "@/lib/shops";
import * as bcryptjs from "bcryptjs";

export async function GET() {
  const rows = await db.select({ id: shops.id, name: shops.name, slug: shops.slug,
    secondarySlug: shops.secondarySlug, image: shops.image, bannerImage: shops.bannerImage,
    bannerMobileImage: shops.bannerMobileImage, commissionRate: shops.commissionRate, phone: shops.phone,
    totalEarnings: shops.totalEarnings, paidEarnings: shops.paidEarnings }).from(shops);
  return NextResponse.json(rows);
}

async function slugConflict(primary: string, secondary: string | null, excludedId?: number) {
  const candidates = secondary ? [primary, secondary] : [primary];
  for (const candidate of candidates) {
    const condition = or(eq(shops.slug, candidate), eq(shops.secondarySlug, candidate));
    const row = await db.select({ id: shops.id }).from(shops)
      .where(excludedId ? and(condition, ne(shops.id, excludedId)) : condition).then((rows) => rows[0]);
    if (row) return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const slug = normalizeShopSlug(body.slug) as string;
    const secondarySlug = normalizeShopSlug(body.secondarySlug, true);
    if (!name || !username || password.length < 8) return NextResponse.json({ error: "نام، نام کاربری و رمز حداقل ۸ کاراکتری الزامی است" }, { status: 400 });
    if (slug === secondarySlug) return NextResponse.json({ error: "شناسه اصلی و ثانویه نباید یکسان باشند" }, { status: 400 });
    if (await slugConflict(slug, secondarySlug)) return NextResponse.json({ error: "شناسه اصلی یا ثانویه قبلاً استفاده شده است" }, { status: 409 });
    const [result] = await db.insert(shops).values({ name, username, slug, secondarySlug,
      image: body.image || null, bannerImage: body.bannerImage || null, bannerMobileImage: body.bannerMobileImage || null,
      phone: body.phone || null, password: await bcryptjs.hash(password, 12),
      commissionRate: Number.isFinite(Number(body.commissionRate)) ? Number(body.commissionRate) : 10,
      totalEarnings: 0, paidEarnings: 0 }).returning();
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message.includes("شناسه URL")) return NextResponse.json({ error: error.message }, { status: 400 });
    const code = (error as { code?: string }).code;
    if (code === "23505") return NextResponse.json({ error: "شناسه یا نام کاربری تکراری است" }, { status: 409 });
    console.error("POST /api/shops", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "خطا در افزودن فروشگاه" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "شناسه فروشگاه نامعتبر است" }, { status: 400 });
    const current = await db.select().from(shops).where(eq(shops.id, id)).then((rows) => rows[0]);
    if (!current) return NextResponse.json({ error: "فروشگاه پیدا نشد" }, { status: 404 });
    const slug = body.slug === undefined ? current.slug : normalizeShopSlug(body.slug) as string;
    const secondarySlug = body.secondarySlug === undefined ? current.secondarySlug : normalizeShopSlug(body.secondarySlug, true);
    if (slug === secondarySlug) return NextResponse.json({ error: "شناسه اصلی و ثانویه نباید یکسان باشند" }, { status: 400 });
    if (await slugConflict(slug, secondarySlug, id)) return NextResponse.json({ error: "شناسه اصلی یا ثانویه قبلاً استفاده شده است" }, { status: 409 });
    const data: Record<string, unknown> = { slug, secondarySlug };
    for (const key of ["name", "image", "bannerImage", "bannerMobileImage", "phone", "commissionRate"]) {
      if (body[key] !== undefined) data[key] = key === "commissionRate" ? Number(body[key]) : body[key] || null;
    }
    if (body.password) data.password = await bcryptjs.hash(String(body.password), 12);
    const [result] = await db.update(shops).set(data).where(eq(shops.id, id)).returning();
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.message.includes("شناسه URL")) return NextResponse.json({ error: error.message }, { status: 400 });
    if ((error as { code?: string }).code === "23505") return NextResponse.json({ error: "شناسه یا نام کاربری تکراری است" }, { status: 409 });
    console.error("PUT /api/shops", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "خطا در ویرایش فروشگاه" }, { status: 500 });
  }
}
