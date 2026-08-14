import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

async function ensureSchema() {
  const c = await pool.connect();
  try { await c.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB; ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;"); } finally { c.release(); }
}
export async function GET() {
  await ensureSchema();
  const allProducts = await db.select().from(products);
  return NextResponse.json(allProducts);
}

export async function POST(req: NextRequest) {
  await ensureSchema();
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin" && payload.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const data = {
      name: String(body.name || "").trim(),
      description: body.description || null,
      price: Number(body.price),
      image: body.image || null,
      images: Array.isArray(body.images) ? body.images : [],
      videoUrl: body.videoUrl || null,
      isBestseller: Boolean(body.isBestseller),
      stock: Number.isFinite(Number(body.stock)) ? Number(body.stock) : 100,
    };
    if (!data.name || !Number.isFinite(data.price) || data.price < 0) return NextResponse.json({ error: "اطلاعات محصول نامعتبر است" }, { status: 400 });
    const result = await db.insert(products).values(data).returning();
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error("POST /api/products", error);
    return NextResponse.json({ error: "خطا در افزودن محصول", details: error?.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  await ensureSchema();
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin" && payload.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isInteger(id)) return NextResponse.json({ error: "شناسه محصول نامعتبر است" }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = String(body.name).trim();
    if (body.description !== undefined) data.description = body.description || null;
    if (body.price !== undefined) data.price = Number(body.price);
    if (body.image !== undefined) data.image = body.image || null;
    if (body.images !== undefined) data.images = Array.isArray(body.images) ? body.images : [];
    if (body.videoUrl !== undefined) data.videoUrl = body.videoUrl || null;
    if (body.isBestseller !== undefined) data.isBestseller = Boolean(body.isBestseller);
    if (body.stock !== undefined) data.stock = Number(body.stock);
    const result = await db.update(products).set(data).where(eq(products.id, id)).returning();
    if (!result[0]) return NextResponse.json({ error: "محصول پیدا نشد" }, { status: 404 });
    return NextResponse.json(result[0]);
  } catch (error: any) {
    console.error("PUT /api/products", error);
    return NextResponse.json({ error: "خطا در ویرایش محصول", details: error?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin" && payload.role !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await db.delete(products).where(eq(products.id, id));
  return NextResponse.json({ success: true });
}
