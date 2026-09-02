import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";
import * as bcryptjs from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const cleanUsername = String(username || "").trim();
    const cleanPassword = String(password || "").trim();

    if (!cleanUsername || !cleanPassword) {
      return NextResponse.json({ error: "لطفاً نام کاربری و رمز عبور را وارد کنید" }, { status: 400 });
    }

    const shop = await db
      .select()
      .from(shops)
      .where(eq(shops.username, cleanUsername))
      .then((r) => r[0]);

    if (!shop) {
      return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
    }

    let valid = false;
    if (shop.password) {
      if (shop.password.startsWith("$2a$") || shop.password.startsWith("$2b$") || shop.password.startsWith("$2y$")) {
        valid = await bcryptjs.compare(cleanPassword, shop.password);
      } else {
        valid = shop.password === cleanPassword;
        if (valid) {
          const newHash = await bcryptjs.hash(cleanPassword, 10);
          await db.update(shops).set({ password: newHash }).where(eq(shops.id, shop.id));
        }
      }
    }

    if (!valid) {
      return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
    }

    const token = await signToken({
      id: shop.id,
      username: shop.username,
      type: "shop",
    });

    const resp = NextResponse.json({
      success: true,
      shop: { id: shop.id, name: shop.name, slug: shop.slug },
    });

    // Set cookie with secure settings
    resp.cookies.set("shop_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return resp;
  } catch (error) {
    console.error("Shop login error:", error);
    return NextResponse.json({ error: "خطا در برقراری ارتباط با سرور" }, { status: 500 });
  }
}
