import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  const all = await db.select().from(siteSettings);
  const result: Record<string, string> = {};
  for (const s of all) {
    result[s.key] = s.value;
  }
  return NextResponse.json(result);
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  for (const [key, value] of Object.entries(body)) {
    const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key)).then(r => r[0]);
    if (existing) {
      await db.update(siteSettings).set({ value: String(value) }).where(eq(siteSettings.key, key));
    } else {
      await db.insert(siteSettings).values({ key, value: String(value) });
    }
  }

  return NextResponse.json({ success: true });
}
