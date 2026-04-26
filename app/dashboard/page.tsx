"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Eye,
  AlertTriangle,
  Activity,
  ChevronRight,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { analyzeSentiment, type SentimentResponse } from "../actions/gemini";

// ─────────────────────────────────────────────────────────────────────────────
// SHARED LOGO — identik dengan Landing Page (Fix #1)
// ─────────────────────────────────────────────────────────────────────────────

function TapeReaderLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5 group">
      <svg
        width="26"
        height="26"
        viewBox="0 0 28 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        {/* Bearish candle */}
        <line x1="7" y1="2" x2="7" y2="6" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="4" y="6" width="6" height="10" rx="0.5" fill="#ef4444" opacity="0.85" />
        <line x1="7" y1="16" x2="7" y2="20" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
        {/* Bullish candle */}
        <line x1="17" y1="5" x2="17" y2="9" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="14" y="9" width="6" height="8" rx="0.5" fill="#34d399" opacity="0.85" />
        <line x1="17" y1="17" x2="17" y2="22" stroke="#a1a1aa" strokeWidth="1.5" strokeLinecap="round" />
        {/* Lightning bolt — memotong kedua candle */}
        <polyline
          points="16,2 11,14 15,14 10,26"
          stroke="#ffffff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      <span className="font-mono font-bold text-sm tracking-[0.18em] text-white uppercase group-hover:text-zinc-300 transition-colors">
        TapeReader
      </span>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCANLINE TEXTURE
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// SENTINEL STANDBY — versi mini untuk panel kanan saat idle (Fix #2)
// ─────────────────────────────────────────────────────────────────────────────

function icosaVertices(): [number, number, number][] {
  const phi = (1 + Math.sqrt(5)) / 2;
  const raw: [number, number, number][] = [
    [0, 1, phi],[0,-1, phi],[0, 1,-phi],[0,-1,-phi],
    [1, phi, 0],[-1, phi, 0],[1,-phi, 0],[-1,-phi, 0],
    [phi, 0, 1],[phi, 0,-1],[-phi, 0, 1],[-phi, 0,-1],
  ];
  const len = Math.sqrt(1 + phi * phi);
  return raw.map(([x, y, z]) => [x / len, y / len, z / len]);
}

const VERTS = icosaVertices();
const EDGES: [number, number][] = [];
for (let i = 0; i < VERTS.length; i++) {
  for (let j = i + 1; j < VERTS.length; j++) {
    const [x1, y1, z1] = VERTS[i];
    const [x2, y2, z2] = VERTS[j];
    if (Math.sqrt((x2-x1)**2+(y2-y1)**2+(z2-z1)**2) < 1.1) EDGES.push([i, j]);
  }
}

function project(x: number, y: number, z: number, rx: number, ry: number, cx: number, cy: number, scale: number) {
  const cosY = Math.cos(ry), sinY = Math.sin(ry);
  const x1 = x * cosY - z * sinY, z1 = x * sinY + z * cosY;
  const cosX = Math.cos(rx), sinX = Math.sin(rx);
  const y2 = y * cosX - z1 * sinX, z2 = y * sinX + z1 * cosX;
  const d = 6 / (6 + z2 + 2);
  return [cx + x1 * scale * d, cy + y2 * scale * d, z2] as [number, number, number];
}

function SentinelStandby() {
  const size = 160;
  const cx = size / 2, cy = size / 2, scale = 54;
  const rx = 0.26, ry = 0.35;
  const projected = VERTS.map(([x, y, z]) => project(x, y, z, rx, ry, cx, cy, scale));

  return (
    <div className="flex flex-col items-center justify-center gap-6 h-full py-16 select-none">
      {/* Outer pulse rings */}
      <div className="relative flex items-center justify-center">
        <motion.div
          className="absolute rounded-full border border-white/5"
          animate={{ scale: [1, 1.18, 1], opacity: [0.4, 0.08, 0.4] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: size + 48, height: size + 48 }}
        />
        <motion.div
          className="absolute rounded-full border border-white/[0.07]"
          animate={{ scale: [1, 1.1, 1], opacity: [0.6, 0.12, 0.6] }}
          transition={{ duration: 3.5, delay: 0.8, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: size + 24, height: size + 24 }}
        />

        {/* Glow */}
        <div
          className="absolute rounded-full"
          style={{
            width: size, height: size,
            background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)",
            filter: "blur(12px)",
          }}
        />

        {/* Rotating dashed ring */}
        <motion.div
          className="absolute rounded-full border border-white/[0.06]"
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          style={{ width: size, height: size, borderStyle: "dashed" }}
        />

        {/* Wireframe SVG */}
        <motion.svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          style={{ filter: "drop-shadow(0 0 6px rgba(255,255,255,0.1))" }}
          animate={{ rotateY: [0, 360], rotateX: [8, 20, 8] }}
          transition={{
            rotateY: { duration: 20, repeat: Infinity, ease: "linear" },
            rotateX: { duration: 10, repeat: Infinity, ease: "easeInOut" },
          }}
        >
          {EDGES.map(([a, b], i) => {
            const [ax, ay, az] = projected[a];
            const [bx, by, bz] = projected[b];
            const op = 0.15 + 0.55 * (((az + bz) / 2 + 1) / 2);
            return (
              <line key={i} x1={ax} y1={ay} x2={bx} y2={by}
                stroke="white" strokeWidth="0.7" strokeOpacity={op} strokeLinecap="round" />
            );
          })}
          {VERTS.map(([x, y, z], i) => {
            const [px, py, pz] = project(x, y, z, rx, ry, cx, cy, scale);
            return <circle key={i} cx={px} cy={py} r={1.2} fill="white" fillOpacity={0.15 + 0.5 * ((pz + 1) / 2)} />;
          })}
        </motion.svg>
      </div>

      {/* Status text */}
      <div className="text-center space-y-1.5">
        <motion.p
          className="font-mono text-[11px] text-zinc-500 tracking-[0.25em] uppercase"
          animate={{ opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          Sentinel is on standby...
        </motion.p>
        <p className="font-mono text-[10px] text-zinc-700 tracking-wider">
          Menunggu input data pasar
        </p>
      </div>

      {/* Fake ticker animation */}
      <div className="w-48 space-y-1.5 opacity-30">
        {["BBRI", "TLKM", "ASII", "GOTO"].map((ticker, i) => (
          <motion.div
            key={ticker}
            className="flex items-center justify-between font-mono text-[9px] text-zinc-600"
            animate={{ opacity: [0.2, 0.6, 0.2] }}
            transition={{ duration: 2 + i * 0.4, repeat: Infinity, delay: i * 0.3 }}
          >
            <span>{ticker}</span>
            <span className="w-16 h-px bg-zinc-800" />
            <span>— — —</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function getScoreColor(s: number) {
  if (s < 40) return "text-red-500";
  if (s <= 60) return "text-yellow-400";
  return "text-emerald-400";
}
function getScoreBg(s: number) {
  if (s < 40) return "from-red-950/40 to-transparent";
  if (s <= 60) return "from-yellow-950/40 to-transparent";
  return "from-emerald-950/40 to-transparent";
}
function getScoreBorder(s: number) {
  if (s < 40) return "border-red-800/50";
  if (s <= 60) return "border-yellow-800/50";
  return "border-emerald-800/50";
}
function getVolatilityColor(risk: string) {
  const map: Record<string, string> = {
    Rendah: "text-emerald-400 bg-emerald-950/60 border-emerald-800/50",
    Sedang: "text-yellow-400 bg-yellow-950/60 border-yellow-800/50",
    Tinggi: "text-orange-400 bg-orange-950/60 border-orange-800/50",
    Ekstrem: "text-red-400 bg-red-950/60 border-red-800/50",
  };
  return map[risk] ?? "text-zinc-400 bg-zinc-900 border-zinc-700";
}
function getSignalIcon(signal: string) {
  if (signal === "Berpotensi Naik") return <TrendingUp className="w-4 h-4 text-emerald-400" />;
  if (signal === "Waspada Koreksi") return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Eye className="w-4 h-4 text-yellow-400" />;
}
function getSignalStyle(signal: string) {
  if (signal === "Berpotensi Naik") return "text-emerald-400 border-emerald-700/50 bg-emerald-950/40";
  if (signal === "Waspada Koreksi") return "text-red-400 border-red-700/50 bg-red-950/40";
  return "text-yellow-400 border-yellow-700/50 bg-yellow-950/40";
}

// ─────────────────────────────────────────────────────────────────────────────
// RESULT PANEL — panel kanan saat ada output
// ─────────────────────────────────────────────────────────────────────────────

function ResultPanel({ result }: { result: SentimentResponse }) {
  return (
    <motion.div
      key="result"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col gap-3 h-full"
    >
      {/* Header label */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-mono text-[10px] text-zinc-600 tracking-[0.2em] uppercase">Analysis Output</span>
        <span className="font-mono text-[10px] text-emerald-600 tracking-wider">● COMPLETE</span>
      </div>

      {/* Catalyst Score card */}
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden rounded-xl border bg-gradient-to-br ${getScoreBg(result.catalyst_score)} ${getScoreBorder(result.catalyst_score)} p-5`}
      >
        <div className="absolute top-3 right-4 font-mono text-[9px] text-zinc-600 tracking-widest uppercase">
          Catalyst Score
        </div>
        <div className={`font-mono font-black text-7xl leading-none tracking-tighter ${getScoreColor(result.catalyst_score)}`}>
          {result.catalyst_score}
        </div>
        <div className="mt-1 font-mono text-[11px] text-zinc-500">
          / 100 &nbsp;·&nbsp;{" "}
          {result.catalyst_score < 40 ? "BEARISH TERRITORY" : result.catalyst_score <= 60 ? "NEUTRAL ZONE" : "BULLISH TERRITORY"}
        </div>
        <div className="mt-4 h-1 w-full rounded-full bg-zinc-800">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${result.catalyst_score}%` }}
            transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full ${result.catalyst_score < 40 ? "bg-red-500" : result.catalyst_score <= 60 ? "bg-yellow-400" : "bg-emerald-400"}`}
          />
        </div>
      </motion.div>

      {/* Signal + Volatility row */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className={`rounded-xl border p-4 flex flex-col gap-2 ${getSignalStyle(result.action_signal)}`}
        >
          <div className="font-mono text-[9px] text-zinc-500 tracking-widest uppercase">Action Signal</div>
          <div className="flex items-center gap-1.5">
            {getSignalIcon(result.action_signal)}
            <span className="font-mono font-bold text-xs leading-tight">{result.action_signal}</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.4 }}
          className={`rounded-xl border p-4 flex flex-col gap-2 ${getVolatilityColor(result.volatility_risk)}`}
        >
          <div className="font-mono text-[9px] text-zinc-500 tracking-widest uppercase">Volatility Risk</div>
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4" />
            <span className="font-mono font-bold text-xs">{result.volatility_risk}</span>
          </div>
        </motion.div>
      </div>

      {/* Key Drivers */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.4 }}
        className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 flex-1"
      >
        <div className="font-mono text-[9px] text-zinc-500 tracking-widest uppercase mb-3">Key Drivers</div>
        <div className="flex flex-wrap gap-2">
          {result.key_drivers.map((driver, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.08 }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/80 px-3 py-1.5 font-mono text-xs text-zinc-200"
            >
              <ChevronRight className="w-3 h-3 text-zinc-500" />
              {driver}
            </motion.span>
          ))}
        </div>
      </motion.div>

      {/* Disclaimer */}
      <p className="font-mono text-[9px] text-zinc-700 leading-relaxed">
        ⚠ Hasil analisis AI bukan rekomendasi investasi. Selalu lakukan riset mandiri.
      </p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR 
// ─────────────────────────────────────────────────────────────────────────────

function Navbar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-black/85 backdrop-blur-md">
      <nav className="mx-auto max-w-7xl px-6 h-13 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <TapeReaderLogo />
          {/* Separator */}
          <span className="hidden sm:block w-px h-4 bg-zinc-800" />
          <div className="hidden sm:flex items-center gap-1.5 font-mono text-[10px] text-zinc-600 tracking-widest uppercase">
            <Activity className="w-3 h-3 text-emerald-600" />
            Terminal
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Fix #3: label Gemini Pro */}
          <span className="hidden md:flex items-center gap-1.5 font-mono text-[10px] text-zinc-600 border border-zinc-800 px-2 py-1 rounded">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Gemini 2.5 Flash
          </span>

          {/* Fix #4: Documentation → GitHub README */}
          <a
            href="https://github.com/nexuzz14/tapereader#readme"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors tracking-wider"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Docs</span>
          </a>

          {/* Back to landing */}
          <Link
            href="/"
            className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-500 hover:text-zinc-200 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Home</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE — 2-column layout (Fix #2)
// ─────────────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SentimentResponse | null>(null);

  const charCount = text.length;
  const isOverLimit = charCount > 5000;

  async function handleAnalyze() {
    setError(null);
    setResult(null);
    setLoading(true);
    try {
      const data = await analyzeSentiment(text);
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan tidak terduga.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white relative overflow-hidden">
      <Scanlines />

      {/* Ambient glow top */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 0%, rgba(255,255,255,0.03) 0%, transparent 70%)",
        }}
      />

      <Navbar />

      {/* Main layout: full height, 2 columns */}
      <main className="relative z-10 pt-[52px] min-h-screen flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-zinc-800/60">

          {/* ── LEFT COLUMN: Input (40%) ── */}
          <div className="w-full lg:w-[40%] flex flex-col p-6 lg:p-8 gap-5">
            {/* Section header */}
            <div>
              <p className="font-mono text-[10px] text-zinc-600 tracking-[0.25em] uppercase mb-1">
                [01] Input
              </p>
              <h1 className="font-mono font-black text-lg text-white tracking-tight">
                Sentiment Analyzer
              </h1>
              <p className="font-mono text-[11px] text-zinc-500 mt-0.5">
                Paste berita atau prospektus IPO · The Sentinel akan membaca seketika
              </p>
            </div>

            {/* Textarea */}
            <div className="flex-1 flex flex-col gap-3">
              <div className="relative flex-1">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={`Paste teks di sini...\n\nContoh:\n"PT XYZ Tbk mencatat laba bersih Rp 2,4 triliun pada Q3 2024, naik 38% YoY didorong ekspansi segmen digital..."`}
                  disabled={loading}
                  className="w-full h-full min-h-[280px] lg:min-h-0 rounded-xl border border-zinc-800 bg-zinc-900/70 px-4 py-3.5 font-mono text-[13px] text-zinc-200 placeholder-zinc-700 resize-none focus:outline-none focus:border-zinc-600 focus:ring-1 focus:ring-zinc-700/50 transition-colors duration-200 leading-relaxed"
                />
                {/* Char counter */}
                <div className={`absolute bottom-3 right-3.5 font-mono text-[9px] tabular-nums ${isOverLimit ? "text-red-500" : "text-zinc-700"}`}>
                  {charCount.toLocaleString()} / 5,000
                </div>
              </div>

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={loading || !text.trim() || isOverLimit}
                className="group relative overflow-hidden w-full rounded-xl border border-zinc-700 bg-white text-black px-5 py-3 font-mono text-sm font-black tracking-widest uppercase hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors duration-200 focus:outline-none"
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-black/10 to-transparent" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        className="inline-block w-4 h-4 border-2 border-black border-t-transparent rounded-full"
                      />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Analyze Catalyst
                    </>
                  )}
                </span>
              </button>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2.5 rounded-xl border border-red-800/50 bg-red-950/30 px-4 py-3"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <p className="font-mono text-[11px] text-red-400 leading-relaxed">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bottom meta */}
            <div className="flex items-center gap-2 pt-2 border-t border-zinc-900">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-mono text-[9px] text-zinc-700 tracking-widest uppercase">
                Powered by Gemini 2.5 Flash · Max 5,000 chars
              </span>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Output (60%) ── */}
          <div className="w-full lg:w-[60%] flex flex-col p-6 lg:p-8 bg-black/20">
            <div className="mb-4">
              <p className="font-mono text-[10px] text-zinc-600 tracking-[0.25em] uppercase mb-1">
                [02] Output
              </p>
              <h2 className="font-mono font-bold text-sm text-zinc-400 tracking-tight">
                Analysis Result
              </h2>
            </div>

            {/* Content: Sentinel standby OR result */}
            <div className="flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                {result ? (
                  <ResultPanel key="result" result={result} />
                ) : (
                  <motion.div
                    key="standby"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex-1 rounded-xl border border-zinc-800/50 bg-zinc-900/20 flex items-center justify-center"
                  >
                    <SentinelStandby />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Footer — Fix #3: label Gemini Flash */}
        <footer className="border-t border-zinc-900 py-3 px-8">
          <div className="flex items-center justify-between font-mono text-[9px] text-zinc-800">
            <span>TAPEREADER · Day Trader Sentiment Engine</span>
            <span>Powered by Gemini 2.5 Flash · Not financial advice</span>
          </div>
        </footer>
      </main>
    </div>
  );
}