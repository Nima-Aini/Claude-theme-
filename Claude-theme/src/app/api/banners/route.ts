import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sliderBanners, bottomBanners } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  const sliders = await db.select().from(sliderBanners).orderBy(asc(sliderBanners.sortOrder));
  const bottoms = await db.select().from(bottomBanners).orderBy(asc(bottomBanners.sortOrder));
  return NextResponse.json({ sliders, bottoms });
}

export async function POST(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, image, sortOrder } = await req.json();
  if (type === "slider") {
    const result = await db.insert(sliderBanners).values({ image, sortOrder: sortOrder || 0 }).returning();
    return NextResponse.json(result[0]);
  } else {
    const result = await db.insert(bottomBanners).values({ image, sortOrder: sortOrder || 0 }).returning();
    return NextResponse.json(result[0]);
  }
}

export async function DELETE(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "admin")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, id } = await req.json();
  if (type === "slider") {
    await db.delete(sliderBanners).where(eq(sliderBanners.id, id));
  } else {
    await db.delete(bottomBanners).where(eq(bottomBanners.id, id));
  }
  return NextResponse.json({ success: true });
}
