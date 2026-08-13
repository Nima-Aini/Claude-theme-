import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import * as bcryptjs from "bcryptjs";

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  if (key !== "akma-setup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const client = await pool.connect();

    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (id SERIAL PRIMARY KEY, key VARCHAR(255) NOT NULL UNIQUE, value TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS products (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT, price INTEGER NOT NULL, image TEXT, is_bestseller BOOLEAN DEFAULT false, stock INTEGER DEFAULT 100, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS shops (id SERIAL PRIMARY KEY, name VARCHAR(255) NOT NULL, slug VARCHAR(255) NOT NULL UNIQUE, image TEXT, banner_image TEXT, username VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL, phone VARCHAR(20), commission_rate INTEGER DEFAULT 10, total_earnings INTEGER DEFAULT 0, paid_earnings INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS customers (id SERIAL PRIMARY KEY, phone VARCHAR(20) NOT NULL UNIQUE, name VARCHAR(255), address TEXT, postal_code VARCHAR(10), created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS orders (id SERIAL PRIMARY KEY, customer_id INTEGER NOT NULL, shop_id INTEGER NOT NULL, customer_name VARCHAR(255) NOT NULL, customer_phone VARCHAR(20) NOT NULL, customer_address TEXT NOT NULL, shipping_method VARCHAR(50) NOT NULL, total_amount INTEGER NOT NULL, commission_amount INTEGER DEFAULT 0, status VARCHAR(50) DEFAULT 'pending', tracking_link TEXT, customer_postal_code VARCHAR(10), items JSONB NOT NULL, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS admins (id SERIAL PRIMARY KEY, username VARCHAR(255) NOT NULL UNIQUE, password VARCHAR(255) NOT NULL);
      CREATE TABLE IF NOT EXISTS payouts (id SERIAL PRIMARY KEY, shop_id INTEGER NOT NULL, amount INTEGER NOT NULL, description TEXT, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS payout_requests (id SERIAL PRIMARY KEY, shop_id INTEGER NOT NULL, amount INTEGER NOT NULL, status VARCHAR(50) DEFAULT 'pending', created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS slider_banners (id SERIAL PRIMARY KEY, image TEXT NOT NULL, sort_order INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS bottom_banners (id SERIAL PRIMARY KEY, image TEXT NOT NULL, sort_order INTEGER DEFAULT 0);
      CREATE TABLE IF NOT EXISTS discount_codes (id SERIAL PRIMARY KEY, code VARCHAR(50) NOT NULL UNIQUE, percentage INTEGER NOT NULL DEFAULT 0, type VARCHAR(20) NOT NULL DEFAULT 'percentage', value INTEGER NOT NULL DEFAULT 0, is_active BOOLEAN DEFAULT true, is_public BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW());
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'percentage';
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS value INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
      UPDATE discount_codes SET value = percentage, type = 'percentage' WHERE value = 0 AND percentage > 0;
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_postal_code VARCHAR(10);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
      CREATE TABLE IF NOT EXISTS support_tickets (id SERIAL PRIMARY KEY, customer_id INTEGER, shop_id INTEGER, product_id INTEGER, subject VARCHAR(255) NOT NULL DEFAULT 'پشتیبانی', status VARCHAR(30) NOT NULL DEFAULT 'open', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS support_messages (id SERIAL PRIMARY KEY, ticket_id INTEGER NOT NULL, sender_type VARCHAR(20) NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS otp_codes (id SERIAL PRIMARY KEY, phone VARCHAR(20) NOT NULL, code VARCHAR(6) NOT NULL, expires_at TIMESTAMP NOT NULL, verified BOOLEAN DEFAULT false, created_at TIMESTAMP DEFAULT NOW());
    `);

    const adminCheck = await client.query("SELECT id FROM admins WHERE username = 'admin'");
    
    if (adminCheck.rows.length === 0) {
      const adminPass = await bcryptjs.hash("admin123", 10);
      await client.query("INSERT INTO admins (username, password) VALUES ($1, $2)", ["admin", adminPass]);

      await client.query(`INSERT INTO site_settings (key, value) VALUES ('primary_color', '#FF1744'), ('secondary_color', '#37474F'), ('accent_color', '#FF5252'), ('bestseller_title', 'پرفروش‌ترین‌ها') ON CONFLICT (key) DO NOTHING`);

      await client.query(`INSERT INTO products (name, description, price, image, is_bestseller) VALUES ('کرم مرطوب‌کننده آکما', 'کرم مرطوب‌کننده با فرمول پیشرفته', 350000, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', true), ('سرم ویتامین C آکما', 'سرم روشن‌کننده و ضد لک', 480000, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop', true), ('ضد آفتاب آکما SPF50', 'ضد آفتاب با محافظت بالا', 290000, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop', true), ('شامپو تقویتی آکما', 'شامپو تقویت‌کننده مو', 220000, 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop', false), ('ماسک صورت آکما', 'ماسک تغذیه‌کننده و آبرسان', 180000, 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop', true) ON CONFLICT DO NOTHING`);

      const shop1Pass = await bcryptjs.hash("shop123", 10);
      const shop2Pass = await bcryptjs.hash("shop456", 10);
      const shop3Pass = await bcryptjs.hash("shop789", 10);

      await client.query(`INSERT INTO shops (name, slug, image, banner_image, username, password, commission_rate) VALUES ($1, 'sara-beauty', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=400&fit=crop', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop', 'sara', $2, 15) ON CONFLICT (slug) DO NOTHING`, ['فروشگاه زیبایی سارا', shop1Pass]);
      await client.query(`INSERT INTO shops (name, slug, image, banner_image, username, password, commission_rate) VALUES ($1, 'mahsa-cosmetics', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=400&fit=crop', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop', 'mahsa', $2, 12) ON CONFLICT (slug) DO NOTHING`, ['فروشگاه آرایشی مهسا', shop2Pass]);
      await client.query(`INSERT INTO shops (name, slug, image, banner_image, username, password, commission_rate) VALUES ($1, 'rose-boutique', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop', 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=1200&h=400&fit=crop', 'rose', $2, 10) ON CONFLICT (slug) DO NOTHING`, ['بوتیک رز', shop3Pass]);

      await client.query(`INSERT INTO slider_banners (image, sort_order) VALUES ('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop', 1), ('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop', 2) ON CONFLICT DO NOTHING`);
    }

    client.release();

    return NextResponse.json({ success: true, message: "Database setup complete!", admin: "adminakma / Akma!2026#Nima@Secure", shops: "sara/shop123, mahsa/shop456, rose/shop789" });

  } catch (error: any) {
    return NextResponse.json({ error: "Setup failed", details: error.message }, { status: 500 });
  }
}
