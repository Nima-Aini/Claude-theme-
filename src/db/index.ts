import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { newDb } from "pg-mem";
import * as bcryptjs from "bcryptjs";

const databaseUrl = process.env.DATABASE_URL;

interface GlobalDbState {
  pool?: Pool;
  db?: any;
  initialized?: boolean;
}

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsDbState?: GlobalDbState;
};

if (!globalForDb.__arenaNextJsDbState) {
  globalForDb.__arenaNextJsDbState = {};
}

export async function syncFullDatabase(poolInstance: Pool) {
  let client;
  try {
    client = await poolInstance.connect();
  } catch (e) {
    console.error("[Database] Failed to connect for sync:", e);
    return;
  }

  try {
    // 1. Create all base tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        key VARCHAR(255) NOT NULL UNIQUE,
        value TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        image TEXT,
        images JSONB,
        video_url TEXT,
        is_bestseller BOOLEAN DEFAULT false,
        stock INTEGER DEFAULT 100,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        image TEXT,
        banner_image TEXT,
        username VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        commission_rate INTEGER DEFAULT 10,
        total_earnings INTEGER DEFAULT 0,
        paid_earnings INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL UNIQUE,
        name VARCHAR(255),
        address TEXT,
        postal_code VARCHAR(10),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
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
        customer_postal_code VARCHAR(10),
        items JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20),
        password VARCHAR(255) NOT NULL
      );
      CREATE TABLE IF NOT EXISTS payouts (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS payout_requests (
        id SERIAL PRIMARY KEY,
        shop_id INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS slider_banners (
        id SERIAL PRIMARY KEY,
        image TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS bottom_banners (
        id SERIAL PRIMARY KEY,
        image TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS discount_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) NOT NULL UNIQUE,
        percentage INTEGER NOT NULL DEFAULT 0,
        type VARCHAR(20) NOT NULL DEFAULT 'percentage',
        value INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        is_public BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS otp_codes (
        id SERIAL PRIMARY KEY,
        phone VARCHAR(20) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER,
        shop_id INTEGER,
        product_id INTEGER,
        subject VARCHAR(255) NOT NULL DEFAULT 'پشتیبانی',
        status VARCHAR(30) NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS support_messages (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL,
        sender_type VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS customer_shop_logins (
        id SERIAL PRIMARY KEY,
        customer_id INTEGER NOT NULL,
        shop_id INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Perform all ALTER TABLE migrations safely
    await client.query(`
      ALTER TABLE admins ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS images JSONB;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS video_url TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS is_bestseller BOOLEAN DEFAULT false;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 100;
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS commission_rate INTEGER DEFAULT 10;
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS total_earnings INTEGER DEFAULT 0;
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS paid_earnings INTEGER DEFAULT 0;
      ALTER TABLE customers ADD COLUMN IF NOT EXISTS postal_code VARCHAR(10);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_postal_code VARCHAR(10);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_link TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'percentage';
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS value INTEGER DEFAULT 0;
      ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
    `);

    // 3. Seed/Sync Admin Accounts (adminakma, admin, nima)
    const adminPassHash = await bcryptjs.hash("Akma!2026#Nima@Secure", 10);
    const legacyPassHash = await bcryptjs.hash("admin123", 10);

    // Ensure adminakma exists
    const adminakmaRes = await client.query("SELECT id FROM admins WHERE username = $1", ["adminakma"]);
    if (adminakmaRes.rows.length === 0) {
      await client.query("INSERT INTO admins (username, password) VALUES ($1, $2)", ["adminakma", adminPassHash]);
    } else {
      await client.query("UPDATE admins SET password = $1 WHERE username = $2", [adminPassHash, "adminakma"]);
    }

    // Ensure admin exists
    const adminRes = await client.query("SELECT id FROM admins WHERE username = $1", ["admin"]);
    if (adminRes.rows.length === 0) {
      await client.query("INSERT INTO admins (username, password) VALUES ($1, $2)", ["admin", legacyPassHash]);
    } else {
      await client.query("UPDATE admins SET password = $1 WHERE username = $2", [legacyPassHash, "admin"]);
    }

    // Ensure site settings
    await client.query(`
      INSERT INTO site_settings (key, value) VALUES 
      ('primary_color', '#FF1744'),
      ('secondary_color', '#37474F'),
      ('accent_color', '#FF5252'),
      ('bestseller_title', 'پرفروش‌ترین‌ها 🔥')
      ON CONFLICT (key) DO NOTHING
    `);

    // Ensure default shops
    const shop1Pass = await bcryptjs.hash("shop123", 10);
    const shop2Pass = await bcryptjs.hash("shop456", 10);
    const shop3Pass = await bcryptjs.hash("shop789", 10);

    await client.query(
      "INSERT INTO shops (name, slug, image, banner_image, username, password, commission_rate) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (slug) DO NOTHING",
      ["فروشگاه زیبایی سارا", "sara-beauty", "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop", "sara", shop1Pass, 15]
    );
    await client.query(
      "INSERT INTO shops (name, slug, image, banner_image, username, password, commission_rate) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (slug) DO NOTHING",
      ["فروشگاه آرایشی مهسا", "mahsa-cosmetics", "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop", "mahsa", shop2Pass, 12]
    );
    await client.query(
      "INSERT INTO shops (name, slug, image, banner_image, username, password, commission_rate) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (slug) DO NOTHING",
      ["بوتیک رز", "rose-boutique", "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop", "https://images.unsplash.com/photo-1526045478516-99145907023c?w=1200&h=400&fit=crop", "rose", shop3Pass, 10]
    );

    // Ensure sample products if products table is empty
    const productCountRes = await client.query("SELECT COUNT(*) as count FROM products");
    if (parseInt(productCountRes.rows[0]?.count || "0", 10) === 0) {
      const sampleProducts = [
        { name: "کرم مرطوب‌کننده آکما", desc: "کرم مرطوب‌کننده با فرمول پیشرفته مناسب انواع پوست", price: 350000, img: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop", bestseller: true },
        { name: "سرم ویتامین C آکما", desc: "سرم روشن‌کننده و ضد لک با ویتامین C خالص", price: 480000, img: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop", bestseller: true },
        { name: "ضد آفتاب آکما SPF50", desc: "ضد آفتاب با محافظت بالا مناسب استفاده روزانه", price: 290000, img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop", bestseller: true },
        { name: "شامپو تقویتی آکما", desc: "شامپو تقویت‌کننده مو با عصاره گیاهان طبیعی", price: 220000, img: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop", bestseller: false },
        { name: "ماسک صورت آکما", desc: "ماسک تغذیه‌کننده و آبرسان با عصاره آلوئه‌ورا", price: 180000, img: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop", bestseller: true },
        { name: "لوسیون بدن آکما", desc: "لوسیون بدن نرم‌کننده و معطر با رایحه گل رز", price: 260000, img: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop", bestseller: false },
        { name: "کرم دور چشم آکما", desc: "کرم ضد چروک و تیرگی دور چشم با فرمول حرفه‌ای", price: 420000, img: "https://images.unsplash.com/photo-1570194065650-d99fb4d8a609?w=400&h=400&fit=crop", bestseller: false },
        { name: "تونر پاک‌کننده آکما", desc: "تونر پاک‌کننده و متعادل‌کننده PH پوست", price: 195000, img: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400&h=400&fit=crop", bestseller: true }
      ];
      for (const p of sampleProducts) {
        await client.query(
          "INSERT INTO products (name, description, price, image, is_bestseller) VALUES ($1, $2, $3, $4, $5)",
          [p.name, p.desc, p.price, p.img, p.bestseller]
        );
      }
    }

    // Default banners if empty
    const bannerCount = await client.query("SELECT COUNT(*) as count FROM slider_banners");
    if (parseInt(bannerCount.rows[0]?.count || "0", 10) === 0) {
      await client.query(
        "INSERT INTO slider_banners (image, sort_order) VALUES ($1, 1), ($2, 2)",
        [
          "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop",
          "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop",
        ]
      );
    }
    const bottomBannerCount = await client.query("SELECT COUNT(*) as count FROM bottom_banners");
    if (parseInt(bottomBannerCount.rows[0]?.count || "0", 10) === 0) {
      await client.query(
        "INSERT INTO bottom_banners (image, sort_order) VALUES ($1, 1)",
        ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200&h=300&fit=crop"]
      );
    }

    // Default discount
    await client.query(
      "INSERT INTO discount_codes (code, percentage, type, value, is_active, is_public) VALUES ($1, 10, 'percentage', 10, true, true) ON CONFLICT (code) DO NOTHING",
      ["AKMA10"]
    );
  } finally {
    client.release();
  }
}

function createInMemoryPool(): Pool {
  const mem = newDb();
  
  mem.public.registerFunction({
    name: "now",
    implementation: () => new Date(),
  });
  mem.public.registerFunction({
    name: "current_timestamp",
    implementation: () => new Date(),
  });

  const { Pool: MemPool } = mem.adapters.createPg();
  const poolInstance = new MemPool() as unknown as Pool;

  syncFullDatabase(poolInstance).catch((err) => {
    console.error("Error syncing in-memory DB:", err);
  });

  return poolInstance;
}

let pool: Pool;

if (globalForDb.__arenaNextJsDbState?.pool) {
  pool = globalForDb.__arenaNextJsDbState.pool;
} else if (databaseUrl) {
  try {
    pool = new Pool({ connectionString: databaseUrl });
    syncFullDatabase(pool).catch((err) => {
      console.error("Error auto-syncing PostgreSQL DB:", err);
    });
  } catch {
    console.warn("[AI Studio] DATABASE_URL provided but failed to instantiate pool, using in-memory DB fallback");
    pool = createInMemoryPool();
  }
} else {
  console.info("[AI Studio] No DATABASE_URL provided. Using in-memory PostgreSQL fallback.");
  pool = createInMemoryPool();
}

globalForDb.__arenaNextJsDbState.pool = pool;

export const db = drizzle(pool);
export { pool };
