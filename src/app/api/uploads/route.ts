import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { requireAdmin } from "@/lib/auth";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"],
  ["image/gif", ".gif"],
  ["image/avif", ".avif"],
]);

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const requestedFolder = String(formData.get("folder") || "products");
    const folder = requestedFolder === "shops" || requestedFolder === "banners" ? requestedFolder : "products";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "فایلی برای آپلود ارسال نشده است" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "فرمت تصویر مجاز نیست. فقط JPG، PNG، WEBP، GIF و AVIF قابل آپلود هستند." },
        { status: 400 },
      );
    }

    if (file.size <= 0) {
      return NextResponse.json({ error: "فایل تصویر خالی است" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد" }, { status: 400 });
    }

    const extension = ALLOWED_TYPES.get(file.type)!;
    const filename = `${Date.now()}-${crypto.randomUUID()}${extension}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads", folder);
    await mkdir(uploadDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), buffer, { flag: "wx" });

    return NextResponse.json({
      url: `/uploads/${folder}/${filename}`,
      filename,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("POST /api/uploads", error);
    return NextResponse.json({ error: "آپلود تصویر انجام نشد" }, { status: 500 });
  }
}
