import { db, pool } from "@/db";
import { shops, products, siteSettings, sliderBanners, bottomBanners } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import StoreClient from "./StoreClient";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

export default async function StorePage({ params }: PageProps) {
  const { slug } = await params;
  const c = await pool.connect();
  try { await c.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB; ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;"); } finally { c.release(); }

  const shop = await db
    .select()
    .from(shops)
    .where(eq(shops.slug, slug))
    .then((r) => r[0]);

  if (!shop) notFound();

  const allProducts = await db.select().from(products);
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
      sliderBanners={sliders.map((s) => ({ id: s.id, image: s.image }))}
      bottomBanners={bottoms.map((b) => ({ id: b.id, image: b.image }))}
      settings={settings}
      bestsellerTitle={bestsellerTitle}
    />
  );
}
