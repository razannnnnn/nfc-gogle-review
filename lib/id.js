import { customAlphabet } from "nanoid";

// Alphabet tanpa karakter yang mirip (0/O, 1/l/I) supaya ID gampang dibaca
// kalau sewaktu-waktu perlu ditulis manual, dan tetap pendek untuk URL/QR.
const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";
const generate = customAlphabet(alphabet, 8);

export function generateCardId() {
  return generate();
}
