import { useId } from "react";
export function Headphones({
  tone = "mint",
  className = "",
}: {
  tone?: "mint" | "ink" | "peach";
  className?: string;
}) {
  const id = useId().replaceAll(":", "");
  const c =
    tone === "ink"
      ? ["#6d7b81", "#172930"]
      : tone === "peach"
        ? ["#ffd4b7", "#d17f62"]
        : ["#e1f7cb", "#739e88"];
  return (
    <svg
      className={`headphone-art ${className}`}
      viewBox="0 0 420 400"
      role="img"
      aria-label={
        tone === "ink"
          ? "Fone fictício Onda Essencial, em grafite"
          : "Fone fictício Onda Pulse, com acabamento verde-sálvia"
      }
    >
      <defs>
        <linearGradient id={id} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor={c[0]} />
          <stop offset="1" stopColor={c[1]} />
        </linearGradient>
        <linearGradient id={`${id}p`}>
          <stop stopColor="#152b2c" />
          <stop offset=".5" stopColor="#3a514b" />
          <stop offset="1" stopColor="#13282a" />
        </linearGradient>
        <filter id={`${id}s`} x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="9" dy="18" stdDeviation="9" floodOpacity=".24" />
        </filter>
      </defs>
      <g transform="rotate(-19 210 210)" filter={`url(#${id}s)`}>
        <path
          d="M103 236V166C103 24 317 24 317 166V236"
          fill="none"
          stroke={`url(#${id}p)`}
          strokeWidth="42"
        />
        <path
          d="M103 216V164C103 24 317 24 317 164V216"
          fill="none"
          stroke={`url(#${id})`}
          strokeWidth="26"
        />
        <path
          d="M116 151C128 56 290 56 305 151"
          fill="none"
          stroke="#f3ffe9"
          strokeOpacity=".55"
          strokeWidth="3"
        />
        <rect
          x="85"
          y="186"
          width="34"
          height="100"
          rx="14"
          fill={`url(#${id})`}
        />
        <rect
          x="301"
          y="186"
          width="34"
          height="100"
          rx="14"
          fill={`url(#${id})`}
        />
        <rect
          x="109"
          y="203"
          width="54"
          height="132"
          rx="27"
          fill={`url(#${id}p)`}
        />
        <rect
          x="65"
          y="198"
          width="68"
          height="141"
          rx="31"
          fill={`url(#${id})`}
        />
        <rect
          x="257"
          y="203"
          width="54"
          height="132"
          rx="27"
          fill={`url(#${id}p)`}
        />
        <rect
          x="287"
          y="198"
          width="68"
          height="141"
          rx="31"
          fill={`url(#${id})`}
        />
        <path
          d="M78 227v81M300 223v83"
          stroke="#f0ffe2"
          strokeOpacity=".38"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle
          cx="320"
          cy="267"
          r="15"
          fill="none"
          stroke="#415e50"
          strokeOpacity=".45"
        />
        <path
          d="M312 269q8-12 16 0"
          fill="none"
          stroke="#415e50"
          strokeWidth="2"
        />
        <rect x="316" y="319" width="9" height="3" rx="1.5" fill="#304d43" />
      </g>
    </svg>
  );
}
export function Sneaker() {
  return (
    <svg
      viewBox="0 0 400 260"
      role="img"
      aria-label="Tênis fictício Passo, em coral e creme"
    >
      <defs>
        <linearGradient id="shoe">
          <stop stopColor="#f2b69c" />
          <stop offset="1" stopColor="#dc745e" />
        </linearGradient>
      </defs>
      <ellipse
        cx="202"
        cy="216"
        rx="153"
        ry="13"
        fill="#713b2d"
        opacity=".13"
      />
      <path
        d="M54 166 75 77q27 48 66 33l53-23 49 49 80 24q44 15 29 43H61q-24-14-7-37"
        fill="url(#shoe)"
      />
      <path
        d="m65 171 63 9 59-24 53 12 113 19-2 24H62q-17-3-15-23z"
        fill="#fff7df"
      />
      <path
        d="m158 102 41 43m-25-50 42 43m-25-49 42 43"
        stroke="#fff4df"
        strokeWidth="8"
      />
      <path
        d="m111 143 17 14 55-24"
        stroke="#9a4b3c"
        strokeWidth="9"
        fill="none"
      />
      <path d="M65 199h274" stroke="#cdbfa3" strokeWidth="2" />
    </svg>
  );
}
export function Battery() {
  return (
    <svg
      viewBox="0 0 400 280"
      role="img"
      aria-label="Bateria portátil fictícia Volt"
    >
      <defs>
        <linearGradient id="battery">
          <stop stopColor="#676e88" />
          <stop offset="1" stopColor="#222c44" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="241" rx="95" ry="12" fill="#20314a" opacity=".15" />
      <g transform="rotate(-13 200 140)">
        <rect x="124" y="32" width="150" height="207" rx="25" fill="#172235" />
        <rect
          x="116"
          y="25"
          width="150"
          height="207"
          rx="25"
          fill="url(#battery)"
        />
        <rect x="158" y="42" width="65" height="5" rx="2" fill="#131f30" />
        <text
          x="191"
          y="138"
          fontFamily="sans-serif"
          fontWeight="700"
          fontSize="28"
          textAnchor="middle"
          fill="#e8f3f6"
        >
          volt.
        </text>
        <circle cx="177" cy="192" r="3" fill="#c8f36b" />
        <circle cx="191" cy="192" r="3" fill="#c8f36b" />
        <circle cx="205" cy="192" r="3" fill="#c8f36b" />
      </g>
    </svg>
  );
}
export function Lamp() {
  return (
    <svg
      viewBox="0 0 400 280"
      role="img"
      aria-label="Kit fictício de luz e suporte"
    >
      <ellipse cx="220" cy="250" rx="115" ry="12" opacity=".1" />
      <path
        d="m209 141-2 85m0-2-55 25m55-25 55 25"
        stroke="#253c3c"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <circle
        cx="208"
        cy="92"
        r="65"
        stroke="#243a38"
        strokeWidth="15"
        fill="none"
      />
      <circle
        cx="208"
        cy="92"
        r="57"
        stroke="#fff9d6"
        strokeWidth="8"
        fill="none"
      />
      <rect x="192" y="70" width="32" height="58" rx="6" fill="#405b52" />
      <rect x="197" y="76" width="22" height="41" rx="3" fill="#b8d2bb" />
    </svg>
  );
}
