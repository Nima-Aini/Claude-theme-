"use client";

import { useState, useEffect } from "react";

type Product = { id: number; name: string; description: string | null; price: number; image: string | null; images?: string[] | null; videoUrl?: string | null; isBestseller: boolean | null; stock: number | null };
type Shop = { id: number; name: string; slug: string; image: string | null; bannerImage: string | null; phone?: string | null; commissionRate: number | null; totalEarnings: number | null; paidEarnings: number | null };
type Discount = { id: number; code: string; type: "percentage" | "amount"; value: number; isActive: boolean | null; isPublic: boolean | null; createdAt: string | null };
type Order = { id: number; customerId: number; shopId: number; customerName: string; customerPhone: string; customerAddress: string; shippingMethod: string; totalAmount: number; commissionAmount: number | null; status: string | null; trackingLink: string | null; items: any; createdAt: string | null };
type CustomerReportOrder = { id: number; shopId: number; shopName: string; customerName: string; customerPhone: string; customerAddress: string; totalAmount: number; commissionAmount: number; status: string; trackingLink: string | null; shippingMethod: string; items: any; createdAt: string | null };
type CustomerReportRow = { id: number; phone: string; name: string; address: string; shopIds: number[]; shops: string[]; orderCount: number; orders: CustomerReportOrder[] };

function formatPrice(price: number) { return new Intl.NumberFormat("fa-IR").format(price) + " تومان"; }

const SvgIcons = {
  dashboard: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" /></svg>,
  products: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>,
  shops: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>,
  orders: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>,
  payouts: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" /></svg>,
  banners: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg>,
  settings: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>,
  logout: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>,
  edit: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>,
  trash: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>,
  close: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>,
  menu: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>,
};

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [newDiscount, setNewDiscount] = useState({ code: "", type: "percentage" as "percentage" | "amount", value: 0, isPublic: false });
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [sliderBanners, setSliderBanners] = useState<any[]>([]);
  const [bottomBanners, setBottomBanners] = useState<any[]>([]);
  const [editProduct, setEditProduct] = useState<any>(null);
  const [editShop, setEditShop] = useState<any>(null);
  const [editOrder, setEditOrder] = useState<any>(null);
  const [payoutForm, setPayoutForm] = useState({ shopId: 0, amount: 0, description: "" });
  const [newBanner, setNewBanner] = useState({ type: "slider", image: "", sortOrder: 0 });
  const [editBanner, setEditBanner] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);
  const [supportReply, setSupportReply] = useState<Record<number,string>>({});
  const [reportShopIds, setReportShopIds] = useState<number[] | "all">("all");
  const [customerReport, setCustomerReport] = useState<CustomerReportRow[]>([]);
  const [reportExpanded, setReportExpanded] = useState<Record<number, boolean>>({});
  const [reportLoading, setReportLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const session = await fetch("/api/auth/admin/session", { cache: "no-store" });
        if (!session.ok) {
          window.location.href = "/nimaaminarsham/login";
          return;
        }
        await loadAll();
      } catch {
        window.location.href = "/nimaaminarsham/login";
      }
    })();
  }, []);

  const loadAll = async () => {
    try {
      const [pRes, sRes, oRes, stRes, bRes, dRes, supRes] = await Promise.all([
        fetch("/api/products"), fetch("/api/shops"), fetch("/api/orders"), fetch("/api/settings"), fetch("/api/banners"), fetch("/api/discounts"), fetch("/api/support"),
      ]);
      setProducts(await pRes.json());
      setShops(await sRes.json());
      const od = await oRes.json(); setOrders(Array.isArray(od) ? od : []);
      setSettings(await stRes.json());
      const bd = await bRes.json(); setSliderBanners(bd.sliders || []); setBottomBanners(bd.bottoms || []);
      const dd = await dRes.json(); setDiscounts(Array.isArray(dd) ? dd : []); const sd = await supRes.json(); setSupportTickets(Array.isArray(sd) ? sd : []);
    } catch (err) { console.error(err); }
  };

  const request = async (url: string, options: RequestInit) => {
    const res = await fetch(url, { ...options, credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      window.location.href = "/nimaaminarsham/login";
      throw new Error("نشست مدیریت منقضی شده است؛ دوباره وارد شوید");
    }
    if (!res.ok) throw new Error(data.error || "عملیات انجام نشد");
    return data;
  };
  const saveProduct = async () => { if (!editProduct) return; try { await request("/api/products", { method: editProduct.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editProduct) }); setEditProduct(null); await loadAll(); } catch (e:any) { alert(e.message); } };
  const deleteProduct = async (id: number) => { if (!confirm("حذف شود؟")) return; try { await request("/api/products", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); await loadAll(); } catch (e:any) { alert(e.message); } };
  const saveShop = async () => { if (!editShop) return; try { await request("/api/shops", { method: editShop.id ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editShop) }); setEditShop(null); await loadAll(); } catch (e:any) { alert(e.message); } };
  const updateOrder = async () => { if (!editOrder) return; try { await request("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editOrder.id, status: editOrder.status, trackingLink: editOrder.trackingLink }) }); setEditOrder(null); await loadAll(); } catch (e:any) { alert(e.message); } };
  const processPayout = async () => { try { await request("/api/payouts", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payoutForm) }); setPayoutForm({ shopId: 0, amount: 0, description: "" }); await loadAll(); } catch (e:any) { alert(e.message); } };
  const saveSettings = async () => { try { await request("/api/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) }); await loadAll(); alert("تنظیمات ذخیره شد"); } catch (e:any) { alert(e.message); } };
  const addBanner = async () => { if (!newBanner.image) return; try { await request("/api/banners", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newBanner) }); setNewBanner({ type: "slider", image: "", sortOrder: 0 }); await loadAll(); } catch (e:any) { alert(e.message); } };
  const editExistingBanner = (type: string, b: any) => setEditBanner({ id: b.id, type, image: b.image, sortOrder: b.sortOrder || 0 });
  const saveBannerEdit = async () => { if (!editBanner) return; try { await request("/api/banners", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editBanner) }); setEditBanner(null); await loadAll(); } catch (e:any) { alert(e.message); } };
  const deleteBanner = async (type: string, id: number) => { try { await request("/api/banners", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type, id }) }); await loadAll(); } catch (e:any) { alert(e.message); } };
  const addDiscount = async () => {
    if (!newDiscount.code.trim() || !newDiscount.value) return;
    try {
      await request("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDiscount),
      });
      setNewDiscount({ code: "", type: "percentage", value: 0, isPublic: false });
      await loadAll();
    } catch (e: any) { alert(e.message); }
  };
  const toggleDiscount = async (d: Discount, field: "isPublic" | "isActive") => {
    try {
      await request("/api/discounts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: d.id, [field]: !d[field] }),
      });
      await loadAll();
    } catch (e: any) { alert(e.message); }
  };
  const deleteDiscount = async (id: number) => {
    if (!confirm("این کد تخفیف حذف شود؟")) return;
    try {
      await request("/api/discounts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
      await loadAll();
    } catch (e: any) { alert(e.message); }
  };

  const loadCustomerReport = async () => {
    setReportLoading(true);
    try {
      const query = reportShopIds === "all" ? "all" : reportShopIds.join(",");
      const data = await request(`/api/admin/customer-report?shopIds=${encodeURIComponent(query)}`);
      setCustomerReport(Array.isArray(data.customers) ? data.customers : []);
      setReportExpanded({});
    } catch (e:any) {
      alert(e.message);
    } finally {
      setReportLoading(false);
    }
  };

  const logout = async () => { await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "admin" }) }); window.location.href = "/nimaaminarsham/login"; };

  const primary = settings.primary_color || "#FF1744";
  const secondary = settings.secondary_color || "#37474F";

  const menuItems = [
    { key: "dashboard", icon: SvgIcons.dashboard, label: "داشبورد" },
    { key: "products", icon: SvgIcons.products, label: "محصولات" },
    { key: "shops", icon: SvgIcons.shops, label: "فروشگاه‌ها" },
    { key: "orders", icon: SvgIcons.orders, label: "سفارش‌ها" },
    { key: "discounts", icon: SvgIcons.payouts, label: "کدهای تخفیف" },
    { key: "payouts", icon: SvgIcons.payouts, label: "پورسانت‌ها" },
    { key: "banners", icon: SvgIcons.banners, label: "بنرها" },
    { key: "support", icon: SvgIcons.settings, label: "پشتیبانی" },
    { key: "customer-report", icon: SvgIcons.orders, label: "گزارش مشتریان" },
    { key: "settings", icon: SvgIcons.settings, label: "تنظیمات" },
  ];

  const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 transition-all";

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex" dir="rtl">
      {/* Mobile menu */}
      <button onClick={() => setSidebarOpen(!sidebarOpen)} className="fixed top-4 right-4 z-50 lg:hidden w-10 h-10 rounded-xl bg-white shadow-md flex items-center justify-center text-gray-600">
        {SvgIcons.menu}
      </button>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-40 w-60 transform transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"}`}
        style={{ background: secondary }}>
        <div className="p-5">
          <div className="mb-8 mt-2">
            <p className="text-[10px] font-bold tracking-[0.2em] text-white/40 mb-1">ADMIN PANEL</p>
            <h1 className="text-base font-black text-white">پنل مدیریت</h1>
          </div>
          <nav className="space-y-0.5">
            {menuItems.map((item) => (
              <button key={item.key} onClick={() => { setActiveSection(item.key); setSidebarOpen(false); }}
                className={`w-full text-right px-3.5 py-2.5 rounded-xl transition-all flex items-center gap-2.5 text-sm ${activeSection === item.key ? "text-white font-bold" : "text-white/50 hover:text-white/80 hover:bg-white/5"}`}
                style={{ background: activeSection === item.key ? primary : "transparent" }}>
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <button onClick={logout}
            className="w-full mt-8 px-3.5 py-2.5 rounded-xl text-white/40 hover:text-white/70 hover:bg-white/5 text-right flex items-center gap-2.5 text-sm transition-all">
            {SvgIcons.logout}
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-30 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 p-4 lg:p-7 overflow-auto min-h-screen">
        {/* Dashboard */}
        {activeSection === "dashboard" && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-black mb-5" style={{ color: secondary }}>داشبورد</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <StatCard title="محصولات" value={String(products.length)} color={primary} />
              <StatCard title="فروشگاه‌ها" value={String(shops.length)} color="#1976D2" />
              <StatCard title="سفارش‌ها" value={String(orders.length)} color="#4CAF50" />
              <StatCard title="در انتظار" value={String(orders.filter((o) => o.status === "pending").length)} color="#FFA000" />
              <StatCard title="کل فروش" value={formatPrice(orders.reduce((s, o) => s + o.totalAmount, 0))} color="#9C27B0" />
              <StatCard title="کل پورسانت" value={formatPrice(orders.reduce((s, o) => s + (o.commissionAmount || 0), 0))} color="#E91E63" />
            </div>
            <div className="bg-white rounded-2xl p-5">
              <p className="text-xs font-bold text-gray-400 mb-4">آخرین سفارش‌ها</p>
              <div className="space-y-1.5">
                {orders.slice(0, 5).map((o) => (
                  <div key={o.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl text-xs">
                    <span className="font-bold" style={{ color: secondary }}>#{o.id} — {o.customerName}</span>
                    <span className="font-bold" style={{ color: primary }}>{formatPrice(o.totalAmount)}</span>
                  </div>
                ))}
                {orders.length === 0 && <p className="text-center text-gray-300 py-6 text-sm">سفارشی ثبت نشده</p>}
              </div>
            </div>
          </div>
        )}

        {/* Products */}
        {activeSection === "products" && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black" style={{ color: secondary }}>محصولات</h2>
              <button onClick={() => setEditProduct({ name: "", description: "", price: 0, image: "", images: [], videoUrl: "", isBestseller: false, stock: 100 })}
                className="px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ background: primary }}>
                محصول جدید
              </button>
            </div>
            {editProduct && (
              <div className="bg-white rounded-2xl p-5 mb-5 space-y-3 animate-scaleIn">
                <input placeholder="نام محصول" value={editProduct.name} onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })} className={inputClass} style={{ "--tw-ring-color": primary } as any} />
                <textarea placeholder="توضیحات" value={editProduct.description || ""} onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })} className={inputClass + " resize-none"} rows={2} style={{ "--tw-ring-color": primary } as any} />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="قیمت (تومان)" value={editProduct.price || ""} onChange={(e) => setEditProduct({ ...editProduct, price: parseInt(e.target.value) || 0 })} className={inputClass} style={{ "--tw-ring-color": primary } as any} />
                  <input type="number" placeholder="موجودی" value={editProduct.stock || ""} onChange={(e) => setEditProduct({ ...editProduct, stock: parseInt(e.target.value) || 0 })} className={inputClass} style={{ "--tw-ring-color": primary } as any} />
                </div>
                <input placeholder="لینک تصویر" value={editProduct.image || ""} onChange={(e) => setEditProduct({ ...editProduct, image: e.target.value })} className={inputClass} dir="ltr" style={{ "--tw-ring-color": primary } as any} /><input placeholder="لینک تصاویر بیشتر (هر خط یک لینک)" value={Array.isArray(editProduct.images) ? editProduct.images.join("\n") : ""} onChange={(e) => setEditProduct({ ...editProduct, images: e.target.value.split("\n").map((x:string)=>x.trim()).filter(Boolean) })} className={inputClass} dir="ltr" />
                <input placeholder="لینک ویدیو آموزشی" value={editProduct.videoUrl || ""} onChange={(e) => setEditProduct({ ...editProduct, videoUrl: e.target.value })} className={inputClass} dir="ltr" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editProduct.isBestseller || false} onChange={(e) => setEditProduct({ ...editProduct, isBestseller: e.target.checked })} className="w-4 h-4 rounded" style={{ accentColor: primary }} />
                  <span className="text-xs font-bold text-gray-600">محصول پرفروش</span>
                </label>
                <div className="flex gap-2">
                  <button onClick={saveProduct} className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold" style={{ background: primary }}>ذخیره</button>
                  <button onClick={() => setEditProduct(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500">انصراف</button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl overflow-hidden">
                  <img src={p.image || "https://via.placeholder.com/300"} alt={p.name} className="w-full h-36 object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold text-sm" style={{ color: secondary }}>{p.name}</h3>
                    <p className="text-xs font-bold mt-1" style={{ color: primary }}>{formatPrice(p.price)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {p.isBestseller && <span className="text-[10px] px-2 py-0.5 rounded-md font-bold" style={{ background: `${primary}15`, color: primary }}>پرفروش</span>}
                      <span className="text-[10px] text-gray-400">موجودی: {p.stock}</span>
                    </div>
                    <div className="flex gap-1.5 mt-3">
                      <button onClick={() => setEditProduct({ ...p })} className="flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1" style={{ background: `${primary}08`, color: primary }}>{SvgIcons.edit} ویرایش</button>
                      <button onClick={() => deleteProduct(p.id)} className="py-2 px-3 rounded-lg bg-red-50 text-red-400">{SvgIcons.trash}</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shops */}
        {activeSection === "shops" && (
          <div className="animate-fadeIn">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-black" style={{ color: secondary }}>فروشگاه‌ها</h2>
              <button onClick={() => setEditShop({ name: "", slug: "", image: "", bannerImage: "", phone: "", username: "", password: "", commissionRate: 10 })}
                className="px-4 py-2 rounded-xl text-white text-xs font-bold" style={{ background: primary }}>فروشگاه جدید</button>
            </div>
            {editShop && (
              <div className="bg-white rounded-2xl p-5 mb-5 space-y-3 animate-scaleIn">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="نام فروشگاه" value={editShop.name} onChange={(e) => setEditShop({ ...editShop, name: e.target.value })} className={inputClass} style={{ "--tw-ring-color": primary } as any} />
                  <input placeholder="شناسه URL" value={editShop.slug} onChange={(e) => setEditShop({ ...editShop, slug: e.target.value })} className={inputClass} dir="ltr" style={{ "--tw-ring-color": primary } as any} />
                </div>
                <input placeholder="لینک تصویر" value={editShop.image || ""} onChange={(e) => setEditShop({ ...editShop, image: e.target.value })} className={inputClass} dir="ltr" style={{ "--tw-ring-color": primary } as any} />
                <input placeholder="لینک بنر" value={editShop.bannerImage || ""} onChange={(e) => setEditShop({ ...editShop, bannerImage: e.target.value })} className={inputClass} dir="ltr" style={{ "--tw-ring-color": primary } as any} /><input placeholder="شماره تماس فروشگاه برای پیامک" value={editShop.phone || ""} onChange={(e) => setEditShop({ ...editShop, phone: e.target.value.replace(/\D/g, "").slice(0, 20) })} className={inputClass} dir="ltr" />
                <div className="grid grid-cols-3 gap-3">
                  <input placeholder="نام کاربری" value={editShop.username} onChange={(e) => setEditShop({ ...editShop, username: e.target.value })} className={inputClass} dir="ltr" style={{ "--tw-ring-color": primary } as any} />
                  <input type="password" placeholder={editShop.id ? "رمز جدید" : "رمز عبور"} value={editShop.password || ""} onChange={(e) => setEditShop({ ...editShop, password: e.target.value })} className={inputClass} dir="ltr" style={{ "--tw-ring-color": primary } as any} />
                  <input type="number" placeholder="پورسانت %" value={editShop.commissionRate || ""} onChange={(e) => setEditShop({ ...editShop, commissionRate: parseInt(e.target.value) || 0 })} className={inputClass} style={{ "--tw-ring-color": primary } as any} />
                </div>
                <div className="flex gap-2">
                  <button onClick={saveShop} className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold" style={{ background: primary }}>ذخیره</button>
                  <button onClick={() => setEditShop(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500">انصراف</button>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {shops.map((s) => (
                <div key={s.id} className="bg-white rounded-2xl overflow-hidden">
                  <img src={s.image || "https://via.placeholder.com/300x150"} alt={s.name} className="w-full h-32 object-cover" />
                  <div className="p-4">
                    <h3 className="font-bold text-sm" style={{ color: secondary }}>{s.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-0.5" dir="ltr">/{s.slug}</p>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                      <div className="rounded-lg p-2" style={{ background: `${primary}08` }}>
                        <p className="text-[10px] text-gray-500">پورسانت</p>
                        <p className="font-black text-xs" style={{ color: primary }}>{s.commissionRate}%</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-[10px] text-gray-500">کل درآمد</p>
                        <p className="font-bold text-[10px]" style={{ color: secondary }}>{formatPrice(s.totalEarnings || 0)}</p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-2">
                        <p className="text-[10px] text-gray-500">واریز شده</p>
                        <p className="font-bold text-[10px]" style={{ color: secondary }}>{formatPrice(s.paidEarnings || 0)}</p>
                      </div>
                    </div>
                    <button onClick={() => setEditShop({ ...s, password: "" })}
                      className="w-full mt-3 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                      style={{ background: `${primary}08`, color: primary }}>
                      {SvgIcons.edit} ویرایش
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        {activeSection === "orders" && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-black mb-5" style={{ color: secondary }}>سفارش‌ها</h2>
            {editOrder && (
              <div className="bg-white rounded-2xl p-5 mb-5 space-y-3 animate-scaleIn">
                <p className="text-xs font-bold text-gray-400">ویرایش سفارش #{editOrder.id}</p>
                <select value={editOrder.status} onChange={(e) => setEditOrder({ ...editOrder, status: e.target.value })} className={inputClass} style={{ "--tw-ring-color": primary } as any}>
                  <option value="pending">در انتظار</option>
                  <option value="processing">در حال پردازش</option>
                  <option value="shipped">ارسال شده</option>
                  <option value="delivered">تحویل شده</option>
                </select>
                <input placeholder="لینک پیگیری ارسال (در صورت ارسال وارد کنید)" value={editOrder.trackingLink || ""} onChange={(e) => setEditOrder({ ...editOrder, trackingLink: e.target.value })} className={inputClass} dir="ltr" style={{ "--tw-ring-color": primary } as any} />
                <button type="button" onClick={() => setEditOrder({ ...editOrder, status: "shipped" })} className="w-full py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-xs font-bold">
                  علامت‌گذاری به عنوان «ارسال شد»
                </button>
                <div className="flex gap-2">
                  <button onClick={updateOrder} className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold" style={{ background: primary }}>ذخیره</button>
                  <button onClick={() => setEditOrder(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500">انصراف</button>
                </div>
              </div>
            )}
            <div className="space-y-2.5">
              {orders.map((o) => {
                const statusMap: Record<string, { l: string; c: string }> = { pending: { l: "در انتظار", c: "#FFA000" }, processing: { l: "پردازش", c: "#1976D2" }, shipped: { l: "ارسال شده", c: "#4CAF50" }, delivered: { l: "تحویل شده", c: "#2E7D32" } };
                const st = statusMap[o.status || "pending"] || statusMap.pending;
                const shop = shops.find((s) => s.id === o.shopId);
                const items = o.items as any[];
                return (
                  <div key={o.id} className="bg-white rounded-2xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold" style={{ color: secondary }}>#{o.id}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white" style={{ background: st.c }}>{st.l}</span>
                      </div>
                      <button onClick={() => setEditOrder({ ...o })} className="text-gray-300 hover:text-gray-500 transition-colors">{SvgIcons.edit}</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                      <div><span className="text-gray-400">مشتری: </span><span className="font-bold">{o.customerName}</span></div>
                      <div><span className="text-gray-400">تلفن: </span><span className="font-bold" dir="ltr">{o.customerPhone}</span></div>
                      <div><span className="text-gray-400">فروشگاه: </span><span className="font-bold">{shop?.name || "-"}</span></div>
                      <div><span className="text-gray-400">ارسال: </span><span className="font-bold">{o.shippingMethod === "post" ? "پست" : "تیپاکس"}</span></div>
                    </div>
                    <p className="text-xs text-gray-400 mb-2"><span>آدرس: </span>{o.customerAddress}</p>
                    <div className="flex flex-wrap gap-1 mb-3">
                      {items?.map((item: any, i: number) => (
                        <span key={i} className="text-[10px] bg-gray-50 px-2 py-1 rounded-md font-bold">{item.name} ×{item.quantity}</span>
                      ))}
                    </div>
                    <div className="flex justify-between pt-3 border-t border-gray-50 text-xs">
                      <span className="text-gray-400">پورسانت: {formatPrice(o.commissionAmount || 0)}</span>
                      <span className="font-black" style={{ color: primary }}>{formatPrice(o.totalAmount)}</span>
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 && <div className="text-center py-16"><p className="text-gray-300 text-sm">سفارشی ثبت نشده</p></div>}
            </div>
          </div>
        )}

        {/* Discounts */}
        {activeSection === "discounts" && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-black mb-5" style={{ color: secondary }}>مدیریت کدهای تخفیف</h2>

            <div className="bg-white rounded-2xl p-5 mb-5 space-y-3">
              <p className="text-xs font-bold text-gray-400">افزودن کد تخفیف</p>
              <input
                placeholder="کد تخفیف (مثلاً AKMA20)"
                value={newDiscount.code}
                onChange={(e) => setNewDiscount({ ...newDiscount, code: e.target.value.toUpperCase() })}
                className={inputClass} dir="ltr"
              />
              <select value={newDiscount.type} onChange={(e) => setNewDiscount({ ...newDiscount, type: e.target.value as "percentage" | "amount" })} className={inputClass}>
                <option value="percentage">درصدی</option>
                <option value="amount">مبلغی (تومان)</option>
              </select>
              <input
                type="number"
                min={1}
                max={newDiscount.type === "percentage" ? 100 : undefined}
                placeholder={newDiscount.type === "percentage" ? "درصد تخفیف" : "مبلغ تخفیف (تومان)"}
                value={newDiscount.value || ""}
                onChange={(e) => setNewDiscount({ ...newDiscount, value: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
              <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-xs font-bold cursor-pointer">
                <input type="checkbox" checked={newDiscount.isPublic} onChange={(e) => setNewDiscount({ ...newDiscount, isPublic: e.target.checked })} />
                نمایش این کد در بخش «بیشتر» مشتری
              </label>
              <button onClick={addDiscount} disabled={!newDiscount.code.trim() || !newDiscount.value}
                className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: primary }}>
                افزودن کد تخفیف
              </button>
            </div>

            <div className="space-y-2.5">
              {discounts.map((d) => (
                <div key={d.id} className="bg-white rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-black text-sm" dir="ltr">{d.code}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {d.type === "percentage" ? `${d.value}% تخفیف` : `${formatPrice(d.value)} تخفیف`}
                      </p>
                    </div>
                    <button onClick={() => deleteDiscount(d.id)} className="text-gray-300 hover:text-red-500">{SvgIcons.trash}</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-3">
                    <button onClick={() => toggleDiscount(d, "isPublic")}
                      className="py-2 rounded-lg text-[11px] font-bold"
                      style={{ background: d.isPublic ? `${primary}12` : "#f5f5f5", color: d.isPublic ? primary : "#999" }}>
                      {d.isPublic ? "✓ نمایش عمومی" : "مخفی از مشتری"}
                    </button>
                    <button onClick={() => toggleDiscount(d, "isActive")}
                      className="py-2 rounded-lg text-[11px] font-bold"
                      style={{ background: d.isActive ? "#ecfdf5" : "#f5f5f5", color: d.isActive ? "#059669" : "#999" }}>
                      {d.isActive ? "فعال" : "غیرفعال"}
                    </button>
                  </div>
                </div>
              ))}
              {discounts.length === 0 && <div className="text-center py-16 bg-white rounded-2xl"><p className="text-gray-300 text-sm">کد تخفیفی ثبت نشده</p></div>}
            </div>
          </div>
        )}

        {/* Payouts */}
        {activeSection === "payouts" && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-black mb-5" style={{ color: secondary }}>ثبت واریز پورسانت</h2>
            <div className="bg-white rounded-2xl p-5 space-y-3">
              <select value={payoutForm.shopId} onChange={(e) => setPayoutForm({ ...payoutForm, shopId: parseInt(e.target.value) })} className={inputClass} style={{ "--tw-ring-color": primary } as any}>
                <option value={0}>انتخاب فروشگاه</option>
                {shops.map((s) => <option key={s.id} value={s.id}>{s.name} (مانده: {formatPrice((s.totalEarnings || 0) - (s.paidEarnings || 0))})</option>)}
              </select>
              <input type="number" placeholder="مبلغ (تومان)" value={payoutForm.amount || ""} onChange={(e) => setPayoutForm({ ...payoutForm, amount: parseInt(e.target.value) || 0 })} className={inputClass} style={{ "--tw-ring-color": primary } as any} />
              <input placeholder="توضیحات" value={payoutForm.description} onChange={(e) => setPayoutForm({ ...payoutForm, description: e.target.value })} className={inputClass} style={{ "--tw-ring-color": primary } as any} />
              <button onClick={processPayout} disabled={!payoutForm.shopId || !payoutForm.amount}
                className="w-full py-3 rounded-xl text-white text-sm font-bold disabled:opacity-40" style={{ background: primary }}>ثبت واریز</button>
            </div>
          </div>
        )}

        {/* Banners */}
        {activeSection === "banners" && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-black mb-5" style={{ color: secondary }}>مدیریت بنرها</h2>
            <div className="bg-white rounded-2xl p-5 mb-5 space-y-3">
              <p className="text-xs font-bold text-gray-400">افزودن بنر جدید</p>
              <select value={newBanner.type} onChange={(e) => setNewBanner({ ...newBanner, type: e.target.value })} className={inputClass} style={{ "--tw-ring-color": primary } as any}>
                <option value="slider">اسلایدر</option>
                <option value="bottom">بنر پایین</option>
              </select>
              <input placeholder="لینک تصویر" value={newBanner.image} onChange={(e) => setNewBanner({ ...newBanner, image: e.target.value })} className={inputClass} dir="ltr" style={{ "--tw-ring-color": primary } as any} />
              <input type="number" placeholder="ترتیب" value={newBanner.sortOrder} onChange={(e) => setNewBanner({ ...newBanner, sortOrder: parseInt(e.target.value) || 0 })} className={inputClass} style={{ "--tw-ring-color": primary } as any} />
              <button onClick={addBanner} className="w-full py-2.5 rounded-xl text-white text-xs font-bold" style={{ background: primary }}>افزودن</button>
            </div>
            {editBanner && (
              <div className="bg-white rounded-2xl p-5 mb-5 space-y-3">
                <p className="text-xs font-bold text-gray-400">ویرایش بنر</p>
                <input placeholder="لینک تصویر" value={editBanner.image || ""} onChange={(e) => setEditBanner({ ...editBanner, image: e.target.value })} className={inputClass} dir="ltr" />
                <input type="number" placeholder="ترتیب" value={editBanner.sortOrder || 0} onChange={(e) => setEditBanner({ ...editBanner, sortOrder: parseInt(e.target.value) || 0 })} className={inputClass} />
                <div className="flex gap-2">
                  <button onClick={saveBannerEdit} className="flex-1 py-2.5 rounded-xl text-white text-xs font-bold" style={{ background: primary }}>ذخیره تغییرات</button>
                  <button onClick={() => setEditBanner(null)} className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-500">انصراف</button>
                </div>
              </div>
            )}
            <p className="text-xs font-bold text-gray-400 mb-3">اسلایدر</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {sliderBanners.map((b) => (
                <div key={b.id} className="relative rounded-xl overflow-hidden group">
                  <img src={b.image} alt="" className="w-full h-28 object-cover" />
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => editExistingBanner("slider", b)} className="w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center backdrop-blur-sm">{SvgIcons.edit}</button>
                    <button onClick={() => deleteBanner("slider", b.id)} className="w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center backdrop-blur-sm">{SvgIcons.close}</button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs font-bold text-gray-400 mb-3">بنر پایین</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {bottomBanners.map((b) => (
                <div key={b.id} className="relative rounded-xl overflow-hidden group">
                  <img src={b.image} alt="" className="w-full h-28 object-cover" />
                  <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => editExistingBanner("bottom", b)} className="w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center backdrop-blur-sm">{SvgIcons.edit}</button>
                    <button onClick={() => deleteBanner("bottom", b.id)} className="w-7 h-7 rounded-lg bg-black/50 text-white flex items-center justify-center backdrop-blur-sm">{SvgIcons.close}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Customer Report */}
        {activeSection === "customer-report" && (
          <div className="animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <h2 className="text-lg font-black" style={{ color: secondary }}>گزارش مشتریان فروشگاه‌ها</h2>
                <p className="text-[11px] text-gray-400 mt-1">مشتریانی که از فروشگاه‌های انتخابی وارد شده‌اند یا از آن‌ها سفارش داشته‌اند.</p>
              </div>
              <button onClick={loadCustomerReport} disabled={reportLoading} className="px-4 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-50" style={{ background: primary }}>
                {reportLoading ? "در حال دریافت..." : "دریافت گزارش"}
              </button>
            </div>

            <div className="bg-white rounded-2xl p-5 mb-5">
              <p className="text-xs font-bold text-gray-400 mb-3">انتخاب فروشگاه‌ها</p>
              <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 text-xs font-bold cursor-pointer mb-2">
                <input type="checkbox" checked={reportShopIds === "all"} onChange={() => setReportShopIds("all")} />
                همه فروشگاه‌ها
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {shops.map((s) => {
                  const checked = reportShopIds !== "all" && reportShopIds.includes(s.id);
                  return (
                    <label key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 text-xs cursor-pointer hover:bg-gray-50">
                      <input type="checkbox" checked={checked} onChange={(e) => {
                        if (reportShopIds === "all") {
                          setReportShopIds(e.target.checked ? [s.id] : []);
                        } else if (e.target.checked) {
                          setReportShopIds(Array.from(new Set([...reportShopIds, s.id])));
                        } else {
                          setReportShopIds(reportShopIds.filter((id) => id !== s.id));
                        }
                      }} />
                      <span className="font-bold">{s.name}</span>
                    </label>
                  );
                })}
              </div>
              {reportShopIds !== "all" && reportShopIds.length === 0 && <p className="text-[11px] text-amber-600 mt-3">حداقل یک فروشگاه را انتخاب کنید یا «همه فروشگاه‌ها» را بزنید.</p>}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
              <StatCard title="تعداد مشتری" value={String(customerReport.length)} color={primary} />
              <StatCard title="تعداد سفارش" value={String(customerReport.reduce((n, c) => n + c.orderCount, 0))} color="#1976D2" />
              <StatCard title="مجموع خرید" value={formatPrice(customerReport.reduce((n, c) => n + c.orders.reduce((s, o) => s + o.totalAmount, 0), 0))} color="#4CAF50" />
            </div>

            <div className="space-y-3">
              {customerReport.map((customer) => {
                const open = !!reportExpanded[customer.id];
                return (
                  <div key={customer.id} className="bg-white rounded-2xl p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="font-black text-sm" style={{ color: secondary }}>{customer.name || "بدون نام"}</span>
                          <span className="text-[11px] font-bold bg-gray-50 px-2.5 py-1 rounded-lg" dir="ltr">{customer.phone}</span>
                          <span className="text-[10px] text-gray-400">{customer.orderCount} سفارش</span>
                        </div>
                        <p className="text-[11px] text-gray-500 mb-1">آدرس: {customer.address || "ثبت نشده"}</p>
                        <p className="text-[11px] text-gray-400">فروشگاه‌ها: {customer.shops.length ? customer.shops.join("، ") : "-"}</p>
                      </div>
                      <button onClick={() => setReportExpanded({ ...reportExpanded, [customer.id]: !open })} className="shrink-0 px-4 py-2 rounded-xl text-xs font-bold" style={{ background: `${primary}10`, color: primary }}>
                        {open ? "بستن جزئیات" : "مشاهده همه سفارش‌ها"}
                      </button>
                    </div>

                    {open && (
                      <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
                        {customer.orders.length === 0 ? (
                          <p className="text-xs text-gray-300 text-center py-5">برای این مشتری سفارشی ثبت نشده است.</p>
                        ) : customer.orders.map((o) => (
                          <div key={o.id} className="rounded-xl bg-gray-50 p-4 text-xs">
                            <div className="flex flex-wrap justify-between gap-2 mb-2">
                              <span className="font-black" style={{ color: secondary }}>سفارش #{o.id} — {o.shopName}</span>
                              <span className="font-black" style={{ color: primary }}>{formatPrice(o.totalAmount)}</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px] text-gray-500">
                              <div>نام: <b className="text-gray-700">{o.customerName}</b></div>
                              <div>شماره: <b className="text-gray-700" dir="ltr">{o.customerPhone}</b></div>
                              <div className="sm:col-span-2">آدرس: <b className="text-gray-700">{o.customerAddress}</b></div>
                              <div>پورسانت: <b className="text-gray-700">{formatPrice(o.commissionAmount)}</b></div>
                              <div>وضعیت: <b className="text-gray-700">{o.status}</b></div>
                              <div>ارسال: <b className="text-gray-700">{o.shippingMethod === "post" ? "پست" : o.shippingMethod}</b></div>
                              <div>تاریخ: <b className="text-gray-700">{o.createdAt ? new Date(o.createdAt).toLocaleString("fa-IR") : "-"}</b></div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-1">
                              {Array.isArray(o.items) && o.items.map((item:any, i:number) => (
                                <span key={i} className="bg-white border border-gray-100 rounded-md px-2 py-1 text-[10px] font-bold">{item.name} ×{item.quantity}</span>
                              ))}
                            </div>
                            {o.trackingLink && <a href={o.trackingLink} target="_blank" rel="noreferrer" className="inline-block mt-3 text-[10px] font-bold" style={{ color: primary }}>لینک پیگیری</a>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {customerReport.length === 0 && <div className="bg-white rounded-2xl text-center py-16 text-sm text-gray-300">گزارشی برای فروشگاه‌های انتخاب‌شده دریافت نشده است.</div>}
            </div>
          </div>
        )}

        {/* Support */}
        {activeSection === "support" && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-black mb-5" style={{ color: secondary }}>پشتیبانی</h2>
            <div className="space-y-3">
              {supportTickets.map((t:any)=><div key={t.id} className="bg-white rounded-2xl p-5">
                <div className="flex justify-between"><div><p className="font-black text-sm">{t.subject}</p><p className="text-[10px] text-gray-400 mt-1">تیکت #{t.id} {t.productId ? `| محصول ${t.productId}` : ""}</p></div><span className="text-[10px] text-amber-600">{t.status}</span></div>
                <div className="mt-3 space-y-2">{t.messages?.map((m:any)=><div key={m.id} className={`p-3 rounded-xl text-xs ${m.senderType==="admin"?"bg-[#FF174410]":"bg-gray-50"}`}><b>{m.senderType==="admin"?"مدیریت":"مشتری/فروشگاه"}:</b> {m.message}</div>)}</div>
                <div className="flex gap-2 mt-3"><input value={supportReply[t.id]||""} onChange={e=>setSupportReply({...supportReply,[t.id]:e.target.value})} className={inputClass} placeholder="پاسخ مدیریت..." /><button onClick={async()=>{const message=supportReply[t.id]?.trim();if(!message)return;await fetch("/api/support",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticketId:t.id,message})});setSupportReply({...supportReply,[t.id]:""});loadAll();}} className="px-5 rounded-xl text-white text-xs font-bold" style={{background:primary}}>پاسخ</button></div>
                <button onClick={async()=>{await fetch("/api/support",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({ticketId:t.id,status:"closed"})});loadAll();}} className="mt-2 text-[10px] text-gray-400">بستن تیکت</button>
              </div>)}
              {supportTickets.length===0 && <p className="text-center text-gray-300 py-16 text-sm">تیکتی ثبت نشده</p>}
            </div>
          </div>
        )}

        {/* Settings */}
        {activeSection === "settings" && (
          <div className="animate-fadeIn">
            <h2 className="text-lg font-black mb-5" style={{ color: secondary }}>تنظیمات</h2>
            <div className="bg-white rounded-2xl p-5 space-y-5">
              <div>
                <p className="text-xs font-bold text-gray-400 mb-3">رنگ‌های سایت</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {[
                    { key: "primary_color", label: "رنگ اصلی", def: "#FF1744" },
                    { key: "secondary_color", label: "رنگ ثانویه", def: "#37474F" },
                    { key: "accent_color", label: "رنگ تاکیدی", def: "#FF5252" },
                  ].map((c) => (
                    <div key={c.key}>
                      <label className="block text-[11px] font-bold mb-1.5 text-gray-500">{c.label}</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={settings[c.key] || c.def} onChange={(e) => setSettings({ ...settings, [c.key]: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0" />
                        <input type="text" value={settings[c.key] || c.def} onChange={(e) => setSettings({ ...settings, [c.key]: e.target.value })} className="flex-1 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 text-xs" dir="ltr" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-bold text-gray-400 mb-3">متن‌ها</p>
                <div>
                  <label className="block text-[11px] font-bold mb-1.5 text-gray-500">عنوان بخش پرفروش‌ترین‌ها</label>
                  <input type="text" value={settings.bestseller_title || ""} onChange={(e) => setSettings({ ...settings, bestseller_title: e.target.value })} className={inputClass} style={{ "--tw-ring-color": primary } as any} />
                </div>
              </div>
              <button onClick={saveSettings} className="w-full py-3 rounded-xl text-white text-sm font-bold" style={{ background: primary }}>ذخیره تنظیمات</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      </div>
      <p className="text-[10px] text-gray-400 font-bold">{title}</p>
      <p className="font-black text-sm mt-0.5" style={{ color }}>{value}</p>
    </div>
  );
}
