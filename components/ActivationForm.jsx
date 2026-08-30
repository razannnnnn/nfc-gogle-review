"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { gooeyToast } from "@/lib/toast";
import { useRouter } from "next/navigation";

export default function ActivationForm({ id }) {
  const router = useRouter();
  const [namaToko, setNamaToko] = useState("");
  const [linkMaps, setLinkMaps] = useState("");
  const [kontak, setKontak] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    const toastId = gooeyToast("Mengaktivasi kartu…");

    try {
      const res = await fetch(`/api/cards/${id}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_toko: namaToko,
          link_maps: linkMaps,
          owner_kontak: kontak,
          honeypot,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        gooeyToast.update(toastId, {
          title: data.error || "Gagal mengaktivasi kartu.",
          type: "error",
        });
        setLoading(false);
        return;
      }

      gooeyToast.update(toastId, {
        title: "Kartu berhasil diaktivasi!",
        type: "success",
        description: "Pelanggan sekarang bisa langsung tap/scan untuk memberi ulasan.",
      });
      setDone(true);
    } catch {
      gooeyToast.update(toastId, {
        title: "Terjadi kesalahan jaringan.",
        type: "error",
      });
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="page-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-shell max-w-md w-full p-7 sm:p-8 text-center"
        >
          <div className="mx-auto h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center text-3xl animate-pulse-glow">
            ✅
          </div>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Kartu aktif!</h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            Kartu <strong>{namaToko}</strong> sekarang sudah tersambung ke halaman
            ulasan Google Maps toko Anda. Coba tap/scan kartunya lagi untuk
            memastikan.
          </p>
          <button
            className="btn-primary mt-6 w-full"
            onClick={() => router.push("/dashboard")}
          >
            Kelola kartu di Dashboard
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="page-center" style={{ padding: "1rem", alignItems: "flex-start", paddingTop: "clamp(2rem, 8vh, 6rem)" }}>
      <motion.form
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="card-shell max-w-md w-full p-7 sm:p-8"
      >
        <h1 className="text-xl font-bold text-slate-900">Aktivasi Kartu Baru</h1>
        <p className="mt-1 text-sm text-slate-500 leading-relaxed">
          Kartu ini belum aktif. Isi data toko Anda supaya pelanggan bisa
          langsung diarahkan ke halaman ulasan Google Maps saat tap/scan.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Nama toko</label>
            <input
              className="input-field mt-1"
              placeholder="Contoh: Kopi Senja Kediri"
              value={namaToko}
              onChange={(e) => setNamaToko(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              Link Google Maps toko
            </label>
            <input
              className="input-field mt-1"
              placeholder="Tempel link share dari Google Maps"
              value={linkMaps}
              onChange={(e) => setLinkMaps(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              Buka Google Maps → cari toko Anda → Bagikan → salin link, lalu
              tempel di sini. Tidak perlu link &ldquo;tulis ulasan&rdquo; khusus, sistem
              akan konversi otomatis.
            </p>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              No. HP / email Anda
            </label>
            <input
              className="input-field mt-1"
              placeholder="Untuk login ke dashboard nanti"
              value={kontak}
              onChange={(e) => setKontak(e.target.value)}
              required
            />
          </div>

          {/* Honeypot anti-spam — disembunyikan dari pengguna asli */}
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            className="hidden"
            aria-hidden="true"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-6">
          {loading ? "Memproses…" : "Aktivasi Kartu"}
        </button>
      </motion.form>
    </main>
  );
}
