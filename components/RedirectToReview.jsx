"use client";

import { useEffect } from "react";

export default function RedirectToReview({ id, url, namaToko, source }) {
  useEffect(() => {
    // Catat statistik scan tanpa menunda redirect (NFR: redirect < 1 detik).
    fetch(`/api/cards/${id}/scan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source }),
      keepalive: true,
    }).catch(() => {});

    window.location.replace(url);
  }, [id, url, source]);

  return (
    <main className="page-center">
      <div className="text-center">
        <div className="mx-auto h-10 w-10 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin" />
        <p className="mt-4 text-slate-600 text-sm">
          Mengarahkan ke halaman ulasan{namaToko ? ` ${namaToko}` : ""}…
        </p>
        <a href={url} className="mt-3 inline-block text-xs text-emerald-600 underline hover:text-emerald-700 transition-colors">
          Klik di sini kalau tidak otomatis terbuka
        </a>
      </div>
    </main>
  );
}
