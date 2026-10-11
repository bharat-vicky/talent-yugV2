"use client";

import { motion } from "framer-motion";
import { QrCode, ShieldCheck, Fingerprint, Zap, CheckCircle2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

export function AnimatedQR() {
  return (
    <div className="relative z-10 w-full max-w-sm mx-auto mb-16 perspective-[2000px]">

      {/* Real-time Status Badge */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="absolute -top-5 -right-5 bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg flex items-center gap-2 z-20"
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400 text-xs font-bold tracking-widest uppercase">Live Scan</span>
      </motion.div>

      {/* Main Glass Ticket - 3D Flipping Container */}
      <motion.div
        animate={{
          rotateY: [0, 180, 180, 360, 360],
          y: [-10, 10, -10]
        }}
        transition={{
          rotateY: { duration: 12, repeat: Infinity, ease: "easeInOut", times: [0, 0.45, 0.5, 0.95, 1] },
          y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
        }}
        className="w-full relative"
        style={{ transformStyle: "preserve-3d" }}
      >

        {/* ================= FRONT FACE (Scanner) ================= */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="bg-white/5 backdrop-blur-2xl p-8 rounded-[2rem] border border-white/10 border-t-white/20 border-l-white/20 shadow-2xl overflow-hidden relative"
          style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
        >
          {/* Ticket Header */}
          <div className="flex items-start justify-between mb-8">
            <div>
              <h3 className="text-white font-bold text-xl">VIP Guest Pass</h3>
              <p className="text-zinc-400 text-sm mt-1">Global Tech Summit &apos;26</p>
            </div>
            <div className="bg-white/10 p-2 rounded-xl">
              <ShieldCheck className="text-white w-5 h-5" />
            </div>
          </div>

          {/* QR Code Mock Container */}
          <div className="bg-white p-6 rounded-2xl relative overflow-hidden group shadow-inner flex items-center justify-center">
            <QrCode className="w-full h-full text-zinc-950 opacity-90 stroke-[1]" />

            {/* Animated Laser Line */}
            <motion.div
              animate={{ top: ["0%", "100%", "0%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 w-full h-1 bg-emerald-500 shadow-[0_0_20px_4px_rgba(16,185,129,0.5)]"
            />
          </div>

          {/* Real-time scanning log */}
          <div className="mt-8 space-y-3 font-mono text-[10px] text-zinc-500">
            <div className="flex items-center gap-2">
              <Fingerprint className="w-3 h-3 text-zinc-400" />
              <span>Validating cryptographic signature...</span>
            </div>
            <motion.div
              initial={{ opacity: 0.5 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="flex items-center gap-2"
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Payload verified • 14ms latency</span>
            </motion.div>
          </div>
        </motion.div>

        {/* ================= BACK FACE (Proper QR) ================= */}
        <div
          className="absolute inset-0 bg-zinc-900/80 backdrop-blur-3xl p-8 rounded-[2rem] border border-white/10 border-t-white/20 border-r-white/20 shadow-2xl flex flex-col items-center justify-center"
          style={{
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "rotateY(180deg)"
          }}
        >
          <div className="text-center mb-8">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
            <h3 className="text-white font-bold text-lg">Access Granted</h3>
            <p className="text-zinc-400 text-xs mt-1">Ready for scanning</p>
          </div>

          <div className="bg-white p-4 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.15)] ring-1 ring-white/50">
            <QRCodeSVG
              value="Pahchaan illustrative QR"
              size={180}
              level="H"
              includeMargin={false}
            />
          </div>

          <div className="mt-8 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-full text-[10px] font-mono tracking-widest uppercase border border-emerald-500/20">
            ID: 8F92A-4B7C
          </div>
        </div>

      </motion.div>
    </div>
  );
}
