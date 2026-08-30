"use client";

import { useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { gooeyToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import StoreSearchInput from "@/components/StoreSearchInput";
import {
  BarChart2,
  Plus,
  LogOut,
  Nfc,
  QrCode,
  Pencil,
  Trash2,
  Search,
  X,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";

function StatusBadge({ status }) {
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
}

export default function AdminDashboard({ initialCards }) {
  const router = useRouter();
  const [cards, setCards] = useState(initialCards);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("semua");

  // State untuk Modals
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [deletingCard, setDeletingCard] = useState(null);
  const [loadingAction, setLoadingAction] = useState(false);

  // Form state untuk Tambah Custom & Edit
  const [formId, setFormId] = useState("");
  const [formNamaToko, setFormNamaToko] = useState("");
  const [formLinkMaps, setFormLinkMaps] = useState("");
  const [formOwnerKontak, setFormOwnerKontak] = useState("");
  const [formStatus, setFormStatus] = useState("belum_aktif");

  // 1. Generate Auto ID Baru (Create Quick)
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

  // 2. Open Modal Edit (Update)
  const openEditModal = (card) => {
    setEditingCard(card);
    setFormNamaToko(card.nama_toko || "");
    setFormLinkMaps(card.link_google_review_asli || card.link_google_review || "");
    setFormOwnerKontak(card.owner_kontak || "");
    setFormStatus(card.status || "belum_aktif");
  };

  // Submit Update (Update API)
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!editingCard) return;

    setLoadingAction(true);
    const toastId = gooeyToast(`Updating kartu ${editingCard.id}…`);

    try {
      const res = await fetch(`/api/cards/${editingCard.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama_toko: formNamaToko,
          link_maps: formLinkMaps,
          owner_kontak: formOwnerKontak,
          status: formStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        gooeyToast.update(toastId, { title: data.error || "Gagal memperbarui kartu.", type: "error" });
        return;
      }

      setCards((prev) => prev.map((c) => (c.id === editingCard.id ? data.card : c)));
      gooeyToast.update(toastId, {
        title: `Kartu ${editingCard.id} berhasil diperbarui!`,
        type: "success",
      });
      setEditingCard(null);
    } catch {
      gooeyToast.update(toastId, { title: "Terjadi kesalahan koneksi.", type: "error" });
    } finally {
      setLoadingAction(false);
    }
  };

  // 3. Submit Delete (Delete API)
  const handleDeleteSubmit = async () => {
    if (!deletingCard) return;

    setLoadingAction(true);
    const toastId = gooeyToast(`Menghapus kartu ${deletingCard.id}…`);

    try {
      const res = await fetch(`/api/cards/${deletingCard.id}`, {
        method: "DELETE",
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        gooeyToast.update(toastId, { title: data.error || "Gagal menghapus kartu.", type: "error" });
        return;
      }

      setCards((prev) => prev.filter((c) => c.id !== deletingCard.id));
      gooeyToast.update(toastId, {
        title: `Kartu ${deletingCard.id} telah dihapus.`,
        type: "success",
      });
      setDeletingCard(null);
    } catch {
      gooeyToast.update(toastId, { title: "Terjadi kesalahan koneksi.", type: "error" });
    } finally {
      setLoadingAction(false);
    }
  };

  const handleLogout = useCallback(async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }, [router]);

  // Filter Cards (Search & Status)
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      const matchSearch =
        searchQuery === "" ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.nama_toko && c.nama_toko.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.owner_kontak && c.owner_kontak.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchStatus =
        statusFilter === "semua" || c.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [cards, searchQuery, statusFilter]);

  const totalAktif = cards.filter((c) => c.status === "aktif").length;
  const totalScan = cards.reduce((acc, curr) => acc + (curr.jumlah_scan || 0), 0);

  return (
    <main className="page-wrapper pb-12">
      <div className="container-wide py-8 sm:py-10">
        {/* ─── Header ─── */}
        <div className="dash-header animate-fade-in flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Dashboard Admin (Manajemen CRUD)
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Total {cards.length} kartu · {totalAktif} aktif · {totalScan} total scan
            </p>
          </div>
          <div className="dash-header-actions flex flex-wrap gap-2">
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

        {/* ─── Search & Filter Bar ─── */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Cari ID kartu, nama toko, no HP owner…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field input-field-has-icon-left text-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field text-xs !py-2 !w-auto cursor-pointer"
            >
              <option value="semua">Semua Status ({cards.length})</option>
              <option value="aktif">Aktif ({totalAktif})</option>
              <option value="belum_aktif">Belum Aktif ({cards.length - totalAktif})</option>
            </select>
          </div>
        </div>

        {/* ─── Desktop Table (CRUD) ─── */}
        <div className="card-shell mt-6 overflow-hidden admin-table-wrapper animate-fade-in-up">
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID Kartu</th>
                <th>Nama Toko</th>
                <th>Kontak Owner</th>
                <th>Status</th>
                <th>Statistik Scan</th>
                <th>Dibuat</th>
                <th className="text-right">Aksi (CRUD)</th>
              </tr>
            </thead>
            <tbody>
              {filteredCards.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada kartu yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
              {filteredCards.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="font-mono text-slate-800 font-bold">{c.id}</td>
                  <td className="text-slate-800 font-medium">
                    {c.nama_toko ? (
                      c.nama_toko
                    ) : (
                      <span className="text-slate-400 italic">Belum diisi</span>
                    )}
                  </td>
                  <td className="text-slate-600 text-xs">
                    {c.owner_kontak || "—"}
                  </td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="text-slate-600 text-xs">
                    <span className="font-semibold text-slate-800">{c.jumlah_scan}</span>
                    <span className="text-slate-400 ml-1">
                      (NFC: {c.jumlah_scan_nfc} · QR: {c.jumlah_scan_qr})
                    </span>
                  </td>
                  <td className="text-slate-400 text-xs">
                    {new Date(c.dibuat_pada).toLocaleDateString("id-ID")}
                  </td>
                  <td className="text-right space-x-2">
                    <button
                      onClick={() => openEditModal(c)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Edit Detail Kartu (Update)"
                    >
                      <Pencil className="w-4 h-4 inline" />
                    </button>
                    <Link
                      href={`/admin/tulis/${c.id}`}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors inline-block"
                      title="Tulis NFC Chip"
                    >
                      <Nfc className="w-4 h-4 inline" />
                    </Link>
                    <a
                      href={`/api/qr/${c.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors inline-block"
                      title="Lihat / Download QR"
                    >
                      <QrCode className="w-4 h-4 inline" />
                    </a>
                    <button
                      onClick={() => setDeletingCard(c)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Hapus Kartu (Delete)"
                    >
                      <Trash2 className="w-4 h-4 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ─── Mobile Card List (CRUD) ─── */}
        <div className="admin-card-list mt-6 flex-col gap-3 stagger-children sm:hidden">
          {filteredCards.length === 0 && (
            <div className="card-shell p-6 text-center text-slate-400 text-sm">
              Tidak ada kartu yang cocok dengan pencarian.
            </div>
          )}
          {filteredCards.map((card) => (
            <div key={card.id} className="card-shell p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-800 text-sm">{card.id}</span>
                <StatusBadge status={card.status} />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {card.nama_toko || "Belum ada nama toko"}
                </p>
                {card.owner_kontak && (
                  <p className="text-xs text-slate-500 mt-0.5">Owner: {card.owner_kontak}</p>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {card.jumlah_scan} total scan
                  <span className="text-slate-400 ml-1">
                    (NFC {card.jumlah_scan_nfc} · QR {card.jumlah_scan_qr})
                  </span>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <Link
                  href={`/admin/tulis/${card.id}`}
                  className="btn-primary !py-1.5 !px-3 text-xs flex-1 justify-center"
                >
                  <Nfc className="w-3.5 h-3.5 mr-1 inline" />
                  Tulis NFC
                </Link>
                <a
                  href={`/api/qr/${card.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-secondary !py-1.5 !px-3 text-xs flex-1 justify-center"
                >
                  <QrCode className="w-3.5 h-3.5 mr-1 inline" />
                  Lihat QR
                </a>
                <button
                  onClick={() => openEditModal(card)}
                  className="btn-secondary !py-1.5 !px-2.5 text-xs text-emerald-600 hover:text-emerald-700"
                  title="Edit Kartu"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeletingCard(card)}
                  className="btn-secondary !py-1.5 !px-2.5 text-xs text-red-500 hover:text-red-600"
                  title="Hapus Kartu"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── MODAL EDIT KARTU (UPDATE) ─── */}
      {editingCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Pencil className="w-4 h-4 text-emerald-600" />
                Edit Kartu {editingCard.id}
              </h3>
              <button
                onClick={() => setEditingCard(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="space-y-4">
              <StoreSearchInput
                namaToko={formNamaToko}
                onChangeNamaToko={setFormNamaToko}
                linkMaps={formLinkMaps}
                onChangeLinkMaps={setFormLinkMaps}
              />

              <div>
                <label className="text-sm font-medium text-slate-700">Kontak Owner (No. HP / Email)</label>
                <input
                  type="text"
                  className="input-field mt-1"
                  placeholder="081234567890 / owner@toko.com"
                  value={formOwnerKontak}
                  onChange={(e) => setFormOwnerKontak(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium text-slate-700">Status Kartu</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="input-field mt-1 cursor-pointer"
                >
                  <option value="belum_aktif">Belum Aktif</option>
                  <option value="aktif">Aktif</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCard(null)}
                  className="btn-secondary text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loadingAction}
                  className="btn-primary text-xs"
                >
                  {loadingAction ? "Simpan…" : "Simpan Perubahan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL KONFIRMASI HAPUS (DELETE) ─── */}
      {deletingCard && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="h-12 w-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Hapus Kartu {deletingCard.id}?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tindakan ini permanen. Kartu fisik dengan ID ini tidak akan bisa discan lagi.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeletingCard(null)}
                className="btn-secondary w-full text-xs"
              >
                Batal
              </button>
              <button
                onClick={handleDeleteSubmit}
                disabled={loadingAction}
                className="btn-primary !bg-red-600 hover:!bg-red-700 w-full text-xs"
              >
                {loadingAction ? "Menghapus…" : "Hapus Permanen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
