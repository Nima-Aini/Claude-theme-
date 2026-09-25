"use client";

import { useEffect } from "react";

export default function ClearPaidCart({ slug, orderId }: { slug: string; orderId: number }) {
  useEffect(() => {
    if (sessionStorage.getItem(`payment_order_${slug}`) === String(orderId)) {
      localStorage.removeItem(`cart_${slug}`);
      sessionStorage.removeItem(`payment_order_${slug}`);
    }
  }, [slug, orderId]);
  return null;
}
