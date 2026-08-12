import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { discountCodes } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const { code } = await req.json();
  const discount = await db
    .select()
    .from(discountCodes)
    .where(eq(discountCodes.code, code))
    .then((r) => r[0]);

  if (!discount || !discount.isActive) {
    return NextResponse.json({ valid: false, error: "کد تخفیف نامعتبر است" });
  }

  return NextResponse.json({ valid: true, percentage: discount.percentage });
}
