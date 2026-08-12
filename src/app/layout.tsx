import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "AKMA Store",
  description: "فروشگاه اینترنتی محصولات آکما",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#FAFAFA" />
      </head>
      <body className="bg-[#FAFAFA] text-gray-900 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
