"use client";
import { useState } from "react";

export default function ShopLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Important for cookies
      });
      const data = await res.json();
      if (data.success) {
        // Small delay to ensure cookie is set
        setTimeout(() => {
          window.location.href = "/shop-panel";
        }, 100);
      } else {
        setError(data.error || "خطا در ورود");
      }
    } catch {
      setError("خطای ارتباط");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-5" style={{ background: "#37474F" }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '24px 24px' }} />
      <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl animate-scaleIn">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: "#FF174410" }}>
            <svg width="24" height="24" fill="none" stroke="#FF1744" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-gray-800">پنل فروشندگان</h1>
          <p className="text-xs text-gray-400 mt-1">SELLER PANEL</p>
        </div>
        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-xl text-xs text-center mb-4 font-bold">{error}</div>
        )}
        <div className="space-y-3">
          <input type="text" placeholder="نام کاربری" value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-[#FF1744] transition-all" />
          <input type="password" placeholder="رمز عبور" value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl bg-gray-50 border border-gray-100 text-sm focus:ring-2 focus:ring-[#FF1744] transition-all" />
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#FF1744] text-white font-bold text-sm disabled:opacity-50 hover:shadow-lg transition-all">
            {loading ? "لطفا صبر کنید..." : "ورود"}
          </button>
        </div>
        <p className="text-[10px] text-gray-300 text-center mt-6">
          sara / shop123 — mahsa / shop456 — rose / shop789
        </p>
      </form>
    </div>
  );
}
