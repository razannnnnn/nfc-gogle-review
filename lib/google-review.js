// lib/google-review.js
//
// Konversi link Google Maps biasa menjadi link ulasan langsung Google Maps.
//
// PENTING:
// - Google Place ID (mis. ChIJ...): Menggunakan `https://search.google.com/local/writereview?placeid=ChIJ...`
//   URL ini WAJIB menggunakan Place ID (ChIJ...) agar Google secara otomatis memunculkan
//   MODAL POPUP BINTANG 5 & FORM ULASAN di semua perangkat (Desktop & Mobile).

const FEATURE_ID_REGEX = /!1s(0x[0-9a-fA-F]+):(0x[0-9a-fA-F]+)/;
const CID_QUERY_REGEX = /[?&](?:cid|ludocid)=(\d+)/;
const PLACE_ID_QUERY_REGEX = /[?&](?:query_place_id|place_id)=([^&]+)/;
const PLACE_ID_REGEX = /(ChIJ[a-zA-Z0-9_-]{20,40})/;

function hexToDecimalString(hex) {
  try {
    return BigInt(hex).toString(10);
  } catch {
    return null;
  }
}

export function buildWriteReviewUrl(placeIdOrCid) {
  const val = String(placeIdOrCid).trim();
  // Jika Place ID (ChIJ...), gunakan writereview?placeid=... agar modal 5 bintang muncul
  if (val.startsWith("ChIJ")) {
    return `https://search.google.com/local/writereview?placeid=${val}`;
  }
  // Jika CID murni angka, gunakan maps.google.com/?cid=...
  if (/^\d+$/.test(val)) {
    return `https://maps.google.com/?cid=${val}`;
  }
  return `https://search.google.com/local/writereview?placeid=${val}`;
}

export function isAlreadyWriteReviewLink(url) {
  return /search\.google\.com\/local\/writereview\?placeid=ChIJ/i.test(url);
}

export function sanitizeReviewUrl(url) {
  if (!url) return url;
  const trimmed = url.trim();
  
  // Jika URL berupa writereview dengan CID angka, ubah ke maps.google.com/?cid= agar tidak 404
  const numericWritereview = trimmed.match(/search\.google\.com\/local\/writereview\?placeid=(\d+)/i);
  if (numericWritereview) {
    return `https://maps.google.com/?cid=${numericWritereview[1]}`;
  }
  
  return trimmed;
}

/**
 * Mencoba mengubah sembarang link Google Maps toko menjadi link ulasan langsung.
 * Mengembalikan { ok, url, method, original }.
 */
export async function resolveReviewLink(inputUrl) {
  const original = inputUrl.trim();

  // 1. Jika sudah berupa URL write-review dengan Place ID (ChIJ...)
  if (/search\.google\.com\/local\/writereview\?placeid=ChIJ/i.test(original)) {
    return { ok: true, url: original, method: "sudah_writereview_place_id", original };
  }

  // 2. Cari Place ID (ChIJ...) langsung dari query parameter
  const directPlaceId = original.match(PLACE_ID_QUERY_REGEX) || original.match(PLACE_ID_REGEX);
  if (directPlaceId) {
    const extracted = decodeURIComponent(directPlaceId[1]);
    if (extracted.startsWith("ChIJ")) {
      return {
        ok: true,
        url: `https://search.google.com/local/writereview?placeid=${extracted}`,
        method: "place_id_di_url",
        original,
      };
    }
  }

  // 3. Ikuti redirect link (maps.app.goo.gl atau g.co/maps) & baca respon Google Maps
  let resolvedUrl = original;
  let htmlText = "";
  try {
    const res = await fetch(original, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(6000),
    });
    resolvedUrl = res.url || original;
    htmlText = await res.text();
  } catch {
    resolvedUrl = original;
  }

  // Cari Place ID (ChIJ...) di URL hasil redirect atau di dalam isi HTML halaman Google Maps
  const placeIdMatch = resolvedUrl.match(PLACE_ID_REGEX) || htmlText.match(PLACE_ID_REGEX);
  if (placeIdMatch) {
    return {
      ok: true,
      url: `https://search.google.com/local/writereview?placeid=${placeIdMatch[1]}`,
      method: "place_id_dari_redirect",
      original,
    };
  }

  // 4. Jika hanya CID yang ditemukan, coba lookup Place ID via Google Places API jika Key tersedia
  const directCid = original.match(CID_QUERY_REGEX);
  const featureMatch = resolvedUrl.match(FEATURE_ID_REGEX);
  const cidDecimal = directCid ? directCid[1] : featureMatch ? hexToDecimalString(featureMatch[2]) : null;

  if (cidDecimal) {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;
    if (apiKey) {
      try {
        const res = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?cid=${cidDecimal}&fields=place_id&key=${apiKey}`
        );
        const data = await res.json();
        if (data.status === "OK" && data.result?.place_id) {
          return {
            ok: true,
            url: `https://search.google.com/local/writereview?placeid=${data.result.place_id}`,
            method: "place_id_dari_api_cid",
            original,
          };
        }
      } catch (err) {
        console.error("[Places API CID Lookup Error]", err);
      }
    }

    return {
      ok: true,
      url: `https://maps.google.com/?cid=${cidDecimal}`,
      method: "cid_di_url",
      original,
    };
  }

  return { ok: false, url: resolvedUrl, method: "fallback_link_asli", original };
}

export function isLikelyGoogleMapsUrl(url) {
  try {
    const u = new URL(url);
    return /google\.[a-z.]+$|goo\.gl$|maps\.app\.goo\.gl$/i.test(u.hostname);
  } catch {
    return false;
  }
}
