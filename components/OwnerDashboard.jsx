"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { gooeyToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { Save, Nfc, QrCode, LogOut } from "lucide-react";
import StoreSearchInput from "./StoreSearchInput";

function CardEditor({ card, onSaved }) {
  const [namaToko, setNamaToko] = useState(card.nama_toko || "");
  const [linkMaps, setLinkMaps] = useState(card.link_google_review_asli || "");
  const [saving, setSaving] = useState(false);
  const saveTimerRef = useRef(null);

  const handleSave = useCallback(async () => {
    if (saveTimerRef.current) return;
    saveTimerRef.current = setTimeout(() => {
      saveTimerRef.current = null;
    }, 1000);

    setSaving(true);
    const toastId = gooeyToast("Menyimpan perubahan…");
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama_toko: namaToko, link_maps: linkMaps }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        gooeyToast.update(toastId, { title: "Gagal menyimpan.", type: "error" });
        return;
      }
      gooeyToast.update(toastId, { title: "Perubahan tersimpan.", type: "success" });
      onSaved(data.card);
    } catch {
      gooeyToast.update(toastId, { title: "Terjadi kesalahan jaringan.", type: "error" });
    } finally {
      setSaving(false);
    }
  }, [card.id, namaToko, linkMaps, onSaved]);

  return (
    <div className="card-shell p-5 sm:p-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="font-semibold text-slate-900 font-mono text-sm sm:text-base">
          {card.id}
        </h3>
        <span className="badge badge-success">
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#059669",
              display: "inline-block",
            }}
          />
          Aktif · {card.jumlah_scan} scan
        </span>
      </div>

      <div className="mt-4">
        <StoreSearchInput
          namaToko={namaToko}
          onChangeNamaToko={setNamaToko}
          linkMaps={linkMaps}
          onChangeLinkMaps={setLinkMaps}
        />
      </div>

      <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary !py-2 !px-4 text-sm inline-flex items-center justify-center gap-1.5"
        >
          <Save className="w-4 h-4" />
          {saving ? "Menyimpan…" : "Simpan Perubahan"}
        </button>
        <Link
          href={`/dashboard/tulis-ulang/${card.id}`}
          className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center justify-center gap-1.5"
        >
          <Nfc className="w-4 h-4 text-emerald-600" />
          Tulis Ulang Chip NFC
        </Link>
        <a
          href={`/api/qr/${card.id}`}
          target="_blank"
          rel="noreferrer"
          className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center justify-center gap-1.5"
        >
          <QrCode className="w-4 h-4 text-slate-600" />
          Download QR
        </a>
      </div>
    </div>
  );
}

export default function OwnerDashboard({ initialCards }) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);

  const handleSaved = useCallback((updated) => {
    setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
  }, []);

  const handleLogout = useCallback(async () => {
    await fetch("/api/owner/logout", { method: "POST" });
    router.refresh();
  }, [router]);

  return (
    <main className="page-wrapper" style={{ padding: "0 0 2rem" }}>
      <div className="container-narrow py-8 sm:py-10">
        {/* ─── Header ─── */}
        <div className="dash-header animate-fade-in">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Kartu Saya
          </h1>
          <button
            onClick={handleLogout}
            className="btn-secondary !py-2 !px-4 text-sm inline-flex items-center gap-1.5"
          >
            <LogOut className="w-4 h-4 text-slate-500" />
            Keluar
          </button>
        </div>

        {/* ─── Cards ─── */}
        <div className="mt-6 space-y-4 stagger-children">
          {cards.map((c) => (
            <CardEditor key={c.id} card={c} onSaved={handleSaved} />
          ))}
        </div>
      </div>
    </main>
  );
}
