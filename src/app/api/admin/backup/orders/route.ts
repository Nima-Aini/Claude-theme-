import { NextRequest, NextResponse } from "next/server";
import { db, pool } from "@/db";
import { orders, shops } from "@/db/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { verifyToken } from "@/lib/auth";
import { formatJalaliDate, gregorianToJalali, jalaliToGregorian } from "@/lib/jalali";
import * as XLSX from "xlsx";

async function ensureOrdersSchema() {
  const client = await pool.connect();
  try {
    await client.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_postal_code VARCHAR(10);
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_link TEXT;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
      UPDATE orders SET created_at = NOW() WHERE created_at IS NULL;
    `);
  } catch (err) {
    console.error("Schema update error:", err);
  } finally {
    client.release();
  }
}

const statusMap: Record<string, string> = {
  pending: "در انتظار بررسی",
  processing: "در حال پردازش",
  shipped: "ارسال شده",
  delivered: "تحویل داده شده",
  cancelled: "لغو شده",
};

const shippingMap: Record<string, string> = {
  post: "پست پیشتاز",
  tipax: "تیپاکس",
  express: "پیک فوری",
};

export async function GET(req: NextRequest) {
  try {
    await ensureOrdersSchema();

    // Check admin authentication
    const token = req.cookies.get("admin_token")?.value;
    if (!token) {
      return NextResponse.json({ error: "عدم دسترسی: لطفا وارد پنل مدیریت شوید" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || (payload.type !== "admin" && payload.role !== "admin")) {
      return NextResponse.json({ error: "عدم دسترسی مدیر" }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const fromYear = searchParams.get("fromYear");
    const fromMonth = searchParams.get("fromMonth");
    const fromDay = searchParams.get("fromDay");
    const toYear = searchParams.get("toYear");
    const toMonth = searchParams.get("toMonth");
    const toDay = searchParams.get("toDay");
    const shopFilter = searchParams.get("shopId");
    const statusFilter = searchParams.get("status");

    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (fromYear && fromMonth && fromDay) {
      const [gy, gm, gd] = jalaliToGregorian(Number(fromYear), Number(fromMonth), Number(fromDay));
      startDate = new Date(gy, gm - 1, gd, 0, 0, 0, 0);
    }

    if (toYear && toMonth && toDay) {
      const [gy, gm, gd] = jalaliToGregorian(Number(toYear), Number(toMonth), Number(toDay));
      endDate = new Date(gy, gm - 1, gd, 23, 59, 59, 999);
    }

    // Fetch orders and shops
    const allShops = await db.select().from(shops);
    const shopMap = new Map<number, (typeof allShops)[0]>();
    allShops.forEach((s) => shopMap.set(s.id, s));

    const conditions = [];
    if (startDate) conditions.push(gte(orders.createdAt, startDate));
    if (endDate) conditions.push(lte(orders.createdAt, endDate));
    if (shopFilter && shopFilter !== "all") conditions.push(eq(orders.shopId, Number(shopFilter)));
    if (statusFilter && statusFilter !== "all") conditions.push(eq(orders.status, statusFilter));

    const orderQuery = conditions.length > 0
      ? db.select().from(orders).where(and(...conditions)).orderBy(desc(orders.createdAt))
      : db.select().from(orders).orderBy(desc(orders.createdAt));

    const rawOrders = await orderQuery;

    // Prepare Sheet 1: Detailed Orders
    const detailedRows = rawOrders.map((ord, index) => {
      const shop = shopMap.get(ord.shopId);
      const itemsList = Array.isArray(ord.items)
        ? ord.items.map((it: any) => `${it.name || "محصول"} (${it.quantity || 1} عدد - ${(it.price || 0).toLocaleString("fa-IR")} تومان)`).join(" | ")
        : "";
      const totalItemsCount = Array.isArray(ord.items)
        ? ord.items.reduce((sum: number, it: any) => sum + (Number(it.quantity) || 1), 0)
        : 0;

      const created = ord.createdAt ? new Date(ord.createdAt) : new Date();
      const [jy, jm, jd] = gregorianToJalali(created.getFullYear(), created.getMonth() + 1, created.getDate());
      const shamsiDate = `${jy}/${jm.toString().padStart(2, "0")}/${jd.toString().padStart(2, "0")}`;
      const timeStr = `${created.getHours().toString().padStart(2, "0")}:${created.getMinutes().toString().padStart(2, "0")}`;

      return {
        "ردیف": index + 1,
        "کد سفارش": ord.id,
        "نام فروشگاه": shop ? shop.name : `فروشگاه #${ord.shopId}`,
        "شناسه فروشگاه (slug)": shop?.slug || "",
        "شماره تماس فروشگاه": shop?.phone || "-",
        "نام مشتری": ord.customerName || "-",
        "شماره تماس مشتری": ord.customerPhone || "-",
        "کد پستی مشتری": ord.customerPostalCode || "-",
        "آدرس کامل تحویل": ord.customerAddress || "-",
        "وضعیت سفارش": statusMap[ord.status || "pending"] || ord.status || "در انتظار",
        "روش ارسال": shippingMap[ord.shippingMethod] || ord.shippingMethod || "-",
        "لینک / کد رهگیری": ord.trackingLink || "-",
        "مبلغ کل سفارش (تومان)": ord.totalAmount,
        "پورسانت فروشگاه (تومان)": ord.commissionAmount || 0,
        "تاریخ ثبت (شمسی)": shamsiDate,
        "ساعت ثبت": timeStr,
        "تعداد اقلام": totalItemsCount,
        "جزئیات و شرح اقلام سفارش": itemsList,
      };
    });

    // Prepare Sheet 2: Summary by Shop
    const shopSummaryMap = new Map<number, {
      shopName: string;
      shopSlug: string;
      phone: string;
      orderCount: number;
      totalSales: number;
      totalCommission: number;
    }>();

    rawOrders.forEach((ord) => {
      const s = shopMap.get(ord.shopId);
      const current = shopSummaryMap.get(ord.shopId) || {
        shopName: s?.name || `فروشگاه #${ord.shopId}`,
        shopSlug: s?.slug || "",
        phone: s?.phone || "-",
        orderCount: 0,
        totalSales: 0,
        totalCommission: 0,
      };
      current.orderCount += 1;
      current.totalSales += ord.totalAmount || 0;
      current.totalCommission += ord.commissionAmount || 0;
      shopSummaryMap.set(ord.shopId, current);
    });

    const shopSummaryRows = Array.from(shopSummaryMap.values()).map((row, idx) => ({
      "ردیف": idx + 1,
      "نام فروشگاه": row.shopName,
      "شناسه فروشگاه (Slug)": row.shopSlug,
      "تلفن فروشگاه": row.phone,
      "تعداد سفارشات": row.orderCount,
      "مجموع فروش (تومان)": row.totalSales,
      "مجموع پورسانت متعلقه (تومان)": row.totalCommission,
    }));

    // Prepare Sheet 3: Status Breakdown
    const statusCountMap: Record<string, { count: number; totalAmount: number }> = {
      pending: { count: 0, totalAmount: 0 },
      processing: { count: 0, totalAmount: 0 },
      shipped: { count: 0, totalAmount: 0 },
      delivered: { count: 0, totalAmount: 0 },
      cancelled: { count: 0, totalAmount: 0 },
    };

    rawOrders.forEach((ord) => {
      const st = ord.status || "pending";
      if (!statusCountMap[st]) statusCountMap[st] = { count: 0, totalAmount: 0 };
      statusCountMap[st].count += 1;
      statusCountMap[st].totalAmount += ord.totalAmount || 0;
    });

    const statusSummaryRows = Object.entries(statusCountMap).map(([k, v], idx) => ({
      "ردیف": idx + 1,
      "وضعیت سفارش": statusMap[k] || k,
      "تعداد سفارش": v.count,
      "ارزش کل سفارشات (تومان)": v.totalAmount,
    }));

    // Create workbook with multiple categorized sheets
    const workbook = XLSX.utils.book_new();

    const sheet1 = XLSX.utils.json_to_sheet(detailedRows.length > 0 ? detailedRows : [{ "پیام": "هیچ سفارشی در این بازه یافت نشد" }]);
    const sheet2 = XLSX.utils.json_to_sheet(shopSummaryRows.length > 0 ? shopSummaryRows : [{ "پیام": "داده‌ای موجود نیست" }]);
    const sheet3 = XLSX.utils.json_to_sheet(statusSummaryRows);

    // Right-to-Left and styling for Persian spreadsheets
    (sheet1 as any)["!rtl"] = true;
    (sheet2 as any)["!rtl"] = true;
    (sheet3 as any)["!rtl"] = true;

    XLSX.utils.book_append_sheet(workbook, sheet1, "لیست کامل سفارش‌ها");
    XLSX.utils.book_append_sheet(workbook, sheet2, "خلاصه فروشگاه‌ها");
    XLSX.utils.book_append_sheet(workbook, sheet3, "آمار وضعیت ارسال");

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const now = new Date();
    const [ny, nm, nd] = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const fileName = `orders_backup_${ny}_${nm}_${nd}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    console.error("Backup export error:", error);
    return NextResponse.json({ error: error?.message || "خطا در تهیه فایل پشتیبان اکسل" }, { status: 500 });
  }
}
