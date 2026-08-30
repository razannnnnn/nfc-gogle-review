import { NextResponse } from "next/server";
import { cardExists, incrementScan } from "@/lib/db";

export async function POST(req, { params }) {
  const { id } = await params;
  const { source } = await req.json().catch(() => ({}));

  if (!(await cardExists(id))) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const card = await incrementScan(id, source === "nfc" ? "nfc" : "qr");
  return NextResponse.json({ ok: true, jumlah_scan: card?.jumlah_scan ?? 0 });
}
