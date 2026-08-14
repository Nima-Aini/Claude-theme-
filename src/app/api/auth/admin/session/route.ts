import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";

export async function GET() {
  const session = await getAdminSession();
  if (!session || (session.type !== "admin" && session.role !== "admin")) {
    const response = NextResponse.json({ authenticated: false }, { status: 401 });
    response.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
    return response;
  }
  return NextResponse.json({ authenticated: true });
}
