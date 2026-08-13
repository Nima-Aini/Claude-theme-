import { db } from "@/db";
import { orders } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TrackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.select({ id: orders.id, status: orders.status, createdAt: orders.createdAt, totalAmount: orders.totalAmount }).from(orders).where(eq(orders.id, Number(id))).then(r => r[0]);
  if (!order) notFound();
  const labels: Record<string,string> = { pending: "در انتظار بررسی", processing: "در حال پردازش", shipped: "ارسال شده", delivered: "تحویل شده" };
  return <main className="min-h-screen flex items-center justify-center p-5 bg-[#FAFAFA]" dir="rtl">
    <div className="w-full max-w-md bg-white rounded-3xl p-7 shadow-sm text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FF174410] flex items-center justify-center text-[#FF1744] font-black">AK</div>
      <h1 className="text-xl font-black mt-5 text-[#37474F]">پیگیری سفارش #{order.id}</h1>
      <p className="text-sm text-gray-400 mt-2">وضعیت: <b className="text-[#37474F]">{labels[order.status || "pending"] || order.status}</b></p>
      <p className="text-xs text-gray-400 mt-2">مبلغ: {new Intl.NumberFormat("fa-IR").format(order.totalAmount)} تومان</p>
    </div>
  </main>;
}
