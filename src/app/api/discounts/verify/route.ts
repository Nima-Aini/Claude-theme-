import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { discountCodes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const normalizedCode = String(code || "").trim().toUpperCase();

  const discount = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.code, normalizedCode))
    .then((r) => r[0]);

  if (!discount || !discount.isActive) {
    return NextResponse.json({ valid: false, error: "کد تخفیف نامعتبر است" });
  }

  return NextResponse.json({
    valid: true,
    type: discount.type,
    value: discount.value,
    label: discount.type === "percentage"
      ? `تخفیف ${discount.value}%`
      : `تخفیف ${new Intl.NumberFormat("fa-IR").format(discount.value)} تومان`,
  });
}
