import { Metadata } from "next";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "AKMA Store", description: "برای خرید به لینک فروشگاه مراجعه کنید", robots: { index: false, follow: false } };
export default function HomePage() {
  return <main className="min-h-screen flex items-center justify-center p-6 bg-[#FAFAFA]" dir="rtl">
    <div className="w-full max-w-lg bg-white rounded-3xl p-10 text-center shadow-sm">
      <div className="w-16 h-16 mx-auto rounded-2xl bg-[#FF174410] flex items-center justify-center text-[#FF1744] font-black text-xl">AK</div>
      <h1 className="text-3xl font-black text-[#37474F] mt-5">AKMA</h1>
      <p className="text-sm text-gray-400 mt-3 leading-7">این صفحه برای عموم قابل مشاهده نیست.<br/>برای خرید، به لینک فروشگاه موردنظر مراجعه کنید.</p>
    </div>
  </main>;
}
