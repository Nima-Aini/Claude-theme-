import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as bcryptjs from "bcryptjs";
import {
  products,
  shops,
  admins,
  siteSettings,
  sliderBanners,
  bottomBanners,
} from "./schema";

async function seed() {
  const pool = new Pool({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres@127.0.0.1:5432/app_db",
  });
  const db = drizzle(pool);

  console.log("Seeding database...");

  // Admin
  const adminPass = await bcryptjs.hash("admin123", 10);
  await db
    .insert(admins)
    .values({ username: "admin", password: adminPass })
    .onConflictDoNothing();

  // Site settings
  const settings = [
    { key: "primary_color", value: "#FF1744" },
    { key: "secondary_color", value: "#37474F" },
    { key: "accent_color", value: "#FF5252" },
    { key: "bestseller_title", value: "پرفروش‌ترین‌ها 🔥" },
  ];
  for (const s of settings) {
    await db.insert(siteSettings).values(s).onConflictDoNothing();
  }

  // Products (sample AKMA products)
  const productData = [
    {
      name: "کرم مرطوب‌کننده آکما",
      description: "کرم مرطوب‌کننده با فرمول پیشرفته مناسب انواع پوست",
      price: 350000,
      image: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop",
      isBestseller: true,
    },
    {
      name: "سرم ویتامین C آکما",
      description: "سرم روشن‌کننده و ضد لک با ویتامین C خالص",
      price: 480000,
      image: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop",
      isBestseller: true,
    },
    {
      name: "ضد آفتاب آکما SPF50",
      description: "ضد آفتاب با محافظت بالا مناسب استفاده روزانه",
      price: 290000,
      image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&h=400&fit=crop",
      isBestseller: true,
    },
    {
      name: "شامپو تقویتی آکما",
      description: "شامپو تقویت‌کننده مو با عصاره گیاهان طبیعی",
      price: 220000,
      image: "https://images.unsplash.com/photo-1585751119414-ef2636f8aede?w=400&h=400&fit=crop",
      isBestseller: false,
    },
    {
      name: "ماسک صورت آکما",
      description: "ماسک تغذیه‌کننده و آبرسان با عصاره آلوئه‌ورا",
      price: 180000,
      image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=400&h=400&fit=crop",
      isBestseller: true,
    },
    {
      name: "لوسیون بدن آکما",
      description: "لوسیون بدن نرم‌کننده و معطر با رایحه گل رز",
      price: 260000,
      image: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=400&h=400&fit=crop",
      isBestseller: false,
    },
    {
      name: "کرم دور چشم آکما",
      description: "کرم ضد چروک و تیرگی دور چشم با فرمول حرفه‌ای",
      price: 420000,
      image: "https://images.unsplash.com/photo-1570194065650-d99fb4d8a609?w=400&h=400&fit=crop",
      isBestseller: false,
    },
    {
      name: "تونر پاک‌کننده آکما",
      description: "تونر پاک‌کننده و متعادل‌کننده PH پوست",
      price: 195000,
      image: "https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=400&h=400&fit=crop",
      isBestseller: true,
    },
  ];
  for (const p of productData) {
    await db.insert(products).values(p).onConflictDoNothing();
  }

  // Shops
  const shop1Pass = await bcryptjs.hash("shop123", 10);
  const shop2Pass = await bcryptjs.hash("shop456", 10);
  const shop3Pass = await bcryptjs.hash("shop789", 10);

  await db
    .insert(shops)
    .values([
      {
        name: "فروشگاه زیبایی سارا",
        slug: "sara-beauty",
        image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=800&h=400&fit=crop",
        bannerImage: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop",
        username: "sara",
        password: shop1Pass,
        commissionRate: 15,
      },
      {
        name: "فروشگاه آرایشی مهسا",
        slug: "mahsa-cosmetics",
        image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=800&h=400&fit=crop",
        bannerImage: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop",
        username: "mahsa",
        password: shop2Pass,
        commissionRate: 12,
      },
      {
        name: "بوتیک رز",
        slug: "rose-boutique",
        image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=400&fit=crop",
        bannerImage: "https://images.unsplash.com/photo-1526045478516-99145907023c?w=1200&h=400&fit=crop",
        username: "rose",
        password: shop3Pass,
        commissionRate: 10,
      },
    ])
    .onConflictDoNothing();

  // Default slider banners
  await db.insert(sliderBanners).values([
    {
      image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1200&h=400&fit=crop",
      sortOrder: 1,
    },
    {
      image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop",
      sortOrder: 2,
    },
  ]).onConflictDoNothing();

  // Default bottom banners
  await db.insert(bottomBanners).values([
    {
      image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=1200&h=300&fit=crop",
      sortOrder: 1,
    },
  ]).onConflictDoNothing();

  console.log("Seeding complete!");
  console.log("Admin: username=admin, password=admin123");
  console.log("Shop 1: username=sara, password=shop123");
  console.log("Shop 2: username=mahsa, password=shop456");
  console.log("Shop 3: username=rose, password=shop789");

  await pool.end();
}

seed().catch(console.error);
