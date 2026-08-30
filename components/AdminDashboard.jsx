"use client";

import { useState, useCallback, memo } from "react";
import Link from "next/link";
import { gooeyToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { BarChart2, Plus, LogOut, Nfc, QrCode } from "lucide-react";

const StatusBadge = memo(function StatusBadge({ status }) {
  const aktif = status === "aktif";
  return (
    <span className={`badge ${aktif ? "badge-success" : "badge-warning"}`}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: aktif ? "#059669" : "#d97706",
          display: "inline-block",
        }}
      />
      {aktif ? "Aktif" : "Belum Aktif"}
    </span>
  );
});

function MobileCard({ card }) {
  return (
    <div className="admin-mobile-card animate-fade-in-up">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-semibold text-slate-800">
          {card.id}
        </span>
        <StatusBadge status={card.status} />
      </div>

      {card.nama_toko && (
        <p className="mt-2 text-sm font-medium text-slate-700">
          {card.nama_toko}
        </p>
      )}

      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
        <span>
          {card.jumlah_scan} scan
          <span className="text-slate-400 ml-1">
            (NFC {card.jumlah_scan_nfc} · QR {card.jumlah_scan_qr})
          </span>
        </span>
      </div>

      <div className="mt-1 text-xs text-slate-400">
        {new Date(card.dibuat_pada).toLocaleDateString("id-ID")}
      </div>

      <div className="mt-3 flex gap-2">
        <Link
          href={`/admin/tulis/${card.id}`}
          className="btn-primary !py-1.5 !px-3 text-xs flex-1"
        >
          <Nfc className="w-3.5 h-3.5 mr-1 inline" />
          Tulis NFC
        </Link>
        <a
          href={`/api/qr/${card.id}`}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary !py-1.5 !px-3 text-xs flex-1"
        >
          <QrCode className="w-3.5 h-3.5 mr-1 inline" />
          Lihat QR
        </a>
      </div>
    </div>
  );
}

export default function AdminDashboard({ initialCards }) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [creating, setCreating] = useState(false);

  const handleGenerate = useCallback(async () => {
    setCreating(true);
    const toastId = gooeyToast("Membuat ID kartu baru…");
    try {
      const res = await fetch("/api/admin/cards", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        gooeyToast.update(toastId, { title: "Gagal membuat kartu.", type: "error" });
        return;
      }
      setCards((prev) => [data.card, ...prev]);
      gooeyToast.update(toastId, {
        title: `Kartu ${data.card.id} berhasil dibuat`,
        type: "success",
        description: "Lanjut tulis chip NFC atau download QR-nya.",
      });
    } catch {
      gooeyToast.update(toastId, { title: "Terjadi kesalahan jaringan.", type: "error" });
    } finally {
      setCreating(false);
    }
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }, [router]);

  const totalAktif = cards.filter((c) => c.status === "aktif").length;

  return (
    <main className="page-wrapper" style={{ padding: "0 0 2rem" }}>
      <div className="container-wide py-8 sm:py-10">
        {/* ─── Header ─── */}
        <div className="dash-header animate-fade-in">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Dashboard Admin
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {cards.length} kartu diproduksi · {totalAktif} sudah aktif
            </p>
          </div>
          <div className="dash-header-actions flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={creating}
              className="btn-primary"
            >
              <Plus className="w-4 h-4 mr-1 inline" />
              {creating ? "Membuat…" : "Buat Kartu Baru"}
            </button>
            <button onClick={handleLogout} className="btn-secondary">
              <LogOut className="w-4 h-4 mr-1 inline text-slate-500" />
              Keluar
            </button>
          </div>
        </div>

        {/* ─── Desktop Table ─── */}
        <div className="card-shell mt-6 sm:mt-8 overflow-hidden admin-table-wrapper animate-fade-in-up">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID Kartu</th>
                <th>Toko</th>
                <th>Status</th>
                <th>Scan</th>
                <th>Dibuat</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {cards.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Belum ada kartu. Klik &quot;Buat Kartu Baru&quot; untuk mulai.
                  </td>
                </tr>
              )}
              {cards.map((c) => (
                <tr key={c.id}>
                  <td className="font-mono text-slate-800">{c.id}</td>
                  <td className="text-slate-700">{c.nama_toko || "—"}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="text-slate-500">
                    {c.jumlah_scan}
                    <span className="text-slate-300 ml-1">
                      (NFC {c.jumlah_scan_nfc} · QR {c.jumlah_scan_qr})
                    </span>
                  </td>
                  <td className="text-slate-500">
                    {new Date(c.dibuat_pada).toLocaleDateString("id-ID")}
                  </td>
                  <td className="text-right space-x-3">
                    <Link
                      href={`/admin/tulis/${c.id}`}
                      className="text-emerald-600 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <Nfc className="w-3.5 h-3.5" />
                      Tulis NFC
                    </Link>
                    <a
                      href={`/api/qr/${c.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-slate-500 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      Lihat QR
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Mobile Card List ─── */}
        <div
          className="admin-card-list mt-6 flex-col gap-3 stagger-children"
          style={{ display: "none" }}
        >
          {cards.length === 0 && (
            <div className="card-shell p-6 text-center text-slate-400 text-sm">
              Belum ada kartu. Klik &quot;Buat Kartu Baru&quot; untuk mulai.
            </div>
          )}
          {cards.map((c) => (
            <MobileCard key={c.id} card={c} />
          ))}
        </div>
      </div>
    </main>
  );
}
