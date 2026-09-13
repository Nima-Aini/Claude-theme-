import { NextRequest, NextResponse } from "next/server";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import crypto from "node:crypto";
import path from "node:path";
import { safeMediaFile } from "@/lib/storage/local";

export const runtime = "nodejs";
const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
  ".webp": "image/webp", ".avif": "image/avif",
};

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const parts = (await context.params).path;
  const filename = safeMediaFile(parts);
  if (!filename) return NextResponse.json({ error: "مسیر تصویر نامعتبر است" }, { status: 400 });
  try {
    const info = await stat(filename);
    if (!info.isFile()) throw new Error("not-file");
    const etag = `"${crypto.createHash("sha1").update(`${info.size}:${info.mtimeMs}`).digest("hex")}"`;
    if (req.headers.get("if-none-match") === etag) return new NextResponse(null, { status: 304, headers: { ETag: etag } });
    const stream = Readable.toWeb(createReadStream(filename)) as ReadableStream;
    return new NextResponse(stream, {
      headers: {
        "Content-Type": CONTENT_TYPES[path.extname(filename).toLowerCase()] || "application/octet-stream",
        "Content-Length": String(info.size), ETag: etag,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "تصویر پیدا نشد" }, { status: 404 });
  }
}
