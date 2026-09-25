import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import ts from "typescript";

process.env.ZARINPAL_MERCHANT_ID = "test-merchant-only";
process.env.SITE_URL = "https://shop.example.test";
const gateway = await import(`../src/lib/zarinpal.ts?test=${Date.now()}`);

test("payment request sends the server amount in toman and returns the official redirect", async (t) => {
  let call;
  t.mock.method(globalThis, "fetch", async (url, options) => {
    call = { url: String(url), body: JSON.parse(options.body) };
    return Response.json({ data: { code: 100, authority: "A000123" }, errors: [] });
  });
  const result = await gateway.requestPayment(23, 150000, "09123456789");
  assert.equal(call.url, "https://api.zarinpal.com/pg/v4/payment/request.json");
  assert.equal(call.body.amount, 150000);
  assert.equal(call.body.currency, "IRT");
  assert.equal(call.body.merchant_id, "test-merchant-only");
  assert.equal(call.body.callback_url, "https://shop.example.test/api/payment/zarinpal/callback?orderId=23");
  assert.equal(result.paymentUrl, "https://www.zarinpal.com/pg/StartPay/A000123");
});

test("rejected payment request never returns a redirect", async (t) => {
  t.mock.method(globalThis, "fetch", async () => Response.json({ data: { code: -9 }, errors: { code: -9 } }));
  await assert.rejects(() => gateway.requestPayment(23, 150000, "09123456789"), /پذیرفته نشد/);
});

test("verify sends the same stored toman amount; success and failure are distinct", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    calls.push({ url: String(url), body: JSON.parse(options.body) });
    return Response.json(calls.length === 1
      ? { data: { code: 100, ref_id: 987654 } }
      : { data: { code: -51 } });
  });
  assert.deepEqual(await gateway.verifyPayment("A000123", 150000), { paid: true, refId: "987654" });
  assert.deepEqual(await gateway.verifyPayment("A000123", 150000), { paid: false, refId: null });
  assert.equal(calls[0].url, "https://api.zarinpal.com/pg/v4/payment/verify.json");
  assert.deepEqual(calls.map((call) => call.body.amount), [150000, 150000]);
});

test("already verified response requires a real ref_id before finalization", async (t) => {
  let count = 0;
  t.mock.method(globalThis, "fetch", async () => {
    count++;
    return Response.json(count === 1
      ? { data: { code: 101, ref_id: 987654 } }
      : { data: { code: 101 } });
  });
  assert.deepEqual(await gateway.verifyPayment("A000123", 150000), { paid: true, refId: "987654" });
  await assert.rejects(() => gateway.verifyPayment("A000123", 150000), /بدون کد پیگیری/);
});

async function paymentService(verification) {
  const state = {
    order: {
      id: 23, shop_id: 5, customer_phone: "09123456789", total_amount: 150000,
      commission_quote_amount: 15000, payment_status: "pending",
      payment_authority: "A000123", payment_ref_id: null, reservation_active: true,
      items: [{ itemType: "product", productId: 9, quantity: 2 }],
    },
    stock: 8, reserved: 2, earnings: 0, sms: 0, verifies: [],
  };
  const client = {
    async query(sql, args = []) {
      if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") return { rows: [] };
      if (sql.startsWith("SELECT * FROM orders")) return { rows: [state.order] };
      if (sql.startsWith("SELECT payment_expires_at")) return { rows: [{ expired: false }] };
      if (sql.startsWith("UPDATE products SET reserved_stock")) state.reserved -= args[0];
      if (sql.startsWith("UPDATE orders SET reservation_active")) state.order.reservation_active = false;
      if (sql.includes("SET payment_status = 'cancelled'")) state.order.payment_status = "cancelled";
      if (sql.includes("SET payment_status = 'failed'")) state.order.payment_status = "failed";
      if (sql.startsWith("UPDATE products SET stock")) {
        state.stock -= args[0];
        state.reserved -= args[0];
        return { rows: [{ id: 9 }] };
      }
      if (sql.startsWith("UPDATE shops SET total_earnings")) state.earnings += args[0];
      if (sql.includes("SET payment_status = 'paid'")) {
        state.order.payment_status = "paid";
        state.order.payment_ref_id = args[0];
        state.order.reservation_active = false;
      }
      return { rows: [] };
    },
    release() {},
  };
  const source = await readFile(new URL("../src/lib/order-payment.ts", import.meta.url), "utf8");
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  const sandbox = {
    exports, process, console,
    require(name) {
      if (name === "@/db") return { pool: {
        connect: async () => client,
        query: async () => ({ rows: [{ customer_phone: state.order.customer_phone, total_amount: 150000, commission_amount: 15000, phone: "09120000000", total_earnings: state.earnings }] }),
      } };
      if (name === "@/lib/sms") return { sendOrderSMS: async () => { state.sms++; } };
      if (name === "@/lib/zarinpal") return {
        siteUrl: () => "https://shop.example.test",
        verifyPayment: async (authority, amount) => {
          state.verifies.push({ authority, amount });
          return verification;
        },
      };
      throw new Error(`Unexpected import: ${name}`);
    },
  };
  vm.runInNewContext(compiled, sandbox);
  return { state, settlePayment: exports.settlePayment, failPaymentRequest: exports.failPaymentRequest };
}

test("successful verification finalizes stock and commission once across duplicate callbacks", async () => {
  const { state, settlePayment } = await paymentService({ paid: true, refId: "987654" });
  assert.equal((await settlePayment(23, "A000123", "OK")).state, "paid");
  assert.equal((await settlePayment(23, "A000123", "OK")).state, "paid");
  assert.equal(state.stock, 6);
  assert.equal(state.reserved, 0);
  assert.equal(state.earnings, 15000);
  assert.equal(state.sms, 1);
  assert.deepEqual(state.verifies, [{ authority: "A000123", amount: 150000 }]);
  assert.equal(state.order.payment_ref_id, "987654");
});

test("failed verification does not finalize the order", async () => {
  const { state, settlePayment } = await paymentService({ paid: false, refId: null });
  assert.equal((await settlePayment(23, "A000123", "OK")).state, "failed");
  assert.equal(state.stock, 8);
  assert.equal(state.earnings, 0);
  assert.equal(state.sms, 0);
});

test("cancelled payment and mismatched authority never verify or finalize", async () => {
  const { state, settlePayment } = await paymentService({ paid: true, refId: "987654" });
  assert.equal((await settlePayment(23, "WRONG", "OK")).state, "failed");
  assert.equal((await settlePayment(23, "A000123", "NOK")).state, "cancelled");
  assert.equal(state.verifies.length, 0);
  assert.equal(state.stock, 8);
  assert.equal(state.earnings, 0);
  assert.equal(state.sms, 0);
});

test("failed gateway request releases the reservation without changing stock", async () => {
  const { state, failPaymentRequest } = await paymentService({ paid: false, refId: null });
  state.order.payment_authority = null;
  await failPaymentRequest(23);
  assert.equal(state.order.payment_status, "failed");
  assert.equal(state.order.reservation_active, false);
  assert.equal(state.reserved, 0);
  assert.equal(state.stock, 8);
  assert.equal(state.earnings, 0);
  assert.equal(state.sms, 0);
});
