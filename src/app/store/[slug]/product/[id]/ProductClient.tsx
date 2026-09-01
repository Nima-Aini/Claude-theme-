"use client";

import { useState, useEffect, useRef } from "react";

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

type CartItem = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  image: string | null;
  isBestseller?: boolean;
  stock?: number;
  quantity: number;
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

  const cartKey = `cart_${shop.slug}`;

  // Gallery
  const allImages = [
    product.image,
    ...(Array.isArray(product.images) ? (product.images as string[]) : []),
  ].filter(Boolean) as string[];
  const [selectedImage, setSelectedImage] = useState(allImages[0] || "");
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
  const [customer, setCustomer] = useState<{ id: number; name: string | null; phone: string; address: string | null } | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(`cart_${shop.slug}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showCart, setShowCart] = useState(false);
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

  // Synchronize cart with localStorage
  useEffect(() => {
    try {
      localStorage.setItem(cartKey, JSON.stringify(cart));
      window.dispatchEvent(new Event("storage"));
    } catch {}
  }, [cart, cartKey]);

  // Listen for storage events from other tabs/pages
  useEffect(() => {
    const handleStorage = () => {
      try {
        const saved = localStorage.getItem(cartKey);
        if (saved) setCart(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [cartKey]);

  // Check login
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

  // Public discounts
  useEffect(() => {
    fetch("/api/discounts")
      .then((r) => r.json())
      .then((data) => setPublicDiscounts(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const addToCartWithQuantity = (item: Product, qty: number = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + qty } : i));
      }
      return [
        ...prev,
        {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price,
          image: item.image,
          isBestseller: item.isBestseller,
          stock: item.stock,
          quantity: qty,
        },
      ];
    });
    showToast(`✓ «${item.name}» (${qty} عدد) به سبد خرید اضافه شد.`);
  };

  const buyNow = (item: Product) => {
    addToCartWithQuantity(item, quantity);
    if (!isLoggedIn) {
      setShowLoginModal(true);
    } else {
      setShowCheckout(true);
    }
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((i) => i.id !== productId));
  };

  const updateQuantity = (productId: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => prev.map((i) => (i.id === productId ? { ...i, quantity: qty } : i)));
  };

  const totalCartCount = cart.reduce((s, i) => s + (i.quantity || 0), 0);
  const cartTotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const discountAmount =
    discountType === "percentage"
      ? Math.floor((cartTotal * discountValue) / 100)
      : Math.min(discountValue, cartTotal);
  const discountedTotal = Math.max(0, cartTotal - discountAmount);

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
      setOtpError("خطای ارتباط");
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
        setCheckoutForm((f) => ({ ...f, name: data.customer.name || "", address: data.customer.address || "" }));
        setShowLoginModal(false);
        showToast("ورود با موفقیت انجام شد");
      } else {
        setOtpError(data.error || "کد نامعتبر است");
      }
    } catch {
      setOtpError("خطای ارتباط");
    } finally {
      setLoginLoading(false);
    }
  };

  const applyDiscount = async () => {
    if (!discountCode) return;
    try {
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
        setCart([]);
        setShowCheckout(false);
        setShowCart(false);
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

  const sendProductSupport = async () => {
    if (!supportMessage.trim()) return;
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    try {
      const r = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.id,
          subject: `پشتیبانی محصول: ${product.name}`,
          message: supportMessage,
        }),
        credentials: "include",
      });
      if (r.ok) {
        setSupportMessage("");
        setSupportSent(true);
        loadSupport();
      } else {
        alert("خطا در ارسال پیام");
      }
    } catch {
      alert("خطا در ارتباط با سرور");
    }
  };

  const scrollBestseller = (dir: "left" | "right") => {
    if (bestsellerRef.current) {
      bestsellerRef.current.scrollBy({ left: dir === "left" ? -220 : 220, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pb-[88px]" dir="rtl">
      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#37474F] text-white text-xs font-bold shadow-2xl flex items-center gap-2 animate-slideUp">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a
              href={`/store/${shop.slug}`}
              className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-colors"
              title="بازگشت به فروشگاه"
            >
              {Icons.back}
            </a>
            <a href={`/store/${shop.slug}`} className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs border border-gray-100 bg-gray-50">
                <img src={shop.image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=100&h=100&fit=crop"} alt={shop.name} className="w-full h-full object-cover" />
              </div>
              <div>
                <h2 className="text-xs font-black text-gray-900 leading-tight">{shop.name}</h2>
                <span className="text-[10px] text-gray-400">فروشگاه رسمی</span>
              </div>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.clipboard) {
                  navigator.clipboard.writeText(window.location.href);
                  showToast("لینک محصول کپی شد");
                }
              }}
              className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
              title="اشتراک‌گذاری محصول"
            >
              {Icons.share}
            </button>
            <button
              onClick={() => setShowCart(true)}
              className="relative w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform active:scale-95 shadow-md"
              style={{ background: primary }}
              title="سبد خرید"
            >
              {Icons.cart}
              {totalCartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[#37474F] text-white text-[10px] font-black flex items-center justify-center border-2 border-white">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* SUCCESS MODAL */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-md flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-gray-100">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 bg-green-50 text-green-500 flex items-center justify-center">
              {Icons.check}
            </div>
            <h2 className="text-xl font-black mb-2 text-gray-900">سفارش شما با موفقیت ثبت شد!</h2>
            <p className="text-gray-500 text-xs leading-relaxed mb-6">
              سفارش شما در سیستم ثبت گردید و به زودی پردازش و ارسال خواهد شد.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOrderSuccess(false);
                  window.location.href = `/store/${shop.slug}`;
                }}
                className="flex-1 py-3 rounded-xl text-white font-bold text-xs"
                style={{ background: primary }}
              >
                بازگشت به فروشگاه
              </button>
              <button
                onClick={() => {
                  setOrderSuccess(false);
                  setActiveTab("orders");
                  loadOrders();
                }}
                className="px-4 py-3 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
              >
                مشاهده سفارش‌ها
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-gray-100 relative animate-scaleIn">
            <button
              onClick={() => setShowLoginModal(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100"
            >
              {Icons.close}
            </button>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-3 overflow-hidden shadow-md">
                <img src={shop.image || "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop"} alt={shop.name} className="w-full h-full object-cover" />
              </div>
              <h2 className="text-base font-black text-gray-900">{shop.name}</h2>
              <p className="text-gray-400 text-xs mt-1">
                {otpSent ? "کد ۶ رقمی ارسال شده به شماره خود را وارد کنید" : "برای ثبت سفارش یا دسترسی به حساب، شماره تماس خود را وارد کنید"}
              </p>
            </div>

            {otpError && (
              <div className="bg-red-50 text-red-500 p-2.5 rounded-xl text-xs text-center mb-3 font-bold">
                {otpError}
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-3">
                <input
                  type="tel"
                  placeholder="09123456789"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-center text-sm font-bold tracking-widest focus:ring-2 focus:bg-white outline-hidden"
                  dir="ltr"
                />
                <button
                  onClick={sendOTP}
                  disabled={loginLoading}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-md disabled:opacity-50"
                  style={{ background: primary }}
                >
                  {loginLoading ? "در حال ارسال..." : "دریافت کد تایید پیامکی"}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                  <span>{phone}</span>
                  <button onClick={() => { setOtpSent(false); setOtpCode(""); }} className="font-bold text-xs" style={{ color: primary }}>
                    تغییر شماره
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="کد ۶ رقمی"
                  value={otpCode}
                  maxLength={6}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 text-center text-xl font-bold tracking-[0.4em] focus:ring-2 focus:bg-white outline-hidden"
                  dir="ltr"
                />
                <button
                  onClick={verifyOTP}
                  disabled={loginLoading || otpCode.length < 4}
                  className="w-full py-3.5 rounded-xl text-white font-bold text-xs shadow-md disabled:opacity-50"
                  style={{ background: primary }}
                >
                  {loginLoading ? "در حال بررسی..." : "تایید و ورود"}
                </button>
                <div className="text-center">
                  {countdown > 0 ? (
                    <span className="text-[11px] text-gray-400">
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
      )}

      {/* VIDEO MODAL */}
      {showVideoModal && product.videoUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
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
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <span className="text-xs font-bold truncate">{product.name} — ویدیو معرفی</span>
              <a href={product.videoUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-400 hover:underline">
                مشاهده مستقیم
              </a>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      {activeTab === "product" && !showCart && !showCheckout && (
        <main className="max-w-4xl mx-auto px-4 pt-4 space-y-4">
          {/* PRODUCT CARD */}
          <div className="bg-white rounded-3xl overflow-hidden shadow-xs border border-gray-100 p-4 sm:p-6">
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
              {/* IMAGE GALLERY */}
              <div className="space-y-3">
                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 border border-gray-100 shadow-xs">
                  <img
                    src={selectedImage || product.image || "https://via.placeholder.com/600"}
                    alt={product.name}
                    className="w-full h-full object-cover transition-all duration-300"
                  />
                  {product.isBestseller && (
                    <span
                      className="absolute top-3 right-3 px-3 py-1 rounded-lg text-white text-[11px] font-black shadow-md"
                      style={{ background: primary }}
                    >
                      پرفروش 🔥
                    </span>
                  )}
                  {product.videoUrl && (
                    <button
                      onClick={() => setShowVideoModal(true)}
                      className="absolute bottom-3 left-3 px-3 py-2 rounded-xl bg-black/60 backdrop-blur-md text-white text-xs font-bold flex items-center gap-1.5 hover:bg-black/80 transition-colors"
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
                        className={`relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                          selectedImage === imgUrl ? "ring-2 scale-105 shadow-xs" : "opacity-70 hover:opacity-100 border-transparent"
                        }`}
                        style={{ borderColor: selectedImage === imgUrl ? primary : "transparent" }}
                      >
                        <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* PRODUCT DETAILS */}
              <div className="flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-red-50" style={{ color: primary }}>
                      {shop.name}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">کد محصول: #{product.id}</span>
                  </div>

                  <h1 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">{product.name}</h1>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="text-2xl sm:text-3xl font-black" style={{ color: primary }}>
                      {formatPrice(product.price)}
                    </span>
                  </div>

                  <div className="py-3 border-y border-gray-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="text-green-600 font-bold">✓ موجود در انبار</span>
                      <span className="text-gray-300">•</span>
                      <span className="text-gray-500">ارسال سریع به سراسر کشور</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-gray-500 pt-1">
                      <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-xl">
                        <span className="text-gray-400">{Icons.shield}</span>
                        <span>ضمانت اصالت و کیفیت</span>
                      </div>
                      <div className="flex items-center gap-1.5 bg-gray-50 p-2 rounded-xl">
                        <span className="text-gray-400">{Icons.truck}</span>
                        <span>ارسال پست پیشتاز و تیپاکس</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity and Actions */}
                  <div className="pt-2 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-500">تعداد:</span>
                      <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100">
                        <button
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-gray-700 hover:bg-gray-100"
                        >
                          {Icons.minus}
                        </button>
                        <span className="w-8 text-center text-sm font-black text-gray-900">{quantity}</span>
                        <button
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-8 h-8 rounded-lg bg-white shadow-xs flex items-center justify-center text-gray-700 hover:bg-gray-100"
                        >
                          {Icons.plus}
                        </button>
                      </div>
                      <span className="text-xs text-gray-400 font-bold mr-auto">
                        مجموع: {formatPrice(product.price * quantity)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2">
                      <button
                        onClick={() => addToCartWithQuantity(product, quantity)}
                        className="py-3.5 px-4 rounded-xl text-white text-xs font-black shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                        style={{ background: primary }}
                      >
                        {Icons.cart}
                        <span>افزودن به سبد</span>
                      </button>
                      <button
                        onClick={() => buyNow(product)}
                        className="py-3.5 px-4 rounded-xl text-white text-xs font-black shadow-md flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                        style={{ background: secondary }}
                      >
                        <span>خرید سریع</span>
                        <span>←</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DESCRIPTION */}
            <div className="mt-8 pt-6 border-t border-gray-100">
              <h2 className="text-sm font-black text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1.5 h-4 rounded-full" style={{ background: primary }} />
                <span>توضیحات و مشخصات محصول</span>
              </h2>
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50">
                {product.description || "توضیحاتی برای این محصول ثبت نشده است."}
              </div>
            </div>
          </div>

          {/* BESTSELLERS / RELATED PRODUCTS */}
          {bestsellers.length > 0 && (
            <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[10px] font-black tracking-wide" style={{ color: primary }}>
                    RELATED PRODUCTS
                  </p>
                  <h2 className="text-sm font-black text-gray-900">{bestsellerTitle}</h2>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => scrollBestseller("right")}
                    className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    {Icons.chevronRight}
                  </button>
                  <button
                    onClick={() => scrollBestseller("left")}
                    className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-600 hover:bg-gray-100"
                  >
                    {Icons.chevronLeft}
                  </button>
                </div>
              </div>

              <div ref={bestsellerRef} className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                {bestsellers.map((p) => (
                  <div
                    key={p.id}
                    className="flex-shrink-0 w-44 bg-gray-50/70 rounded-2xl overflow-hidden border border-gray-100 p-2.5 flex flex-col justify-between"
                  >
                    <a href={`/store/${shop.slug}/product/${p.id}`} className="block">
                      <div className="aspect-square rounded-xl overflow-hidden bg-white mb-2">
                        <img src={p.image || "https://via.placeholder.com/200"} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <h3 className="font-bold text-xs text-gray-800 line-clamp-1 mb-1">{p.name}</h3>
                      <p className="text-xs font-black mb-2" style={{ color: primary }}>
                        {formatPrice(p.price)}
                      </p>
                    </a>
                    <button
                      onClick={() => addToCartWithQuantity(p, 1)}
                      className="w-full py-2 rounded-xl text-white text-[11px] font-bold shadow-xs hover:opacity-90 transition-opacity"
                      style={{ background: primary }}
                    >
                      افزودن به سبد
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PRODUCT SUPPORT BOX */}
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
            <h2 className="text-sm font-black text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-1.5 h-4 rounded-full" style={{ background: secondary }} />
              <span>پشتیبانی و سوال درباره این محصول</span>
            </h2>
            <p className="text-[11px] text-gray-400 mb-3">
              سوالی درباره کارکرد، ترکیبات یا نحوه مصرف دارید؟ پیام بفرستید.
            </p>
            <textarea
              value={supportMessage}
              onChange={(e) => setSupportMessage(e.target.value)}
              rows={3}
              placeholder="پیام یا سوال خود را اینجا بنویسید..."
              className="w-full p-3 rounded-2xl bg-gray-50 border border-gray-100 text-xs focus:ring-2 focus:bg-white outline-hidden"
            />
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={sendProductSupport}
                disabled={!supportMessage.trim()}
                className="px-5 py-2.5 rounded-xl text-white text-xs font-bold disabled:opacity-40"
                style={{ background: primary }}
              >
                ارسال پیام به پشتیبانی
              </button>
              {supportSent && <span className="text-xs text-green-600 font-bold">✓ پیام شما ارسال شد</span>}
            </div>
          </div>
        </main>
      )}

      {/* CART DRAWER / MODAL */}
      {showCart && !showCheckout && (
        <div className="max-w-xl mx-auto px-4 pt-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span>سبد خرید شما</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-red-50" style={{ color: primary }}>
                  {totalCartCount} کالا
                </span>
              </h2>
              <button
                onClick={() => setShowCart(false)}
                className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100"
              >
                {Icons.close}
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl mx-auto mb-3 bg-gray-50 flex items-center justify-center text-gray-300">
                  {Icons.cart}
                </div>
                <p className="text-gray-400 text-xs font-bold">سبد خرید شما خالی است</p>
                <button
                  onClick={() => setShowCart(false)}
                  className="mt-4 px-5 py-2.5 rounded-xl text-white text-xs font-bold"
                  style={{ background: primary }}
                >
                  مشاهده محصول و ادامه خرید
                </button>
              </div>
            ) : (
              <div className="pt-4 space-y-3">
                <div className="space-y-2.5">
                  {cart.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-2xl flex gap-3 items-center">
                      <img
                        src={item.image || "https://via.placeholder.com/80"}
                        alt={item.name}
                        className="w-14 h-14 rounded-xl object-cover bg-white"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-gray-800 truncate">{item.name}</h4>
                        <p className="text-xs font-black mt-1" style={{ color: primary }}>
                          {formatPrice(item.price)}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600"
                          >
                            {Icons.minus}
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-lg flex items-center justify-center text-white"
                            style={{ background: primary }}
                          >
                            {Icons.plus}
                          </button>
                          <button
                            onClick={() => removeFromCart(item.id)}
                            className="mr-auto text-gray-300 hover:text-red-500"
                          >
                            {Icons.trash}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* DISCOUNT INPUT */}
                <div className="pt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="کد تخفیف (مثلاً AKMA10)"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold"
                    />
                    <button
                      onClick={applyDiscount}
                      className="px-4 py-2.5 rounded-xl text-white text-xs font-bold"
                      style={{ background: secondary }}
                    >
                      اعمال کد
                    </button>
                  </div>
                  {discountMessage && (
                    <p className="text-[11px] mt-1 text-right font-bold text-gray-500">{discountMessage}</p>
                  )}
                </div>

                {/* SUMMARY */}
                <div className="p-4 rounded-2xl text-white mt-4" style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}>
                  <div className="flex justify-between text-xs mb-1.5 opacity-80">
                    <span>جمع کل کالاها</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  {discountValue > 0 && (
                    <div className="flex justify-between text-xs mb-1.5 text-yellow-300 font-bold">
                      <span>تخفیف</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="border-t border-white/20 pt-2.5 mt-2 flex justify-between font-black text-sm">
                    <span>مبلغ قابل پرداخت</span>
                    <span>{formatPrice(discountedTotal)}</span>
                  </div>
                  <button
                    onClick={() => {
                      if (!isLoggedIn) {
                        setShowLoginModal(true);
                      } else {
                        setShowCheckout(true);
                      }
                    }}
                    className="w-full mt-4 py-3 rounded-xl bg-white font-black text-xs shadow-lg"
                    style={{ color: primary }}
                  >
                    تکمیل خرید و ثبت اطلاعات ارسال ←
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT FLOW */}
      {showCheckout && (
        <div className="max-w-xl mx-auto px-4 pt-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <h2 className="text-base font-black text-gray-900">تکمیل سفارش و آدرس</h2>
              <button
                onClick={() => setShowCheckout(false)}
                className="w-8 h-8 rounded-xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-gray-100"
              >
                {Icons.close}
              </button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">نام و نام خانوادگی تحویل‌گیرنده</label>
                <input
                  type="text"
                  value={checkoutForm.name}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                  placeholder="نام کامل"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">آدرس کامل پستی</label>
                <textarea
                  value={checkoutForm.address}
                  onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                  placeholder="استان، شهر، خیابان، پلاک، واحد"
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-medium resize-none focus:ring-2"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1">کد پستی ۱۰ رقمی</label>
                <input
                  inputMode="numeric"
                  maxLength={10}
                  value={checkoutForm.postalCode}
                  onChange={(e) =>
                    setCheckoutForm({ ...checkoutForm, postalCode: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                  placeholder="۱۰ رقم کدپستی"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs font-bold text-center tracking-widest"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-500 mb-1.5">روش ارسال</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { key: "post", label: "پست پیشتاز (سراسری)" },
                    { key: "tipax", label: "تیپاکس (سریع)" },
                  ].map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setCheckoutForm({ ...checkoutForm, shipping: s.key })}
                      className="py-2.5 rounded-xl border text-xs font-bold transition-all"
                      style={{
                        borderColor: checkoutForm.shipping === s.key ? primary : "#e5e7eb",
                        background: checkoutForm.shipping === s.key ? primary : "white",
                        color: checkoutForm.shipping === s.key ? "white" : "#37474F",
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl text-white mt-4" style={{ background: `linear-gradient(135deg, ${secondary}, ${primary})` }}>
                <p className="text-[11px] font-bold opacity-70 mb-2">اقلام سفارش:</p>
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs mb-1 opacity-90">
                    <span>{item.name} × {item.quantity}</span>
                    <span>{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
                <div className="border-t border-white/20 pt-2.5 mt-2.5 flex justify-between font-black text-sm">
                  <span>مبلغ نهایی</span>
                  <span>{formatPrice(discountedTotal)}</span>
                </div>
                <button
                  onClick={placeOrder}
                  disabled={loading || !checkoutForm.name || !checkoutForm.address || checkoutForm.postalCode.length !== 10}
                  className="w-full mt-4 py-3 rounded-xl bg-white font-black text-xs shadow-lg disabled:opacity-50"
                  style={{ color: primary }}
                >
                  {loading ? "در حال ثبت سفارش..." : "تایید و ثبت نهایی سفارش"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ORDERS TAB VIEW */}
      {activeTab === "orders" && (
        <div className="max-w-xl mx-auto px-4 pt-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
            <h2 className="text-base font-black text-gray-900 mb-4">سفارش‌های شما</h2>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-xl mx-auto mb-2 bg-gray-50 flex items-center justify-center text-gray-300">
                  {Icons.orders}
                </div>
                <p className="text-gray-400 text-xs">سفارشی ثبت نشده است.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((o) => (
                  <div key={o.id} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-100 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700">سفارش #{o.id}</span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white bg-blue-600">
                        {o.status || "ثبت شده"}
                      </span>
                    </div>
                    <div className="text-gray-500">{o.customerAddress}</div>
                    <div className="flex justify-between font-bold pt-1 border-t border-gray-200/50">
                      <span className="text-gray-400">{o.shippingMethod === "post" ? "پست پیشتاز" : "تیپاکس"}</span>
                      <span style={{ color: primary }}>{formatPrice(o.totalAmount)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MORE / PROFILE TAB VIEW */}
      {activeTab === "more" && (
        <div className="max-w-xl mx-auto px-4 pt-4 animate-fadeIn space-y-3">
          <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
            <h3 className="font-black text-sm text-gray-900 mb-3">کدهای تخفیف فعال</h3>
            {publicDiscounts.length > 0 ? (
              <div className="space-y-2">
                {publicDiscounts.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => {
                      setDiscountCode(d.code);
                      setShowCart(true);
                      setActiveTab("product");
                      showToast(`کد ${d.code} انتخاب شد`);
                    }}
                    className="p-3 rounded-2xl border border-dashed flex justify-between items-center cursor-pointer hover:bg-red-50/40"
                    style={{ borderColor: primary }}
                  >
                    <span className="font-black text-xs" dir="ltr" style={{ color: primary }}>
                      {d.code}
                    </span>
                    <span className="text-xs font-bold text-gray-600">
                      {d.type === "percentage" ? `${d.value}% تخفیف` : `${formatPrice(d.value)} تخفیف`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-xs">کد تخفیف فعالی در دسترس نیست.</p>
            )}
          </div>

          <div className="bg-white rounded-3xl p-5 shadow-xs border border-gray-100">
            <h3 className="font-black text-sm text-gray-900 mb-2">اطلاعات فروشگاه</h3>
            <p className="text-xs text-gray-500 leading-relaxed mb-3">{shop.name}</p>
            <a
              href={`/store/${shop.slug}`}
              className="block text-center py-2.5 rounded-xl text-white text-xs font-bold"
              style={{ background: secondary }}
            >
              مشاهده تمامی محصولات فروشگاه
            </a>
          </div>
        </div>
      )}

      {/* BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-gray-100 z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.04)]">
        <div className="flex justify-around items-center py-2 max-w-md mx-auto">
          <a
            href={`/store/${shop.slug}`}
            className="flex flex-col items-center gap-1 text-[11px] font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <span>{Icons.store}</span>
            <span>فروشگاه</span>
          </a>

          <button
            onClick={() => {
              setActiveTab("product");
              setShowCheckout(false);
              setShowCart(true);
            }}
            className="relative flex flex-col items-center gap-1 text-[11px] font-bold transition-colors"
            style={{ color: showCart ? primary : "#6b7280" }}
          >
            <span>{Icons.cart}</span>
            <span>سبد خرید</span>
            {totalCartCount > 0 && (
              <span
                className="absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full text-white text-[9px] font-black flex items-center justify-center"
                style={{ background: primary }}
              >
                {totalCartCount}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              setShowCart(false);
              setShowCheckout(false);
              setActiveTab("orders");
              loadOrders();
            }}
            className="flex flex-col items-center gap-1 text-[11px] font-bold transition-colors"
            style={{ color: activeTab === "orders" ? primary : "#6b7280" }}
          >
            <span>{Icons.orders}</span>
            <span>سفارش‌ها</span>
          </button>

          <button
            onClick={() => {
              setShowCart(false);
              setShowCheckout(false);
              setActiveTab("more");
              loadSupport();
            }}
            className="flex flex-col items-center gap-1 text-[11px] font-bold transition-colors"
            style={{ color: activeTab === "more" ? primary : "#6b7280" }}
          >
            <span>{Icons.more}</span>
            <span>بیشتر</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
