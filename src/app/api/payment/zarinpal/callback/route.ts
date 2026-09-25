import { NextRequest, NextResponse } from "next/server";
import { settlePayment } from "@/lib/order-payment";
import { siteUrl } from "@/lib/zarinpal";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const orderId = Number(req.nextUrl.searchParams.get("orderId"));
  const authority = req.nextUrl.searchParams.get("Authority") || "";
  const status = req.nextUrl.searchParams.get("Status") || "";
  const resultUrl = new URL("/payment/result", siteUrl());
  if (!Number.isSafeInteger(orderId) || orderId < 1 || authority.length > 100 || !/^[A-Za-z0-9-]+$/.test(authority)) {
    return NextResponse.redirect(resultUrl, { status: 303 });
  }
  const result = await settlePayment(orderId, authority, status);
  resultUrl.searchParams.set("orderId", String(orderId));
  if (result.state === "retry") resultUrl.searchParams.set("retry", "1");
  return NextResponse.redirect(resultUrl, { status: 303 });
}
