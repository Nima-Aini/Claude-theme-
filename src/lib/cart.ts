"use client";

import { useSyncExternalStore, useCallback } from "react";

export type CartItem = {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  image: string | null;
  isBestseller?: boolean;
  stock?: number;
  quantity: number;
};

const CART_EVENT = "akma_cart_synced";
const memoryCache: Record<string, { raw: string | null; parsed: CartItem[] }> = {};

export function getLocalCart(slug: string): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`cart_${slug}`);
    if (memoryCache[slug] && memoryCache[slug].raw === raw) {
      return memoryCache[slug].parsed;
    }
    const parsed = raw ? JSON.parse(raw) : [];
    memoryCache[slug] = { raw, parsed };
    return parsed;
  } catch {
    return [];
  }
}

export function saveLocalCart(slug: string, items: CartItem[]): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(items);
    localStorage.setItem(`cart_${slug}`, serialized);
    memoryCache[slug] = { raw: serialized, parsed: items };
    window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { slug, items } }));
  } catch (e) {
    console.error("Cart save error:", e);
  }
}

function subscribeToCart(slug: string, callback: () => void) {
  const handleCustomSync = (e: Event) => {
    const customEvent = e as CustomEvent<{ slug: string; items: CartItem[] }>;
    if (customEvent.detail && customEvent.detail.slug === slug) {
      callback();
    }
  };

  const handleStorage = (e: StorageEvent) => {
    if (e.key === `cart_${slug}`) {
      delete memoryCache[slug];
      callback();
    }
  };

  window.addEventListener(CART_EVENT, handleCustomSync);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CART_EVENT, handleCustomSync);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useCart(slug: string) {
  const subscribe = useCallback(
    (onStoreChange: () => void) => subscribeToCart(slug, onStoreChange),
    [slug]
  );

  const getSnapshot = useCallback(() => getLocalCart(slug), [slug]);
  const getServerSnapshot = useCallback(() => [], []);

  const cart = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const updateCart = useCallback(
    (newItems: CartItem[]) => {
      saveLocalCart(slug, newItems);
    },
    [slug]
  );

  const addItem = useCallback(
    (item: { id: number; name: string; price: number; image?: string | null; description?: string | null; isBestseller?: boolean; stock?: number }, qty: number = 1) => {
      const current = getLocalCart(slug);
      const existingIndex = current.findIndex((i) => i.id === item.id);
      let updated: CartItem[];

      if (existingIndex > -1) {
        updated = current.map((i, idx) =>
          idx === existingIndex ? { ...i, quantity: i.quantity + qty } : i
        );
      } else {
        updated = [
          ...current,
          {
            id: item.id,
            name: item.name,
            price: item.price,
            image: item.image || null,
            description: item.description || null,
            isBestseller: item.isBestseller,
            stock: item.stock,
            quantity: qty,
          },
        ];
      }
      updateCart(updated);
      return updated;
    },
    [slug, updateCart]
  );

  const setItemQuantity = useCallback(
    (productId: number, qty: number) => {
      const current = getLocalCart(slug);
      if (qty <= 0) {
        const updated = current.filter((i) => i.id !== productId);
        updateCart(updated);
        return;
      }
      const updated = current.map((i) => (i.id === productId ? { ...i, quantity: qty } : i));
      updateCart(updated);
    },
    [slug, updateCart]
  );

  const removeItem = useCallback(
    (productId: number) => {
      const current = getLocalCart(slug);
      const updated = current.filter((i) => i.id !== productId);
      updateCart(updated);
    },
    [slug, updateCart]
  );

  const clear = useCallback(() => {
    updateCart([]);
  }, [updateCart]);

  const totalCount = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalAmount = cart.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);

  return {
    cart,
    addItem,
    setItemQuantity,
    removeItem,
    clear,
    totalCount,
    totalAmount,
  };
}
