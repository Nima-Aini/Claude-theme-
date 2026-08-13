import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { supportTickets, supportMessages } from "@/db/schema";
import { verifyToken } from "@/lib/auth";
import { desc, eq } from "drizzle-orm";

async function ensureSchema() {
  const c = await pool.connect();
  try {
    await c.query(`CREATE TABLE IF NOT EXISTS support_tickets (id SERIAL PRIMARY KEY, customer_id INTEGER, shop_id INTEGER, product_id INTEGER, subject VARCHAR(255) NOT NULL DEFAULT 'پشتیبانی', status VARCHAR(30) NOT NULL DEFAULT 'open', created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS support_messages (id SERIAL PRIMARY KEY, ticket_id INTEGER NOT NULL, sender_type VARCHAR(20) NOT NULL, message TEXT NOT NULL, created_at TIMESTAMP DEFAULT NOW());`);
  } finally { c.release(); }
}
async function auth(req: NextRequest) {
  const token = req.cookies.get("admin_token")?.value || req.cookies.get("customer_token")?.value || req.cookies.get("shop_token")?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function GET(req: NextRequest) {
  await ensureSchema();
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let tickets;
  if (payload.type === "admin") tickets = await db.select().from(supportTickets).orderBy(desc(supportTickets.updatedAt));
  else if (payload.type === "customer") tickets = await db.select().from(supportTickets).where(eq(supportTickets.customerId, payload.id as number)).orderBy(desc(supportTickets.updatedAt));
  else tickets = await db.select().from(supportTickets).where(eq(supportTickets.shopId, payload.id as number)).orderBy(desc(supportTickets.updatedAt));
  const ids = tickets.map(t => t.id);
  const messages = ids.length ? await db.select().from(supportMessages).orderBy(desc(supportMessages.createdAt)) : [];
  return NextResponse.json(tickets.map(t => ({ ...t, messages: messages.filter(m => m.ticketId === t.id).reverse() })));
}

export async function POST(req: NextRequest) {
  await ensureSchema();
  const payload = await auth(req);
  if (!payload || payload.type === "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const message = String(body.message || "").trim();
  if (!message) return NextResponse.json({ error: "پیام خالی است" }, { status: 400 });
  const ticket = await db.insert(supportTickets).values({
    customerId: payload.type === "customer" ? payload.id as number : null,
    shopId: payload.type === "shop" ? payload.id as number : null,
    productId: body.productId ? Number(body.productId) : null,
    subject: String(body.subject || "پشتیبانی"),
  }).returning();
  const msg = await db.insert(supportMessages).values({ ticketId: ticket[0].id, senderType: payload.type, message }).returning();
  return NextResponse.json({ ...ticket[0], messages: [msg[0]] });
}

export async function PUT(req: NextRequest) {
  await ensureSchema();
  const payload = await auth(req);
  if (!payload) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const ticketId = Number(body.ticketId);
  const message = String(body.message || "").trim();
  if (!ticketId || !message) return NextResponse.json({ error: "اطلاعات ناقص است" }, { status: 400 });
  const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, ticketId)).then(r => r[0]);
  if (!ticket) return NextResponse.json({ error: "تیکت پیدا نشد" }, { status: 404 });
  if (payload.type !== "admin" && ticket.customerId !== (payload.type === "customer" ? payload.id : null) && ticket.shopId !== (payload.type === "shop" ? payload.id : null))
    return NextResponse.json({ error: "دسترسی ندارید" }, { status: 403 });
  const msg = await db.insert(supportMessages).values({ ticketId, senderType: payload.type, message }).returning();
  await db.update(supportTickets).set({ updatedAt: new Date(), status: "open" }).where(eq(supportTickets.id, ticketId));
  return NextResponse.json(msg[0]);
}

export async function PATCH(req: NextRequest) {
  await ensureSchema();
  const payload = await auth(req);
  if (!payload || payload.type !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { ticketId, status } = await req.json();
  const result = await db.update(supportTickets).set({ status, updatedAt: new Date() }).where(eq(supportTickets.id, Number(ticketId))).returning();
  return NextResponse.json(result[0]);
}
