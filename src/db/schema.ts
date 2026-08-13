import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  jsonb,
} from "drizzle-orm/pg-core";

// Site settings (colors, texts, banners)
export const siteSettings = pgTable("site_settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  price: integer("price").notNull(), // in Toman
  image: text("image"),
  images: jsonb("images"),
  videoUrl: text("video_url"),
  isBestseller: boolean("is_bestseller").default(false),
  stock: integer("stock").default(100),
  createdAt: timestamp("created_at").defaultNow(),
});

// Shops (sellers/resellers)
export const shops = pgTable("shops", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  image: text("image"),
  bannerImage: text("banner_image"),
  username: varchar("username", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  password: varchar("password", { length: 255 }).notNull(),
  commissionRate: integer("commission_rate").default(10), // percentage
  totalEarnings: integer("total_earnings").default(0),
  paidEarnings: integer("paid_earnings").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Customers
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  address: text("address"),
  postalCode: varchar("postal_code", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id").notNull(),
  shopId: integer("shop_id").notNull(),
  customerName: varchar("customer_name", { length: 255 }).notNull(),
  customerPhone: varchar("customer_phone", { length: 20 }).notNull(),
  customerAddress: text("customer_address").notNull(),
  shippingMethod: varchar("shipping_method", { length: 50 }).notNull(),
  totalAmount: integer("total_amount").notNull(),
  commissionAmount: integer("commission_amount").default(0),
  status: varchar("status", { length: 50 }).default("pending"),
  trackingLink: text("tracking_link"),
  customerPostalCode: varchar("customer_postal_code", { length: 10 }),
  items: jsonb("items").notNull(), // [{productId, name, price, quantity, image}]
  createdAt: timestamp("created_at").defaultNow(),
});

// Admin users
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  password: varchar("password", { length: 255 }).notNull(),
});

// Payout history
export const payouts = pgTable("payouts", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull(),
  amount: integer("amount").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payout requests from shops
export const payoutRequests = pgTable("payout_requests", {
  id: serial("id").primaryKey(),
  shopId: integer("shop_id").notNull(),
  amount: integer("amount").notNull(),
  status: varchar("status", { length: 50 }).default("pending"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Slider banners
export const sliderBanners = pgTable("slider_banners", {
  id: serial("id").primaryKey(),
  image: text("image").notNull(),
  sortOrder: integer("sort_order").default(0),
});

// Bottom banners
export const bottomBanners = pgTable("bottom_banners", {
  id: serial("id").primaryKey(),
  image: text("image").notNull(),
  sortOrder: integer("sort_order").default(0),
});

// Discount codes
export const discountCodes = pgTable("discount_codes", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 50 }).notNull().unique(),
  // Legacy column kept for backwards-compatible databases. New code uses type/value.
  percentage: integer("percentage").notNull().default(0),
  type: varchar("type", { length: 20 }).notNull().default("percentage"), // percentage | amount
  value: integer("value").notNull().default(0), // percentage number or Toman amount
  isActive: boolean("is_active").default(true),
  isPublic: boolean("is_public").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// OTP codes for phone verification
export const otpCodes = pgTable("otp_codes", {
  id: serial("id").primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull(),
  code: varchar("code", { length: 6 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  verified: boolean("verified").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  customerId: integer("customer_id"),
  shopId: integer("shop_id"),
  productId: integer("product_id"),
  subject: varchar("subject", { length: 255 }).notNull().default("پشتیبانی"),
  status: varchar("status", { length: 30 }).notNull().default("open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
export const supportMessages = pgTable("support_messages", {
  id: serial("id").primaryKey(),
  ticketId: integer("ticket_id").notNull(),
  senderType: varchar("sender_type", { length: 20 }).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
