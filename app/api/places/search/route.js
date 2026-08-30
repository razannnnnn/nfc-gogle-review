import { NextResponse } from "next/server";

const DEFAULT_GOOGLE_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
  "AIzaSyC0aOZFftjtxoPg1OZob7wsNAQrVwxCle4";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ ok: true, places: [] });
  }

  // Google Places API v1 searchText
  // POST https://places.googleapis.com/v1/places:searchText
  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": DEFAULT_GOOGLE_API_KEY,
        "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
      },
      body: JSON.stringify({
        textQuery: query.trim(),
      }),
    });
    const data = await res.json();

    if (Array.isArray(data.places) && data.places.length > 0) {
      const places = data.places.map((p) => ({
        place_id: p.id,
        name: p.displayName?.text || "",
        address: p.formattedAddress || "",
        review_url: `https://search.google.com/local/writereview?placeid=${p.id}`,
        maps_url: `https://search.google.com/local/writereview?placeid=${p.id}`,
      }));
      return NextResponse.json({ ok: true, places, provider: "google_v1_searchText" });
    }
  } catch (err) {
    console.error("[Google Places v1 searchText Search Error]", err);
  }

  // Fallback Darurat: Buat entri Google Search otomatis
  const fallbackPlaces = [
    {
      place_id: null,
      name: query.trim(),
      address: `Cari "${query.trim()}" di Google Maps`,
      review_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        query.trim()
      )}`,
      maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        query.trim()
      )}`,
    },
  ];

  return NextResponse.json({ ok: true, places: fallbackPlaces, provider: "fallback" });
}
