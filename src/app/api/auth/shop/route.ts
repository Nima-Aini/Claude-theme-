import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";
import * as bcryptjs from "bcryptjs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const shop = await db
    .select()
    .from(shops)
    .where(eq(shops.username, username))
    .then((r) => r[0]);

  if (!shop) {
    return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }

  const valid = await bcryptjs.compare(password, shop.password);
  if (!valid) {
    return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }

  const token = await signToken({
    id: shop.id,
    username: shop.username,
    type: "shop",
  });

  const resp = NextResponse.json({ success: true, shop: { id: shop.id, name: shop.name, slug: shop.slug } });
  
  // Set cookie with settings that work across environments
  resp.cookies.set("shop_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  
  return resp;
}
