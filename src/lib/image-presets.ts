export type ImagePreset = { label: string; width: number; height: number; aspect: number; preview: "square" | "wide" };

export const IMAGE_PRESETS = {
  product: { label: "تصویر محصول", width: 1080, height: 1080, aspect: 1, preview: "square" },
  shop: { label: "لوگو فروشگاه", width: 800, height: 800, aspect: 1, preview: "square" },
  sliderDesktop: { label: "اسلایدر دسکتاپ", width: 1600, height: 900, aspect: 16 / 9, preview: "wide" },
  sliderMobile: { label: "اسلایدر موبایل", width: 1080, height: 608, aspect: 16 / 9, preview: "wide" },
  bottomDesktop: { label: "بنر پایین دسکتاپ", width: 1600, height: 500, aspect: 16 / 5, preview: "wide" },
  bottomMobile: { label: "بنر پایین موبایل", width: 1080, height: 338, aspect: 16 / 5, preview: "wide" },
  shopBannerDesktop: { label: "بنر فروشگاه", width: 1600, height: 600, aspect: 8 / 3, preview: "wide" },
  shopBannerMobile: { label: "بنر موبایل فروشگاه", width: 1080, height: 540, aspect: 2, preview: "wide" },
} as const satisfies Record<string, ImagePreset>;

export type ImagePresetName = keyof typeof IMAGE_PRESETS;
