import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";
import { requireAdmin } from "@/lib/auth";
import { saveMedia } from "@/lib/storage/local";
import { IMAGE_PRESETS, ImagePresetName } from "@/lib/image-presets";

export const runtime = "nodejs";
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
const FOLDERS = new Set(["products", "shops", "banners"]);

export async function POST(req: NextRequest) {
  if (!await requireAdmin(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const form = await req.formData();
    const file = form.get("file");
    const folder = String(form.get("folder") || "products");
    const presetName = String(form.get("preset") || "") as ImagePresetName;
    if (!(file instanceof File)) return NextResponse.json({ error: "فایلی ارسال نشده است" }, { status: 400 });
    if (!FOLDERS.has(folder)) return NextResponse.json({ error: "دسته‌بندی تصویر نامعتبر است" }, { status: 400 });
    const preset = IMAGE_PRESETS[presetName];
    if (!preset) return NextResponse.json({ error: "نسبت تصویر مشخص نشده است" }, { status: 400 });
    if (!file.size) return NextResponse.json({ error: "فایل تصویر خالی است" }, { status: 400 });
    if (file.size > MAX_FILE_SIZE) return NextResponse.json({ error: "حجم تصویر نباید بیشتر از ۱۰ مگابایت باشد" }, { status: 413 });

    const source = Buffer.from(await file.arrayBuffer());
    const image = sharp(source, { limitInputPixels: MAX_PIXELS, failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.width || !metadata.height || !["jpeg", "png", "webp", "avif"].includes(metadata.format || "")) {
      return NextResponse.json({ error: "محتوای فایل یک تصویر مجاز نیست" }, { status: 400 });
    }
    const output = await image.rotate().resize(preset.width, preset.height, { fit: "cover" }).webp({ quality: 86, smartSubsample: true }).toBuffer();
    const saved = await saveMedia(folder, output);
    return NextResponse.json({ ...saved, size: output.length, type: "image/webp", width: preset.width, height: preset.height });
  } catch (error) {
    console.error("POST /api/uploads", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "تصویر معتبر نیست یا آپلود انجام نشد" }, { status: 400 });
  }
}
