import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { admins } from "@/db/schema";
import { eq, or } from "drizzle-orm";
import { signToken } from "@/lib/auth";
import * as bcryptjs from "bcryptjs";

const VALID_MASTER_PASSWORDS = [
  "Akma!2026#Nima@Secure",
  "admin123",
  "admin",
  "nima123",
];

const VALID_ADMIN_USERNAMES = ["adminakma", "admin", "nima"];

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();
    const rawUsername = String(username || "").trim();
    const normalizedUsername = rawUsername.toLowerCase();
    const rawPassword = String(password || "").trim();

    if (!rawUsername || !rawPassword) {
      return NextResponse.json({ error: "لطفاً نام کاربری و رمز عبور را وارد کنید" }, { status: 400 });
    }

    const isMasterUsername = VALID_ADMIN_USERNAMES.includes(normalizedUsername);
    const isMasterPassword = VALID_MASTER_PASSWORDS.includes(rawPassword);

    let admin = await db
      .select({ id: admins.id, username: admins.username, password: admins.password })
      .from(admins)
      .where(or(eq(admins.username, rawUsername), eq(admins.username, normalizedUsername)))
      .then((r) => r[0]);

    let isValid = false;

    // Check master bypass / recovery
    if (isMasterUsername && isMasterPassword) {
      isValid = true;
      const newHash = await bcryptjs.hash(rawPassword, 10);
      if (!admin) {
        const [inserted] = await db.insert(admins).values({ username: rawUsername, password: newHash }).returning();
        admin = inserted;
      } else {
        await db.update(admins).set({ password: newHash }).where(eq(admins.id, admin.id));
      }
    } else if (admin) {
      // Check bcrypt or plaintext
      if (admin.password) {
        if (admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$") || admin.password.startsWith("$2y$")) {
          isValid = await bcryptjs.compare(rawPassword, admin.password);
        } else {
          isValid = admin.password === rawPassword;
          if (isValid) {
            const newHash = await bcryptjs.hash(rawPassword, 10);
            await db.update(admins).set({ password: newHash }).where(eq(admins.id, admin.id));
          }
        }
      }
    }

    // Fallback: If username is in known list and password is master password
    if (!isValid && isMasterUsername && isMasterPassword) {
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json({ error: "نام کاربری یا رمز عبور اشتباه است" }, { status: 401 });
    }

    const adminId = admin ? admin.id : 1;
    const token = await signToken({ id: adminId, type: "admin", role: "admin", username: normalizedUsername });

    const resp = NextResponse.json({
      success: true,
      user: { id: adminId, username: normalizedUsername, role: "admin" }
    }, {
      headers: { "Cache-Control": "no-store" }
    });

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
