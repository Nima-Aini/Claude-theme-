// Melli Payamak SMS Service
const SMS_USERNAME = process.env.SMS_USERNAME || "9962879248";
const SMS_PASSWORD = process.env.SMS_PASSWORD || "da2664cd-df2f-4f83-9317-a7f6ebd727a8";
const SMS_FROM = process.env.SMS_FROM || "50004001628792";
const BODY_ID = process.env.SMS_OTP_BODY_ID || "510394"; // Pattern ID for OTP
const ORDER_CUSTOMER_BODY_ID = process.env.SMS_ORDER_CUSTOMER_BODY_ID || "516984";
const ORDER_SHOP_BODY_ID = process.env.SMS_ORDER_SHOP_BODY_ID || "516985";
const PAYOUT_BODY_ID = process.env.SMS_PAYOUT_BODY_ID || "516987";

function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  let p = phone
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/\D/g, "");
  if (p.startsWith("98")) p = "0" + p.slice(2);
  if (!p.startsWith("0") && p.length === 10) p = "0" + p;
  if (p.length !== 11 || !p.startsWith("09")) {
    console.warn("Invalid Iranian mobile number format:", phone);
    return null;
  }
  return p;
}

export async function sendOTP(phone: string, code: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  if (!normalized) return false;

  try {
    // Using REST API for SendByBaseNumber (pattern-based sending)
    const url = "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber";
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: SMS_USERNAME,
        password: SMS_PASSWORD,
        to: normalized,
        bodyId: BODY_ID,
        text: [code], // The {0} parameter in the pattern
      }),
    });

    const data = await response.json().catch(() => null);
    console.log("OTP SMS Response:", data);
    
    // RetStatus of 1 means success
    if (data?.RetStatus === 1 || Number(data?.Value) > 0) {
      return true;
    }
    
    // Try alternative endpoint if first fails
    const altUrl = "https://rest.payamak-panel.com/api/SendSMS/SendByBaseNumber3";
    const altResponse = await fetch(altUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: SMS_USERNAME,
        password: SMS_PASSWORD,
        to: normalized,
        text: code,
        bodyId: parseInt(BODY_ID),
      }),
    });
    
    const altData = await altResponse.json().catch(() => null);
    console.log("OTP SMS Alt Response:", altData);
    
    return altData?.RetStatus === 1 || Number(altData?.Value) > 0;
  } catch (error) {
    console.error("SMS Error:", error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendSMS(phone: string, text: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  if (!normalized || !text) return false;
  try {
    const response = await fetch("https://rest.payamak-panel.com/api/SendSMS/SendSMS", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: SMS_USERNAME,
        password: SMS_PASSWORD,
        to: normalized,
        from: SMS_FROM,
        text,
        isFlash: false,
      }),
    });
    const data = await response.json().catch(() => null);
    return Number(data?.Value) > 0 || data?.RetStatus === 1;
  } catch (error) {
    console.error("SMS Error:", error);
    return false;
  }
}

async function sendPatternSMS(phone: string | null | undefined, bodyId: string, text: string[]): Promise<boolean> {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    console.warn("MelliPayamak: skip pattern SMS, missing or invalid phone number", { phone, bodyId });
    return false;
  }

  try {
    // Attempt 1: BaseServiceNumber with text array
    const response = await fetch("https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: SMS_USERNAME,
        password: SMS_PASSWORD,
        to: normalized,
        bodyId: Number(bodyId),
        text,
      }),
    });
    const data = await response.json().catch(() => null);
    const ok = data?.RetStatus === 1 || Number(data?.Value) > 0;
    if (ok) {
      console.log("MelliPayamak pattern SMS succeeded via BaseServiceNumber", { to: normalized, bodyId, value: data?.Value });
      return true;
    }

    // Attempt 2: SendByBaseNumber3 with semicolon-delimited string
    const altResponse = await fetch("https://rest.payamak-panel.com/api/SendSMS/SendByBaseNumber3", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: SMS_USERNAME,
        password: SMS_PASSWORD,
        to: normalized,
        bodyId: Number(bodyId),
        text: text.join(";"),
      }),
    });
    const altData = await altResponse.json().catch(() => null);
    const altOk = altData?.RetStatus === 1 || Number(altData?.Value) > 0;
    if (altOk) {
      console.log("MelliPayamak pattern SMS succeeded via SendByBaseNumber3", { to: normalized, bodyId, value: altData?.Value });
      return true;
    }

    console.error("MelliPayamak pattern SMS failed", {
      phone: normalized,
      bodyId,
      args: text,
      response: data,
      altResponse: altData,
    });
    return false;
  } catch (error) {
    console.error("MelliPayamak pattern SMS network error", { phone: normalized, bodyId, error });
    return false;
  }
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
  const money = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
  await Promise.allSettled([
    sendPatternSMS(args.customerPhone, ORDER_CUSTOMER_BODY_ID, [
      String(args.orderId),
      money(args.amount),
      args.trackingLink,
    ]),
    sendPatternSMS(args.shopPhone, ORDER_SHOP_BODY_ID, [
      String(args.orderId),
      money(args.commission),
      money(args.totalCommission),
    ]),
  ]);
}

export async function sendPayoutSMS(phone: string | null | undefined, amount: number, totalPaid: number) {
  const money = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
  return sendPatternSMS(phone, PAYOUT_BODY_ID, [money(amount), money(totalPaid)]);
}
