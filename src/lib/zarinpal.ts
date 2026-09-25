const REQUEST_URL = "https://api.zarinpal.com/pg/v4/payment/request.json";
const VERIFY_URL = "https://api.zarinpal.com/pg/v4/payment/verify.json";
const START_URL = "https://www.zarinpal.com/pg/StartPay/";

type GatewayReply = { data?: { code?: number; authority?: string; ref_id?: number | string }; errors?: unknown };

function merchantId() {
  const id = process.env.ZARINPAL_MERCHANT_ID?.trim();
  if (!id) throw new Error("ZARINPAL_MERCHANT_ID تنظیم نشده است");
  return id;
}

export function siteUrl() {
  const value = process.env.SITE_URL;
  if (!value) throw new Error("SITE_URL تنظیم نشده است");
  const url = new URL(value);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.hostname === "localhost")) {
    throw new Error("SITE_URL باید HTTPS باشد");
  }
  if (url.username || url.password || url.search || url.hash) throw new Error("SITE_URL نامعتبر است");
  return url.origin;
}

async function postGateway(url: string, body: object): Promise<GatewayReply> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error(`خطای ارتباط با زرین‌پال (${response.status})`);
  return response.json() as Promise<GatewayReply>;
}

// Database prices and both gateway calls use toman. Explicit IRT prevents a 10x rial mismatch.
export async function requestPayment(orderId: number, amountToman: number, mobile: string) {
  if (!Number.isSafeInteger(amountToman) || amountToman <= 0) throw new Error("مبلغ پرداخت نامعتبر است");
  const reply = await postGateway(REQUEST_URL, {
    merchant_id: merchantId(), amount: amountToman, currency: "IRT",
    callback_url: `${siteUrl()}/api/payment/zarinpal/callback?orderId=${orderId}`,
    description: `سفارش شماره ${orderId}`,
    metadata: { mobile },
  });
  const authority = reply.data?.authority;
  if (reply.data?.code !== 100 || !authority || authority.length > 100 || !/^[A-Za-z0-9-]+$/.test(authority)) {
    throw new Error("درخواست پرداخت توسط زرین‌پال پذیرفته نشد");
  }
  return { authority, paymentUrl: `${START_URL}${authority}` };
}

export async function verifyPayment(authority: string, amountToman: number) {
  if (!Number.isSafeInteger(amountToman) || amountToman <= 0) throw new Error("مبلغ پرداخت نامعتبر است");
  const reply = await postGateway(VERIFY_URL, {
    merchant_id: merchantId(), authority, amount: amountToman,
  });
  const code = reply.data?.code;
  const refId = reply.data?.ref_id;
  // 101 means this authority was already verified; a stored paid order is checked first.
  if ((code === 100 || code === 101) && refId != null && /^\d+$/.test(String(refId))) {
    return { paid: true, refId: String(refId) };
  }
  if (code === 100 || code === 101) throw new Error("تأیید زرین‌پال بدون کد پیگیری برگشت؛ بررسی دوباره لازم است");
  return { paid: false, refId: null };
}
