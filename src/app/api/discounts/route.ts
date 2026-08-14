import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { discountCodes } from "@/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";


async function ensureDiscountSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS discount_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        percentage INTEGER NOT NULL DEFAULT 0,
        type VARCHAR(20) NOT NULL DEFAULT 'percentage',
        value INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS percentage INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'percentage';
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS value INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      UPDATE discount_codes SET value = percentage, type = 'percentage' WHERE value = 0 AND percentage > 0;
    `);
  } finally {
    client.release();
  }
}

async function isAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return false;
  const payload = await verifyToken(token);
  return !!payload && payload.type === "admin";
}

export async function GET(req: NextRequest) {
  await ensureDiscountSchema();
  const admin = await isAdmin(req);
  if (admin) {
    const all = await db.select().from(discountCodes).orderBy(desc(discountCodes.createdAt));
    return NextResponse.json(all);
  }

  // Public endpoint: customers only see discounts explicitly marked public and active.
  const publicDiscounts = await db
    .select({
      id: discountCodes.id,
      code: discountCodes.code,
      type: discountCodes.type,
      value: discountCodes.value,
    })
    .from(discountCodes)
    .where(and(eq(discountCodes.isPublic, true), eq(discountCodes.isActive, true)))
    .orderBy(desc(discountCodes.createdAt));

  return NextResponse.json(publicDiscounts);
}

export async function POST(req: NextRequest) {
  try {
    await ensureDiscountSchema();
  } catch (e) {
    return NextResponse.json({ error: "اتصال به دیتابیس برقرار نشد" }, { status: 500 });
  }
  if (!(await isAdmin(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const type = body.type === "amount" ? "amount" : "percentage";
    const value = Number(body.value);
    const isPublic = Boolean(body.isPublic);

    if (!code || !Number.isInteger(value) || value <= 0)
      return NextResponse.json({ error: "اطلاعات کد تخفیف نامعتبر است" }, { status: 400 });

    if (type === "percentage" && value > 100)
      return NextResponse.json({ error: "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد" }, { status: 400 });

    const result = await db.insert(discountCodes).values({
      code,
      percentage: type === "percentage" ? value : 0,
      type,
      value,
      isPublic,
      isActive: true,
    }).returning();

    return NextResponse.json(result[0]);
  } catch (error: any) {
    if (error?.code === "23505")
      return NextResponse.json({ error: "این کد تخفیف قبلاً ثبت شده است" }, { status: 409 });
    return NextResponse.json({ error: "خطا در ثبت کد تخفیف" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  await ensureDiscountSchema();
  if (!(await isAdmin(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const id = Number(body.id);
  if (!id) return NextResponse.json({ error: "شناسه نامعتبر است" }, { status: 400 });

  const data: any = {};
  if (body.type !== undefined) data.type = body.type === "amount" ? "amount" : "percentage";
  if (body.value !== undefined) data.value = Number(body.value);
  if (body.isPublic !== undefined) data.isPublic = Boolean(body.isPublic);
  if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
  if (body.code !== undefined) data.code = String(body.code).trim().toUpperCase();

  if (data.type && data.value !== undefined) {
    if (!Number.isInteger(data.value) || data.value <= 0)
      return NextResponse.json({ error: "مقدار تخفیف نامعتبر است" }, { status: 400 });
    if (data.type === "percentage" && data.value > 100)
      return NextResponse.json({ error: "درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد" }, { status: 400 });
    data.percentage = data.type === "percentage" ? data.value : 0;
  }

  const result = await db.update(discountCodes).set(data).where(eq(discountCodes.id, id)).returning();
  return NextResponse.json(result[0]);
}

export async function DELETE(req: NextRequest) {
  await ensureDiscountSchema();
  if (!(await isAdmin(req)))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await db.delete(discountCodes).where(eq(discountCodes.id, Number(id)));
  return NextResponse.json({ success: true });
}
