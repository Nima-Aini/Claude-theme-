import test from "node:test";
import assert from "node:assert/strict";

process.env.MELIPAYAMAK_TOKEN = "test-token";
process.env.SMS_OTP_BODY_ID = "510394";
process.env.SMS_ORDER_CUSTOMER_BODY_ID = "1001";
process.env.SMS_ORDER_SHOP_BODY_ID = "1002";
process.env.SMS_PAYOUT_BODY_ID = "1003";
process.env.SMS_FROM = "500000000000";

const sms = await import(`../src/lib/sms.ts?test=${Date.now()}`);
const sharedUrl = "https://console.melipayamak.com/api/send/shared/test-token";
const simpleUrl = "https://console.melipayamak.com/api/send/simple/test-token";
const success = () => Response.json({ recId: 4964357668335355040, status: "عملیات موفق" });

test("OTP sends JSON to shared Token API with numeric bodyId and ordered args", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requests.push({ url: String(url), init });
    return success();
  });
  assert.equal(await sms.sendOTP("+98 912 345 6789", "246810"), true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, sharedUrl);
  assert.equal(requests[0].init.method, "POST");
  assert.equal(requests[0].init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(requests[0].init.body), {
    to: "09123456789", bodyId: 510394, args: ["246810"],
  });
});

test("order and payout patterns retain argument order on shared API", async (t) => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    requests.push({ url: String(url), body: JSON.parse(init.body) });
    return success();
  });
  await sms.sendOrderSMS({
    customerPhone: "09123456789", shopPhone: "09122222222", orderId: 42,
    amount: 125000, commission: 12500, totalCommission: 50000,
    trackingLink: "https://shop.example.test/track/42",
  });
  assert.equal(await sms.sendPayoutSMS("09121111111", 15000, 90000), true);
  assert.deepEqual(requests.map((request) => request.url), [sharedUrl, sharedUrl, sharedUrl]);
  assert.deepEqual(requests[0].body, {
    to: "09123456789", bodyId: 1001,
    args: ["42", "۱۲۵٬۰۰۰", "https://shop.example.test/track/42"],
  });
  assert.deepEqual(requests[1].body, {
    to: "09122222222", bodyId: 1002, args: ["42", "۱۲٬۵۰۰", "۵۰٬۰۰۰"],
  });
  assert.deepEqual(requests[2].body, {
    to: "09121111111", bodyId: 1003, args: ["۱۵٬۰۰۰", "۹۰٬۰۰۰"],
  });
});

test("missing token returns false without a request", async (t) => {
  const previous = process.env.MELIPAYAMAK_TOKEN;
  delete process.env.MELIPAYAMAK_TOKEN;
  t.after(() => { process.env.MELIPAYAMAK_TOKEN = previous; });
  const errors = [];
  t.mock.method(console, "error", (...args) => errors.push(args));
  t.mock.method(globalThis, "fetch", () => { throw new Error("fetch must not run"); });
  assert.equal(await sms.sendOTP("09123456789", "123456"), false);
  assert.deepEqual(errors, [["MelliPayamak: MELIPAYAMAK_TOKEN is not configured"]]);
});

test("invalid phone and invalid body ID return false before fetch", async (t) => {
  t.mock.method(console, "error", () => undefined);
  t.mock.method(globalThis, "fetch", () => { throw new Error("fetch must not run"); });
  assert.equal(await sms.sendOTP("02112345678", "123456"), false);
  const previous = process.env.SMS_OTP_BODY_ID;
  process.env.SMS_OTP_BODY_ID = "12x";
  t.after(() => { process.env.SMS_OTP_BODY_ID = previous; });
  assert.equal(await sms.sendOTP("09123456789", "123456"), false);
  process.env.SMS_OTP_BODY_ID = "0";
  assert.equal(await sms.sendOTP("09123456789", "123456"), false);
});

test("failed shared response and HTTP failure do not count as sent or leak secrets", async (t) => {
  const errors = [];
  let count = 0;
  t.mock.method(console, "error", (...args) => errors.push(args));
  t.mock.method(globalThis, "fetch", async () => {
    count++;
    return count === 1
      ? Response.json({ recId: 0, status: "ارسال ناموفق برای 09123456789" })
      : Response.json({ recId: 123, status: "عملیات موفق" }, { status: 500 });
  });
  assert.equal(await sms.sendOTP("09123456789", "123456"), false);
  assert.equal(await sms.sendOTP("09123456789", "123456"), false);
  assert.equal(errors.length, 2);
  assert.deepEqual(Object.keys(errors[0][1]), ["operation", "httpStatus", "status"]);
  assert.equal(errors[0][1].status.includes("09123456789"), false);
  assert.equal(JSON.stringify(errors).includes("test-token"), false);
});

test("plain SMS uses simple Token API; missing sender returns false", async (t) => {
  let request;
  t.mock.method(globalThis, "fetch", async (url, init) => {
    request = { url: String(url), init };
    return success();
  });
  assert.equal(await sms.sendSMS("۹۱۲۳۴۵۶۷۸۹", "پیام آزمایشی"), true);
  assert.equal(request.url, simpleUrl);
  assert.equal(request.init.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(request.init.body), {
    from: "500000000000", to: "09123456789", text: "پیام آزمایشی",
  });
  const previous = process.env.SMS_FROM;
  delete process.env.SMS_FROM;
  t.after(() => { process.env.SMS_FROM = previous; });
  t.mock.method(console, "error", () => undefined);
  request = null;
  assert.equal(await sms.sendSMS("09123456789", "پیام آزمایشی"), false);
  assert.equal(request, null);
});
