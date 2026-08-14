import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { otpCodes } from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { sendOTP, generateOTP } from "@/lib/sms";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  
  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: "شماره تلفن معتبر نیست" }, { status: 400 });
  }

  // Normalize phone number
  let normalizedPhone = phone.replace(/\D/g, "");
  if (normalizedPhone.startsWith("98")) {
    normalizedPhone = "0" + normalizedPhone.slice(2);
  } else if (!normalizedPhone.startsWith("0")) {
    normalizedPhone = "0" + normalizedPhone;
  }

  // Check if there's a recent OTP (prevent spam)
  const recentOTP = await db
    .select()
    .from(otpCodes)
    .where(
      and(
        eq(otpCodes.phone, normalizedPhone),
        gt(otpCodes.expiresAt, new Date()),
        eq(otpCodes.verified, false)
      )
    )
    .then((r) => r[0]);

  // If OTP was sent less than 60 seconds ago, return error
  if (recentOTP) {
    const createdAt = recentOTP.createdAt;
    if (createdAt && Date.now() - createdAt.getTime() < 60000) {
      return NextResponse.json(
        { error: "لطفا ۶۰ ثانیه صبر کنید" },
        { status: 429 }
      );
    }
  }

  // Generate new OTP
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + 2 * 60 * 1000); // 2 minutes

  // Send SMS
  const sent = await sendOTP(normalizedPhone, code);
  
  if (!sent) {
    // For development/testing, still save the code but return a warning
    console.log(`OTP for ${normalizedPhone}: ${code}`);
  }

  // Save OTP to database
  await db.insert(otpCodes).values({
    phone: normalizedPhone,
    code,
    expiresAt,
  });

  return NextResponse.json({ 
    success: true, 
    message: "کد تایید ارسال شد",
    // For testing only - remove in production
    ...(process.env.NODE_ENV !== "production" ? { debug_code: code } : {})
  });
}
