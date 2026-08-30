import { NextResponse } from "next/server";
import { setOwnerSession } from "@/lib/auth";
import { listCardsByKontak } from "@/lib/db";

export async function POST(req) {
  const { kontak } = await req.json();

  if (!kontak || !kontak.trim()) {
    return NextResponse.json(
      { ok: false, error: "Isi nomor HP atau email dulu ya." },
      { status: 400 }
    );
  }

  const cards = await listCardsByKontak(kontak);
  if (cards.length === 0) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Belum ada kartu aktif dengan kontak ini. Aktivasi kartu Anda dulu lewat tap/scan kartu fisiknya.",
      },
      { status: 404 }
    );
  }

  await setOwnerSession(kontak.trim());
  return NextResponse.json({ ok: true, cards });
}
