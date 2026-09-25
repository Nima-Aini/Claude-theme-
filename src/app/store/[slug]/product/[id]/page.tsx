import { db, pool } from "@/db";
import { products, siteSettings, sliderBanners, bottomBanners } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound, permanentRedirect } from "next/navigation";
import ProductClient from "./ProductClient";
import { querySuffix, resolveShopSlug } from "@/lib/shops";
import type { Metadata } from "next";

type ProductPageProps = { params: Promise<{ slug: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, id } = await params;
  const resolved = await resolveShopSlug(slug);
  if (!resolved) return {};
  return { alternates: { canonical: `/store/${resolved.shop.slug}/product/${id}` } };
}

export const dynamic = "force-dynamic";

export default async function ProductPage({ params, searchParams }: ProductPageProps) {
  const { slug, id } = await params;
  const c = await pool.connect();
  try {
    await c.query(`
      ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 100;
    `);
  } finally {
    c.release();
  }

  const resolved = await resolveShopSlug(slug);
  if (!resolved) notFound();
  if (resolved.isAlias) permanentRedirect(`/store/${resolved.shop.slug}/product/${id}${querySuffix(await searchParams)}`);
  const shop = resolved.shop;
  const product = await db.select().from(products).where(eq(products.id, Number(id))).then((r) => r[0]);

  if (!product) notFound();

  const allProducts = await db.select().from(products).orderBy(desc(products.id));
  const bestsellers = allProducts
    .filter((p) => p.isBestseller && p.id !== product.id)
    .slice(0, 8);

  const rawSettings = await db.select().from(siteSettings);
  const settings: Record<string, string> = {};
  rawSettings.forEach((s) => {
    settings[s.key] = s.value;
  });

  const sliders = await db.select().from(sliderBanners).orderBy(sliderBanners.sortOrder);
  const bottoms = await db.select().from(bottomBanners).orderBy(bottomBanners.sortOrder);

  const normalizedProduct = {
    ...product,
    isBestseller: Boolean(product.isBestseller),
    stock: Math.max(0, (product.stock ?? 0) - product.reservedStock),
  };

  const normalizedBestsellers = (bestsellers.length > 0 ? bestsellers : allProducts.filter((p) => p.id !== product.id).slice(0, 6)).map((p) => ({
    ...p,
    isBestseller: Boolean(p.isBestseller),
    stock: Math.max(0, (p.stock ?? 0) - p.reservedStock),
  }));

  return (
    <ProductClient
      shop={shop}
      product={normalizedProduct}
      bestsellers={normalizedBestsellers}
      allProducts={allProducts.map(p => ({ ...p, isBestseller: Boolean(p.isBestseller), stock: Math.max(0, (p.stock ?? 0) - p.reservedStock) }))}
      settings={settings}
      sliderBanners={sliders}
      bottomBanners={bottoms}
      bestsellerTitle={settings.bestseller_title || "محصولات پرفروش 🔥"}
    />
  );
}

