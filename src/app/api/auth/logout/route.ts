import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { type } = await req.json();
  const resp = NextResponse.json({ success: true });
  
  if (type === "customer") {
    resp.cookies.set("customer_token", "", { maxAge: 0, path: "/" });
  } else if (type === "shop") {
    resp.cookies.set("shop_token", "", { maxAge: 0, path: "/" });
  } else if (type === "admin") {
    resp.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
  }
  
  return resp;
}
