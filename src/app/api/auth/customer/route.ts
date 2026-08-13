import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { phone } = await req.json();
  if (!phone || phone.length < 10) {
    return NextResponse.json({ error: "شماره تلفن معتبر نیست" }, { status: 400 });
  }

  let customer = await db
    .select()
    .from(customers)
    .where(eq(customers.phone, phone))
    .then((r) => r[0]);

  if (!customer) {
    const result = await db
      .insert(customers)
      .values({ phone })
      .returning();
    customer = result[0];
  }

  const token = await signToken({
    id: customer.id,
    phone: customer.phone,
    type: "customer",
  });

  const resp = NextResponse.json({ success: true, customer });
  
  resp.cookies.set("customer_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  
  return resp;
}
