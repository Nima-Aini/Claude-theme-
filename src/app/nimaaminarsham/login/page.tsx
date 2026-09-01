"use client";

import { useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.success) {
        window.location.href = "/nimaaminarsham";
      } else {
        setError(data.error || "نام کاربری یا رمز عبور اشتباه است");
      }
    } catch {
      setError("خطا در برقراری ارتباط با سرور");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError("");
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-5 relative overflow-hidden" style={{ background: "#1e293b" }} dir="rtl">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`, backgroundSize: "28px 28px" }} />
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl opacity-20 bg-rose-500 pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full blur-3xl opacity-20 bg-blue-500 pointer-events-none" />

      <form onSubmit={handleSubmit} className="relative bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-100 z-10 animate-fadeIn">
        <div className="text-center mb-7">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-md bg-gradient-to-tr from-rose-600 to-rose-400 text-white font-black text-xl">
            AK
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">ورود به پنل مدیریت</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium tracking-wide">AKMA PLATFORM MANAGEMENT</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3.5 rounded-2xl text-xs text-center mb-5 font-bold animate-shake">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">نام کاربری</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: adminakma یا admin"
              className="w-full px-4 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all text-left font-mono"
              dir="ltr"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1.5">رمز عبور</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="رمز عبور"
                className="w-full px-4 py-3.5 pl-12 rounded-2xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all text-left font-mono"
                dir="ltr"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs px-2 py-1"
              >
                {showPassword ? "مخفی" : "نمایش"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-sm shadow-lg shadow-rose-500/25 active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
          >
            {loading ? "در حال اعتبارسنجی..." : "ورود به مدیریت"}
          </button>
        </div>

        {/* Quick-fill helpers for hassle-free login */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 text-center mb-2.5">ورود سریع با اطلاعات پیش‌فرض:</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill("adminakma", "Akma!2026#Nima@Secure")}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 font-bold transition-all text-center"
            >
              adminakma (جدید)
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("admin", "admin123")}
              className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-[11px] text-slate-700 font-bold transition-all text-center"
            >
              admin (قبلی)
            </button>
          </div>
        </div>
      </form>
    </main>
  );
}
