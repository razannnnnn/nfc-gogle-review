import { NextResponse } from "next/server";
import { getCard, updateCard } from "@/lib/db";
import { resolveReviewLink } from "@/lib/google-review";
import { getOwnerKontak, isAdmin } from "@/lib/auth";

export async function GET(req, { params }) {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) {
    return NextResponse.json({ ok: false, error: "Kartu tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, card });
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const card = await getCard(id);
  if (!card) {
    return NextResponse.json({ ok: false, error: "Kartu tidak ditemukan." }, { status: 404 });
  }

  const admin = await isAdmin();
  const ownerKontak = await getOwnerKontak();
  const isOwner =
    ownerKontak && card.owner_kontak && ownerKontak.trim().toLowerCase() === card.owner_kontak.trim().toLowerCase();

  if (!admin && !isOwner) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { nama_toko, link_maps } = await req.json();
  const patch = {};

  if (nama_toko?.trim()) patch.nama_toko = nama_toko.trim();

  if (link_maps?.trim()) {
    const resolved = await resolveReviewLink(link_maps.trim());
    patch.link_google_review = resolved.url;
    patch.link_google_review_asli = link_maps.trim();
  }

  const updated = await updateCard(id, patch);
  return NextResponse.json({ ok: true, card: updated });
}
