// Console Token API. This module is imported only by server routes.
const SMS_API = "https://console.melipayamak.com/api/send";

type SmsResponse = {
  recId?: string | number;
  status?: string;
};

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let normalized = phone
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/\D/g, "");
  if (normalized.startsWith("98")) normalized = `0${normalized.slice(2)}`;
  if (!normalized.startsWith("0") && normalized.length === 10) normalized = `0${normalized}`;
  if (normalized.length !== 11 || !normalized.startsWith("09")) {
    console.warn("MelliPayamak: invalid Iranian mobile number");
    return null;
  }
  return normalized;
}

function token() {
  const value = process.env.MELIPAYAMAK_TOKEN?.trim();
  if (!value) {
    console.error("MelliPayamak: MELIPAYAMAK_TOKEN is not configured");
    return null;
  }
  return value;
}

function numericBodyId(value: string | undefined, envName: string) {
  const bodyId = value?.trim();
  const numeric = Number(bodyId);
  if (!bodyId || !/^\d+$/.test(bodyId) || !Number.isSafeInteger(numeric) || numeric <= 0) {
    console.error(`MelliPayamak: ${envName} is not configured with a numeric pattern ID`);
    return null;
  }
  return numeric;
}

function succeeded(data: SmsResponse | null) {
  const recId = data?.recId;
  const validRecId = typeof recId === "number"
    ? Number.isFinite(recId) && Number.isInteger(recId) && recId > 0
    : typeof recId === "string" && /^\d+$/.test(recId) && /[1-9]/.test(recId);
  const status = data?.status?.trim();
  return validRecId && (status === "عملیات موفق" || /^(success|successful)$/i.test(status || ""));
}

async function postJson(method: "shared" | "simple", body: object, operation: string) {
  const authToken = token();
  if (!authToken) return false;
  try {
    const response = await fetch(`${SMS_API}/${method}/${encodeURIComponent(authToken)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    const data = await response.json().catch(() => null) as SmsResponse | null;
    const ok = response.ok && succeeded(data);
    if (!ok) {
      const safeStatus = typeof data?.status === "string"
        ? data.status.replaceAll(authToken, "[redacted]").replace(/09\d{9}/g, "[redacted]").slice(0, 120)
        : null;
      console.error("MelliPayamak request failed", {
        operation,
        httpStatus: response.status,
        status: safeStatus,
      });
    }
    return ok;
  } catch {
    console.error("MelliPayamak network error", {
      operation,
      httpStatus: null,
      status: "network_error",
    });
    return false;
  }
}

async function sendPatternSMS(
  phone: string | null | undefined,
  bodyIdValue: string | undefined,
  bodyIdEnvName: string,
  values: string[],
): Promise<boolean> {
  const to = normalizePhone(phone);
  const bodyId = numericBodyId(bodyIdValue, bodyIdEnvName);
  if (!to || !bodyId || values.length === 0) return false;

  return postJson("shared", {
    to,
    bodyId,
    args: values.map(String),
  }, bodyIdEnvName);
}

export async function sendOTP(phone: string, code: string): Promise<boolean> {
  if (!/^\d{4,8}$/.test(code)) return false;
  return sendPatternSMS(phone, process.env.SMS_OTP_BODY_ID, "SMS_OTP_BODY_ID", [code]);
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendSMS(phone: string, text: string): Promise<boolean> {
  const to = normalizePhone(phone);
  const from = process.env.SMS_FROM?.trim();
  if (!to || !text.trim()) return false;
  if (!from) {
    console.error("MelliPayamak: SMS_FROM is not configured");
    return false;
  }
  return postJson("simple", { from, to, text }, "plain SMS");
}

export async function sendOrderSMS(args: {
  customerPhone: string;
  shopPhone?: string | null;
  orderId: number;
  amount: number;
  commission: number;
  totalCommission: number;
  trackingLink: string;
}) {
  const money = (value: number) => new Intl.NumberFormat("fa-IR").format(value);
  await Promise.allSettled([
    sendPatternSMS(args.customerPhone, process.env.SMS_ORDER_CUSTOMER_BODY_ID, "SMS_ORDER_CUSTOMER_BODY_ID", [
      String(args.orderId),
      money(args.amount),
      args.trackingLink,
    ]),
    sendPatternSMS(args.shopPhone, process.env.SMS_ORDER_SHOP_BODY_ID, "SMS_ORDER_SHOP_BODY_ID", [
      String(args.orderId),
      money(args.commission),
      money(args.totalCommission),
    ]),
  ]);
}

export async function sendPayoutSMS(phone: string | null | undefined, amount: number, totalPaid: number) {
  const money = (value: number) => new Intl.NumberFormat("fa-IR").format(value);
  return sendPatternSMS(phone, process.env.SMS_PAYOUT_BODY_ID, "SMS_PAYOUT_BODY_ID", [money(amount), money(totalPaid)]);
}
