import { NextResponse } from "next/server";

const DEFAULT_GOOGLE_API_KEY =
  process.env.GOOGLE_PLACES_API_KEY ||
  process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
  "AIzaSyC0aOZFftjtxoPg1OZob7wsNAQrVwxCle4";

export async function POST(req) {
  try {
    const { input, sessionToken } = await req.json();

    if (!input || typeof input !== "string" || input.trim().length < 2) {
      return NextResponse.json({ ok: true, places: [] });
    }

    const payload = {
      input: input.trim(),
    };

    if (sessionToken && typeof sessionToken === "string") {
      payload.sessionToken = sessionToken;
    }

    // Google Places API (New) - Autocomplete (New)
    // Endpoint: POST https://places.googleapis.com/v1/places:autocomplete
    const res = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": DEFAULT_GOOGLE_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("[Google Autocomplete (New) API Error]", data);
      return NextResponse.json(
        { ok: false, error: data.error?.message || "Gagal mengambil data autocomplete Google Places." },
        { status: res.status }
      );
    }

    if (Array.isArray(data.suggestions)) {
      const places = data.suggestions
        .filter((item) => item.placePrediction)
        .map((item) => {
          const p = item.placePrediction;
          const placeId = p.placeId || (p.place ? p.place.replace("places/", "") : null);
          const mainText = p.structuredFormat?.mainText?.text || p.text?.text || "";
          const secondaryText = p.structuredFormat?.secondaryText?.text || "";

          return {
            place_id: placeId,
            name: mainText,
            address: secondaryText || p.text?.text || "",
            review_url: placeId
              ? `https://search.google.com/local/writereview?placeid=${placeId}`
              : null,
          };
        });

      return NextResponse.json({ ok: true, places, provider: "google_v1_autocomplete" });
    }

    return NextResponse.json({ ok: true, places: [] });
  } catch (err) {
    console.error("[Google Places v1 Autocomplete Route Exception]", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
