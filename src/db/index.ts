import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { newDb } from "pg-mem";

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
      CREATE TABLE IF NOT EXISTS stands (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price INTEGER NOT NULL,
        image TEXT,
        images JSONB,
        stock INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT true,
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS stands_public_order_idx ON stands (is_active, sort_order, id);
      CREATE TABLE IF NOT EXISTS shops (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) NOT NULL UNIQUE,
        secondary_slug VARCHAR(255) UNIQUE,
        image TEXT,
        banner_image TEXT,
        banner_mobile_image TEXT,
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
        mobile_image TEXT,
        sort_order INTEGER DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS bottom_banners (
        id SERIAL PRIMARY KEY,
        image TEXT NOT NULL,
        mobile_image TEXT,
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
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS secondary_slug VARCHAR(255);
      ALTER TABLE shops ADD COLUMN IF NOT EXISTS banner_mobile_image TEXT;
      ALTER TABLE slider_banners ADD COLUMN IF NOT EXISTS mobile_image TEXT;
      ALTER TABLE bottom_banners ADD COLUMN IF NOT EXISTS mobile_image TEXT;
      CREATE UNIQUE INDEX IF NOT EXISTS shops_secondary_slug_unique ON shops (secondary_slug) WHERE secondary_slug IS NOT NULL;
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
    if (process.env.NODE_ENV !== "production") {
      syncFullDatabase(pool).catch((err) => console.error("Error auto-syncing development DB:", err));
    }
  } catch {
    console.warn("[AI Studio] DATABASE_URL provided but failed to instantiate pool, using in-memory DB fallback");
    pool = createInMemoryPool();
  }
} else {
  if (process.env.NODE_ENV === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("DATABASE_URL is required in production");
  }
  console.info("[AI Studio] No DATABASE_URL provided. Using in-memory PostgreSQL fallback.");
  pool = createInMemoryPool();
}

globalForDb.__arenaNextJsDbState.pool = pool;

export const db = drizzle(pool);
export { pool };
