import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { otpCodes, customers } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { phone, code } = await req.json();
  
  if (!phone || !code) {
    return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
  }

  // Normalize phone number
  let normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.startsWith("98")) {
    normalizedPhone = "0" + normalizedPhone.slice(2);
  } else if (!normalizedPhone.startsWith("0")) {
    normalizedPhone = "0" + normalizedPhone;
  }

  // Find valid OTP
  const validOTP = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, normalizedPhone),
        eq(otpCodes.code, code),
        gt(otpCodes.expiresAt, new Date()),
        eq(otpCodes.verified, false)
      )
    )
    .then((r) => r[0]);

  if (!validOTP) {
    return NextResponse.json(
      { error: "کد تایید نامعتبر یا منقضی شده است" },
      { status: 400 }
    );
  }

  // Mark OTP as verified
  await db
    .update(otpCodes)
    .set({ verified: true })
    .where(eq(otpCodes.id, validOTP.id));

  // Find or create customer
  let customer = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, normalizedPhone))
    .then((r) => r[0]);

  if (!customer) {
    const result = await db
      .insert(customers)
      .values({ phone: normalizedPhone })
      .returning();
    customer = result[0];
  }

  // Create token
  const token = await signToken({
    id: customer.id,
    phone: customer.phone,
    type: "customer",
  });

  const resp = NextResponse.json({ 
    success: true, 
    customer: {
      id: customer.id,
      phone: customer.phone,
      name: customer.name,
      address: customer.address,
    }
  });
  
  resp.cookies.set("customer_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  
  return resp;
}
