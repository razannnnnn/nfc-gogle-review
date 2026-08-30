"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { gooeyToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function OwnerLoginForm() {
  const router = useRouter();
  const [kontak, setKontak] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/owner/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kontak }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        gooeyToast.error(data.error || "Login gagal.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      gooeyToast.error("Terjadi kesalahan jaringan.");
      setLoading(false);
    }
  }

  return (
    <main className="page-center">
      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        onSubmit={handleSubmit}
        className="card-shell max-w-sm w-full p-7 sm:p-8"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-medium mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-slate-400" />
          Kembali ke Beranda
        </Link>

        <h1 className="text-lg font-bold text-slate-900">Dashboard Owner</h1>
        <p className="mt-1 text-sm text-slate-500">
          Masuk dengan no. HP/email yang Anda isi saat aktivasi kartu.
        </p>

        <input
          className="input-field mt-5"
          placeholder="No. HP atau email"
          value={kontak}
          onChange={(e) => setKontak(e.target.value)}
          required
        />

        <button type="submit" disabled={loading} className="btn-primary w-full mt-4">
          {loading ? "Memeriksa…" : "Masuk"}
        </button>

        <p className="mt-4 text-xs text-slate-400 text-center leading-relaxed">
          Belum punya kartu aktif? Tap/scan kartu fisik Anda untuk mengaktivasi
          terlebih dahulu.
        </p>
      </motion.form>
    </main>
  );
}
