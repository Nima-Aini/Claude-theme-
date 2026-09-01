"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";

type Product = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  images?: string[] | unknown;
  videoUrl?: string | null;
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
  product: Product;
  bestsellers?: Product[];
  allProducts?: Product[];
  settings?: Record<string, string>;
  sliderBanners?: Banner[];
  bottomBanners?: Banner[];
  bestsellerTitle?: string;
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
  video: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>,
  back: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>,
  shield: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" /></svg>,
  truck: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.25V14.25m0 0h3.75m-3.75 0H3.75" /></svg>,
};

export default function ProductClient({
  shop,
  product,
  bestsellers = [],
  settings = {},
  bestsellerTitle = "محصولات پرفروش 🔥",
}: Props) {
  const primary = settings.primary_color || "#FF1744";
  const secondary = settings.secondary_color || "#37474F";

  const { cart, addItem, setItemQuantity, removeItem, clear, totalCount, totalAmount } = useCart(shop.slug);

  // Gallery
  const rawImages = Array.isArray(product.images)
    ? (product.images as string[])
    : typeof product.images === "string"
    ? JSON.parse(product.images || "[]")
    : [];
  const allImages = [product.image, ...rawImages].filter(Boolean) as string[];
  const [selectedImage, setSelectedImage] = useState(allImages[0] || product.image || "");
  const [quantity, setQuantity] = useState(1);
  const [toastMessage, setToastMessage] = useState("");

  // Customer state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [customer, setCustomer] = useState<{ id: number; name: string | null; phone: string; address: string | null; postalCode?: string | null } | null>(null);

  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeTab, setActiveTab] = useState<"product" | "profile" | "orders" | "more">("product");
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Checkout
  const [checkoutForm, setCheckoutForm] = useState({ name: "", address: "", postalCode: "", shipping: "post" });
  const [discountCode, setDiscountCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [discountMessage, setDiscountMessage] = useState("");
  const [publicDiscounts, setPublicDiscounts] = useState<PublicDiscount[]>([]);

  // Support
  const [supportMessage, setSupportMessage] = useState("");
  const [supportSent, setSupportSent] = useState(false);
  const [supportTickets, setSupportTickets] = useState<any[]>([]);

  const bestsellerRef = useRef<HTMLDivElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  // Check login
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

  // Public discounts
  useEffect(() => {
    fetch("/api/discounts", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setPublicDiscounts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleAddToCart = (qty: number = 1) => {
    addItem(product, qty);
    showToast(`✓ «${product.name}» (${qty} عدد) به سبد خرید اضافه شد.`);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    setShowCartDrawer(true);
    if (isLoggedIn) {
      setShowCheckout(true);
    } else {
      setShowLoginModal(true);
    }
  };

  const discountAmount =
    discountType === "percentage"
      ? Math.floor((totalAmount * discountValue) / 100)
      : Math.min(discountValue, totalAmount);
  const discountedTotal = Math.max(0, totalAmount - discountAmount);

  // OTP methods
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
      setDiscountMessage("خطا در بررسی کد");
    }
  };

  const placeOrder = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
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

  const loadOrders = async () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    try {
      const res = await fetch("/api/orders", { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data)) setOrders(data);
    } catch {}
  };

  const loadSupport = async () => {
    if (!isLoggedIn) return;
    try {
      const r = await fetch("/api/support", { credentials: "include" });
      if (r.ok) setSupportTickets(await r.json());
    } catch {}
  };

  const scrollBestseller = (dir: "left" | "right") => {
    if (bestsellerRef.current) {
      bestsellerRef.current.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans antialiased text-slate-800 select-none" dir="rtl">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900/90 backdrop-blur-md text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-slideDown border border-white/10">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100 shadow-sm">
        <div className="max-w-xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href={`/store/${shop.slug}`}
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 transition-colors"
              title="بازگشت به فروشگاه"
            >
              {Icons.back}
            </Link>
            <Link href={`/store/${shop.slug}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              {shop.image ? (
                <img src={shop.image} alt={shop.name} className="w-9 h-9 rounded-xl object-cover shadow-sm border border-slate-100" />
              ) : (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shadow-sm" style={{ background: primary }}>
                  {shop.name.charAt(0)}
                </div>
              )}
              <div>
                <h2 className="text-xs font-black text-slate-900 leading-tight">{shop.name}</h2>
                <span className="text-[10px] text-slate-400 font-medium">فروشگاه رسمی</span>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  showToast("لینک محصول کپی شد");
                }
              }}
              className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
              title="اشتراک‌گذاری"
            >
              {Icons.share}
            </button>
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

      {/* SUCCESS MODAL */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-100">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-emerald-50 text-emerald-500 flex items-center justify-center">
              {Icons.check}
            </div>
            <h2 className="text-xl font-black mb-2 text-slate-900">سفارش شما با موفقیت ثبت شد!</h2>
            <p className="text-slate-500 text-xs leading-relaxed mb-6">
              سفارش شما در سیستم ثبت گردید و به زودی پردازش و ارسال خواهد شد.
            </p>
            <div className="flex gap-2">
              <Link
                href={`/store/${shop.slug}`}
                className="flex-1 py-3 rounded-2xl text-white font-bold text-xs shadow-md text-center"
                style={{ background: primary }}
              >
                بازگشت به فروشگاه
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* VIDEO MODAL */}
      {showVideoModal && product.videoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-black rounded-3xl overflow-hidden max-w-2xl w-full relative shadow-2xl">
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40"
            >
              {Icons.close}
            </button>
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              {product.videoUrl.includes("aparat.com") || product.videoUrl.includes("youtube.com") ? (
                <iframe src={product.videoUrl} className="w-full h-full border-0" allowFullScreen title={product.name} />
              ) : (
                <video src={product.videoUrl} controls autoPlay className="w-full h-full object-contain" />
              )}
            </div>
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold truncate">{product.name} — ویدیو معرفی</span>
              <a href={product.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-400 hover:underline">
                مشاهده مستقیم
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MAIN SINGLE PRODUCT VIEW */}
      <main className="max-w-xl mx-auto px-4 pt-4 space-y-4 animate-fadeIn">
        <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-slate-100 p-4 sm:p-5">
          <div className="space-y-4">
            {/* Gallery Image */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
              <img
                src={selectedImage || product.image || "https://via.placeholder.com/600"}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
              {product.isBestseller && (
                <span
                  className="absolute top-3 right-3 px-3 py-1 rounded-xl text-white text-[10px] font-black shadow-md"
                  style={{ background: primary }}
                >
                  پرفروش 🔥
                </span>
              )}
              {product.videoUrl && (
                <button
                  onClick={() => setShowVideoModal(true)}
                  className="absolute bottom-3 left-3 px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 hover:bg-black/80 transition-colors"
                >
                  {Icons.video}
                  <span>ویدیو محصول</span>
                </button>
              )}
            </div>

            {/* Thumbnails */}
            {allImages.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {allImages.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(imgUrl)}
                    className={`relative shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === imgUrl ? "ring-2 scale-105 shadow-sm" : "opacity-70 hover:opacity-100 border-transparent"
                    }`}
                    style={{ borderColor: selectedImage === imgUrl ? primary : "transparent" }}
                  >
                    <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Product Meta */}
            <div className="space-y-3 pt-2">
              <h1 className="text-xl font-black text-slate-900 leading-snug">{product.name}</h1>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black" style={{ color: primary }}>
                  {formatPrice(product.price)}
                </span>
              </div>

              {/* Guarantees */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400">{Icons.shield}</span>
                  <span>ضمانت اصالت و سلامت کالا</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400">{Icons.truck}</span>
                  <span>ارسال به سراسر کشور</span>
                </div>
              </div>

              {/* Quantity Selector & Action Buttons */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-600 mr-2">تعداد سفارش:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-100 active:scale-95"
                    >
                      {Icons.minus}
                    </button>
                    <span className="w-8 text-center text-sm font-black text-slate-900 font-mono">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-8 h-8 rounded-xl text-white shadow-sm flex items-center justify-center active:scale-95"
                      style={{ background: primary }}
                    >
                      {Icons.plus}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={() => handleAddToCart(quantity)}
                    className="py-3.5 px-4 rounded-2xl text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                    style={{ background: primary }}
                  >
                    {Icons.cart}
                    <span>افزودن به سبد</span>
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="py-3.5 px-4 rounded-2xl text-white text-xs font-black shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all"
                    style={{ background: secondary }}
                  >
                    <span>خرید مستقیم</span>
                    <span>←</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-sm font-black text-slate-800 mb-2">توضیحات و مشخصات کالا</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
                {product.description || "توضیحاتی برای این محصول ثبت نشده است."}
              </p>
            </div>
          </div>
        </div>

        {/* BESTSELLERS CAROUSEL */}
        {bestsellers.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black text-slate-800">{bestsellerTitle}</h3>
              <div className="flex gap-1">
                <button
                  onClick={() => scrollBestseller("right")}
                  className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {Icons.chevronRight}
                </button>
                <button
                  onClick={() => scrollBestseller("left")}
                  className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                >
                  {Icons.chevronLeft}
                </button>
              </div>
            </div>

            <div ref={bestsellerRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2 scroll-smooth">
              {bestsellers.map((item) => (
                <Link
                  key={item.id}
                  href={`/store/${shop.slug}/product/${item.id}`}
                  className="w-40 shrink-0 bg-white rounded-2xl p-3 border border-slate-100 shadow-sm block group"
                >
                  <div className="aspect-square rounded-xl overflow-hidden mb-2 bg-slate-100">
                    <img
                      src={item.image || "https://via.placeholder.com/200"}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h4 className="font-bold text-xs text-slate-800 line-clamp-1 mb-1">{item.name}</h4>
                  <p className="font-black text-xs" style={{ color: primary }}>
                    {formatPrice(item.price)}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>

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

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 animate-slideLeft">
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

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!showCheckout ? (
                cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-3 text-slate-300">
                      {Icons.cart}
                    </div>
                    <p className="text-sm font-bold">سبد خرید شما خالی است</p>
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

                    {/* Discount */}
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/60 mt-4 space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={discountCode}
                          onChange={(e) => setDiscountCode(e.target.value)}
                          placeholder="کد تخفیف"
                          className="flex-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-mono"
                          dir="ltr"
                        />
                        <button
                          onClick={applyDiscount}
                          className="px-4 py-2 rounded-xl text-white text-xs font-bold shadow-sm active:scale-95"
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
                /* CHECKOUT FORM */
                <div className="space-y-4">
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/60 space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">نام و نام خانوادگی تحویل گیرنده</label>
                      <input
                        type="text"
                        value={checkoutForm.name}
                        onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                        placeholder="نام و نام خانوادگی"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs"
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
                        placeholder="۱۰ رقم بدون خط تیره"
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
                      {loading ? "در حال ثبت..." : "ثبت نهایی سفارش"}
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
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-left"
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
                  className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-mono text-center tracking-widest"
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

      {/* BOTTOM BAR */}
      <div className="fixed bottom-0 right-0 left-0 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 z-40">
        <div className="flex justify-around items-center py-2 max-w-xl mx-auto">
          <Link
            href={`/store/${shop.slug}`}
            className="flex flex-col items-center py-1 px-4 rounded-xl text-slate-500 hover:text-slate-900 transition-all"
          >
            {Icons.store}
            <span className="text-[11px] font-bold mt-1">فروشگاه</span>
          </Link>
          <button
            onClick={() => setShowCartDrawer(true)}
            className="flex flex-col items-center py-1 px-4 rounded-xl relative"
            style={{ color: primary }}
          >
            <div className="relative">
              {Icons.cart}
              {totalCount > 0 && (
                <span
                  className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full text-white text-[9px] font-black flex items-center justify-center shadow-xs"
                  style={{ background: primary }}
                >
                  {totalCount}
                </span>
              )}
            </div>
            <span className="text-[11px] font-bold mt-1">سبد خرید</span>
          </button>
        </div>
      </div>
    </div>
  );
}
