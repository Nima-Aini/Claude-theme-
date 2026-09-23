import type {} from "react";

declare module "react" {
  interface ImgHTMLAttributes<T> {
    code?: string;
  }
}

export default function EnamadBadge() {
  return (
    <div className="flex max-w-full items-center justify-center overflow-hidden [&_img]:h-auto [&_img]:max-h-28 [&_img]:max-w-[120px] [&_img]:object-contain">
      <a
        referrerPolicy="origin"
        target="_blank"
        href="https://trustseal.enamad.ir/?id=7452237&Code=P60yaoafM9r9twpvfb1fhmxsak1by8uF"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          referrerPolicy="origin"
          src="https://trustseal.enamad.ir/logo.aspx?id=7452237&Code=P60yaoafM9r9twpvfb1fhmxsak1by8uF"
          alt=""
          style={{ cursor: "pointer" }}
          code="P60yaoafM9r9twpvfb1fhmxsak1by8uF"
        />
      </a>
    </div>
  );
}
