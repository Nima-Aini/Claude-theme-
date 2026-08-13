import { db } from "@/db";
import { shops, siteSettings } from "@/db/schema";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function getSettings() {
  try {
    const all = await db.select().from(siteSettings);
    const result: Record<string, string> = {};
    for (const s of all) result[s.key] = s.value;
    return result;
  } catch {
    return { primary_color: "#FF1744", secondary_color: "#37474F", accent_color: "#FF5252" };
  }
}

export default async function HomePage() {
  let allShops: { id: number; name: string; slug: string; image: string | null }[] = [];
  let settings: Record<string, string> = { primary_color: "#FF1744", secondary_color: "#37474F", accent_color: "#FF5252" };

  try {
    allShops = await db.select({ id: shops.id, name: shops.name, slug: shops.slug, image: shops.image }).from(shops);
    settings = await getSettings();
  } catch {
    // DB not ready
  }

  const primary = settings.primary_color || "#FF1744";
  const secondary = settings.secondary_color || "#37474F";

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ background: secondary }}>
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-10" style={{ background: primary, filter: 'blur(80px)' }} />
        <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10" style={{ background: primary, filter: 'blur(100px)' }} />

        <div className="relative px-6 py-20 sm:py-28 text-center text-white max-w-3xl mx-auto">
          <div className="line-accent mx-auto mb-6" style={{ background: primary }} />
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
            AKMA
          </h1>
          <p className="text-base sm:text-lg text-white/60 mb-10 max-w-md mx-auto leading-relaxed">
            محصولات اصل با تضمین کیفیت و ارسال سریع
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/admin/login"
              className="px-6 py-3 rounded-xl text-sm font-bold border border-white/20 text-white/80 hover:bg-white/10 transition-all duration-300"
            >
              پنل مدیریت
            </Link>
            <Link
              href="/shop-login"
              className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-300 hover:opacity-90"
              style={{ background: primary }}
            >
              پنل فروشندگان
            </Link>
          </div>
        </div>
      </div>

      {/* Shops */}
      <div className="px-4 sm:px-6 py-12 sm:py-16 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: primary }}>
            STORES
          </p>
          <h2 className="text-2xl sm:text-3xl font-black" style={{ color: secondary }}>
            فروشگاه‌ها
          </h2>
          <div className="line-accent mx-auto mt-4" style={{ background: primary }} />
        </div>

        {allShops.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: `${primary}10` }}>
              <svg width="24" height="24" fill="none" stroke={primary} strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72M6.75 18h3.75a.75.75 0 0 0 .75-.75V13.5a.75.75 0 0 0-.75-.75H6.75a.75.75 0 0 0-.75.75v3.75c0 .414.336.75.75.75Z" /></svg>
            </div>
            <p className="text-gray-400 text-sm">فروشگاهی ایجاد نشده است</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {allShops.map((shop, i) => (
              <Link key={shop.id} href={`/store/${shop.slug}`}>
                <div
                  className="group relative rounded-2xl overflow-hidden card-hover bg-white animate-slideUp"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="aspect-[16/10] overflow-hidden">
                    <img
                      src={shop.image || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=375&fit=crop"}
                      alt={shop.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  </div>
                  <div className="absolute bottom-0 right-0 left-0 p-5">
                    <h3 className="text-lg font-bold text-white mb-1">{shop.name}</h3>
                    <div className="flex items-center gap-1.5 text-white/60 text-xs">
                      <span>مشاهده محصولات</span>
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" /></svg>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 text-center">
        <p className="text-xs text-gray-300 tracking-wide">
          AKMA © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
