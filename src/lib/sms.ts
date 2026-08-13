// Melli Payamak SMS Service
const SMS_USERNAME = "9962879248";
const SMS_PASSWORD = "da2664cd-df2f-4f83-9317-a7f6ebd727a8";
const SMS_FROM = "50004001628792";
const BODY_ID = "510394"; // Pattern ID for OTP

export async function sendOTP(phone: string, code: string): Promise<boolean> {
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
        to: phone,
        bodyId: BODY_ID,
        text: [code], // The {0} parameter in the pattern
      }),
    });

    const data = await response.json();
    console.log("SMS Response:", data);
    
    // RetStatus of 1 means success
    if (data.RetStatus === 1 || data.Value > 0) {
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
        to: phone,
        text: code,
        bodyId: parseInt(BODY_ID),
      }),
    });
    
    const altData = await altResponse.json();
    console.log("SMS Alt Response:", altData);
    
    return altData.RetStatus === 1 || altData.Value > 0;
  } catch (error) {
    console.error("SMS Error:", error);
    return false;
  }
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendSMS(phone: string, text: string): Promise<boolean> {
  if (!phone || !text) return false;
  try {
    const response = await fetch("https://rest.payamak-panel.com/api/SendSMS/SendSMS", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: SMS_USERNAME,
        password: SMS_PASSWORD,
        to: phone,
        from: SMS_FROM,
        text,
        isFlash: false,
      }),
    });
    const data = await response.json();
    return Number(data?.Value) > 0 || data?.RetStatus === 1;
  } catch (error) {
    console.error("SMS Error:", error);
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
  const customerText = `آکما | سفارش شما با شماره ${args.orderId} با مبلغ ${money(args.amount)} تومان ثبت شد. پیگیری سفارش: ${args.trackingLink}`;
  const shopText = `آکما | سفارش #${args.orderId} ثبت شد. پورسانت این سفارش: ${money(args.commission)} تومان. مجموع پورسانت تا الان: ${money(args.totalCommission)} تومان.`;
  await Promise.allSettled([
    sendSMS(args.customerPhone, customerText),
    args.shopPhone ? sendSMS(args.shopPhone, shopText) : Promise.resolve(false),
  ]);
}

export async function sendPayoutSMS(phone: string | null | undefined, amount: number, totalPaid: number) {
  if (!phone) return false;
  const money = (n: number) => new Intl.NumberFormat("fa-IR").format(n);
  return sendSMS(phone, `آکما | مبلغ ${money(amount)} تومان بابت پورسانت شما واریز شد. مجموع واریزی تا الان: ${money(totalPaid)} تومان.`);
}
