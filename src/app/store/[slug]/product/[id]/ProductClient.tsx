"use client";
import { useEffect, useMemo, useState } from "react";

type Product = { id:number; name:string; description:string|null; price:number; image:string|null; images?: unknown; videoUrl?:string|null; isBestseller?:boolean; stock?:number|null };

export default function ProductClient({ shop, product, bestsellers = [] }: { shop:any; product:Product; bestsellers?:Product[] }) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const images = [product.image, ...(Array.isArray(product.images) ? product.images as string[] : [])].filter(Boolean) as string[];
  const cartKey = `cart_${shop.slug}`;
  const format = (n:number) => new Intl.NumberFormat("fa-IR").format(n);

  const refreshCartCount = () => {
    try {
      const saved = localStorage.getItem(cartKey);
      const cart = saved ? JSON.parse(saved) : [];
      setCartCount(Array.isArray(cart) ? cart.reduce((sum:number, item:any) => sum + Number(item.quantity || 0), 0) : 0);
    } catch { setCartCount(0); }
  };
  useEffect(() => {
    refreshCartCount();
    const onStorage = () => refreshCartCount();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [cartKey]);

  const addToCart = (item:Product) => {
    try {
      const saved = localStorage.getItem(cartKey);
      const cart = saved ? JSON.parse(saved) : [];
      const existing = cart.find((i:any) => i.id === item.id);
      const next = existing
        ? cart.map((i:any) => i.id === item.id ? { ...i, quantity: Number(i.quantity || 0) + 1 } : i)
        : [...cart, { ...item, quantity: 1 }];
      localStorage.setItem(cartKey, JSON.stringify(next));
      refreshCartCount();
      alert("محصول به سبد خرید اضافه شد");
    } catch { alert("افزودن به سبد خرید انجام نشد"); }
  };

  const sendSupport = async () => {
    if (!message.trim()) return;
    const r = await fetch("/api/support", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ productId:product.id, subject:`پشتیبانی محصول: ${product.name}`, message }), credentials:"include" });
    if (r.ok) { setMessage(""); setSent(true); } else alert("ابتدا وارد حساب مشتری شوید.");
  };

  const nav = (path:string) => { window.location.href = path; };
  const productHref = (id:number) => `/store/${shop.slug}/product/${id}`;

  return <main className="min-h-screen bg-[#FAFAFA] pb-28" dir="rtl">
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-gray-100">
      <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href={`/store/${shop.slug}`} className="text-sm font-bold text-gray-500">← {shop.name}</a>
        <button onClick={() => nav(`/store/${shop.slug}?cart=1`)} className="relative w-11 h-11 rounded-full bg-gray-50 flex items-center justify-center text-[#FF1744]" aria-label="سبد خرید">
          🛒
          {cartCount > 0 && <span className="absolute -top-1 -left-1 min-w-5 h-5 px-1 rounded-full bg-[#FF1744] text-white text-[10px] font-black flex items-center justify-center">{cartCount}</span>}
        </button>
      </div>
    </header>

    <div className="max-w-3xl mx-auto p-4">
      <div className="bg-white rounded-3xl overflow-hidden shadow-sm mt-2">
        <div className="grid md:grid-cols-2 gap-5 p-5">
          <div className="space-y-3">
            <div className="aspect-square rounded-2xl overflow-hidden bg-gray-50"><img src={images[0] || "https://via.placeholder.com/600"} className="w-full h-full object-cover" alt={product.name}/></div>
            {images.length > 1 && <div className="grid grid-cols-4 gap-2">{images.slice(1,5).map((im:string,i:number)=><img key={i} src={im} className="aspect-square rounded-xl object-cover" alt=""/>)}</div>}
          </div>
          <div>
            <p className="text-xs text-[#FF1744] font-bold">{shop.name}</p>
            <h1 className="text-2xl font-black text-[#37474F] mt-2">{product.name}</h1>
            <p className="text-lg font-black text-[#FF1744] mt-3">{format(product.price)} تومان</p>
            <div className="mt-6 prose prose-sm max-w-none text-gray-600 whitespace-pre-line">{product.description || "توضیحاتی ثبت نشده است."}</div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button onClick={() => addToCart(product)} className="inline-flex px-5 py-3 rounded-xl bg-[#FF1744] text-white text-sm font-bold">افزودن به سبد خرید</button>
              <button onClick={() => { if (!product.videoUrl) { alert("ویدیوی آموزشی برای این محصول هنوز تنظیم نشده است."); return; } window.open(product.videoUrl, "_blank", "noopener,noreferrer"); }} className="inline-flex px-5 py-3 rounded-xl bg-[#37474F] text-white text-sm font-bold">▶ ویدیو آموزشی</button>
            </div>
          </div>
        </div>
      </div>

      <section className="mt-5">
        <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-black text-[#37474F]">محصولات پرفروش</h2><a href={`/store/${shop.slug}`} className="text-xs font-bold text-[#FF1744]">مشاهده همه</a></div>
        {bestsellers.length ? <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{bestsellers.map((item) => <article key={item.id} className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
          <a href={productHref(item.id)}><div className="aspect-square bg-gray-50"><img src={item.image || "https://via.placeholder.com/400"} alt={item.name} className="w-full h-full object-cover" /></div></a>
          <div className="p-3"><a href={productHref(item.id)}><h3 className="font-bold text-sm text-[#37474F] line-clamp-2 min-h-10">{item.name}</h3></a><p className="text-xs font-black text-[#FF1744] mt-2">{format(item.price)} تومان</p><button onClick={() => addToCart(item)} className="w-full mt-2 py-2 rounded-lg bg-[#37474F] text-white text-xs font-bold">افزودن به سبد</button></div>
        </article>)}</div> : <div className="bg-white rounded-2xl p-5 text-center text-sm text-gray-400">محصول پرفروشی ثبت نشده است.</div>}
      </section>

      <div className="bg-white rounded-3xl p-5 mt-5">
        <h2 className="font-black text-[#37474F]">پشتیبانی این محصول</h2>
        <p className="text-xs text-gray-400 mt-1">سؤال یا مشکلی دارید؟ پیام بفرستید.</p>
        <textarea value={message} onChange={e=>setMessage(e.target.value)} className="w-full mt-4 p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm" rows={4} placeholder="پیام شما..." />
        <button onClick={sendSupport} className="mt-2 px-5 py-3 rounded-xl bg-[#FF1744] text-white text-sm font-bold">ارسال پیام</button>
        {sent && <p className="text-xs text-green-600 mt-2">پیام شما ارسال شد.</p>}
      </div>
    </div>

    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white border-t border-gray-100 shadow-[0_-6px_25px_rgba(0,0,0,.06)]">
      <div className="max-w-3xl mx-auto grid grid-cols-4 h-16">
        <button onClick={() => nav(`/store/${shop.slug}`)} className="flex flex-col items-center justify-center gap-1 text-[11px] text-gray-500"><span>⌂</span>فروشگاه</button>
        <button onClick={() => nav(`/store/${shop.slug}?cart=1`)} className="relative flex flex-col items-center justify-center gap-1 text-[11px] text-gray-500"><span>🛒</span>سبد خرید{cartCount>0 && <span className="absolute top-1/2 -translate-y-4 ml-7 min-w-4 h-4 rounded-full bg-[#FF1744] text-white text-[9px] flex items-center justify-center">{cartCount}</span>}</button>
        <button onClick={() => nav(`/store/${shop.slug}?tab=orders`)} className="flex flex-col items-center justify-center gap-1 text-[11px] text-gray-500"><span>▣</span>سفارش‌ها</button>
        <button onClick={() => nav(`/store/${shop.slug}?tab=more`)} className="flex flex-col items-center justify-center gap-1 text-[11px] text-gray-500"><span>•••</span>بیشتر</button>
      </div>
    </nav>
  </main>;
}
