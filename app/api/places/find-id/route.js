import { NextResponse } from "next/server";
import { getGooglePlaceId, buildDirectReviewUrl } from "@/lib/google-places";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");

  if (!q || !q.trim()) {
    return NextResponse.json(
      { ok: false, error: "Parameter 'q' (nama toko / URL) wajib diisi." },
      { status: 400 }
    );
  }

  const result = await getGooglePlaceId(q);

  if (!result.place_id) {
    return NextResponse.json(
      {
        ok: false,
        error: "Place ID tidak ditemukan. Pastikan API key terpasang atau gunakan URL Google Maps lengkap.",
      },
      { status: 444 }
    );
  }

  return NextResponse.json({
    ok: true,
    place_id: result.place_id,
    review_url: result.review_url || buildDirectReviewUrl(result.place_id),
    name: result.name || null,
    address: result.address || null,
  });
}
