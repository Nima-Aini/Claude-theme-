import { NextRequest, NextResponse } from "next/server";
import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { stands } from "@/db/schema";
import { requireAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

function values(body: Record<string, unknown>) {
  const name = String(body.name || "").trim();
  const price = Number(body.price);
  const stock = Number(body.stock ?? 0);
  const sortOrder = Number(body.sortOrder ?? 0);
  if (!name || !Number.isInteger(price) || price < 0 || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(sortOrder)) {
    throw new Error("اطلاعات استند نامعتبر است");
  }
  return {
    name,
    description: body.description ? String(body.description).trim() : null,
    price,
    image: body.image ? String(body.image) : null,
    images: Array.isArray(body.images) ? body.images.filter((item): item is string => typeof item === "string") : [],
    stock,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    sortOrder,
  };
}

export async function GET(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  const admin = req.nextUrl.searchParams.get("admin") === "1";
  if (admin && !await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (Number.isInteger(id) && id > 0) {
    const where = admin ? eq(stands.id, id) : and(eq(stands.id, id), eq(stands.isActive, true));
    const item = await db.select().from(stands).where(where).then((rows) => rows[0]);
    return item ? NextResponse.json(item) : NextResponse.json({ error: "استند پیدا نشد" }, { status: 404 });
  }
  const list = admin
    ? await db.select().from(stands).orderBy(asc(stands.sortOrder), asc(stands.id))
    : await db.select().from(stands).where(eq(stands.isActive, true)).orderBy(asc(stands.sortOrder), asc(stands.id));
  return NextResponse.json(list, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const result = await db.insert(stands).values(values(await req.json())).returning();
    return NextResponse.json(result[0], { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "خطا در افزودن استند" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const body = await req.json();
    const id = Number(body.id);
    if (!Number.isInteger(id) || id < 1) throw new Error("شناسه استند نامعتبر است");
    const data = values(body);
    const result = await db.update(stands).set(data).where(and(eq(stands.id, id), sql`${stands.reservedStock} <= ${data.stock}`)).returning();
    return result[0] ? NextResponse.json(result[0]) : NextResponse.json({ error: "موجودی جدید از تعداد رزروشده کمتر است" }, { status: 409 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "خطا در ویرایش استند" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = Number((await req.json()).id);
  if (!Number.isInteger(id) || id < 1) return NextResponse.json({ error: "شناسه استند نامعتبر است" }, { status: 400 });
  const result = await db.delete(stands).where(and(eq(stands.id, id), eq(stands.reservedStock, 0))).returning({ id: stands.id });
  return result[0] ? NextResponse.json({ success: true }) : NextResponse.json({ error: "استند رزروشده قابل حذف نیست" }, { status: 409 });
}
