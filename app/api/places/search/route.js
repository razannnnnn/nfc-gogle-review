import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ ok: true, places: [] });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  // Jika API Key Google Places tersedia di .env.local
  if (apiKey) {
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          query
        )}&key=${apiKey}&language=id`,
        { next: { revalidate: 3600 } }
      );
      const data = await res.json();

      if (data.status === "OK" && Array.isArray(data.results)) {
        const places = data.results.slice(0, 5).map((p) => ({
          place_id: p.place_id,
          name: p.name,
          address: p.formatted_address || "",
          review_url: `https://search.google.com/local/writereview?placeid=${p.place_id}`,
          maps_url: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            p.name
          )}&query_place_id=${p.place_id}`,
        }));
        return NextResponse.json({ ok: true, places, provider: "google" });
      }
    } catch (err) {
      console.error("[Google Places Search Error]", err);
    }
  }

  // Fallback tanpa API Key: Menggunakan OpenStreetMap Nominatim + Google Maps Link Generator
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
        query
      )}&format=json&addressdetails=1&limit=5`,
      {
        headers: {
          "User-Agent": "ReviewScanApp/1.0",
        },
      }
    );
    const data = await res.json();

    if (Array.isArray(data)) {
      const places = data.map((item) => {
        const name =
          item.address?.amenity ||
          item.address?.shop ||
          item.address?.building ||
          item.display_name.split(",")[0];
        const address = item.display_name;
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          name + " " + address
        )}`;

        return {
          place_id: item.place_id ? String(item.place_id) : null,
          name: name.trim(),
          address: address,
          review_url: mapsUrl,
          maps_url: mapsUrl,
        };
      });

      return NextResponse.json({ ok: true, places, provider: "osm_fallback" });
    }
  } catch (err) {
    console.error("[OSM Places Search Error]", err);
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
