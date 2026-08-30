// lib/google-places.js
//
// Implementasi Pencarian Place ID & Format Link Direct Ulasan sesuai Dokumentasi Google Places API:
// https://developers.google.com/maps/documentation/places/web-service/place-id
//
// Format Direct Link Ulasan Resmi Google:
// https://search.google.com/local/writereview?placeid={PLACE_ID}

const PLACE_ID_REGEX = /(ChIJ[a-zA-Z0-9_-]{20,40})/;
const CID_REGEX = /[?&](?:cid|ludocid)=(\d+)/;

/**
 * Membuat URL pengarahan langsung ke form ulasan 5-bintang Google berdasarkan Place ID.
 * @param {string} placeId - Kode Place ID Google (misal: "ChIJN1t_tDeuEmsRUsoyG83frY4")
 * @returns {string} URL langsung ke form ulasan
 */
export function buildDirectReviewUrl(placeId) {
  if (!placeId) return "";
  const cleanedId = String(placeId).trim();
  return `https://search.google.com/local/writereview?placeid=${cleanedId}`;
}

/**
 * Mencari dan mengekstrak Place ID resmi dari nama toko, link Google Maps, atau CID.
 * Sesuai panduan Google Places Web Service API (Find Place & Place Details).
 *
 * @param {string} input - Nama toko, URL Google Maps, CID, atau Place ID
 * @returns {Promise<{ place_id: string|null, review_url: string|null, name?: string, address?: string }>}
 */
export async function getGooglePlaceId(input) {
  if (!input || typeof input !== "string") {
    return { place_id: null, review_url: null };
  }

  const query = input.trim();

  // 1. Jika input sudah berupa Place ID murni (berawalan ChIJ...)
  if (query.startsWith("ChIJ") && query.length >= 20) {
    return {
      place_id: query,
      review_url: buildDirectReviewUrl(query),
    };
  }

  // 2. Jika input berupa URL yang mengandung query place_id atau Place ID ChIJ...
  const matchDirect = query.match(PLACE_ID_REGEX);
  if (matchDirect) {
    const placeId = matchDirect[1];
    return {
      place_id: placeId,
      review_url: buildDirectReviewUrl(placeId),
    };
  }

  const apiKey =
    process.env.GOOGLE_PLACES_API_KEY ||
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

  // 3. Jika input berupa link Google Maps (seperti maps.app.goo.gl) -> Ikuti redirect & baca halaman
  if (/maps|goo\.gl/i.test(query)) {
    try {
      const res = await fetch(query, {
        method: "GET",
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        signal: AbortSignal.timeout(6000),
      });

      const finalUrl = res.url || query;
      const htmlText = await res.text();

      // Cari Place ID ChIJ... dari URL redirect atau isi HTML
      const matchInRedirect = finalUrl.match(PLACE_ID_REGEX) || htmlText.match(PLACE_ID_REGEX);
      if (matchInRedirect) {
        const placeId = matchInRedirect[1];
        return {
          place_id: placeId,
          review_url: buildDirectReviewUrl(placeId),
        };
      }

      // Jika menemukan CID angka
      const cidMatch = finalUrl.match(CID_REGEX) || query.match(CID_REGEX);
      if (cidMatch && apiKey) {
        const cid = cidMatch[1];
        const apiRes = await fetch(
          `https://maps.googleapis.com/maps/api/place/details/json?cid=${cid}&fields=place_id,name,formatted_address&key=${apiKey}`
        );
        const apiData = await apiRes.json();
        if (apiData.status === "OK" && apiData.result?.place_id) {
          const placeId = apiData.result.place_id;
          return {
            place_id: placeId,
            review_url: buildDirectReviewUrl(placeId),
            name: apiData.result.name,
            address: apiData.result.formatted_address,
          };
        }
      }
    } catch (err) {
      console.error("[getGooglePlaceId Redirect Error]", err);
    }
  }

  // 4. Jika input berupa Teks / Nama Toko -> Gunakan Google Places API (Find Place / Text Search)
  if (apiKey) {
    try {
      // Panggil Google Places API Find Place from Text
      const apiRes = await fetch(
        `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
          query
        )}&inputtype=textquery&fields=place_id,name,formatted_address&key=${apiKey}`
      );
      const apiData = await apiRes.json();

      if (apiData.status === "OK" && Array.isArray(apiData.candidates) && apiData.candidates.length > 0) {
        const candidate = apiData.candidates[0];
        return {
          place_id: candidate.place_id,
          review_url: buildDirectReviewUrl(candidate.place_id),
          name: candidate.name,
          address: candidate.formatted_address,
        };
      }
    } catch (err) {
      console.error("[getGooglePlaceId API Error]", err);
    }
  }

  return { place_id: null, review_url: null };
}

/**
 * Mengambil Place ID & Direct Link Ulasan Google
 * Format hasil: https://search.google.com/local/writereview?placeid={PLACE_ID}
 * HANYA dengan memasukkan string NAMA TEMPAT / TOKO.
 *
 * @param {string} storeName - Nama tempat/toko (misal: "Kopi Senja Kediri")
 * @returns {Promise<{ place_id: string|null, review_url: string|null, name?: string, address?: string }>}
 */
export async function getPlaceIdByName(storeName) {
  if (!storeName || typeof storeName !== "string") {
    return { place_id: null, review_url: null };
  }
  return getGooglePlaceId(storeName);
}

