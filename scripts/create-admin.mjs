import "dotenv/config";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const username = String(process.env.SEED_ADMIN_USERNAME || "").trim().toLowerCase();
const password = String(process.env.SEED_ADMIN_PASSWORD || "");
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!/^[a-z0-9._-]{3,64}$/.test(username)) throw new Error("SEED_ADMIN_USERNAME is invalid");
if (password.length < 12) throw new Error("SEED_ADMIN_PASSWORD must contain at least 12 characters");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const client = await pool.connect();
try {
  const count = await client.query("SELECT COUNT(*)::int AS count FROM admins");
  if (count.rows[0].count > 0) throw new Error("An admin already exists; no account was changed");
  await client.query("INSERT INTO admins(username,password) VALUES($1,$2)", [username, await bcrypt.hash(password, 12)]);
  console.log("Initial administrator created");
} finally { client.release(); await pool.end(); }
