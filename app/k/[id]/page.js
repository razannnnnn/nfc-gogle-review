import { getCard, incrementScan } from "@/lib/db";
import ActivationForm from "@/components/ActivationForm";
import { sanitizeReviewUrl } from "@/lib/google-review";
import { redirect } from "next/navigation";
import { XCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function KartuPage({ params, searchParams }) {
  const { id } = await params;
  const sp = await searchParams;
  const source = sp?.src === "nfc" ? "nfc" : "qr";

  const card = await getCard(id);

  if (!card) {
    return (
      <main className="page-center">
        <div className="card-shell max-w-sm w-full p-7 sm:p-8 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
            <XCircle className="w-8 h-8" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Kartu tidak ditemukan</h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            ID kartu ini belum terdaftar di sistem Review Scan. Hubungi admin
            tempat Anda mendapatkan kartu ini.
          </p>
        </div>
      </main>
    );
  }

  if (card.status === "aktif") {
    // Catat statistik scan secara otomatis di server
    await incrementScan(id, source).catch(() => {});

    const finalUrl = sanitizeReviewUrl(card.link_google_review);

    // Redirect HTTP Server-Side secara LANGSUNG (0 detik, tanpa tombol/tampilan perantara)
    redirect(finalUrl);
  }

  return <ActivationForm id={id} />;
}
