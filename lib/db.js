// lib/db.js
//
// Lapisan penyimpanan data kartu.
//
// Untuk MVP/dev, data disimpan di file JSON lokal (data/db.json) supaya
// proyek bisa langsung dijalankan tanpa setup database apapun.
//
// Untuk PRODUKSI (sesuai PRD, bagian 9. Tech Stack), ganti isi file ini
// dengan implementasi Vercel KV (Upstash Redis) — interface (nama fungsi
// & bentuk data) yang diekspor dari file ini SENGAJA dibuat mirip supaya
// tinggal ganti isi fungsi tanpa mengubah kode yang memanggilnya.
//
// Contoh migrasi ke Vercel KV:
//   import { kv } from '@vercel/kv';
//   export async function getCard(id) { return (await kv.get(`card:${id}`)); }
//   export async function saveCard(card) { await kv.set(`card:${card.id}`, card); }
//   export async function listCards() {
//     const ids = await kv.smembers('card:index');
//     return Promise.all(ids.map((id) => kv.get(`card:${id}`)));
//   }

import fs from "fs";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "db.json");

function ensureDb() {
  if (!fs.existsSync(path.dirname(DB_PATH))) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({ cards: {} }, null, 2));
  }
}

function readDb() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    return { cards: {} };
  }
}

function writeDb(db) {
  ensureDb();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

/** Model kartu (lihat PRD bagian 7):
 * {
 *   id, status: 'belum_aktif' | 'aktif',
 *   nama_toko, link_google_review, link_google_review_asli,
 *   owner_kontak,
 *   dibuat_pada, diaktivasi_pada,
 *   jumlah_scan, jumlah_scan_nfc, jumlah_scan_qr
 * }
 */

export async function createCard(id) {
  const db = readDb();
  const card = {
    id,
    status: "belum_aktif",
    nama_toko: null,
    link_google_review: null,
    link_google_review_asli: null,
    owner_kontak: null,
    dibuat_pada: new Date().toISOString(),
    diaktivasi_pada: null,
    jumlah_scan: 0,
    jumlah_scan_nfc: 0,
    jumlah_scan_qr: 0,
  };
  db.cards[id] = card;
  writeDb(db);
  return card;
}

export async function getCard(id) {
  const db = readDb();
  return db.cards[id] || null;
}

export async function listCards() {
  const db = readDb();
  return Object.values(db.cards).sort(
    (a, b) => new Date(b.dibuat_pada) - new Date(a.dibuat_pada)
  );
}

export async function listCardsByKontak(kontak) {
  const all = await listCards();
  const norm = String(kontak).trim().toLowerCase();
  return all.filter(
    (c) => c.owner_kontak && c.owner_kontak.trim().toLowerCase() === norm
  );
}

export async function updateCard(id, patch) {
  const db = readDb();
  if (!db.cards[id]) return null;
  db.cards[id] = { ...db.cards[id], ...patch };
  writeDb(db);
  return db.cards[id];
}

export async function incrementScan(id, source) {
  const db = readDb();
  const card = db.cards[id];
  if (!card) return null;
  card.jumlah_scan = (card.jumlah_scan || 0) + 1;
  if (source === "nfc") card.jumlah_scan_nfc = (card.jumlah_scan_nfc || 0) + 1;
  if (source === "qr") card.jumlah_scan_qr = (card.jumlah_scan_qr || 0) + 1;
  writeDb(db);
  return card;
}

export async function cardExists(id) {
  const db = readDb();
  return Boolean(db.cards[id]);
}
