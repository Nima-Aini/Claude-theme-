"use client";
import { useState } from "react";

export default function AdminLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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
        setTimeout(() => {
          window.location.href = "/admin";
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
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>
          <h1 className="text-xl font-black text-gray-800">پنل مدیریت</h1>
          <p className="text-xs text-gray-400 mt-1">ADMIN PANEL</p>
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
          admin / admin123
        </p>
      </form>
    </div>
  );
}
