import { mkdir, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const SAFE_SEGMENT = /^[a-z0-9][a-z0-9._-]*$/i;

export function uploadRoot() {
  const configured = process.env.UPLOAD_DIR;
  if (configured) return path.resolve(configured);
  if (process.env.NODE_ENV === "production") throw new Error("UPLOAD_DIR is required in production");
  return path.resolve(process.cwd(), ".data", "uploads");
}

export function publicMediaPath() {
  const value = (process.env.UPLOAD_PUBLIC_PATH || "/media").replace(/\/+$/, "");
  return value.startsWith("/") ? value : `/${value}`;
}

export function safeMediaFile(parts: string[]) {
  if (!parts.length || parts.some((part) => !SAFE_SEGMENT.test(part) || part === "." || part === "..")) return null;
  const root = uploadRoot();
  const resolved = path.resolve(root, ...parts);
  if (resolved !== root && !resolved.startsWith(root + path.sep)) return null;
  return resolved;
}

export async function saveMedia(folder: string, contents: Buffer, extension = ".webp") {
  if (!["products", "stands", "shops", "banners"].includes(folder)) throw new Error("Invalid media folder");
  const directory = path.join(uploadRoot(), folder);
  await mkdir(directory, { recursive: true });
  const name = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const destination = path.join(directory, name);
  const temporary = `${destination}.${crypto.randomUUID()}.tmp`;
  try {
    const { writeFile } = await import("node:fs/promises");
    await writeFile(temporary, contents, { flag: "wx", mode: 0o640 });
    await rename(temporary, destination);
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => undefined);
    throw error;
  }
  return { filename: name, url: `${publicMediaPath()}/${folder}/${name}` };
}

export async function storageHealth() {
  const root = uploadRoot();
  await mkdir(root, { recursive: true });
  return stat(root);
}
