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
