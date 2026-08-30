// lib/google-review.js
//
// Konversi link Google Maps biasa (yang dibagikan owner toko lewat tombol
// "Share" di Google Maps/app) menjadi link langsung ke form "Tulis Ulasan".
//
// Cara kerja (lihat PRD 5.1 "Validasi link Google Maps"):
// 1. Ikuti redirect link (berguna untuk short link seperti maps.app.goo.gl).
// 2. Cari pola Feature ID Google (`!1s0xHEX1:0xHEX2`) di URL hasil redirect.
//    Bagian kedua (0xHEX2) adalah CID (Customer/Client ID) toko dalam heksadesimal.
// 3. Ubah CID ke desimal, lalu susun URL:
//    https://search.google.com/local/writereview?placeid=<CID_DESIMAL>
//    yang langsung membuka form pemberian bintang & ulasan untuk toko itu.
// 4. Kalau link sudah dalam format writereview, atau polanya tidak ditemukan,
//    fallback aman dipakai supaya kartu tetap berfungsi.

const FEATURE_ID_REGEX = /!1s(0x[0-9a-fA-F]+):(0x[0-9a-fA-F]+)/;
const CID_QUERY_REGEX = /[?&](?:cid|ludocid)=(\d+)/;
const PLACE_ID_QUERY_REGEX = /[?&](?:query_place_id|place_id)=([^&]+)/;

function hexToDecimalString(hex) {
  try {
    return BigInt(hex).toString(10);
  } catch {
    return null;
  }
}

function buildWriteReviewUrl(placeIdOrCid) {
  return `https://search.google.com/local/writereview?placeid=${placeIdOrCid}`;
}

export function isAlreadyWriteReviewLink(url) {
  return /search\.google\.com\/local\/writereview/i.test(url);
}

/**
 * Mencoba mengubah sembarang link Google Maps toko menjadi link "tulis ulasan".
 * Mengembalikan { ok, url, method, original }.
 *  - ok: apakah berhasil dikonversi secara pasti (true) atau hanya fallback (false)
 *  - url: link final yang akan dipakai untuk redirect pelanggan
 *  - method: penjelasan singkat metode yang dipakai (untuk ditampilkan ke admin/owner)
 */
export async function resolveReviewLink(inputUrl) {
  const original = inputUrl.trim();

  if (isAlreadyWriteReviewLink(original)) {
    return { ok: true, url: original, method: "sudah_writereview", original };
  }

  const directPlaceId = original.match(PLACE_ID_QUERY_REGEX);
  if (directPlaceId) {
    return {
      ok: true,
      url: buildWriteReviewUrl(decodeURIComponent(directPlaceId[1])),
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
    // Kalau gagal fetch (mis. offline saat build/dev), tetap coba parse URL asli
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

  // Fallback: tidak berhasil menemukan CID/place_id secara pasti.
  // Supaya kartu tetap berfungsi, arahkan ke link Maps toko apa adanya —
  // pelanggan masih bisa menekan tombol ulasan/bintang manual di sana.
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
