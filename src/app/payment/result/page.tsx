import Link from "next/link";
import { db } from "@/db";
import { orders, shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCustomerSession } from "@/lib/auth";
import ClearPaidCart from "./ClearPaidCart";

export const dynamic = "force-dynamic";

export default async function PaymentResult({ searchParams }: { searchParams: Promise<{ orderId?: string }> }) {
  const params = await searchParams;
  const id = Number(params.orderId);
  const customer = await getCustomerSession();
  const order = customer?.type === "customer" && Number.isSafeInteger(id) && id > 0
    ? await db.select().from(orders).where(eq(orders.id, id)).then((rows) => rows[0])
    : null;
  const ownOrder = order && order.customerId === customer?.id ? order : null;
  const shop = ownOrder ? await db.select({ slug: shops.slug }).from(shops).where(eq(shops.id, ownOrder.shopId)).then((rows) => rows[0]) : null;
  const paid = ownOrder?.paymentStatus === "paid";
  const pending = ownOrder?.paymentStatus === "pending";
  return (
    <main dir="rtl" className="min-h-screen bg-slate-50 flex items-center justify-center p-5">
      <section className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-sm space-y-4">
        {paid && shop && ownOrder && <ClearPaidCart slug={shop.slug} orderId={ownOrder.id} />}
        <h1 className="text-xl font-black text-slate-800">
          {paid ? "پرداخت با موفقیت انجام شد" : pending ? "تأیید پرداخت هنوز کامل نشده است" : "پرداخت ناموفق یا لغو شد"}
        </h1>
        {paid && ownOrder && (
          <div className="space-y-2 text-sm text-slate-600">
            <p>شماره سفارش: <b>#{ownOrder.id}</b></p>
            <p>مبلغ: <b>{new Intl.NumberFormat("fa-IR").format(ownOrder.totalAmount)} تومان</b></p>
            <p>کد پیگیری زرین‌پال: <b dir="ltr">{ownOrder.paymentRefId}</b></p>
          </div>
        )}
        {pending && <p className="text-sm text-slate-500">در صورت کسر وجه، برای بررسی دوباره از دکمه زیر استفاده کنید.</p>}
        {!paid && ownOrder?.paymentAuthority && (
          <Link className="block rounded-xl bg-amber-50 p-3 text-sm font-bold text-amber-700"
            href={`/api/payment/zarinpal/callback?orderId=${ownOrder.id}&Authority=${encodeURIComponent(ownOrder.paymentAuthority)}&Status=OK`}>
            بررسی دوباره پرداخت
          </Link>
        )}
        {shop && <Link className="block rounded-xl bg-slate-800 p-3 text-sm font-bold text-white" href={`/store/${shop.slug}`}>بازگشت به فروشگاه</Link>}
      </section>
    </main>
  );
}
