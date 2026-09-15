"use client";

import { useEffect, useMemo, useState } from "react";
import { IMAGE_PRESETS, ImagePresetName } from "@/lib/image-presets";

type Props = {
  label?: string;
  value?: string | null;
  folder: "products" | "stands" | "shops" | "banners";
  preset: ImagePresetName;
  onChange: (url: string) => void;
  onBusyChange?: (busy: boolean) => void;
};

export default function ImageUploader({ label, value, folder, preset, onChange, onBusyChange }: Props) {
  const config = IMAGE_PRESETS[preset];
  const [source, setSource] = useState("");
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState("");
  const frameStyle = useMemo(() => ({ aspectRatio: String(config.aspect) }), [config.aspect]);

  useEffect(() => () => { if (source) URL.revokeObjectURL(source); }, [source]);

  const select = (file?: File) => {
    if (!file) return;
    if (source) URL.revokeObjectURL(source);
    setSource(URL.createObjectURL(file));
    setZoom(1); setX(0); setY(0); setError("");
  };

  const cropAndUpload = async () => {
    if (!source) return;
    setError(""); setProgress(0); onBusyChange?.(true);
    try {
      const img = new Image();
      img.src = source;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = config.width; canvas.height = config.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("مرورگر امکان پردازش تصویر را ندارد");
      const cover = Math.max(config.width / img.naturalWidth, config.height / img.naturalHeight) * zoom;
      const drawWidth = img.naturalWidth * cover;
      const drawHeight = img.naturalHeight * cover;
      const availableX = Math.max(0, drawWidth - config.width) / 2;
      const availableY = Math.max(0, drawHeight - config.height) / 2;
      const drawX = (config.width - drawWidth) / 2 + (x / 100) * availableX;
      const drawY = (config.height - drawHeight) / 2 + (y / 100) * availableY;
      ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("برش تصویر انجام نشد")), "image/webp", .9));
      const form = new FormData();
      form.append("file", blob, `${preset}.webp`); form.append("folder", folder); form.append("preset", preset);
      const result = await new Promise<{ url: string }>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/uploads"); xhr.withCredentials = true;
        xhr.upload.onprogress = (event) => event.lengthComputable && setProgress(Math.round(event.loaded / event.total * 100));
        xhr.onerror = () => reject(new Error("ارتباط هنگام آپلود قطع شد"));
        xhr.onload = () => {
          const data = (() => { try { return JSON.parse(xhr.responseText); } catch { return {}; } })();
          if (xhr.status >= 200 && xhr.status < 300) resolve(data); else reject(new Error(data.error || "آپلود انجام نشد"));
        };
        xhr.send(form);
      });
      onChange(result.url); setSource(""); setProgress(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "آپلود انجام نشد"); setProgress(null);
    } finally { onBusyChange?.(false); }
  };

  return <section className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
    <div>
      <p className="text-xs font-bold text-slate-700">{label || config.label}</p>
      <p className="text-[10px] text-slate-500 mt-1">نسبت {config.width}:{config.height} — اندازه پیشنهادی {config.width}×{config.height} پیکسل</p>
    </div>
    {!source && <label className="block cursor-pointer rounded-lg bg-white border border-dashed border-slate-300 p-3 text-center text-xs text-slate-600">
      انتخاب و برش تصویر
      <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="hidden" onChange={(e) => { select(e.target.files?.[0]); e.currentTarget.value = ""; }} />
    </label>}
    {source && <>
      <div className="relative overflow-hidden rounded-lg bg-slate-200 w-full" style={frameStyle}>
        <img src={source} alt="پیش‌نمایش برش" className="absolute inset-0 w-full h-full object-cover" style={{ transform: `scale(${zoom}) translate(${x / 2}%, ${y / 2}%)` }} />
      </div>
      <label className="block text-[10px]">بزرگ‌نمایی<input className="w-full" type="range" min="1" max="3" step="0.05" value={zoom} onChange={(e) => setZoom(Number(e.target.value))}/></label>
      <div className="grid grid-cols-2 gap-2"><label className="text-[10px]">افقی<input className="w-full" type="range" min="-100" max="100" value={x} onChange={(e) => setX(Number(e.target.value))}/></label><label className="text-[10px]">عمودی<input className="w-full" type="range" min="-100" max="100" value={y} onChange={(e) => setY(Number(e.target.value))}/></label></div>
      <div className="grid grid-cols-2 gap-2"><button type="button" onClick={cropAndUpload} className="rounded-lg bg-rose-500 text-white py-2 text-xs font-bold">تأیید و آپلود</button><button type="button" onClick={() => setSource("")} className="rounded-lg bg-white py-2 text-xs">انصراف</button></div>
    </>}
    {progress !== null && <div className="text-[10px] text-slate-600">در حال آپلود: {progress}٪<div className="h-1 bg-slate-200 rounded mt-1"><div className="h-full bg-rose-500 rounded" style={{ width: `${progress}%` }}/></div></div>}
    {error && <p className="text-[10px] text-red-600">{error}</p>}
    {value && !source && <div className="space-y-2"><div className="overflow-hidden rounded-lg bg-white" style={frameStyle}><img src={value} alt="تصویر ذخیره‌شده" className="w-full h-full object-cover" /></div><button type="button" onClick={() => onChange("")} className="text-[10px] text-red-600">حذف تصویر</button></div>}
  </section>;
}
