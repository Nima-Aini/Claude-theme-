import { db } from "@/db";
import { sql } from "drizzle-orm";
import { storageHealth } from "@/lib/storage/local";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await db.execute(sql`select 1`);
    await storageHealth();
    return Response.json({ ok: true, database: true, storage: true });
  } catch {
    return Response.json({ ok: false }, { status: 500 });
  }
}
