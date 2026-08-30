import { NextResponse } from "next/server";
import { getCard, updateCard } from "@/lib/db";
import { resolveReviewLink } from "@/lib/google-review";
import { getGooglePlaceId } from "@/lib/google-places";
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

  // Proteksi anti-spam (honeypot field tersembunyi).
  if (honeypot) {
    return NextResponse.json({ ok: false, error: "Gagal." }, { status: 400 });
  }

  if (!nama_toko?.trim() || !owner_kontak?.trim()) {
    return NextResponse.json(
      { ok: false, error: "Nama toko dan kontak owner wajib diisi." },
      { status: 400 }
    );
  }

  const inputLink = link_maps?.trim() || nama_toko.trim();

  let resolved;
  try {
    resolved = await resolveReviewLink(inputLink);

    // Jika belum ketemu Place ID (ChIJ...), coba cari lewat Google Places API menggunakan Nama Toko
    if (!resolved.url.includes("placeid=ChIJ")) {
      const placeResult = await getGooglePlaceId(nama_toko.trim());
      if (placeResult.review_url) {
        resolved = {
          ok: true,
          url: placeResult.review_url,
          method: "place_id_dari_search_nama_toko",
        };
      }
    }
  } catch {
    return NextResponse.json(
      { ok: false, error: "Gagal memproses pencarian lokasi Google Maps." },
      { status: 400 }
    );
  }

  const updated = await updateCard(id, {
    status: "aktif",
    nama_toko: nama_toko.trim(),
    link_google_review: resolved.url,
    link_google_review_asli: inputLink,
    owner_kontak: owner_kontak.trim(),
    diaktivasi_pada: new Date().toISOString(),
  });

  await setOwnerSession(owner_kontak.trim());

  return NextResponse.json({ ok: true, card: updated, resolveMethod: resolved.method });
}
