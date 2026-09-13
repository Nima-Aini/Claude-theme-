import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { sql } from "drizzle-orm";
import { signToken } from "@/lib/auth";
import { clearLoginFailures, loginRateLimit, recordLoginFailure } from "@/lib/rate-limit";
import * as bcryptjs from "bcryptjs";

const BCRYPT_HASH = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

function normalizeAdminUsername(value: unknown) {
  return String(value ?? "").trim().toLowerCase();
}

function clientAddress(req: NextRequest) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: NextRequest) {
  const noStore = { "Cache-Control": "no-store" };
  try {
    const body = await req.json();
    const username = normalizeAdminUsername(body.username);
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) {
      return NextResponse.json({ error: "لطفاً نام کاربری و رمز عبور را وارد کنید" }, { status: 400, headers: noStore });
    }

    const rateKey = `${clientAddress(req)}:${username}`;
    const limit = loginRateLimit(rateKey);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "تلاش‌های ورود بیش از حد مجاز است؛ کمی بعد دوباره امتحان کنید" },
        { status: 429, headers: { ...noStore, "Retry-After": String(limit.retryAfter) } },
      );
    }

    const admin = await db.select({ id: admins.id, username: admins.username, password: admins.password })
      .from(admins).where(sql`lower(${admins.username}) = ${username}`).then((rows) => rows[0]);
    const valid = Boolean(admin && BCRYPT_HASH.test(admin.password) && await bcryptjs.compare(password, admin.password));
    if (!valid || !admin) {
      recordLoginFailure(rateKey);
      return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401, headers: noStore });
    }

    clearLoginFailures(rateKey);
    const token = await signToken({ id: admin.id, type: "admin", role: "admin", username: admin.username });
    const response = NextResponse.json(
      { success: true, user: { id: admin.id, username: admin.username, role: "admin" } },
      { headers: noStore },
    );
    response.cookies.set("admin_token", token, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, path: "/",
    });
    return response;
  } catch (error) {
    console.error("Admin login failed", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "خطا در ارتباط با سرور مدیریت" }, { status: 500, headers: noStore });
  }
}
