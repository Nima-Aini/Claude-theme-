import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq, or } from "drizzle-orm";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeShopSlug(value: unknown, optional = false) {
  const normalized = String(value ?? "").trim().toLowerCase().replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (optional && !normalized) return null;
  if (!SLUG.test(normalized)) throw new Error("شناسه URL فقط می‌تواند شامل حروف انگلیسی کوچک، عدد و خط تیره باشد");
  return normalized;
}

export async function resolveShopSlug(value: string) {
  const shop = await db.select().from(shops)
    .where(or(eq(shops.slug, value), eq(shops.secondarySlug, value))).then((rows) => rows[0]);
  return shop ? { shop, isAlias: shop.secondarySlug === value } : null;
}

export function querySuffix(searchParams: Record<string, string | string[] | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) value.forEach((item) => params.append(key, item));
    else if (value !== undefined) params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
