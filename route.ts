import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/db";
import * as bcryptjs from "bcryptjs";
export async function GET(req: NextRequest) {
  // Simple security - change this key!
  const key = req.nextUrl.searchParams.get("key");
  if (key !== "akma-setup-2024") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const client = await pool.connect();
    // Create all tables
    await client.query(`
      -- Site settings
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT NOT NULL
      );
      -- Products
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        image TEXT,
        is_bestseller BOOLEAN DEFAULT false,
        stock INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT NOW()
      );
      -- Shops
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        image TEXT,
        banner_image TEXT,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        commission_rate INTEGER DEFAULT 10,
        total_earnings INTEGER DEFAULT 0,
        paid_earnings INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
      -- Customers
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(255),
        address TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      -- Orders
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        shop_id INTEGER NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        shipping_method VARCHAR(50) NOT NULL,
        total_amount INTEGER NOT NULL,
        commission_amount INTEGER DEFAULT 0,
        status VARCHAR(50) DEFAULT 'pending',
        tracking_link TEXT,
        items JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      -- Admins
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL
      );
      -- Payouts
      CREATE TABLE IF NOT EXISTS payouts (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
      -- Payout requests
      CREATE TABLE IF NOT EXISTS payout_requests (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
      -- Slider banners
      CREATE TABLE IF NOT EXISTS slider_banners (
        id SERIAL PRIMARY KEY,
        image TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      );
      -- Bottom banners
      CREATE TABLE IF NOT EXISTS bottom_banners (
        id SERIAL PRIMARY KEY,
        image TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      );
      -- Discount codes
      CREATE TABLE IF NOT EXISTS discount_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        percentage INTEGER NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
      -- OTP codes
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // Check if admin exists
    const adminCheck = await client.query("SELECT id FROM admins WHERE username = 'admin'");
    
    if (adminCheck.rows.length === 0) {
      // Seed data
      const adminPass = await bcryptjs.hash("admin123", 10);
      await client.query("INSERT INTO admins (username, password) VALUES ($1, $2)", ["admin", adminPass]);
      // Site settings
      await client.query(`
        INSERT INTO site_settings (key, value) VALUES 
        ('primary_color', '#FF1744'),
        ('secondary_color', '#37474F'),
        ('accent_color', '#FF5252'),
        ('bestseller_title', 'پرفروش‌ترین‌ها')
        ON CONFLICT (key) DO NOTHING
      `);
      // Products
      await client.query(`
        INSERT INTO products (name, description, price, image, is_bestseller) VALUES 
        ('کرم مرطوب‌کننده آکما', 'کرم مرطوب‌کننده با فرمول پیشرفته مناسب انواع پوست', 350000, 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop', true),
        ('سرم ویتامین C آکما', 'سرم روشن‌کننده و ضد لک با ویتامین C خالص', 480000, 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop', true),
        ('ضد آفتاب آکما SPF50', 'ضد آفتاب با محافظت بالا مناسب استفاده روزانه', 290000, 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop', true),
        ('شامپو تقویتی آکما', 'شامپو تقویت‌کننده مو با عصاره گیاهان طبیعی', 220000, 'https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop', false),
        ('ماسک صورت آکما', 'ماسک تغذیه‌کننده و آبرسان با عصاره آلوئه‌ورا', 180000, 'https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop', true),
        ('لوسیون بدن آکما', 'لوسیون بدن نرم‌کننده و معطر با رایحه گل رز', 260000, 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop', false),
        ('کرم دور چشم آکما', 'کرم ضد چروک و تیرگی دور چشم با فرمول حرفه‌ای', 420000, 'https://images.unsplash.com/photo-1570194065650-d99fb4d8a609?w=400&h=400&fit=crop', false),
        ('تونر پاک‌کننده آکما', 'تونر پاک‌کننده و متعادل‌کننده PH پوست', 195000, 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400&h=400&fit=crop', true)
        ON CONFLICT DO NOTHING
      `);
      // Shops
      const shop1Pass = await bcryptjs.hash("shop123", 10);
      const shop2Pass = await bcryptjs.hash("shop456", 10);
      const shop3Pass = await bcryptjs.hash("shop789", 10);
      await client.query(`
        INSERT INTO shops (name, slug, image, banner_image, username, password, commission_rate) VALUES 
        ($1, 'sara-beauty', 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=400&fit=crop', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop', 'sara', $2, 15),
        ($3, 'mahsa-cosmetics', 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=400&fit=crop', 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop', 'mahsa', $4, 12),
        ($5, 'rose-boutique', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop', 'https://images.unsplash.com/photo-1526045478516-99145907023c?w=1200&h=400&fit=crop', 'rose', $6, 10)
        ON CONFLICT (slug) DO NOTHING
      `, ['فروشگاه زیبایی سارا', shop1Pass, 'فروشگاه آرایشی مهسا', shop2Pass, 'بوتیک رز', shop3Pass]);
      // Banners
      await client.query(`
        INSERT INTO slider_banners (image, sort_order) VALUES 
        ('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop', 1),
        ('https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop', 2)
        ON CONFLICT DO NOTHING
      `);
      await client.query(`
        INSERT INTO bottom_banners (image, sort_order) VALUES 
        ('https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200&h=300&fit=crop', 1)
        ON CONFLICT DO NOTHING
      `);
    }
    client.release();
    return NextResponse.json({ 
      success: true, 
      message: "Database setup complete!",
      credentials: {
        admin: { username: "admin", password: "admin123" },
        shops: [
          { name: "فروشگاه سارا", username: "sara", password: "shop123", url: "/store/sara-beauty" },
          { name: "فروشگاه مهسا", username: "mahsa", password: "shop456", url: "/store/mahsa-cosmetics" },
          { name: "بوتیک رز", username: "rose", password: "shop789", url: "/store/rose-boutique" },
        ]
      }
    });
  } catch (error: any) {
    console.error("Setup error:", error);
    return NextResponse.json({ 
      error: "Setup failed", 
      details: error.message 
    }, { status: 500 });
  }
}
