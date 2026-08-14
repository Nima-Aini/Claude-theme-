"use client";

import { useState, useEffect } from "react";

function formatPrice(price: number) { return new Intl.NumberFormat("fa-IR").format(price) + " تومان"; }

const SI = {
  logout: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>,
  link: <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>,
};

export default function ShopPanelPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [support, setSupport] = useState<any[]>([]);
  const [reply, setReply] = useState<Record<number,string>>({});

  useEffect(() => { 
    loadData(); 
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch("/api/shop/dashboard", {
        credentials: "include", // Important for cookies
      });
      
      if (res.status === 401) {
        setError("لطفا دوباره وارد شوید");
        setTimeout(() => {
          window.location.href = "/shop-login";
        }, 1500);
        return;
      }
      
      const json = await res.json();
      
      if (json.error) {
        setError(json.error);
        setTimeout(() => {
          window.location.href = "/shop-login";
        }, 1500);
        return;
      }
      
      setData(json);
      setError(null);
    } catch (err) {
      setError("خطا در برقراری ارتباط");
      setTimeout(() => {
        window.location.href = "/shop-login";
      }, 1500);
    } finally {
      setLoading(false);
    }
  };

  const loadSupport = async () => { const r = await fetch("/api/support", {credentials:"include"}); if(r.ok) setSupport(await r.json()); };
  const sendReply = async (ticketId:number) => { const message=reply[ticketId]?.trim(); if(!message)return; await fetch("/api/support",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticketId,message}),credentials:"include"}); setReply({...reply,[ticketId]:""}); loadSupport(); };

  const requestPayout = async () => {
    if (!payoutAmount) return;
    await fetch("/api/payouts", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ amount: payoutAmount }),
      credentials: "include",
    });
    setPayoutAmount(0);
    loadData();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ type: "shop" }),
      credentials: "include",
    });
    window.location.href = "/shop-login";
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="text-center">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-[#FF1744] animate-spin mx-auto" />
        <p className="text-xs text-gray-400 mt-3">در حال بارگذاری...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="text-center">
        <p className="text-sm text-red-500 mb-2">{error}</p>
        <p className="text-xs text-gray-400">در حال انتقال...</p>
      </div>
    </div>
  );

  if (!data) return null;

  const { shop, stats, orders, payouts, requests } = data;
  const statusLabels: Record<string, { label: string; color: string }> = {
    pending: { label: "در انتظار", color: "#FFA000" },
    processing: { label: "پردازش", color: "#1976D2" },
    shipped: { label: "ارسال شده", color: "#4CAF50" },
    delivered: { label: "تحویل شده", color: "#2E7D32" },
  };

  const tabs = [
    { key: "dashboard", label: "داشبورد" },
    { key: "orders", label: "سفارش‌ها" },
    { key: "commission", label: "پورسانت" },
    { key: "payouts", label: "واریزها" },
    { key: "support", label: "پشتیبانی" },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div style={{ background: "#37474F" }} className="text-white">
        <div className="flex items-center justify-between px-5 pt-5 pb-2">
          <div>
            <p className="text-[10px] tracking-[0.15em] text-white/40 font-bold">SELLER PANEL</p>
            <h1 className="text-base font-black mt-0.5">{shop.name}</h1>
          </div>
          <button onClick={logout} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            {SI.logout}
          </button>
        </div>
        <p className="text-[11px] text-white/50 px-5 pb-4">نرخ پورسانت: {shop.commissionRate}%</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 p-1.5 bg-white border-b border-gray-100 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); if(tab.key==="support") loadSupport(); }}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.key ? "bg-[#FF1744] text-white" : "text-gray-400 hover:text-gray-600"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {/* Dashboard */}
        {activeTab === "dashboard" && (
          <div className="animate-fadeIn space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { t: "کل سفارش‌ها", v: String(stats.totalOrders), c: "#FF1744" },
                { t: "در انتظار", v: String(stats.pendingOrders), c: "#FFA000" },
                { t: "ارسال شده", v: String(stats.shippedOrders), c: "#4CAF50" },
                { t: "کل فروش", v: formatPrice(stats.totalSales), c: "#9C27B0" },
                { t: "کل پورسانت", v: formatPrice(stats.totalCommission), c: "#E91E63" },
                { t: "قابل برداشت", v: formatPrice(stats.unpaidAmount), c: "#1976D2" },
              ].map((s, i) => (
                <div key={i} className="bg-white rounded-2xl p-3.5">
                  <div className="w-1.5 h-1.5 rounded-full mb-2" style={{ background: s.c }} />
                  <p className="text-[10px] text-gray-400 font-bold">{s.t}</p>
                  <p className="font-black text-xs mt-0.5" style={{ color: s.c }}>{s.v}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl p-4">
              <p className="text-[11px] font-bold text-gray-400 mb-3">آخرین سفارش‌ها</p>
              {orders.slice(0, 5).map((o: any) => {
                const st = statusLabels[o.status || "pending"] || statusLabels.pending;
                return (
                  <div key={o.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: "#37474F" }}>#{o.id} {o.customerName}</span>
                      <span className="px-1.5 py-0.5 rounded-md text-[9px] text-white font-bold" style={{ background: st.color }}>{st.label}</span>
                    </div>
                    <span className="text-xs font-bold text-[#FF1744]">{formatPrice(o.totalAmount)}</span>
                  </div>
                );
              })}
              {orders.length === 0 && <p className="text-center text-gray-300 py-6 text-xs">سفارشی ثبت نشده</p>}
            </div>
          </div>
        )}

        {/* Orders */}
        {activeTab === "orders" && (
          <div className="animate-fadeIn space-y-2.5">
            {orders.length === 0 ? (
              <div className="text-center py-16"><p className="text-gray-300 text-sm">سفارشی ثبت نشده</p></div>
            ) : orders.map((o: any) => {
              const st = statusLabels[o.status || "pending"] || statusLabels.pending;
              const items = o.items as any[];
              return (
                <div key={o.id} className="bg-white rounded-2xl p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold" style={{ color: "#37474F" }}>سفارش #{o.id}</span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] text-white font-bold" style={{ background: st.color }}>{st.label}</span>
                  </div>
                  <div className="text-xs space-y-1 text-gray-600">
                    <p>مشتری: <span className="font-bold text-gray-800">{o.customerName}</span></p>
                    <p>تلفن: <span className="font-bold" dir="ltr">{o.customerPhone}</span></p>
                    <p>آدرس: {o.customerAddress}</p>
                    <p>ارسال: <span className="font-bold">{o.shippingMethod === "post" ? "پست پیشتاز" : "تیپاکس"}</span></p>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {items?.map((item: any, i: number) => (
                      <span key={i} className="text-[10px] bg-gray-50 px-2 py-1 rounded-md font-bold">{item.name} ×{item.quantity}</span>
                    ))}
                  </div>
                  <div className="flex justify-between mt-3 pt-3 border-t border-gray-50 text-xs">
                    <span className="text-gray-400">پورسانت: <span className="font-bold text-green-600">{formatPrice(o.commissionAmount || 0)}</span></span>
                    <span className="font-black text-[#FF1744]">{formatPrice(o.totalAmount)}</span>
                  </div>
                  {o.trackingLink && (
                    <a href={o.trackingLink} target="_blank" className="flex items-center gap-1 mt-2 text-[11px] text-blue-500">{SI.link} پیگیری مرسوله</a>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Commission */}
        {activeTab === "commission" && (
          <div className="animate-fadeIn space-y-4">
            <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #37474F, #FF1744)" }}>
              <p className="text-[11px] text-white/60 font-bold mb-3">خلاصه مالی</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div><p className="text-[10px] text-white/50">کل پورسانت</p><p className="font-black text-sm mt-1">{formatPrice(stats.totalCommission)}</p></div>
                <div><p className="text-[10px] text-white/50">واریز شده</p><p className="font-black text-sm mt-1">{formatPrice(stats.paidAmount)}</p></div>
                <div><p className="text-[10px] text-white/50">مانده</p><p className="font-black text-sm mt-1">{formatPrice(stats.unpaidAmount)}</p></div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-5 space-y-3">
              <p className="text-xs font-bold" style={{ color: "#37474F" }}>درخواست برداشت</p>
              <input type="number" placeholder="مبلغ درخواستی (تومان)" value={payoutAmount || ""} onChange={(e) => setPayoutAmount(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm" />
              <button onClick={requestPayout} disabled={!payoutAmount}
                className="w-full py-3 rounded-xl bg-[#FF1744] text-white text-sm font-bold disabled:opacity-40">ثبت درخواست</button>
            </div>
            {requests && requests.length > 0 && (
              <div className="bg-white rounded-2xl p-5">
                <p className="text-xs font-bold text-gray-400 mb-3">درخواست‌های قبلی</p>
                {requests.map((r: any) => (
                  <div key={r.id} className="flex justify-between py-2 border-b border-gray-50 last:border-0 text-xs">
                    <span className="font-bold">{formatPrice(r.amount)}</span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${r.status === "paid" ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                      {r.status === "paid" ? "واریز شده" : "در انتظار"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Support */}
        {activeTab === "support" && (
          <div className="animate-fadeIn space-y-3">
            <div className="flex justify-between items-center"><p className="text-xs font-bold text-gray-400">پیام‌های پشتیبانی</p><button onClick={loadSupport} className="text-xs text-[#FF1744] font-bold">بروزرسانی</button></div>
            {support.map((t:any)=><div key={t.id} className="bg-white rounded-2xl p-4">
              <p className="font-bold text-sm text-[#37474F]">{t.subject}</p>
              <div className="mt-3 space-y-2">{t.messages?.map((m:any)=><div key={m.id} className={`p-2 rounded-xl text-xs ${m.senderType==="shop"?"bg-[#FF174410]":"bg-gray-50"}`}>{m.message}</div>)}</div>
              <div className="flex gap-2 mt-3"><input value={reply[t.id]||""} onChange={e=>setReply({...reply,[t.id]:e.target.value})} className="flex-1 p-2 rounded-xl bg-gray-50 border border-gray-100 text-xs" placeholder="پاسخ..." /><button onClick={()=>sendReply(t.id)} className="px-4 rounded-xl bg-[#FF1744] text-white text-xs font-bold">ارسال</button></div>
            </div>)}
            {support.length===0 && <p className="text-center text-gray-300 py-10 text-xs">پیامی ندارید</p>}
          </div>
        )}

        {/* Payouts History */}
        {activeTab === "payouts" && (
          <div className="animate-fadeIn space-y-2.5">
            <p className="text-xs font-bold text-gray-400 mb-1">تاریخچه واریزها</p>
            {payouts && payouts.length > 0 ? payouts.map((p: any) => (
              <div key={p.id} className="bg-white rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-sm text-green-600">{formatPrice(p.amount)}</span>
                  <span className="text-[10px] text-gray-400">{new Date(p.createdAt).toLocaleDateString("fa-IR")}</span>
                </div>
                {p.description && <p className="text-xs text-gray-400 mt-1">{p.description}</p>}
              </div>
            )) : (
              <div className="text-center py-16"><p className="text-gray-300 text-sm">واریزی ثبت نشده</p></div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
