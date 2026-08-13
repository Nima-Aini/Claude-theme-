import { db, pool } from "@/db";
import { products, shops } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import ProductClient from "./ProductClient";

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const c = await pool.connect();
  try { await c.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB; ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;"); } finally { c.release(); }
  const shop = await db.select().from(shops).where(eq(shops.slug, slug)).then(r => r[0]);
  const product = await db.select().from(products).where(eq(products.id, Number(id))).then(r => r[0]);
  if (!shop || !product) notFound();
  return <ProductClient shop={shop} product={product} />;
}
