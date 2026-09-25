import { pool } from "@/db";
import type { PoolClient } from "pg";
import { sendOrderSMS } from "@/lib/sms";
import { siteUrl, verifyPayment } from "@/lib/zarinpal";

type Item = { itemType: "product" | "stand"; productId?: number; standId?: number; quantity: number };
type PaymentOrder = {
  id: number; shop_id: number; customer_phone: string; total_amount: number;
  commission_quote_amount: number; payment_status: string; payment_authority: string | null;
  payment_ref_id: string | null; reservation_active: boolean; items: Item[];
};

async function releaseReservation(client: PoolClient, order: PaymentOrder) {
  if (!order.reservation_active) return;
  for (const item of order.items) {
    const table = item.itemType === "stand" ? "stands" : "products";
    const id = item.itemType === "stand" ? item.standId : item.productId;
    await client.query(`UPDATE ${table} SET reserved_stock = reserved_stock - $1 WHERE id = $2`, [item.quantity, id]);
  }
  await client.query("UPDATE orders SET reservation_active = false WHERE id = $1", [order.id]);
}

export async function failPaymentRequest(orderId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const found = await client.query<PaymentOrder>("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [orderId]);
    const order = found.rows[0];
    if (order?.payment_status === "pending" && !order.payment_authority) {
      await releaseReservation(client, order);
      await client.query("UPDATE orders SET payment_status = 'failed', status = 'payment_failed' WHERE id = $1", [orderId]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally { client.release(); }
}

// A row lock covers the provider verification and all financial/inventory effects.
// Concurrent callbacks serialize; only the first committed transition can apply effects.
export async function settlePayment(orderId: number, authority: string, callbackStatus: string) {
  const client = await pool.connect();
  let sendSms = false;
  let result: { state: "paid" | "cancelled" | "failed" | "retry"; refId?: string } = { state: "failed" };
  try {
    await client.query("BEGIN");
    const found = await client.query<PaymentOrder>("SELECT * FROM orders WHERE id = $1 FOR UPDATE", [orderId]);
    const order = found.rows[0];
    if (!order || !order.payment_authority || order.payment_authority !== authority) {
      await client.query("ROLLBACK");
      return { state: "failed" as const };
    }
    if (order.payment_status === "paid") {
      await client.query("COMMIT");
      return { state: "paid" as const, refId: order.payment_ref_id || undefined };
    }
    if (callbackStatus !== "OK") {
      // Keep the stock reservation until expiry. A later genuine OK callback may still arrive.
      await client.query("UPDATE orders SET payment_status = 'cancelled', status = 'payment_cancelled' WHERE id = $1", [orderId]);
      await client.query("COMMIT");
      return { state: "cancelled" as const };
    }
    const verified = await verifyPayment(authority, order.total_amount);
    if (!verified.paid || !verified.refId) {
      const expired = await client.query("SELECT payment_expires_at < NOW() AS expired FROM orders WHERE id = $1", [orderId]);
      if (expired.rows[0]?.expired) await releaseReservation(client, order);
      await client.query("UPDATE orders SET payment_status = 'failed', status = 'payment_failed' WHERE id = $1", [orderId]);
      await client.query("COMMIT");
      return { state: "failed" as const };
    }
    for (const item of order.items) {
      const table = item.itemType === "stand" ? "stands" : "products";
      const id = item.itemType === "stand" ? item.standId : item.productId;
      const update = order.reservation_active
        ? `UPDATE ${table} SET stock = stock - $1, reserved_stock = reserved_stock - $1 WHERE id = $2 AND reserved_stock >= $1 RETURNING id`
        : `UPDATE ${table} SET stock = stock - $1 WHERE id = $2 RETURNING id`;
      const updated = await client.query(update, [item.quantity, id]);
      if (!updated.rows[0]) throw new Error("موجودی سفارش پرداخت‌شده نیاز به بررسی دستی دارد");
    }
    await client.query("UPDATE shops SET total_earnings = total_earnings + $1 WHERE id = $2", [order.commission_quote_amount, order.shop_id]);
    await client.query(
      "UPDATE orders SET payment_status = 'paid', status = 'processing', payment_ref_id = $1, paid_at = NOW(), commission_amount = commission_quote_amount, reservation_active = false, tracking_link = $3 WHERE id = $2",
      [verified.refId, orderId, `${siteUrl()}/track/${orderId}`],
    );
    await client.query("COMMIT");
    sendSms = true;
    result = { state: "paid", refId: verified.refId };
  } catch (error) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("[payment] settlement requires retry", { orderId, error: error instanceof Error ? error.message : "unknown" });
    result = { state: "retry" };
  } finally { client.release(); }
  if (sendSms) {
    try {
      const info = await pool.query(
        "SELECT o.customer_phone, o.total_amount, o.commission_amount, o.shop_id, s.phone, s.total_earnings FROM orders o JOIN shops s ON s.id = o.shop_id WHERE o.id = $1",
        [orderId],
      );
      const row = info.rows[0];
      if (row) await sendOrderSMS({
        customerPhone: row.customer_phone, shopPhone: row.phone, orderId,
        amount: row.total_amount, commission: row.commission_amount,
        totalCommission: row.total_earnings, trackingLink: `${siteUrl()}/track/${orderId}`,
      });
    } catch (error) { console.error("[payment] post-payment SMS failed", { orderId, error }); }
  }
  return result;
}

// Opportunistic recovery also handles successful payments whose browser never returned.
// A gateway/network outage leaves reservations intact for the next attempt.
export async function reconcileExpiredReservations() {
  const expired = await pool.query<{ id: number; payment_authority: string | null }>(
    "SELECT id, payment_authority FROM orders WHERE reservation_active = true AND payment_expires_at < NOW() ORDER BY id LIMIT 5",
  );
  for (const order of expired.rows) {
    if (order.payment_authority) {
      const result = await settlePayment(order.id, order.payment_authority, "OK");
      if (result.state === "retry") break;
    }
    else await failPaymentRequest(order.id);
  }
}
