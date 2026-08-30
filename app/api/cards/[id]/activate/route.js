import { NextResponse } from "next/server";
import { getCard, updateCard } from "@/lib/db";
import { resolveReviewLink } from "@/lib/google-review";
import { setOwnerSession } from "@/lib/auth";

export async function POST(req, { params }) {
  const { id } = await params;
  const card = await getCard(id);

  if (!card) {
    return NextResponse.json(
      { ok: false, error: "Kartu tidak ditemukan." },
      { status: 404 }
    );
  }

  if (card.status === "aktif") {
    return NextResponse.json(
      { ok: false, error: "Kartu ini sudah aktif." },
      { status: 409 }
    );
  }

  const { nama_toko, link_maps, owner_kontak, honeypot } = await req.json();

  // Proteksi anti-spam sederhana (PRD 5.2): honeypot field tersembunyi.
  if (honeypot) {
    return NextResponse.json({ ok: false, error: "Gagal." }, { status: 400 });
  }

  if (!nama_toko?.trim() || !link_maps?.trim() || !owner_kontak?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Semua kolom wajib diisi." },
      { status: 400 }
    );
  }

  let resolved;
  try {
    resolved = await resolveReviewLink(link_maps.trim());
  } catch {
    return NextResponse.json(
      { ok: false, error: "Link Google Maps tidak valid." },
      { status: 400 }
    );
  }

  const updated = await updateCard(id, {
    status: "aktif",
    nama_toko: nama_toko.trim(),
    link_google_review: resolved.url,
    link_google_review_asli: link_maps.trim(),
    owner_kontak: owner_kontak.trim(),
    diaktivasi_pada: new Date().toISOString(),
  });

  await setOwnerSession(owner_kontak.trim());

  return NextResponse.json({ ok: true, card: updated, resolveMethod: resolved.method });
}
