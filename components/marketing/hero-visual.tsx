"use client";

import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Package, Star } from "lucide-react";

/**
 * Hero composition: a branded SwiftLogix van in front of a Lagos-style
 * skyline (with the cable-stayed Lekki-Ikoyi link bridge), plus a live
 * tracking card. Drawn in SVG so it stays sharp and loads instantly.
 * Swap the scene for photography by placing images in /public/images.
 */
export function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[600px]">
      <div className="relative aspect-[5/4] overflow-hidden rounded-[22px] bg-navy shadow-pop">
        <svg viewBox="0 0 500 400" className="absolute inset-0 size-full" aria-label="SwiftLogix delivery van driving through Lagos at dusk" role="img">
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0d1f33" />
              <stop offset="60%" stopColor="#1f3d5c" />
              <stop offset="100%" stopColor="#c98a3a" />
            </linearGradient>
            <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a4a6b" />
              <stop offset="100%" stopColor="#142C45" />
            </linearGradient>
            <linearGradient id="road" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b3b4c" />
              <stop offset="100%" stopColor="#1a2735" />
            </linearGradient>
            <linearGradient id="van" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#e6ecf1" />
            </linearGradient>
          </defs>
          <rect width="500" height="400" fill="url(#sky)" />
          <circle cx="395" cy="215" r="34" fill="#F2B84B" opacity="0.55" />
          {/* far skyline */}
          <g fill="#17324d">
            <rect x="0" y="190" width="40" height="70" />
            <rect x="34" y="160" width="26" height="100" />
            <rect x="62" y="175" width="34" height="85" />
            <rect x="98" y="130" width="22" height="130" />
            <rect x="122" y="150" width="38" height="110" />
            <rect x="300" y="140" width="30" height="120" />
            <rect x="332" y="168" width="40" height="92" />
            <rect x="430" y="150" width="28" height="110" />
            <rect x="460" y="182" width="40" height="78" />
          </g>
          {/* near towers with lit windows */}
          <g>
            <rect x="168" y="96" width="44" height="164" fill="#122a42" />
            <path d="M168 96 L190 80 L212 96Z" fill="#122a42" />
            <rect x="218" y="122" width="56" height="138" fill="#0f2338" />
            <rect x="376" y="112" width="46" height="148" fill="#122a42" />
            <g fill="#F2B84B" opacity="0.75">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((r) =>
                [0, 1, 2].map((c) => ((r + c) % 3 !== 0 ? <rect key={`a${r}${c}`} x={174 + c * 13} y={106 + r * 18} width="6" height="8" /> : null)),
              )}
              {[0, 1, 2, 3, 4, 5, 6].map((r) =>
                [0, 1, 2, 3].map((c) => ((r * 2 + c) % 4 !== 1 ? <rect key={`b${r}${c}`} x={225 + c * 12} y={132 + r * 18} width="5" height="8" opacity={0.8} /> : null)),
              )}
              {[0, 1, 2, 3, 4, 5, 6].map((r) => [0, 1, 2].map((c) => ((r + c * 2) % 3 !== 2 ? <rect key={`c${r}${c}`} x={383 + c * 13} y={124 + r * 19} width="6" height="8" /> : null)))}
            </g>
          </g>
          {/* lagoon */}
          <rect y="258" width="500" height="44" fill="url(#water)" />
          <g stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1.5">
            <path d="M20 272 h40 M120 282 h60 M260 270 h30 M340 286 h70 M430 276 h40" />
          </g>
          {/* cable-stayed bridge */}
          <g stroke="#e7edf2" strokeOpacity="0.85" fill="none">
            <path d="M0 262 Q250 250 500 262" strokeWidth="4" />
            <path d="M282 262 L282 186" strokeWidth="5" />
            <path d="M282 192 L230 258 M282 196 L244 258 M282 200 L258 258 M282 192 L334 258 M282 196 L320 258 M282 200 L306 258" strokeWidth="1.2" />
          </g>
          {/* road */}
          <rect y="300" width="500" height="100" fill="url(#road)" />
          <g fill="#F2B84B" opacity="0.8">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect key={i} x={10 + i * 75} y="352" width="40" height="5" rx="2.5" />
            ))}
          </g>
          {/* speed lines */}
          <g stroke="#16A477" strokeLinecap="round" strokeWidth="4">
            <path d="M150 318 h62" opacity="0.9" />
            <path d="M128 334 h72" opacity="0.6" />
            <path d="M168 302 h38" opacity="0.4" />
          </g>
          {/* van */}
          <g transform="translate(232 236)">
            <ellipse cx="128" cy="110" rx="128" ry="9" fill="#000" opacity="0.35" />
            <path d="M8 34 Q8 18 24 18 H178 Q190 18 196 28 L224 64 Q236 66 240 78 V98 Q240 104 234 104 H14 Q8 104 8 98Z" fill="url(#van)" />
            <path d="M184 30 L210 64 H178 V34 Q178 30 184 30Z" fill="#9fc2dd" />
            <rect x="8" y="70" width="232" height="10" fill="#142C45" />
            <rect x="8" y="80" width="232" height="6" fill="#16A477" />
            <g transform="translate(26 32) scale(0.62)">
              <rect x="1" y="13" width="12" height="3.4" rx="1.7" fill="#16A477" />
              <rect x="4" y="19.6" width="9" height="3.4" rx="1.7" fill="#16A477" opacity="0.75" />
              <path d="M31 3.5c-8.6 0-15.5 6.8-15.5 15.2C15.5 29.5 31 44.5 31 44.5s15.5-15 15.5-25.8C46.5 10.3 39.6 3.5 31 3.5Z" fill="#142C45" />
              <circle cx="31" cy="18.7" r="8.6" fill="#16A477" />
              <path d="m28.2 13.6 5.6 5.1-5.6 5.1" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <text x="62" y="52" fontFamily="Plus Jakarta Sans Variable, sans-serif" fontWeight="800" fontSize="22" letterSpacing="-0.5">
              <tspan fill="#142C45">Swift</tspan>
              <tspan fill="#16A477">Logix</tspan>
            </text>
            <text x="63" y="64" fontFamily="Plus Jakarta Sans Variable, sans-serif" fontWeight="600" fontSize="7.5" fill="#718096" letterSpacing="1.4">
              DELIVERING MORE, FASTER.
            </text>
            <rect x="232" y="82" width="8" height="8" rx="2" fill="#F2B84B" />
            <circle cx="58" cy="104" r="17" fill="#0d1f33" />
            <circle cx="58" cy="104" r="7" fill="#a9b6c3" />
            <circle cx="196" cy="104" r="17" fill="#0d1f33" />
            <circle cx="196" cy="104" r="7" fill="#a9b6c3" />
          </g>
        </svg>
      </div>

      {/* tracking card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="relative z-10 mx-auto -mt-6 w-[270px] rounded-xl border border-line bg-white p-4 shadow-pop sm:absolute sm:-bottom-8 sm:-left-10 sm:mx-0 sm:mt-0 sm:w-[280px]"
      >
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold tracking-wide text-muted uppercase">Live tracking</span>
          <span className="rounded-full bg-emerald-tint px-2 py-0.5 text-[11px] font-bold text-emerald-deep">In transit</span>
        </div>
        <p className="mt-1 text-sm font-extrabold text-navy">SLX-7K4QPM</p>
        <div className="mt-3 space-y-2.5">
          <div className="flex items-start gap-2.5">
            <span className="mt-0.5 inline-flex size-5 items-center justify-center rounded-full bg-navy">
              <span className="size-1.5 rounded-full bg-white" />
            </span>
            <div>
              <p className="text-xs font-semibold text-ink">Allen Avenue, Ikeja</p>
              <p className="text-[11px] text-muted">Picked up 10:42 AM</p>
            </div>
          </div>
          <div className="ml-2.5 h-3 border-l-2 border-dashed border-emerald" />
          <div className="flex items-start gap-2.5">
            <MapPin className="mt-0.5 size-5 text-emerald" />
            <div>
              <p className="text-xs font-semibold text-ink">Admiralty Way, Lekki</p>
              <p className="text-[11px] text-muted">Arriving in ~24 min</p>
            </div>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line">
          <motion.div className="h-full rounded-full bg-emerald" initial={{ width: "20%" }} animate={{ width: "68%" }} transition={{ delay: 0.8, duration: 1.4, ease: "easeOut" }} />
        </div>
      </motion.div>

      {/* rider chip */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="absolute -top-5 right-3 flex items-center gap-2.5 rounded-xl border border-line bg-white p-2.5 pr-3.5 shadow-raised sm:-right-6"
      >
        <span className="inline-flex size-9 items-center justify-center rounded-full bg-amber text-sm font-extrabold text-navy">CE</span>
        <div>
          <p className="text-xs font-bold text-ink">Chinedu E.</p>
          <p className="flex items-center gap-1 text-[11px] text-muted">
            <Star className="size-3 fill-amber text-amber" /> 4.9 · Verified rider
          </p>
        </div>
      </motion.div>

      {/* delivered chip */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.75, duration: 0.5 }}
        className="absolute right-3 -bottom-5 hidden items-center gap-2 rounded-full bg-navy px-3.5 py-2 text-xs font-semibold text-white shadow-raised sm:flex"
      >
        <CheckCircle2 className="size-4 text-emerald" /> PIN-verified delivery
        <Package className="size-4 text-white/50" />
      </motion.div>
    </div>
  );
}
