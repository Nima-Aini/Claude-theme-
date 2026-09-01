"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  isBestseller: boolean;
  stock: number;
};

type Shop = {
  id: number;
  name: string;
  slug: string;
  image: string | null;
  bannerImage: string | null;
  phone?: string | null;
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

export default function StoreClient({
  shop,
  products,
  bestsellers,
  sliderBanners,
  bottomBanners,
  settings,
  bestsellerTitle,
}: Props) {
  const primary = settings.primary_color || "#FF1744";
  const secondary = settings.secondary_color || "#37474F";

  const { cart, addItem, setItemQuantity, removeItem, clear, totalCount, totalAmount } = useCart(shop.slug);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [activeTab, setActiveTab] = useState<"store" | "profile" | "orders" | "more">("store");
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [customer, setCustomer] = useState<{ id: number; name: string | null; phone: string; address: string | null; postalCode?: string | null } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [checkoutForm, setCheckoutForm] = useState({ name: "", address: "", postalCode: "", shipping: "post" });
  const [discountCode, setDiscountCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountMessage, setDiscountMessage] = useState("");
  const [publicDiscounts, setPublicDiscounts] = useState<PublicDiscount[]>([]);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toastMessage, setToastMessage] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSent, setSupportSent] = useState(false);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  const bestsellerRef = useRef<HTMLDivElement>(null);
  const [, startTransition] = useTransition();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Check login status
  useEffect(() => {
    fetch("/api/customer/profile", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.id) {
          setIsLoggedIn(true);
          setCustomer(data);
          setCheckoutForm((f) => ({
            ...f,
            name: data.name || "",
            address: data.address || "",
            postalCode: data.postalCode || data.postal_code || "",
          }));
        }
      })
      .catch(() => {});
  }, []);

  // Public discount codes
  useEffect(() => {
    fetch(`/api/discounts?t=${Date.now()}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPublicDiscounts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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
        setCountdown(120);
      } else {
        setOtpError(data.error || "خطا در ارسال کد");
      }
    } catch {
      setOtpError("خطای ارتباط با سرور");
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
        body: JSON.stringify({ phone, code: otpCode, shopId: shop.id }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        setIsLoggedIn(true);
        setCustomer(data.customer);
        setCheckoutForm((f) => ({
          ...f,
          name: data.customer.name || "",
          address: data.customer.address || "",
          postalCode: data.customer.postalCode || data.customer.postal_code || "",
        }));
        setShowLoginModal(false);
        showToast("ورود با موفقیت انجام شد");
      } else {
        setOtpError(data.error || "کد نامعتبر است");
      }
    } catch {
      setOtpError("خطای ارتباط با سرور");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem(product, 1);
    showToast(`✓ «${product.name}» به سبد خرید اضافه شد.`);
  };

  const discountAmount =
    discountType === "percentage"
      ? Math.floor((totalAmount * discountValue) / 100)
      : Math.min(discountValue, totalAmount);
  const discountedTotal = Math.max(0, totalAmount - discountAmount);

  const applyDiscount = async () => {
    if (!discountCode.trim()) return;
    try {
      const res = await fetch("/api/discounts/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: discountCode.trim() }),
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
    } catch {
      setDiscountMessage("خطا در بررسی کد تخفیف");
    }
  };

  const placeOrder = async () => {
    if (!checkoutForm.name || !checkoutForm.address || checkoutForm.postalCode.length !== 10) return;
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId: shop.id,
          customerName: checkoutForm.name,
          customerPhone: customer?.phone || phone,
          customerAddress: checkoutForm.address,
          customerPostalCode: checkoutForm.postalCode,
          shippingMethod: checkoutForm.shipping,
          totalAmount: discountedTotal,
          items: cart.map((i) => ({
            productId: i.id,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
        }),
        credentials: "include",
      });
      if (res.ok) {
        clear();
        setShowCheckout(false);
        setShowCartDrawer(false);
        setOrderSuccess(true);
        setDiscountCode("");
        setDiscountValue(0);
      } else {
        const err = await res.json();
        alert(err.error || "خطا در ثبت سفارش");
      }
    } catch {
      alert("خطای ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const loadSupport = async () => {
    const r = await fetch("/api/support", { credentials: "include" });
    if (r.ok) setSupportTickets(await r.json());
  };

  const loadOrders = async () => {
    const res = await fetch("/api/orders", { credentials: "include" });
    const data = await res.json();
    if (Array.isArray(data)) setOrders(data);
  };

  const updateProfile = async () => {
    setLoading(true);
    try {
      await fetch("/api/customer/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: checkoutForm.name,
          address: checkoutForm.address,
          postalCode: checkoutForm.postalCode,
        }),
        credentials: "include",
      });
      showToast("اطلاعات کاربری ذخیره شد");
    } catch {
      alert("خطا در ذخیره اطلاعات");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "customer" }),
      credentials: "include",
    });
    setIsLoggedIn(false);
    setCustomer(null);
    setOtpSent(false);
    setOtpCode("");
    setPhone("");
    showToast("از حساب خارج شدید");
  };

  const scrollBestseller = (dir: "left" | "right") => {
    if (bestsellerRef.current) {
      bestsellerRef.current.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
    }
  };

  /* ── ORDER SUCCESS SCREEN ── */
  if (orderSuccess) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex items-center justify-center animate-fadeIn p-6" dir="rtl">
        <div className="text-center max-w-sm w-full">
          <div className="mx-auto mb-6 text-emerald-500">{Icons.check}</div>
          <h2 className="text-2xl font-black mb-2" style={{ color: secondary }}>
            سفارش شما با موفقیت ثبت شد
          </h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            کد رهگیری و جزئیات سفارش برای شما پیامک خواهد شد. با تشکر از خرید شما از {shop.name}.
          </p>
          <button
            onClick={() => {
              setOrderSuccess(false);
              setActiveTab("orders");
              loadOrders();
            }}
            className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-lg active:scale-95 transition-all"
            style={{ background: primary }}
          >
            مشاهده سفارش در پنل
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-24 font-sans antialiased select-none" dir="rtl">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-white/10 animate-slideDown">
          {toastMessage}
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {shop.image ? (
              <img src={shop.image} alt={shop.name} className="w-10 h-10 rounded-xl object-cover shadow-sm border border-slate-100" />
            ) : (
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm text-white shadow-sm" style={{ background: primary }}>
                {shop.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="font-black text-sm text-slate-900 leading-tight">{shop.name}</h1>
              <p className="text-[10px] text-slate-400 font-medium">فروشگاه آنلاین رسمی</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cart Button */}
            <button
              onClick={() => setShowCartDrawer(true)}
              className="relative p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all"
              title="سبد خرید"
            >
              {Icons.cart}
              {totalCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-white text-[11px] font-black flex items-center justify-center shadow-md animate-scaleIn"
                  style={{ background: primary }}
                >
                  {totalCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN TAB CONTENT */}
      {activeTab === "store" && (
        <main className="max-w-xl mx-auto space-y-6 pb-6 animate-fadeIn">
          {/* SLIDER BANNERS */}
          {sliderBanners.length > 0 && (
            <div className="relative mx-4 mt-4 overflow-hidden rounded-3xl shadow-sm aspect-[16/9] bg-slate-200">
              <div
                className="flex h-full transition-transform duration-500 ease-out"
                style={{ transform: `translateX(${currentSlide * 100}%)` }}
              >
                {sliderBanners.map((banner, i) => (
                  <img
                    key={banner.id || i}
                    src={banner.image}
                    alt=""
                    className="w-full h-full object-cover shrink-0"
                  />
                ))}
              </div>
              {sliderBanners.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/20 backdrop-blur-md px-3 py-1 rounded-full">
                  {sliderBanners.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        currentSlide === i ? "w-5 bg-white" : "w-1.5 bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* BESTSELLERS CAROUSEL */}
          {bestsellers.length > 0 && (
            <div className="px-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-black text-slate-800">{bestsellerTitle}</h2>
                <div className="flex gap-1">
                  <button
                    onClick={() => scrollBestseller("right")}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    {Icons.chevronRight}
                  </button>
                  <button
                    onClick={() => scrollBestseller("left")}
                    className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  >
                    {Icons.chevronLeft}
                  </button>
                </div>
              </div>

              <div
                ref={bestsellerRef}
                className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth"
              >
                {bestsellers.map((product) => (
                  <div
                    key={product.id}
                    className="w-44 shrink-0 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between"
                  >
                    <Link
                      href={`/store/${shop.slug}/product/${product.id}`}
                      className="block group"
                    >
                      <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-slate-100">
                        <img
                          src={product.image || "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop"}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <span
                          className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[9px] font-black text-white shadow-sm"
                          style={{ background: primary }}
                        >
                          ویژه
                        </span>
                      </div>
                      <h3 className="font-bold text-xs text-slate-800 line-clamp-2 h-8 leading-4 mb-1">
                        {product.name}
                      </h3>
                      <p className="font-black text-xs" style={{ color: primary }}>
                        {formatPrice(product.price)}
                      </p>
                    </Link>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full mt-2.5 py-2 rounded-xl text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                      style={{ background: primary }}
                    >
                      افزودن به سبد
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ALL PRODUCTS GRID */}
          <div className="px-4">
            <h2 className="text-base font-black text-slate-800 mb-3.5">همه محصولات</h2>
            <div className="grid grid-cols-2 gap-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl p-3 border border-slate-100 shadow-sm flex flex-col justify-between"
                >
                  <Link
                    href={`/store/${shop.slug}/product/${product.id}`}
                    className="block group"
                  >
                    <div className="aspect-square rounded-xl overflow-hidden mb-2.5 bg-slate-100">
                      <img
                        src={product.image || "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop"}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h3 className="font-bold text-xs text-slate-800 line-clamp-2 h-8 leading-4 mb-1">
                      {product.name}
                    </h3>
                    <p className="font-black text-xs" style={{ color: primary }}>
                      {formatPrice(product.price)}
                    </p>
                  </Link>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="w-full mt-2.5 py-2 rounded-xl text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                    style={{ background: primary }}
                  >
                    افزودن به سبد
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* BOTTOM BANNERS */}
          {bottomBanners.length > 0 && (
            <div className="px-4 space-y-3">
              {bottomBanners.map((banner, i) => (
                <div key={banner.id || i} className="rounded-3xl overflow-hidden shadow-sm">
                  <img src={banner.image} alt="" className="w-full h-auto object-cover" />
                </div>
              ))}
            </div>
          )}
        </main>
      )}

      {/* PROFILE TAB */}
      {activeTab === "profile" && (
        <div className="max-w-xl mx-auto p-4 animate-fadeIn">
          <h2 className="text-lg font-black mb-4" style={{ color: secondary }}>
            حساب کاربری
          </h2>
          {!isLoggedIn ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                {Icons.user}
              </div>
              <h3 className="font-black text-base mb-2 text-slate-800">ورود به حساب مشتری</h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                برای ثبت آسان سفارش‌ها و رهگیری مرسوله‌ها شماره همراه خود را وارد کنید.
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 transition-all"
                style={{ background: primary }}
              >
                ورود / ثبت نام با شماره همراه
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-5 space-y-4 shadow-sm border border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1.5">شماره همراه</label>
                <input
                  type="text"
                  value={customer?.phone || ""}
                  disabled
                  className="w-full px-4 py-3 rounded-xl bg-slate-100 border border-slate-200 text-sm text-slate-500 font-mono"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">نام و نام خانوادگی</label>
                <input
                  type="text"
                  value={checkoutForm.name}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                  placeholder="نام و نام خانوادگی"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">کدپستی ۱۰ رقمی</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={10}
                  value={checkoutForm.postalCode}
                  onChange={(e) =>
                    setCheckoutForm({
                      ...checkoutForm,
                      postalCode: e.target.value.replace(/\D/g, "").slice(0, 10),
                    })
                  }
                  placeholder="۱۰ رقم بدون خط تیره"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono text-left"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">آدرس کامل پستی</label>
                <textarea
                  rows={3}
                  value={checkoutForm.address}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                  placeholder="استان، شهر، خیابان، پلاک، واحد"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all resize-none"
                />
              </div>
              <button
                onClick={updateProfile}
                disabled={loading}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 transition-all"
                style={{ background: primary }}
              >
                {loading ? "در حال ذخیره..." : "ذخیره تغییرات"}
              </button>
              <button
                onClick={logout}
                className="w-full py-3 rounded-2xl border border-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                {Icons.logout}
                <span>خروج از حساب</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {activeTab === "orders" && (
        <div className="max-w-xl mx-auto p-4 animate-fadeIn">
          <h2 className="text-lg font-black mb-4" style={{ color: secondary }}>
            سفارش‌های من
          </h2>
          {!isLoggedIn ? (
            <div className="bg-white rounded-3xl p-8 text-center shadow-sm border border-slate-100">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                {Icons.orders}
              </div>
              <h3 className="font-black text-base mb-2 text-slate-800">مشاهده و پیگیری سفارش‌ها</h3>
              <p className="text-xs text-slate-500 mb-6">
                برای مشاهده سوابق خرید و وضعیت ارسال سفارش‌ها وارد حساب شوید.
              </p>
              <button
                onClick={() => setShowLoginModal(true)}
                className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 transition-all"
                style={{ background: primary }}
              >
                ورود با شماره همراه
              </button>
            </div>
          ) : (
            <OrdersTab orders={orders} loadOrders={loadOrders} primary={primary} secondary={secondary} />
          )}
        </div>
      )}

      {/* MORE TAB */}
      {activeTab === "more" && (
        <div className="max-w-xl mx-auto p-4 space-y-4 animate-fadeIn">
          <h2 className="text-lg font-black mb-4" style={{ color: secondary }}>
            بیشتر
          </h2>
          {/* Discounts card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${primary}15`, color: primary }}>
                {Icons.tag}
              </div>
              <h3 className="font-black text-sm text-slate-800">تخفیف‌های شگفت‌انگیز</h3>
            </div>
            {publicDiscounts.length > 0 ? (
              <div className="space-y-2">
                {publicDiscounts.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => {
                      setDiscountCode(d.code);
                      setShowCartDrawer(true);
                    }}
                    className="w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-dashed transition-all hover:bg-slate-50 text-right"
                    style={{ borderColor: `${primary}30` }}
                  >
                    <span className="font-mono font-black text-sm" dir="ltr" style={{ color: primary }}>
                      {d.code}
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {d.type === "percentage" ? `${d.value}% تخفیف` : `${formatPrice(d.value)} تخفیف`}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">کد تخفیف عمومی فعالی در حال حاضر وجود ندارد.</p>
            )}
          </div>

          {/* Support card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-black text-sm text-slate-800 mb-2">ارتباط با پشتیبانی</h3>
            <p className="text-xs text-slate-500 mb-3">
              سوال یا مشکلی در سفارش خود دارید؟ پیام خود را برای ما ارسال کنید.
            </p>
            <textarea
              rows={3}
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              placeholder="متن پیام شما..."
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-sm focus:bg-white focus:ring-2 focus:ring-rose-500 transition-all resize-none"
            />
            <button
              onClick={async () => {
                if (!supportMessage.trim()) return;
                const r = await fetch("/api/support", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ subject: `پشتیبانی فروشگاه ${shop.name}`, message: supportMessage }),
                  credentials: "include",
                });
                if (r.ok) {
                  setSupportMessage("");
                  setSupportSent(true);
                  showToast("پیام شما ارسال شد");
                } else {
                  setShowLoginModal(true);
                }
              }}
              className="w-full mt-3 py-3 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 transition-all"
              style={{ background: primary }}
            >
              ارسال پیام
            </button>
            {supportSent && <p className="text-xs text-emerald-600 font-bold mt-2 text-center">پیام با موفقیت ارسال شد.</p>}
          </div>

          {/* Share card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${primary}15`, color: primary }}>
                {Icons.share}
              </div>
              <h3 className="font-black text-sm text-slate-800">اشتراک‌گذاری فروشگاه</h3>
            </div>
            <p className="text-xs text-slate-500 mb-4">
              لینک اختصاصی این فروشگاه را با دوستان خود به اشتراک بگذارید.
            </p>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                showToast("لینک فروشگاه کپی شد");
              }}
              className="w-full py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-50 transition-all"
              style={{ color: primary }}
            >
              {Icons.copy}
              <span>کپی لینک صفحه فروشگاه</span>
            </button>
          </div>
        </div>
      )}

      {/* FAST SLIDE-OVER CART DRAWER */}
      {showCartDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end animate-fadeIn">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => {
              setShowCartDrawer(false);
              setShowCheckout(false);
            }}
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slideLeft">
            {/* Drawer Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ color: primary }}>{Icons.cart}</span>
                <h3 className="font-black text-base text-slate-800">
                  {showCheckout ? "تکمیل و نهایی‌سازی خرید" : `سبد خرید (${totalCount})`}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCartDrawer(false);
                  setShowCheckout(false);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition-all"
              >
                {Icons.close}
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!showCheckout ? (
                cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
                      {Icons.cart}
                    </div>
                    <p className="text-sm font-bold">سبد خرید شما خالی است</p>
                    <p className="text-xs text-slate-400 mt-1">محصولات مورد نظرتان را به سبد خرید اضافه کنید.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.id}
                        className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex gap-3 items-center"
                      >
                        <img
                          src={item.image || "https://via.placeholder.com/80"}
                          alt={item.name}
                          className="w-16 h-16 rounded-xl object-cover bg-white shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-slate-800 truncate">{item.name}</h4>
                          <p className="text-xs font-black mt-1" style={{ color: primary }}>
                            {formatPrice(item.price)}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => setItemQuantity(item.id, item.quantity - 1)}
                              className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                            >
                              {item.quantity === 1 ? Icons.trash : Icons.minus}
                            </button>
                            <span className="font-bold text-xs w-6 text-center text-slate-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => setItemQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 rounded-lg text-white flex items-center justify-center active:scale-95 transition-all"
                              style={{ background: primary }}
                            >
                              {Icons.plus}
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Discount Box */}
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/60 mt-4 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          placeholder="کد تخفیف (مثال: AKMA10)"
                          className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono"
                          dir="ltr"
                        />
                        <button
                          onClick={applyDiscount}
                          className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm active:scale-95 transition-all"
                          style={{ background: primary }}
                        >
                          اعمال
                        </button>
                      </div>
                      {discountMessage && (
                        <p className="text-[11px] font-bold text-center text-rose-600">{discountMessage}</p>
                      )}
                    </div>
                  </div>
                )
              ) : (
                /* CHECKOUT FORM IN DRAWER */
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">نام و نام خانوادگی تحویل گیرنده</label>
                      <input
                        type="text"
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        placeholder="نام و نام خانوادگی"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">کدپستی ۱۰ رقمی</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        maxLength={10}
                        value={checkoutForm.postalCode}
                        onChange={(e) =>
                          setCheckoutForm({
                            ...checkoutForm,
                            postalCode: e.target.value.replace(/\D/g, "").slice(0, 10),
                          })
                        }
                        placeholder="۱۰ رقم بدون فاصله"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs font-mono text-left"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">آدرس دقیق پستی</label>
                      <textarea
                        rows={3}
                        value={checkoutForm.address}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                        placeholder="استان، شهر، خیابان، پلاک، واحد"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">نحوه ارسال</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { key: "post", label: "پست پیشتاز" },
                          { key: "tipax", label: "تیپاکس (پس‌کرایه)" },
                        ].map((m) => (
                          <button
                            key={m.key}
                            type="button"
                            onClick={() => setCheckoutForm({ ...checkoutForm, shipping: m.key })}
                            className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                              checkoutForm.shipping === m.key
                                ? "bg-slate-900 text-white border-slate-900"
                                : "bg-white text-slate-700 border-slate-200"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer */}
            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-100 bg-white shadow-lg space-y-3">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>جمع اقلام:</span>
                  <span className="font-bold text-slate-800">{formatPrice(totalAmount)}</span>
                </div>
                {discountValue > 0 && (
                  <div className="flex justify-between text-xs text-emerald-600 font-bold">
                    <span>تخفیف:</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-black text-slate-900 pt-2 border-t border-slate-100">
                  <span>مبلغ قابل پرداخت:</span>
                  <span style={{ color: primary }}>{formatPrice(discountedTotal)}</span>
                </div>

                {!showCheckout ? (
                  <button
                    onClick={() => {
                      if (!isLoggedIn) {
                        setShowLoginModal(true);
                      } else {
                        setShowCheckout(true);
                      }
                    }}
                    className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 transition-all"
                    style={{ background: primary }}
                  >
                    تکمیل و نهایی‌سازی خرید
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCheckout(false)}
                      className="px-4 py-3.5 rounded-2xl bg-slate-100 text-slate-600 font-bold text-xs"
                    >
                      بازگشت
                    </button>
                    <button
                      onClick={placeOrder}
                      disabled={
                        loading ||
                        !checkoutForm.name ||
                        !checkoutForm.address ||
                        checkoutForm.postalCode.length !== 10
                      }
                      className="flex-1 py-3.5 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all"
                      style={{ background: primary }}
                    >
                      {loading ? "در حال ثبت سفارش..." : "ثبت نهایی سفارش"}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 relative animate-scaleIn">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center"
            >
              {Icons.close}
            </button>

            <div className="text-center mb-6">
              <div
                className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center text-white font-black text-xl shadow-md"
                style={{ background: primary }}
              >
                AK
              </div>
              <h3 className="text-lg font-black text-slate-900">ورود به حساب کاربری</h3>
              <p className="text-xs text-slate-400 mt-1">جهت ثبت و پیگیری سفارش‌ها</p>
            </div>

            {otpError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl text-xs text-center mb-4 font-bold">
                {otpError}
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-3">
                <input
                  type="text"
                  inputMode="tel"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="شماره موبایل (مثال: 09123456789)"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-left focus:ring-2 focus:ring-rose-500"
                  dir="ltr"
                />
                <button
                  onClick={sendOTP}
                  disabled={loginLoading || phone.length < 10}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all"
                  style={{ background: primary }}
                >
                  {loginLoading ? "در حال ارسال کد..." : "دریافت کد تایید"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 text-center">
                  کد تایید به شماره <span className="font-mono font-bold" dir="ltr">{phone}</span> ارسال شد.
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="کد ۴ رقمی پیامک شده"
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-center tracking-widest focus:ring-2 focus:ring-rose-500"
                  dir="ltr"
                />
                <button
                  onClick={verifyOTP}
                  disabled={loginLoading || otpCode.length < 4}
                  className="w-full py-3.5 rounded-2xl text-white font-bold text-sm shadow-md active:scale-95 disabled:opacity-50 transition-all"
                  style={{ background: primary }}
                >
                  {loginLoading ? "در حال تایید..." : "تایید و ورود"}
                </button>
                <div className="text-center pt-2">
                  {countdown > 0 ? (
                    <span className="text-[11px] text-slate-400 font-mono">
                      ارسال مجدد تا {countdown} ثانیه دیگر
                    </span>
                  ) : (
                    <button
                      onClick={sendOTP}
                      className="text-[11px] font-bold text-slate-600 hover:underline"
                    >
                      ارسال مجدد کد تایید
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 right-0 left-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 z-40">
        <div className="flex justify-around items-center py-2 max-w-xl mx-auto">
          {[
            { key: "store" as const, icon: Icons.store, label: "فروشگاه" },
            { key: "profile" as const, icon: Icons.user, label: "پروفایل" },
            { key: "orders" as const, icon: Icons.orders, label: "سفارش‌ها" },
            { key: "more" as const, icon: Icons.more, label: "بیشتر" },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setActiveTab(tab.key);
                if (tab.key === "orders") loadOrders();
                if (tab.key === "more") loadSupport();
              }}
              className="flex flex-col items-center py-1 px-4 rounded-xl transition-all duration-200 relative"
              style={{ color: activeTab === tab.key ? primary : "#94a3b8" }}
            >
              {activeTab === tab.key && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full" style={{ background: primary }} />
              )}
              <span className="transition-transform duration-200" style={{ transform: activeTab === tab.key ? "scale(1.1)" : "scale(1)" }}>
                {tab.icon}
              </span>
              <span className="text-[11px] font-bold mt-1">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersTab({
  orders,
  loadOrders,
  primary,
  secondary,
}: {
  orders: any[];
  loadOrders: () => void;
  primary: string;
  secondary: string;
}) {
  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const statusLabels: Record<string, { label: string; bg: string; text: string }> = {
    pending: { label: "در انتظار بررسی", bg: "#fef3c7", text: "#b45309" },
    processing: { label: "در حال بسته‌بندی", bg: "#e0f2fe", text: "#0369a1" },
    shipped: { label: "ارسال شده", bg: "#dcfce7", text: "#15803d" },
    delivered: { label: "تحویل شده", bg: "#f0fdf4", text: "#166534" },
  };

  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-slate-100 shadow-sm">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-300">
          {Icons.orders}
        </div>
        <p className="text-sm font-bold text-slate-700">هنوز سفارشی ثبت نکرده‌اید</p>
        <p className="text-xs text-slate-400 mt-1">سفارش‌های شما پس از ثبت در این بخش نمایش داده می‌شوند.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => {
        const status = statusLabels[order.status] || statusLabels.pending;
        const items = (order.items as any[]) || [];
        return (
          <div key={order.id} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm space-y-3">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <span className="text-xs font-mono font-black text-slate-600">کد سفارش: #{order.id}</span>
              <span
                className="px-3 py-1 rounded-full text-[10px] font-black"
                style={{ backgroundColor: status.bg, color: status.text }}
              >
                {status.label}
              </span>
            </div>

            <div className="flex gap-2 overflow-x-auto py-1">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 shrink-0">
                  <img
                    src={item.image || "https://via.placeholder.com/40"}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover bg-white"
                  />
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-slate-800 line-clamp-1 max-w-[120px]">{item.name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{item.quantity} عدد</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
              <span className="text-slate-500">
                روش ارسال: {order.shippingMethod === "post" ? "پست پیشتاز" : "تیپاکس"}
              </span>
              <span className="font-black text-sm" style={{ color: primary }}>
                {formatPrice(order.totalAmount)}
              </span>
            </div>

            {order.trackingLink && (
              <a
                href={order.trackingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-xl bg-blue-50 text-blue-600 text-xs font-bold hover:bg-blue-100 transition-all"
              >
                {Icons.link}
                <span>پیگیری مرسوله پستی</span>
              </a>
            )}
          </div>
        );
      })}
    </div>
  );
}
