"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { Zap, Activity, ShieldAlert, ArrowRight, ExternalLink } from "lucide-react";

// ─── Utility ──────────────────────────────────────────────────────────────────

function useScrollFade(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return { ref, inView };
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function TapeReaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      {/* Inline SVG: candlestick cut by a lightning bolt */}
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Candlestick wick top */}
        <line x1="7" y1="2" x2="7" y2="6" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
        {/* Candlestick body (bearish, red) */}
        <rect x="4" y="6" width="6" height="10" rx="0.5" fill="#ef4444" opacity="0.85" />
        {/* Candlestick wick bottom */}
        <line x1="7" y1="16" x2="7" y2="20" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />

        {/* Candlestick wick top (bullish) */}
        <line x1="17" y1="5" x2="17" y2="9" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
        {/* Candlestick body (bullish, green) */}
        <rect x="14" y="9" width="6" height="8" rx="0.5" fill="#34d399" opacity="0.85" />
        {/* Candlestick wick bottom */}
        <line x1="17" y1="17" x2="17" y2="22" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />

        {/* Lightning bolt cutting through — white/neon */}
        <polyline
          points="16,2 11,14 15,14 10,26"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className="font-mono font-bold text-base tracking-[0.18em] text-white uppercase group-hover:text-zinc-300 transition-colors">
        TapeReader
      </span>
    </Link>
  );
}

// ─── Scanline Texture ─────────────────────────────────────────────────────────

function Scanlines() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.022]"
      style={{
        backgroundImage:
          "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,255,255,0.18) 2px,rgba(255,255,255,0.18) 4px)",
      }}
    />
  );
}

// ─── Grid Background ─────────────────────────────────────────────────────────

function GridBg() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 opacity-[0.04]"
      style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
        backgroundSize: "48px 48px",
      }}
    />
  );
}

// ─── The Sentinel (Wireframe Icosahedron) ─────────────────────────────────────

const ICOSA_EDGES: [number, number][] = [
  // Top cap
  [0,1],[0,2],[0,3],[0,4],[0,5],
  // Upper ring
  [1,2],[2,3],[3,4],[4,5],[5,1],
  // Cross connections upper→lower
  [1,6],[1,7],[2,7],[2,8],[3,8],[3,9],[4,9],[4,10],[5,10],[5,6],
  // Lower ring
  [6,7],[7,8],[8,9],[9,10],[10,6],
  // Bottom cap
  [11,6],[11,7],[11,8],[11,9],[11,10],
];

function project3D(
  x: number, y: number, z: number,
  rotX: number, rotY: number,
  cx: number, cy: number,
  scale: number,
  fov: number
): [number, number, number] {
  // rotY
  const cosY = Math.cos(rotY), sinY = Math.sin(rotY);
  const x1 = x * cosY - z * sinY;
  const z1 = x * sinY + z * cosY;
  // rotX
  const cosX = Math.cos(rotX), sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;
  // perspective
  const d = fov / (fov + z2 + 2);
  return [cx + x1 * scale * d, cy + y2 * scale * d, z2];
}

function icosaVertices(): [number, number, number][] {
  const phi = (1 + Math.sqrt(5)) / 2;
  const raw: [number, number, number][] = [
    [0, 1, phi],[0,-1, phi],[0, 1,-phi],[0,-1,-phi],
    [1, phi, 0],[-1, phi, 0],[1,-phi, 0],[-1,-phi, 0],
    [phi, 0, 1],[phi, 0,-1],[-phi, 0, 1],[-phi, 0,-1],
  ];
  // Normalize
  const len = Math.sqrt(1 + phi * phi);
  return raw.map(([x,y,z]) => [x/len, y/len, z/len]);
}

const VERTS = icosaVertices();
const ICOSA_EDGES_FULL: [number,number][] = [];
for (let i = 0; i < VERTS.length; i++) {
  for (let j = i+1; j < VERTS.length; j++) {
    const [x1,y1,z1] = VERTS[i];
    const [x2,y2,z2] = VERTS[j];
    const d = Math.sqrt((x2-x1)**2+(y2-y1)**2+(z2-z1)**2);
    // edges have length ~1.051 in normalized icosahedron
    if (d < 1.1) ICOSA_EDGES_FULL.push([i,j]);
  }
}

function SentinelWireframe() {
  const size = 260;
  const cx = size / 2, cy = size / 2;
  const scale = 90;
  const fov = 6;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* Glow behind */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.07) 0%, transparent 70%)",
          filter: "blur(18px)",
        }}
      />

      <motion.svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        xmlns="http://www.w3.org/2000/svg"
        style={{
          filter: "drop-shadow(0 0 8px rgba(255,255,255,0.12))",
        }}
        animate={{
          rotateY: [0, 360],
          rotateX: [8, 22, 8],
        }}
        transition={{
          rotateY: { duration: 18, repeat: Infinity, ease: "linear" },
          rotateX: { duration: 9, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        {/* We render statically; the parent motion.svg handles CSS 3D */}
        {/* Static wireframe at rotX=15°, rotY=20° as baseline */}
        {(() => {
          const rx = 0.26, ry = 0.35;
          const projected = VERTS.map(([x,y,z]) => project3D(x,y,z,rx,ry,cx,cy,scale,fov));
          return ICOSA_EDGES_FULL.map(([a,b], i) => {
            const [ax,ay,az] = projected[a];
            const [bx,by,bz] = projected[b];
            const avgZ = (az + bz) / 2;
            // depth-based opacity
            const opacity = 0.18 + 0.62 * ((avgZ + 1) / 2);
            return (
              <line
                key={i}
                x1={ax} y1={ay} x2={bx} y2={by}
                stroke="white"
                strokeWidth="0.8"
                strokeOpacity={opacity}
                strokeLinecap="round"
              />
            );
          });
        })()}

        {/* Vertex dots */}
        {(() => {
          const rx = 0.26, ry = 0.35;
          return VERTS.map(([x,y,z], i) => {
            const [px,py,pz] = project3D(x,y,z,rx,ry,cx,cy,scale,fov);
            const opacity = 0.2 + 0.6 * ((pz + 1) / 2);
            return (
              <circle
                key={i}
                cx={px} cy={py} r={1.4}
                fill="white"
                fillOpacity={opacity}
              />
            );
          });
        })()}
      </motion.svg>

      {/* Rotating ring around sentinel */}
      <motion.div
        className="absolute inset-0 rounded-full border border-white/5"
        animate={{ rotate: 360 }}
        transition={{ duration: 24, repeat: Infinity, ease: "linear" }}
        style={{ borderStyle: "dashed" }}
      />

      {/* Pulsing outer ring */}
      <motion.div
        className="absolute rounded-full border border-white/10"
        animate={{ scale: [1, 1.12, 1], opacity: [0.5, 0.1, 0.5] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ inset: -20 }}
      />
    </motion.div>
  );
}

// ─── Animated Section Wrapper ────────────────────────────────────────────────

function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useScrollFade();
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-black/80 backdrop-blur-md">
      <nav className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <TapeReaderLogo />
        <div className="flex items-center gap-6">
          <a
            href="https://github.com/nexuzz14/tapereader#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 font-mono text-xs text-zinc-500 hover:text-zinc-200 transition-colors tracking-wider"
          >
            <ExternalLink className="w-3 h-3" />
            Documentation
          </a>
          <Link
            href="/dashboard"
            className="group flex items-center gap-2 font-mono text-xs font-bold tracking-widest text-black bg-white hover:bg-zinc-200 px-4 py-2 rounded-lg transition-colors uppercase"
          >
            Open Terminal
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </nav>
    </header>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  const { scrollY } = useScroll();
  const sentinelY = useTransform(scrollY, [0, 400], [0, 40]);

  return (
    <section className="relative min-h-screen flex items-center pt-14">
      {/* Ambient center glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 70% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-6 w-full py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        {/* Left — Text */}
        <div className="space-y-8">
          {/* Status badge */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 border border-emerald-800/60 bg-emerald-950/30 rounded-full px-3 py-1"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono text-[10px] text-emerald-400 tracking-widest uppercase">
              Gemini 2.5 Flash · Live
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="font-mono font-black text-4xl sm:text-5xl xl:text-6xl text-white leading-[1.05] tracking-tight"
          >
            Cut the Noise.
            <br />
            <span className="text-zinc-400">Trade the</span>{" "}
            <span
              className="relative inline-block"
              style={{
                WebkitTextStroke: "1px rgba(255,255,255,0.6)",
                color: "transparent",
              }}
            >
              Signal.
            </span>
          </motion.h1>

          {/* Sub-headline */}
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="font-mono text-sm text-zinc-400 leading-relaxed max-w-md"
          >
            AI-Powered Tape Reading untuk Scalper & Day Trader. Ekstrak sentimen
            dan katalis langsung dari prospektus dalam hitungan detik.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap items-center gap-4"
          >
            <Link
              href="/dashboard"
              className="group relative overflow-hidden inline-flex items-center gap-2 font-mono text-sm font-bold tracking-widest uppercase bg-white text-black px-6 py-3 rounded-xl hover:bg-zinc-100 transition-colors"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-black/10 to-transparent" />
              <Zap className="w-4 h-4" />
              Launch Terminal
            </Link>
            <span className="font-mono text-xs text-zinc-600">
              No sign-up required · Instant analysis
            </span>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex gap-8 pt-2 border-t border-zinc-900"
          >
            {[
              { value: "<3s", label: "Analysis Time" },
              { value: "4", label: "Output Signals" },
              { value: "100", label: "Score Precision" },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="font-mono font-black text-xl text-white">{value}</div>
                <div className="font-mono text-[10px] text-zinc-600 tracking-wider uppercase mt-0.5">{label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Right — The Sentinel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ y: sentinelY }}
          className="flex flex-col items-center gap-4 justify-center"
        >
          <SentinelWireframe />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="font-mono text-[10px] text-zinc-700 tracking-[0.3em] uppercase"
          >
            THE SENTINEL · ALWAYS WATCHING
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div
        aria-hidden
        className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, transparent, #000)" }}
      />
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: Zap,
    title: "Instant Sentiment",
    tag: "01",
    desc: "Bukan narasi, bukan opini. Hanya sinyal aksi langsung: Pantau, Naik, atau Koreksi — diproses dalam satu pemindaian AI.",
    accent: "text-yellow-400",
    border: "hover:border-yellow-800/50",
  },
  {
    icon: Activity,
    title: "Catalyst Extraction",
    tag: "02",
    desc: "TapeReader menemukan kata kunci penggerak harga dari teks mentah — dari guidance laba hingga kata-kata terlarang di prospektus.",
    accent: "text-emerald-400",
    border: "hover:border-emerald-800/50",
  },
  {
    icon: ShieldAlert,
    title: "Volatility Risk",
    tag: "03",
    desc: "Mitigasi risiko sebelum pasar buka. Skor Rendah–Ekstrem memperingatkan Anda sebelum harga bergerak terlalu liar.",
    accent: "text-red-400",
    border: "hover:border-red-800/50",
  },
];

function FeaturesSection() {
  return (
    <section className="relative py-28 bg-black">
      <div className="mx-auto max-w-6xl px-6">
        <FadeIn className="mb-16 space-y-2">
          <p className="font-mono text-[10px] text-zinc-600 tracking-[0.3em] uppercase">
            Core Modules
          </p>
          <h2 className="font-mono font-black text-2xl sm:text-3xl text-white tracking-tight">
            Tiga Sinyal. Satu Keputusan.
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-zinc-900">
          {FEATURES.map(({ icon: Icon, title, tag, desc, accent, border }, i) => (
            <FadeIn key={title} delay={i * 0.1}>
              <div
                className={`group relative bg-black p-8 border border-transparent ${border} transition-colors duration-300 h-full`}
              >
                {/* Tag */}
                <div className="font-mono text-[10px] text-zinc-700 tracking-widest mb-6">
                  [{tag}]
                </div>
                {/* Icon */}
                <div className={`mb-5 ${accent}`}>
                  <Icon className="w-6 h-6" strokeWidth={1.5} />
                </div>
                {/* Title */}
                <h3 className="font-mono font-bold text-sm text-white tracking-wide mb-3">
                  {title}
                </h3>
                {/* Desc */}
                <p className="font-mono text-xs text-zinc-500 leading-relaxed">
                  {desc}
                </p>
                {/* Bottom accent line on hover */}
                <div
                  className={`absolute bottom-0 left-8 right-8 h-px bg-gradient-to-r from-transparent ${accent.replace("text-", "via-")} to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                />
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Section ──────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="relative py-36 bg-black overflow-hidden">
      {/* Background grid tighter */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Center glow */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(255,255,255,0.05) 0%, transparent 70%)",
        }}
      />

      <div className="relative mx-auto max-w-3xl px-6 text-center space-y-10">
        <FadeIn>
          <p className="font-mono text-[10px] text-zinc-600 tracking-[0.3em] uppercase mb-4">
            Ready to Deploy
          </p>
          <h2 className="font-mono font-black text-3xl sm:text-4xl xl:text-5xl text-white leading-tight tracking-tight">
            Siap mengalahkan
            <br />
            <span className="text-zinc-500">pasar hari ini?</span>
          </h2>
        </FadeIn>

        <FadeIn delay={0.15}>
          <Link
            href="/dashboard"
            className="group relative inline-flex items-center gap-3 font-mono text-base font-black tracking-widest uppercase border border-white/20 text-white px-10 py-5 rounded-2xl hover:border-white/60 hover:bg-white/5 transition-all duration-300 overflow-hidden"
          >
            {/* Shimmer */}
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/8 to-transparent" />
            <Zap className="w-5 h-5 text-emerald-400" />
            Launch TapeReader Terminal
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </FadeIn>

        <FadeIn delay={0.25}>
          <p className="font-mono text-[10px] text-zinc-700 tracking-wider">
            POWERED BY GEMINI 2.5 Flash · NO SIGN-UP · INSTANT ANALYSIS
          </p>
        </FadeIn>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-zinc-900 py-8 px-6 bg-black">
      <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <TapeReaderLogo />
        <p className="font-mono text-[10px] text-zinc-700 tracking-wider">
          © {new Date().getFullYear()} TAPEREADER · FOR INFORMATIONAL PURPOSES ONLY
        </p>
        <div className="flex items-center gap-1 font-mono text-[10px] text-zinc-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
          ALL SYSTEMS OPERATIONAL
        </div>
      </div>
    </footer>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="bg-black text-white min-h-screen">
      <Scanlines />
      <GridBg />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
}