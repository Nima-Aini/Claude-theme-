"use client";
import { useState } from "react";

export default function ProductClient({ shop, product }: { shop: any; product: any }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const images = [product.image, ...((Array.isArray(product.images) ? product.images : []) as string[])].filter(Boolean);
  const sendSupport = async () => {
    if (!message.trim()) return;
    const r = await fetch("/api/support", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({ productId: product.id, subject: `پشتیبانی محصول: ${product.name}`, message }), credentials:"include" });
    if (r.ok) { setMessage(""); setSent(true); }
    else alert("ابتدا وارد حساب مشتری شوید.");
  };
  return <main className="min-h-screen bg-[#FAFAFA] p-4 pb-12" dir="rtl">
    <div className="max-w-3xl mx-auto">
      <a href={`/store/${shop.slug}`} className="text-xs text-gray-400">← بازگشت به فروشگاه</a>
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm mt-4">
        <div className="grid md:grid-cols-2 gap-5 p-5">
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50"><img src={images[0] || "https://via.placeholder.com/600"} className="w-full h-full object-cover" alt={product.name}/></div>
            {images.length > 1 && <div className="grid grid-cols-4 gap-2">{images.slice(1,5).map((im:string,i:number)=><img key={i} src={im} className="aspect-square rounded-xl object-cover" alt=""/>)}</div>}
          </div>
          <div>
            <p className="text-xs text-[#FF1744] font-bold">{shop.name}</p>
            <h1 className="text-2xl font-black text-[#37474F] mt-2">{product.name}</h1>
            <p className="text-lg font-black text-[#FF1744] mt-3">{new Intl.NumberFormat("fa-IR").format(product.price)} تومان</p>
            <div className="mt-6 prose prose-sm max-w-none text-gray-600 whitespace-pre-line">{product.description || "توضیحاتی ثبت نشده است."}</div>
            {product.videoUrl && <a href={product.videoUrl} target="_blank" rel="noreferrer" className="inline-flex mt-6 px-5 py-3 rounded-xl bg-[#37474F] text-white text-sm font-bold">▶ ویدیو آموزشی</a>}
          </div>
        </div>
      </div>
      <div className="bg-white rounded-3xl p-5 mt-4">
        <h2 className="font-black text-[#37474F]">پشتیبانی این محصول</h2>
        <p className="text-xs text-gray-400 mt-1">سؤال یا مشکلی دارید؟ پیام بفرستید.</p>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} className="w-full mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm" rows={4} placeholder="پیام شما..." />
        <button onClick={sendSupport} className="mt-2 px-5 py-3 rounded-xl bg-[#FF1744] text-white text-sm font-bold">ارسال پیام</button>
        {sent && <p className="text-xs text-green-600 mt-2">پیام شما ارسال شد.</p>}
      </div>
    </div>
  </main>;
}
