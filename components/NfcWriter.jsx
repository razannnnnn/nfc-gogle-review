"use client";

import { useEffect, useState } from "react";
import { gooeyToast } from "@/lib/toast";
import { AlertTriangle, CheckCircle2, XCircle, Radio } from "lucide-react";

/**
 * Komponen tulis chip NFC lewat Web NFC API (NDEFReader).
 * Dipakai di /admin/tulis/[id] (oleh admin) dan
 * /dashboard/tulis-ulang/[id] (oleh owner toko).
 *
 * Web NFC API untuk MENULIS hanya berjalan di Chrome for Android (PRD 5.1 & 6).
 */

function diagnoseUnsupported() {
  if (typeof window === "undefined") return null;

  if (!window.isSecureContext) {
    return {
      code: "not_secure_context",
      title: "Situs ini belum diakses lewat HTTPS",
      detail:
        "Web NFC hanya berjalan di koneksi aman (HTTPS), kecuali di localhost saat development. Kalau kamu membuka halaman ini lewat alamat IP (http://192.168...), itu penyebabnya — deploy ke Vercel (otomatis HTTPS) atau akses lewat tunnel HTTPS (mis. ngrok).",
    };
  }

  if (!("NDEFReader" in window)) {
    const ua = navigator.userAgent || "";
    const isAndroid = /Android/i.test(ua);
    const isChrome =
      /Chrome\/[0-9.]+/i.test(ua) &&
      !/(SamsungBrowser|OPR|Edg|FBAV|Instagram|Line)/i.test(ua);

    if (!isAndroid) {
      return {
        code: "not_android",
        title: "Perangkat ini bukan Android",
        detail:
          "Menulis chip NFC lewat web hanya berjalan di Android + Chrome (termasuk tidak berjalan di iPhone).",
      };
    }
    if (!isChrome) {
      return {
        code: "not_chrome",
        title: "Browser ini bukan Chrome",
        detail:
          "Terdeteksi Android, tapi browser yang dipakai sepertinya bukan Chrome murni (bisa jadi Samsung Internet, Firefox, atau in-app browser dari aplikasi lain seperti Instagram/WhatsApp). Buka link ini langsung di aplikasi Google Chrome.",
      };
    }
    return {
      code: "chrome_too_old_or_flag",
      title: "Chrome terdeteksi, tapi Web NFC tidak tersedia",
      detail:
        "Coba update Chrome ke versi terbaru lewat Play Store. Kalau masih gagal, pastikan tidak sedang dibuka dari dalam WebView aplikasi lain (harus benar-benar aplikasi Chrome).",
    };
  }

  return null;
}

export default function NfcWriter({ id, backHref, backLabel }) {
  const [supported, setSupported] = useState(null);
  const [reason, setReason] = useState(null);
  const [writing, setWriting] = useState(false);
  const [lastResult, setLastResult] = useState(null); // 'success' | 'error' | null
  const [targetUrl, setTargetUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const diag = diagnoseUnsupported();
    setReason(diag);
    setSupported(!diag);
    setTargetUrl(`${window.location.origin}/k/${id}?src=nfc`);
  }, [id]);

  async function handleWrite() {
    if (!("NDEFReader" in window)) {
      gooeyToast.error("Browser ini tidak mendukung penulisan NFC.");
      return;
    }

    setWriting(true);
    setLastResult(null);
    const toastId = gooeyToast("Dekatkan chip NFC kosong ke belakang HP…", {
      description: "Proses menunggu chip terdeteksi.",
    });

    try {
      const ndef = new window.NDEFReader();
      await ndef.write({ records: [{ recordType: "url", data: targetUrl }] });

      setLastResult("success");
      gooeyToast.update(toastId, {
        title: "Chip berhasil ditulis!",
        type: "success",
        description: targetUrl,
      });
    } catch (err) {
      setLastResult("error");
      let message = "Gagal menulis chip.";
      const name = err?.name || "";

      if (name === "NotAllowedError") {
        message = "Izin NFC ditolak. Aktifkan izin NFC untuk situs ini.";
      } else if (name === "NotSupportedError") {
        message =
          "Chip tidak mendukung penulisan (read-only atau tipe tidak cocok).";
      } else if (name === "NetworkError") {
        message =
          "Chip tidak terdeteksi / terlepas sebelum proses selesai. Coba lagi.";
      } else if (name === "AbortError") {
        message = "Proses dibatalkan.";
      }

      gooeyToast.update(toastId, { title: message, type: "error" });
    } finally {
      setWriting(false);
    }
  }

  if (supported === null) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-slate-400 text-sm">Memeriksa dukungan perangkat…</p>
      </main>
    );
  }

  if (!supported) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="card-shell max-w-sm w-full p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-2">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="mt-2 text-lg font-bold text-slate-900">
            {reason?.title || "Perangkat tidak didukung"}
          </h1>
          <p className="mt-2 text-sm text-slate-600 leading-relaxed">
            {reason?.detail || (
              <>
                Menulis chip NFC lewat web hanya bisa dilakukan di{" "}
                <strong>Google Chrome untuk Android</strong>.
              </>
            )}
          </p>
          <p className="mt-3 text-xs text-slate-400">
            Alternatif: kartu tetap berfungsi lewat QR code meski tanpa NFC.
          </p>
          {backHref && (
            <a href={backHref} className="btn-secondary mt-6 inline-block">
              {backLabel || "Kembali"}
            </a>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="card-shell max-w-sm w-full p-8 text-center">
        <div
          className={`mx-auto h-16 w-16 rounded-full flex items-center justify-center ${
            lastResult === "success"
              ? "bg-emerald-100 text-emerald-600"
              : lastResult === "error"
                ? "bg-red-100 text-red-600"
                : "bg-emerald-50 text-emerald-600"
          } ${writing ? "animate-pulse-glow" : ""}`}
        >
          {lastResult === "success" ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : lastResult === "error" ? (
            <XCircle className="w-8 h-8" />
          ) : (
            <Radio className={`w-8 h-8 ${writing ? "animate-spin" : ""}`} />
          )}
        </div>
        <h1 className="mt-4 text-lg font-bold text-slate-900">
          Tulis Chip NFC
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Kartu ID: <span className="font-mono">{id}</span>
        </p>
        <p className="mt-1 text-xs text-slate-400 break-all">{targetUrl}</p>

        <button
          onClick={handleWrite}
          disabled={writing}
          className="btn-primary w-full mt-6"
        >
          {writing ? "Menunggu chip…" : "Mulai Tulis Chip"}
        </button>
        <p className="mt-3 text-xs text-slate-400">
          Tempelkan chip NFC kosong ke bagian belakang HP setelah menekan tombol
          di atas.
        </p>

        {backHref && (
          <a href={backHref} className="btn-secondary w-full mt-3 inline-block">
            {backLabel || "Kembali"}
          </a>
        )}
      </div>
    </main>
  );
}
