// Melli Payamak REST service. Credentials and pattern IDs must only come from env.
const SMS_API = "https://rest.payamak-panel.com/api/SendSMS";

type SmsResponse = {
  Value?: string | number;
  RetStatus?: number;
  StrRetStatus?: string;
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

function credentials() {
  const username = process.env.SMS_USERNAME?.trim();
  const password = process.env.SMS_PASSWORD?.trim();
  if (!username || !password) {
    console.error("MelliPayamak: SMS_USERNAME or SMS_PASSWORD is not configured");
    return null;
  }
  return { username, password };
}

function numericBodyId(value: string | undefined, envName: string) {
  const bodyId = value?.trim();
  if (!bodyId || !/^\d+$/.test(bodyId)) {
    console.error(`MelliPayamak: ${envName} is not configured with a numeric pattern ID`);
    return null;
  }
  return bodyId;
}

function succeeded(data: SmsResponse | null) {
  return data?.RetStatus === 1 || Number(data?.Value) > 0;
}

async function postForm(method: "BaseServiceNumber" | "SendSMS", fields: Record<string, string>, operation: string) {
  const auth = credentials();
  if (!auth) return false;

  const body = new URLSearchParams({ username: auth.username, password: auth.password, ...fields });
  try {
    const response = await fetch(`${SMS_API}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
      body: body.toString(),
    });
    const data = await response.json().catch(() => null) as SmsResponse | null;
    const ok = response.ok && succeeded(data);
    if (!ok) {
      console.error("MelliPayamak request failed", {
        operation,
        httpStatus: response.status,
        retStatus: data?.RetStatus,
        status: data?.StrRetStatus,
      });
    }
    return ok;
  } catch (error) {
    console.error("MelliPayamak network error", {
      operation,
      message: error instanceof Error ? error.message : "unknown network error",
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

  // The official REST SDK accepts one text string. Pattern values are ordered
  // and separated with semicolons before standard form-url encoding.
  return postForm("BaseServiceNumber", {
    to,
    bodyId,
    text: values.map(String).join(";"),
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
  return postForm("SendSMS", { to, from, text, isFlash: "false" }, "plain SMS");
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
