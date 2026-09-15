import { db, pool } from "@/db";
import { products, stands, siteSettings, sliderBanners, bottomBanners } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { notFound, permanentRedirect } from "next/navigation";
import StoreClient from "./StoreClient";
import { querySuffix, resolveShopSlug } from "@/lib/shops";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolved = await resolveShopSlug(slug);
  if (!resolved) return {};
  return { title: resolved.shop.name, alternates: { canonical: `/store/${resolved.shop.slug}` } };
}

export default async function StorePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const c = await pool.connect();
  try { await c.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB; ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;"); } finally { c.release(); }

  const resolved = await resolveShopSlug(slug);
  if (!resolved) notFound();
  if (resolved.isAlias) permanentRedirect(`/store/${resolved.shop.slug}${querySuffix(await searchParams)}`);
  const shop = resolved.shop;

  const allProducts = await db.select().from(products);
  const allStands = await db.select().from(stands).where(eq(stands.isActive, true)).orderBy(asc(stands.sortOrder), asc(stands.id));
  const sliders = await db.select().from(sliderBanners).orderBy(asc(sliderBanners.sortOrder));
  const bottoms = await db.select().from(bottomBanners).orderBy(asc(bottomBanners.sortOrder));

  const allSettings = await db.select().from(siteSettings);
  const settings: Record<string, string> = {};
  for (const s of allSettings) settings[s.key] = s.value;

  const bestsellers = allProducts.filter((p) => p.isBestseller);
  const bestsellerTitle = settings.bestseller_title || "پرفروش‌ترین‌ها 🔥";

  return (
    <StoreClient
      shop={{
        id: shop.id,
        name: shop.name,
        slug: shop.slug,
        image: shop.image,
        bannerImage: shop.bannerImage,
        bannerMobileImage: shop.bannerMobileImage,
      }}
      products={allProducts.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        images: Array.isArray(p.images) ? p.images : [],
        videoUrl: p.videoUrl,
        isBestseller: p.isBestseller ?? false,
        stock: p.stock ?? 0,
      }))}
      bestsellers={bestsellers.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: p.price,
        image: p.image,
        images: Array.isArray(p.images) ? p.images : [],
        videoUrl: p.videoUrl,
        isBestseller: p.isBestseller ?? false,
        stock: p.stock ?? 0,
      }))}
      stands={allStands.map((stand) => ({
        id: stand.id,
        name: stand.name,
        description: stand.description,
        price: stand.price,
        image: stand.image,
        stock: stand.stock,
        itemType: "stand" as const,
      }))}
      sliderBanners={sliders.map((s) => ({ id: s.id, image: s.image, mobileImage: s.mobileImage }))}
      bottomBanners={bottoms.map((b) => ({ id: b.id, image: b.image, mobileImage: b.mobileImage }))}
      settings={settings}
      bestsellerTitle={bestsellerTitle}
    />
  );
}
