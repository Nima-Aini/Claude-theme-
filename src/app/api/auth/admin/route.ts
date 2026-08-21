import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq } from "drizzle-orm";
import { signToken } from "@/lib/auth";
import * as bcryptjs from "bcryptjs";

const ADMIN_USERNAME = "adminakma";
const ADMIN_PASSWORD = "Akma!2026#Nima@Secure";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const normalizedUsername = String(username || "").trim();

    // Migrate the legacy admin account lazily so login does not depend on /api/setup.
    if (normalizedUsername === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const existing = await db
        .select({ id: admins.id, username: admins.username, password: admins.password })
        .from(admins)
        .where(eq(admins.username, ADMIN_USERNAME))
        .then((r) => r[0]);

      if (!existing) {
        const legacy = await db
          .select({ id: admins.id, username: admins.username, password: admins.password })
          .from(admins)
          .where(eq(admins.username, "admin"))
          .then((r) => r[0]);

        if (legacy) {
          const hashed = await bcryptjs.hash(ADMIN_PASSWORD, 12);
          await db
            .update(admins)
            .set({ username: ADMIN_USERNAME, password: hashed })
            .where(eq(admins.id, legacy.id));
        } else {
          const hashed = await bcryptjs.hash(ADMIN_PASSWORD, 12);
          await db.insert(admins).values({ username: ADMIN_USERNAME, password: hashed });
        }
      } else {
        const valid = await bcryptjs.compare(password, existing.password);
        if (!valid) {
          const hashed = await bcryptjs.hash(ADMIN_PASSWORD, 12);
          await db.update(admins).set({ password: hashed }).where(eq(admins.id, existing.id));
        }
      }
    }

    const admin = await db
      .select({ id: admins.id, username: admins.username, password: admins.password })
      .from(admins)
      .where(eq(admins.username, normalizedUsername))
      .then((r) => r[0]);

    if (!admin) {
      return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
    }

    const valid = await bcryptjs.compare(String(password || ""), admin.password);
    if (!valid) {
      return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
    }

    const token = await signToken({ id: admin.id, type: "admin", role: "admin" });

    const resp = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } });

    resp.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return resp;
  } catch (error) {
    console.error("Admin login failed:", error);
    return NextResponse.json({ error: "خطا در ارتباط با سرور مدیریت" }, { status: 500 });
  }
}
