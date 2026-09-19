const ENAMAD_ID = "7452237";
const ENAMAD_CODE = "P60yaoafM9r9twpvfb1fhmxsak1by8uF";
const ENAMAD_URL = `https://trustseal.enamad.ir/?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;
const ENAMAD_LOGO_URL = `https://trustseal.enamad.ir/logo.aspx?id=${ENAMAD_ID}&Code=${ENAMAD_CODE}`;

type Props = {
  className?: string;
  label?: string;
};

export default function EnamadBadge({ className = "", label = "مشاهده اعتبار نماد اعتماد الکترونیکی" }: Props) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <a
        href={ENAMAD_URL}
        target="_blank"
        rel="noopener noreferrer"
        referrerPolicy="origin"
        aria-label={label}
        className="inline-flex max-w-full items-center justify-center rounded-2xl bg-white p-2 transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      >
        {/* The official trust-seal endpoint is dynamic and must be loaded as a plain image. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ENAMAD_LOGO_URL}
          alt="نماد اعتماد الکترونیکی"
          referrerPolicy="origin"
          className="h-auto max-h-28 w-auto max-w-[120px] object-contain"
        />
      </a>
      <span className="text-center text-[10px] font-bold text-slate-500">نماد اعتماد الکترونیکی</span>
    </div>
  );
}
