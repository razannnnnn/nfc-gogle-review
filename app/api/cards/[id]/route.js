import { NextResponse } from "next/server";
import { getCard, updateCard, deleteCard } from "@/lib/db";
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

  const body = await req.json();
  const patch = {};

  if (typeof body.nama_toko === "string") {
    patch.nama_toko = body.nama_toko.trim() || null;
  }

  if (body.link_maps?.trim()) {
    const resolved = await resolveReviewLink(body.link_maps.trim());
    patch.link_google_review = resolved.url;
    patch.link_google_review_asli = body.link_maps.trim();
  }

  if (admin) {
    if (body.status === "aktif" || body.status === "belum_aktif") {
      patch.status = body.status;
      if (body.status === "aktif" && !card.diaktivasi_pada) {
        patch.diaktivasi_pada = new Date().toISOString();
      }
    }
    if (typeof body.owner_kontak === "string") {
      patch.owner_kontak = body.owner_kontak.trim() || null;
    }
  }

  const updated = await updateCard(id, patch);
  return NextResponse.json({ ok: true, card: updated });
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const deleted = await deleteCard(id);
  if (!deleted) {
    return NextResponse.json({ ok: false, error: "Kartu tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: "Kartu berhasil dihapus." });
}
