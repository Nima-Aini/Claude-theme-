import { NextResponse } from "next/server";

// Setup is deliberately unavailable over HTTP. Run migrations and admin creation
// from an authenticated server shell instead.
export async function GET() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}
