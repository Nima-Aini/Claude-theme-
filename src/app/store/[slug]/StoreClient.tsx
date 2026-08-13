"use client";

import { useState, useEffect, useRef } from "react";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  isBestseller: boolean;
  stock: number;
};

type CartItem = Product & { quantity: number };

type Shop = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  bannerImage: string | null;
};

type Banner = { id: number; image: string };
type PublicDiscount = { id: number; code: string; type: "percentage" | "amount"; value: number };

type Props = {
  shop: Shop;
  products: Product[];
  bestsellers: Product[];
  sliderBanners: Banner[];
  bottomBanners: Banner[];
  settings: Record<string, string>;
  bestsellerTitle: string;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("fa-IR").format(price) + " تومان";
}

const Icons = {
  store: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>,
  user: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>,
  orders: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>,
  more: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>,
  cart: <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" /></svg>,
  close: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>,
  plus: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  minus: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" /></svg>,
  trash: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>,
  chevronLeft: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>,
  chevronRight: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" /></svg>,
  check: <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>,
  link: <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>,
  copy: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" /></svg>,
  logout: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" /></svg>,
  tag: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" /></svg>,
  share: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" /></svg>,
};

export default function StoreClient({ shop, products, bestsellers, sliderBanners, bottomBanners, settings, bestsellerTitle }: Props) {
  const primary = settings.primary_color || "#FF1744";
  const secondary = settings.secondary_color || "#37474F";

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<"store" | "profile" | "orders" | "more">("store");
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [customer, setCustomer] = useState<{ id: number; name: string | null; phone: string; address: string | null } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", address: "", shipping: "post" });
  const [discountCode, setDiscountCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountMessage, setDiscountMessage] = useState("");
  const [publicDiscounts, setPublicDiscounts] = useState<PublicDiscount[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSent, setSupportSent] = useState(false);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  const bestsellerRef = useRef<HTMLDivElement>(null);

  // Check login status
  useEffect(() => {
    fetch("/api/customer/profile", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.id) {
          setIsLoggedIn(true);
          setCustomer(data);
          setCheckoutForm((f) => ({ ...f, name: data.name || "", address: data.address || "" }));
        }
      })
      .catch(() => {});
  }, []);

  // Public discount codes
  useEffect(() => {
    fetch("/api/discounts")
      .then((r) => r.json())
      .then((data) => setPublicDiscounts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Cart persistence
  useEffect(() => {
    const saved = localStorage.getItem(`cart_${shop.slug}`);
    if (saved) setCart(JSON.parse(saved));
  }, [shop.slug]);

  useEffect(() => {
    localStorage.setItem(`cart_${shop.slug}`, JSON.stringify(cart));
  }, [cart, shop.slug]);

  // Slider auto-play
  useEffect(() => {
    if (sliderBanners.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide((c) => (c + 1) % sliderBanners.length), 5000);
    return () => clearInterval(timer);
  }, [sliderBanners.length]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Send OTP
  const sendOTP = async () => {
    if (!phone || phone.length < 10) {
      setOtpError("شماره موبایل معتبر نیست");
      return;
    }
    setLoginLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setCountdown(120); // 2 minutes
      } else {
        setOtpError(data.error || "خطا در ارسال کد");
      }
    } catch {
      setOtpError("خطای ارتباط");
    } finally {
      setLoginLoading(false);
    }
  };

  // Verify OTP
  const verifyOTP = async () => {
    if (!otpCode || otpCode.length < 4) {
      setOtpError("کد تایید را وارد کنید");
      return;
    }
    setLoginLoading(true);
    setOtpError("");
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: otpCode }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setCustomer(data.customer);
        setCheckoutForm((f) => ({ ...f, name: data.customer.name || "", address: data.customer.address || "" }));
      } else {
        setOtpError(data.error || "کد نامعتبر است");
      }
    } catch {
      setOtpError("خطای ارتباط");
    } finally {
      setLoginLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) return prev.map((i) => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: number) => setCart((prev) => prev.filter((i) => i.id !== productId));

  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) { removeFromCart(productId); return; }
    setCart((prev) => prev.map((i) => (i.id === productId ? { ...i, quantity: qty } : i)));
  };

  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount = discountType === "percentage"
    ? Math.floor(cartTotal * discountValue / 100)
    : Math.min(discountValue, cartTotal);
  const discountedTotal = Math.max(0, cartTotal - discountAmount);

  const applyDiscount = async () => {
    if (!discountCode) return;
    const res = await fetch("/api/discounts/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: discountCode }),
      credentials: "include",
    });
    const data = await res.json();
    if (data.valid) {
      setDiscountType(data.type);
      setDiscountValue(data.value);
      setDiscountMessage(data.label);
    } else {
      setDiscountMessage("کد تخفیف نامعتبر است");
      setDiscountValue(0);
    }
  };

  const placeOrder = async () => {
    if (!checkoutForm.name || !checkoutForm.address || checkoutForm.postalCode.length !== 10) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: shop.id, customerName: checkoutForm.name, customerPhone: customer?.phone, customerAddress: checkoutForm.address, shippingMethod: checkoutForm.shipping, totalAmount: discountedTotal, items: cart.map((i) => ({ productId: i.id, name: i.name, price: i.price, quantity: i.quantity, image: i.image })) }),
        credentials: "include",
      });
      if (res.ok) { setCart([]); setShowCheckout(false); setShowCart(false); setOrderSuccess(true); setDiscountCode(""); setDiscountValue(0); setTimeout(() => setOrderSuccess(false), 5000); }
    } catch {} finally { setLoading(false); }
  };

  const loadSupport = async () => { const r=await fetch("/api/support",{credentials:"include"}); if(r.ok) setSupportTickets(await r.json()); };

  const loadOrders = async () => {
    const res = await fetch("/api/orders", { credentials: "include" });
    const data = await res.json();
    if (Array.isArray(data)) setOrders(data);
  };

  const updateProfile = async () => {
    setLoading(true);
    try { await fetch("/api/customer/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: checkoutForm.name, address: checkoutForm.address }), credentials: "include" }); } catch {} finally { setLoading(false); }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "customer" }), credentials: "include" });
    setIsLoggedIn(false);
    setCustomer(null);
    setOtpSent(false);
    setOtpCode("");
    setPhone("");
  };

  const scrollBestseller = (dir: "left" | "right") => {
    if (bestsellerRef.current) bestsellerRef.current.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
  };

  /* ── LOGIN SCREEN WITH OTP ── */
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-5" style={{ background: secondary }}>
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
        <div className="relative bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scaleIn">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-5 overflow-hidden shadow-lg ring-2 ring-gray-100">
              <img src={shop.image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop"} alt={shop.name} className="w-full h-full object-cover" />
            </div>
            <h1 className="text-xl font-black" style={{ color: secondary }}>{shop.name}</h1>
            <p className="text-gray-400 mt-2 text-xs">
              {otpSent ? "کد تایید ارسال شده را وارد کنید" : "شماره موبایل خود را وارد کنید"}
            </p>
          </div>

          {otpError && (
            <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs text-center mb-4 font-bold">{otpError}</div>
          )}

          {!otpSent ? (
            <div className="space-y-3">
              <input
                type="tel"
                placeholder="09123456789"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-100 text-center text-base tracking-[0.15em] focus:ring-2 transition-all"
                style={{ direction: "ltr", "--tw-ring-color": primary } as any}
              />
              <button
                onClick={sendOTP}
                disabled={loginLoading}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg disabled:opacity-50"
                style={{ background: primary }}
              >
                {loginLoading ? "در حال ارسال..." : "دریافت کد تایید"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{phone}</span>
                <button onClick={() => { setOtpSent(false); setOtpCode(""); }} className="text-xs font-bold" style={{ color: primary }}>
                  تغییر شماره
                </button>
              </div>
              <input
                type="text"
                placeholder="کد ۶ رقمی"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-100 text-center text-2xl tracking-[0.5em] font-bold focus:ring-2 transition-all"
                style={{ direction: "ltr", "--tw-ring-color": primary } as any}
                maxLength={6}
              />
              <button
                onClick={verifyOTP}
                disabled={loginLoading || otpCode.length < 4}
                className="w-full py-3.5 rounded-xl text-white font-bold text-sm transition-all hover:shadow-lg disabled:opacity-50"
                style={{ background: primary }}
              >
                {loginLoading ? "در حال بررسی..." : "تایید و ورود"}
              </button>
              <div className="text-center">
                {countdown > 0 ? (
                  <span className="text-xs text-gray-400">
                    ارسال مجدد تا {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                  </span>
                ) : (
                  <button onClick={sendOTP} className="text-xs font-bold" style={{ color: primary }}>
                    ارسال مجدد کد
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ── ORDER SUCCESS ── */
  if (orderSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center animate-fadeIn">
        <div className="text-center px-6">
          <div className="mx-auto mb-6" style={{ color: "#22c55e" }}>{Icons.check}</div>
          <h2 className="text-xl font-black mb-2" style={{ color: secondary }}>سفارش شما ثبت شد</h2>
          <p className="text-gray-400 text-sm mb-8">به زودی با شما تماس گرفته می‌شود</p>
          <button onClick={() => setOrderSuccess(false)} className="px-8 py-3 rounded-xl text-white font-bold text-sm" style={{ background: primary }}>
            بازگشت به فروشگاه
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-[72px]">
      {/* Cart FAB */}
      {cart.length > 0 && activeTab === "store" && !showCart && !showCheckout && (
        <button onClick={() => setShowCart(true)}
          className="fixed bottom-24 left-5 z-40 w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center text-white animate-scaleIn"
          style={{ background: primary, boxShadow: `0 8px 30px ${primary}40` }}>
          {Icons.cart}
          <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center text-white" style={{ background: secondary }}>
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </span>
        </button>
      )}

      {/* STORE TAB */}
      {activeTab === "store" && !showCart && !showCheckout && (
        <div className="animate-fadeIn">
          {/* Banner */}
          <div className="relative">
            <div className="w-full h-52 sm:h-64 overflow-hidden">
              <img src={shop.bannerImage || shop.image || "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=1200&h=400&fit=crop"} alt={shop.name} className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-[#FAFAFA] via-transparent to-transparent" />
            <div className="absolute bottom-5 right-0 left-0 text-center">
              <h1 className="text-3xl sm:text-4xl font-black text-3d">{shop.name}</h1>
            </div>
          </div>

          {/* Bestsellers */}
          {bestsellers.length > 0 && (
            <div className="px-4 pt-6 pb-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold tracking-wide mb-0.5" style={{ color: primary }}>BEST SELLERS</p>
                  <h2 className="text-base font-black" style={{ color: secondary }}>{bestsellerTitle}</h2>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => scrollBestseller("right")} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow" style={{ color: secondary }}>{Icons.chevronRight}</button>
                  <button onClick={() => scrollBestseller("left")} className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center hover:shadow-md transition-shadow" style={{ color: secondary }}>{Icons.chevronLeft}</button>
                </div>
              </div>
              <div ref={bestsellerRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {bestsellers.map((p) => (
                  <a href={`/store/${shop.slug}/product/${p.id}`} key={p.id} className="flex-shrink-0 w-40 bg-white rounded-2xl overflow-hidden shadow-sm card-hover block">
                    <div className="h-32 overflow-hidden"><img src={p.image || "https://via.placeholder.com/200"} alt={p.name} className="w-full h-full object-cover" /></div>
                    <div className="p-3">
                      <p className="font-bold text-xs truncate" style={{ color: secondary }}>{p.name}</p>
                      <p className="text-[11px] mt-1 font-bold" style={{ color: primary }}>{formatPrice(p.price)}</p>
                      <button onClick={(e) => { e.preventDefault(); addToCart(p); }} className="w-full mt-2 py-1.5 rounded-lg text-white text-[11px] font-bold transition-all hover:opacity-90" style={{ background: primary }}>افزودن به سبد</button>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Slider Banners */}
          {sliderBanners.length > 0 && (
            <div className="px-4 py-3">
              <div className="relative rounded-2xl overflow-hidden">
                <div className="relative h-36 sm:h-48">
                  {sliderBanners.map((b, i) => (<img key={b.id} src={b.image} alt="" className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${i === currentSlide ? "opacity-100" : "opacity-0"}`} />))}
                </div>
                {sliderBanners.length > 1 && (
                  <>
                    <button onClick={() => setCurrentSlide((c) => c === 0 ? sliderBanners.length - 1 : c - 1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/90 transition-colors" style={{ color: secondary }}>{Icons.chevronRight}</button>
                    <button onClick={() => setCurrentSlide((c) => (c + 1) % sliderBanners.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass flex items-center justify-center hover:bg-white/90 transition-colors" style={{ color: secondary }}>{Icons.chevronLeft}</button>
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {sliderBanners.map((_, i) => (<button key={i} onClick={() => setCurrentSlide(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === currentSlide ? "w-5 bg-white" : "w-1.5 bg-white/50"}`} />))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* All Products */}
          <div className="px-4 py-5">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-sm font-bold px-3" style={{ color: secondary }}>همه محصولات</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {products.map((p, idx) => (
                <div key={p.id} className="bg-white rounded-2xl overflow-hidden shadow-sm card-hover animate-slideUp" style={{ animationDelay: `${idx * 40}ms` }}>
                  <div className="aspect-square overflow-hidden relative">
                    <img src={p.image || "https://via.placeholder.com/200"} alt={p.name} className="w-full h-full object-cover" />
                    {p.isBestseller && (<span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] text-white font-bold" style={{ background: primary }}>پرفروش</span>)}
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-xs truncate" style={{ color: secondary }}>{p.name}</h3>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">{p.description}</p>
                    <p className="text-xs font-black mt-2" style={{ color: primary }}>{formatPrice(p.price)}</p>
                    <button onClick={() => addToCart(p)} className="w-full mt-2 py-2 rounded-xl text-white text-xs font-bold transition-all hover:opacity-90" style={{ background: primary }}>افزودن به سبد</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Banners */}
          {bottomBanners.length > 0 && (
            <div className="px-4 py-3 space-y-3">
              {bottomBanners.map((b) => (<div key={b.id} className="rounded-2xl overflow-hidden shadow-sm"><img src={b.image} alt="" className="w-full h-auto object-cover" /></div>))}
            </div>
          )}
        </div>
      )}

      {/* CART PANEL */}
      {showCart && !showCheckout && (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
            <h2 className="text-base font-black" style={{ color: secondary }}>سبد خرید</h2>
            <button onClick={() => setShowCart(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50">{Icons.close}</button>
          </div>
          {cart.length === 0 ? (
            <div className="text-center py-20"><div className="mx-auto mb-3 text-gray-200">{Icons.cart}</div><p className="text-gray-400 text-sm">سبد خرید خالی است</p></div>
          ) : (
            <div className="p-4">
              <div className="space-y-2.5">
                {cart.map((item) => (
                  <div key={item.id} className="bg-white rounded-2xl p-3 flex gap-3">
                    <img src={item.image || "https://via.placeholder.com/80"} alt={item.name} className="w-16 h-16 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-xs truncate" style={{ color: secondary }}>{item.name}</h4>
                      <p className="text-xs mt-0.5 font-bold" style={{ color: primary }}>{formatPrice(item.price)}</p>
                      <div className="flex items-center gap-2.5 mt-2">
                        <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50">{Icons.minus}</button>
                        <span className="text-sm font-bold w-5 text-center" style={{ color: secondary }}>{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg flex items-center justify-center text-white" style={{ background: primary }}>{Icons.plus}</button>
                        <button onClick={() => removeFromCart(item.id)} className="mr-auto text-gray-300 hover:text-red-400 transition-colors">{Icons.trash}</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-5 rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}>
                <div className="flex justify-between text-sm mb-2"><span className="text-white/70">جمع کل</span><span className="font-bold">{formatPrice(cartTotal)}</span></div>
                {discountValue > 0 && (<div className="flex justify-between text-sm mb-2"><span className="text-yellow-300/80">{discountType === "percentage" ? `تخفیف ${discountValue}%` : "تخفیف مبلغی"}</span><span className="font-bold text-yellow-300">-{formatPrice(discountAmount)}</span></div>)}
                <div className="flex gap-2 mt-3 mb-3">
                  <input type="text" placeholder="کد تخفیف" value={discountCode} onChange={(e) => setDiscountCode(e.target.value)} className="flex-1 px-3 py-2 rounded-lg text-gray-900 text-xs bg-white/90" />
                  <button onClick={applyDiscount} className="px-4 py-2 rounded-lg text-xs font-bold" style={{ background: "rgba(255,255,255,0.2)", color: "white" }}>اعمال</button>
                </div>
                {discountMessage && <p className="text-[11px] text-center mb-2 text-white/80">{discountMessage}</p>}
                <div className="border-t border-white/20 pt-3 mt-1 flex justify-between"><span className="font-bold text-sm">مبلغ نهایی</span><span className="font-black">{formatPrice(discountedTotal)}</span></div>
                <button onClick={() => setShowCheckout(true)} className="w-full mt-4 py-3 rounded-xl bg-white font-bold text-sm" style={{ color: primary }}>تکمیل خرید</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* CHECKOUT */}
      {showCheckout && (
        <div className="animate-fadeIn">
          <div className="flex items-center justify-between px-5 py-4 bg-white border-b border-gray-100">
            <h2 className="text-base font-black" style={{ color: secondary }}>تکمیل سفارش</h2>
            <button onClick={() => setShowCheckout(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-50">{Icons.close}</button>
          </div>
          <div className="p-4 space-y-3">
            <div className="bg-white rounded-2xl p-5 space-y-4">
              <div><label className="block text-[11px] font-bold mb-1.5 text-gray-500">نام و نام خانوادگی</label><input type="text" value={checkoutForm.name} onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })} placeholder="نام و نام خانوادگی" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 transition-all" style={{ "--tw-ring-color": primary } as any} /></div>
              <div><label className="block text-[11px] font-bold mb-1.5 text-gray-500">آدرس کامل</label><textarea value={checkoutForm.address} onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })} placeholder="شهر، خیابان، پلاک" rows={3} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm resize-none focus:ring-2 transition-all" style={{ "--tw-ring-color": primary } as any} /></div>
              <div><label className="block text-[11px] font-bold mb-1.5 text-gray-500">کدپستی ۱۰ رقمی</label><input inputMode="numeric" maxLength={10} value={checkoutForm.postalCode} onChange={(e) => setCheckoutForm({ ...checkoutForm, postalCode: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="۱۰ رقم کدپستی" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm" dir="ltr" /></div>
              <div><label className="block text-[11px] font-bold mb-1.5 text-gray-500">نحوه ارسال</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[{ key: "post", label: "پست پیشتاز" }, { key: "tipax", label: "تیپاکس" }].map((s) => (
                    <button key={s.key} onClick={() => setCheckoutForm({ ...checkoutForm, shipping: s.key })} className="py-3 rounded-xl border-2 text-sm font-bold transition-all" style={{ borderColor: checkoutForm.shipping === s.key ? primary : "#f3f4f6", background: checkoutForm.shipping === s.key ? primary : "white", color: checkoutForm.shipping === s.key ? "white" : secondary }}>{s.label}</button>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-2xl p-5 text-white" style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}>
              <p className="text-xs font-bold text-white/60 mb-3">خلاصه سفارش</p>
              {cart.map((item) => (<div key={item.id} className="flex justify-between text-xs mb-1"><span className="text-white/80">{item.name} × {item.quantity}</span><span>{formatPrice(item.price * item.quantity)}</span></div>))}
              <div className="border-t border-white/20 mt-3 pt-3 flex justify-between"><span className="font-bold text-sm">مبلغ نهایی</span><span className="font-black">{formatPrice(discountedTotal)}</span></div>
              <button onClick={placeOrder} disabled={loading || !checkoutForm.name || !checkoutForm.address || checkoutForm.postalCode.length !== 10} className="w-full mt-4 py-3 rounded-xl bg-white font-bold text-sm disabled:opacity-50" style={{ color: primary }}>{loading ? "در حال ثبت..." : "ثبت سفارش"}</button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="animate-fadeIn p-4">
          <h2 className="text-base font-black mb-6" style={{ color: secondary }}>پروفایل</h2>
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <div><label className="block text-[11px] font-bold mb-1.5 text-gray-400">شماره موبایل</label><input type="text" value={customer?.phone || ""} disabled className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm text-gray-400" style={{ direction: "ltr" }} /></div>
            <div><label className="block text-[11px] font-bold mb-1.5 text-gray-400">نام</label><input type="text" value={checkoutForm.name} onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })} placeholder="نام و نام خانوادگی" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 transition-all" style={{ "--tw-ring-color": primary } as any} /></div>
            <div><label className="block text-[11px] font-bold mb-1.5 text-gray-400">کدپستی</label><input inputMode="numeric" maxLength={10} value={checkoutForm.postalCode} onChange={(e) => setCheckoutForm({ ...checkoutForm, postalCode: e.target.value.replace(/\D/g, "").slice(0, 10) })} placeholder="۱۰ رقم کدپستی" className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm" dir="ltr" /></div>
            <div><label className="block text-[11px] font-bold mb-1.5 text-gray-400">آدرس</label><textarea value={checkoutForm.address} onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })} placeholder="آدرس خود را وارد کنید" rows={3} className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-sm resize-none focus:ring-2 transition-all" style={{ "--tw-ring-color": primary } as any} /></div>
            <button onClick={updateProfile} disabled={loading} className="w-full py-3 rounded-xl text-white font-bold text-sm" style={{ background: primary }}>{loading ? "در حال ذخیره..." : "ذخیره تغییرات"}</button>
            <button onClick={logout} className="w-full py-3 rounded-xl border border-gray-200 text-gray-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">{Icons.logout}<span>خروج از حساب</span></button>
          </div>
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && <OrdersTab orders={orders} loadOrders={loadOrders} primary={primary} secondary={secondary} />}

      {/* MORE TAB */}
      {activeTab === "more" && (
        <div className="animate-fadeIn p-4">
          <h2 className="text-base font-black mb-5" style={{ color: secondary }}>بیشتر</h2>
          <div className="space-y-2.5">
            <div className="bg-white rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${primary}10`, color: primary }}>{Icons.tag}</div><h3 className="font-bold text-sm" style={{ color: secondary }}>کدهای تخفیف</h3></div>
              {publicDiscounts.length > 0 ? (
                <div className="space-y-2">
                  {publicDiscounts.map((d) => (
                    <button key={d.id} onClick={() => { setDiscountCode(d.code); setShowCart(true); setActiveTab("store"); }}
                      className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-dashed text-right transition-colors hover:bg-gray-50"
                      style={{ borderColor: `${primary}40` }}>
                      <span className="font-black text-sm" dir="ltr" style={{ color: primary }}>{d.code}</span>
                      <span className="text-[11px] font-bold text-gray-500">{d.type === "percentage" ? `${d.value}% تخفیف` : `${formatPrice(d.value)} تخفیف`}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-xs leading-relaxed">در حال حاضر کد تخفیف عمومی وجود ندارد.</p>
              )}
            </div>
            <div className="bg-white rounded-2xl p-5">
              <h3 className="font-bold text-sm" style={{ color: secondary }}>پشتیبانی</h3>
              <textarea value={supportMessage} onChange={e=>setSupportMessage(e.target.value)} rows={3} placeholder="پیام شما..." className="w-full mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm" />
              <button onClick={async()=>{ if(!supportMessage.trim()) return; const r=await fetch("/api/support",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({subject:`پشتیبانی فروشگاه ${shop.name}`,message:supportMessage}),credentials:"include"}); if(r.ok){setSupportMessage("");setSupportSent(true)} else alert("ابتدا وارد حساب مشتری شوید."); }} className="w-full mt-2 py-3 rounded-xl bg-[#FF1744] text-white text-sm font-bold">ارسال پیام</button>
              {supportSent && <p className="text-xs text-green-600 mt-2">پیام ارسال شد.</p>}
              <button onClick={loadSupport} className="text-xs text-gray-400 mt-3">نمایش پاسخ‌های پشتیبانی</button>
              {supportTickets.map((t:any)=><div key={t.id} className="mt-3 space-y-1">{t.messages?.map((m:any)=><div key={m.id} className="p-2 rounded-lg bg-gray-50 text-xs">{m.message}</div>)}</div>)}
            </div>
            <div className="bg-white rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${primary}10`, color: primary }}>{Icons.share}</div><h3 className="font-bold text-sm" style={{ color: secondary }}>اشتراک‌گذاری</h3></div>
              <p className="text-gray-400 text-xs leading-relaxed mb-3">لینک فروشگاه را با دیگران به اشتراک بگذارید</p>
              <button onClick={() => { navigator.clipboard?.writeText(window.location.href); alert("لینک کپی شد"); }} className="w-full py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all" style={{ background: `${primary}08`, color: primary }}>{Icons.copy}<span>کپی لینک فروشگاه</span></button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM NAV */}
      <div className="fixed bottom-0 right-0 left-0 bg-white/80 backdrop-blur-xl border-t border-gray-100 z-30">
        <div className="flex justify-around items-center py-1.5 pb-safe max-w-lg mx-auto">
          {([
            { key: "store" as const, icon: Icons.store, label: "فروشگاه" },
            { key: "profile" as const, icon: Icons.user, label: "پروفایل" },
            { key: "orders" as const, icon: Icons.orders, label: "سفارش‌ها" },
            { key: "more" as const, icon: Icons.more, label: "بیشتر" },
          ]).map((tab) => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setShowCart(false); setShowCheckout(false); if (tab.key === "orders") loadOrders(); if (tab.key === "more") loadSupport(); }} className="flex flex-col items-center py-1.5 px-4 rounded-xl transition-all duration-200 relative" style={{ color: activeTab === tab.key ? primary : "#c0c0c0" }}>
              {activeTab === tab.key && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background: primary }} />}
              <span className="transition-transform duration-200" style={{ transform: activeTab === tab.key ? "scale(1.1)" : "scale(1)" }}>{tab.icon}</span>
              <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersTab({ orders, loadOrders, primary, secondary }: { orders: any[]; loadOrders: () => void; primary: string; secondary: string }) {
  useEffect(() => { loadOrders(); }, []);
  const statusLabels: Record<string, { label: string; color: string }> = { pending: { label: "در انتظار", color: "#FFA000" }, processing: { label: "پردازش", color: "#1976D2" }, shipped: { label: "ارسال شده", color: "#4CAF50" }, delivered: { label: "تحویل شده", color: "#2E7D32" } };
  return (
    <div className="animate-fadeIn p-4">
      <h2 className="text-base font-black mb-5" style={{ color: secondary }}>سفارش‌ها</h2>
      {orders.length === 0 ? (<div className="text-center py-16"><div className="mx-auto mb-3 text-gray-200">{Icons.orders}</div><p className="text-gray-400 text-sm">سفارشی ثبت نشده</p></div>) : (
        <div className="space-y-2.5">
          {orders.map((order) => {
            const status = statusLabels[order.status] || statusLabels.pending;
            const items = order.items as any[];
            return (
              <div key={order.id} className="bg-white rounded-2xl p-4">
                <div className="flex justify-between items-center mb-3"><span className="text-xs font-bold text-gray-400">#{order.id}</span><span className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white" style={{ background: status.color }}>{status.label}</span></div>
                <div className="flex gap-1.5 mb-2">{items?.slice(0, 4).map((item: any, i: number) => (<img key={i} src={item.image || "https://via.placeholder.com/40"} alt="" className="w-10 h-10 rounded-lg object-cover" />))}{items && items.length > 4 && (<div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-bold text-gray-400">+{items.length - 4}</div>)}</div>
                <div className="flex justify-between text-xs"><span className="text-gray-400">{order.shippingMethod === "post" ? "پست پیشتاز" : "تیپاکس"}</span><span className="font-bold" style={{ color: primary }}>{formatPrice(order.totalAmount)}</span></div>
                {order.trackingLink && (<a href={order.trackingLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 mt-2 text-xs text-blue-500">{Icons.link}<span>پیگیری مرسوله</span></a>)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
