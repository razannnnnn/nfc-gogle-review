// lib/google-review.js
//
// Konversi link Google Maps biasa menjadi link ulasan langsung Google Maps.
//
// PENTING:
// - Google Place ID (mis. ChIJ...): Menggunakan `https://search.google.com/local/writereview?placeid=ChIJ...`
// - Numeric CID (mis. 13013377354521611301): WAJIB menggunakan `https://maps.google.com/?cid=13013377354521611301`
//   (Jika CID desimal dimasukkan ke `writereview?placeid=`, Google akan mengembalikan Error 404!)

const FEATURE_ID_REGEX = /!1s(0x[0-9a-fA-F]+):(0x[0-9a-fA-F]+)/;
const CID_QUERY_REGEX = /[?&](?:cid|ludocid)=(\d+)/;
const PLACE_ID_QUERY_REGEX = /[?&](?:query_place_id|place_id)=([^&]+)/;
const WRITEREVIEW_NUMERIC_REGEX = /search\.google\.com\/local\/writereview\?placeid=(\d+)/i;

function hexToDecimalString(hex) {
  try {
    return BigInt(hex).toString(10);
  } catch {
    return null;
  }
}

export function buildWriteReviewUrl(placeIdOrCid) {
  const val = String(placeIdOrCid).trim();
  // Jika value murni angka (CID), gunakan maps.google.com/?cid=... agar tidak 404
  if (/^\d+$/.test(val)) {
    return `https://maps.google.com/?cid=${val}`;
  }
  // Jika Place ID (ChIJ...), gunakan writereview?placeid=...
  return `https://search.google.com/local/writereview?placeid=${val}`;
}

export function isAlreadyWriteReviewLink(url) {
  return /search\.google\.com\/local\/writereview|maps\.google\.com\/\?cid=/i.test(url);
}

export function sanitizeReviewUrl(url) {
  if (!url) return url;
  const trimmed = url.trim();
  
  // Perbaiki URL yang salah memasukkan CID angka ke writereview?placeid= (penyebab Error 404 Google)
  const numericMatch = trimmed.match(WRITEREVIEW_NUMERIC_REGEX);
  if (numericMatch) {
    return `https://maps.google.com/?cid=${numericMatch[1]}`;
  }
  
  return trimmed;
}

/**
 * Mencoba mengubah sembarang link Google Maps toko menjadi link ulasan langsung.
 * Mengembalikan { ok, url, method, original }.
 */
export async function resolveReviewLink(inputUrl) {
  const original = inputUrl.trim();

  // Cek apakah ada bug writereview + CID angka di URL input
  const sanitized = sanitizeReviewUrl(original);
  if (sanitized !== original) {
    return { ok: true, url: sanitized, method: "perbaikan_cid_writereview", original };
  }

  if (isAlreadyWriteReviewLink(original)) {
    return { ok: true, url: original, method: "sudah_writereview", original };
  }

  const directPlaceId = original.match(PLACE_ID_QUERY_REGEX);
  if (directPlaceId) {
    const extracted = decodeURIComponent(directPlaceId[1]);
    return {
      ok: true,
      url: buildWriteReviewUrl(extracted),
      method: "place_id_di_url",
      original,
    };
  }

  const directCid = original.match(CID_QUERY_REGEX);
  if (directCid) {
    return {
      ok: true,
      url: buildWriteReviewUrl(directCid[1]),
      method: "cid_di_url",
      original,
    };
  }

  // Coba resolve redirect (link pendek maps.app.goo.gl, atau g.co/...)
  let resolvedUrl = original;
  try {
    const res = await fetch(original, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(6000),
    });
    resolvedUrl = res.url || original;
  } catch {
    resolvedUrl = original;
  }

  const featureMatch = resolvedUrl.match(FEATURE_ID_REGEX);
  if (featureMatch) {
    const cidDecimal = hexToDecimalString(featureMatch[2]);
    if (cidDecimal) {
      return {
        ok: true,
        url: buildWriteReviewUrl(cidDecimal),
        method: "feature_id_dari_redirect",
        original,
      };
    }
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
