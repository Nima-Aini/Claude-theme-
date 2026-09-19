import test from "node:test";
import assert from "node:assert/strict";

process.env.SMS_USERNAME = "test-user";
process.env.SMS_PASSWORD = "test-password";
process.env.SMS_OTP_BODY_ID = "12345";
process.env.SMS_FROM = "500000000000";

const sms = await import(`../src/lib/sms.ts?test=${Date.now()}`);

test("sendOTP posts BaseServiceNumber as form-urlencoded with official fields", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requests.push({ url: String(url), init });
    return new Response(JSON.stringify({ Value: "987654", RetStatus: 1, StrRetStatus: "Ok" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  assert.equal(await sms.sendOTP("+98 912 345 6789", "246810"), true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber");
  assert.equal(requests[0].init.method, "POST");
  assert.equal(requests[0].init.headers["Content-Type"], "application/x-www-form-urlencoded; charset=UTF-8");

  const form = new URLSearchParams(requests[0].init.body);
  assert.deepEqual(Object.fromEntries(form), {
    username: "test-user",
    password: "test-password",
    to: "09123456789",
    bodyId: "12345",
    text: "246810",
  });
  assert.doesNotMatch(requests[0].init.body, /^\s*\{/);
});

test("sendOTP returns false without calling a guessed fallback endpoint", async (t) => {
  const urls = [];
  t.mock.method(console, "error", () => undefined);
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(String(url));
    return new Response(JSON.stringify({ Value: "0", RetStatus: 35, StrRetStatus: "InvalidData" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  assert.equal(await sms.sendOTP("09123456789", "135790"), false);
  assert.deepEqual(urls, ["https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber"]);
});

test("sendSMS uses the official SendSMS form endpoint", async (t) => {
  let request;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    request = { url: String(url), init };
    return new Response(JSON.stringify({ Value: "123", RetStatus: 1 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  });

  assert.equal(await sms.sendSMS("09123456789", "پیام آزمایشی"), true);
  assert.equal(request.url, "https://rest.payamak-panel.com/api/SendSMS/SendSMS");
  const form = new URLSearchParams(request.init.body);
  assert.equal(form.get("from"), "500000000000");
  assert.equal(form.get("to"), "09123456789");
  assert.equal(form.get("text"), "پیام آزمایشی");
  assert.equal(form.get("isFlash"), "false");
});
