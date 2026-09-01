import { db, pool } from "@/db";
import { products, shops, siteSettings, sliderBanners, bottomBanners } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProductClient from "./ProductClient";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
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

  const shop = await db.select().from(shops).where(eq(shops.slug, slug)).then((r) => r[0]);
  const product = await db.select().from(products).where(eq(products.id, Number(id))).then((r) => r[0]);

  if (!shop || !product) notFound();

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
    stock: product.stock ?? 100,
  };

  const normalizedBestsellers = (bestsellers.length > 0 ? bestsellers : allProducts.filter((p) => p.id !== product.id).slice(0, 6)).map((p) => ({
    ...p,
    isBestseller: Boolean(p.isBestseller),
    stock: p.stock ?? 100,
  }));

  return (
    <ProductClient
      shop={shop}
      product={normalizedProduct}
      bestsellers={normalizedBestsellers}
      allProducts={allProducts.map(p => ({ ...p, isBestseller: Boolean(p.isBestseller), stock: p.stock ?? 100 }))}
      settings={settings}
      sliderBanners={sliders}
      bottomBanners={bottoms}
      bestsellerTitle={settings.bestseller_title || "محصولات پرفروش 🔥"}
    />
  );
}

