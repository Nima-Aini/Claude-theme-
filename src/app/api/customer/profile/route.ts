import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const token = req.cookies.get("customer_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "customer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, payload.id as number))
    .then((r) => r[0]);

  return NextResponse.json(customer);
}

export async function PUT(req: NextRequest) {
  const token = req.cookies.get("customer_token")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await verifyToken(token);
  if (!payload || payload.type !== "customer")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const result = await db
    .update(customers)
    .set({ name: body.name, address: body.address })
    .where(eq(customers.id, payload.id as number))
    .returning();

  return NextResponse.json(result[0]);
}
