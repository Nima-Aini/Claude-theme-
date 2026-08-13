import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";
import * as bcryptjs from "bcryptjs";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json();

  const admin = await db
    .select()
    .from(admins)
    .where(eq(admins.username, username))
    .then((r) => r[0]);

  if (!admin) {
    return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }

  const valid = await bcryptjs.compare(password, admin.password);
  if (!valid) {
    return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
  }

  const token = await signToken({ id: admin.id, type: "admin" });

  const resp = NextResponse.json({ success: true });
  
  resp.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  
  return resp;
}
