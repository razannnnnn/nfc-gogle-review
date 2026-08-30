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

    // Redirection ke URL direct 5-star writereview
    window.location.replace(url);
  }, [id, url, source]);

  return (
    <main className="page-center">
      <div className="text-center p-6 max-w-sm w-full">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-emerald-200 border-t-emerald-600 animate-spin mb-4" />
        <h2 className="text-base font-bold text-slate-900">
          Mengarahkan ke Form Ulasan Bintang 5…
        </h2>
        {namaToko && (
          <p className="mt-1 text-sm text-slate-600 font-medium">
            {namaToko}
          </p>
        )}
        <div className="mt-5">
          <a
            href={url}
            className="btn-primary !py-2.5 !px-5 text-sm inline-block w-full"
          >
            Buka Form Ulasan
          </a>
        </div>
      </div>
    </main>
  );
}
