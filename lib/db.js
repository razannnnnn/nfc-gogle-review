// lib/db.js
//
// Lapisan penyimpanan data kartu berbasis MongoDB (Mongoose).
// Terkoneksi ke MongoDB Cluster0.

import mongoose from "mongoose";
import fs from "fs";
import path from "path";

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://razanofc_db_user:razanaqiladatabase@cluster0.r686o7n.mongodb.net/reviewscan?retryWrites=true&w=majority&appName=Cluster0";

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const CardSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: ["belum_aktif", "aktif"], default: "belum_aktif" },
    nama_toko: { type: String, default: null },
    link_google_review: { type: String, default: null },
    link_google_review_asli: { type: String, default: null },
    owner_kontak: { type: String, default: null },
    dibuat_pada: { type: String, default: () => new Date().toISOString() },
    diaktivasi_pada: { type: String, default: null },
    jumlah_scan: { type: Number, default: 0 },
    jumlah_scan_nfc: { type: Number, default: 0 },
    jumlah_scan_qr: { type: Number, default: 0 },
  },
  {
    versionKey: false,
  }
);

const Card = mongoose.models.Card || mongoose.model("Card", CardSchema);

let seeded = false;
async function seedIfEmpty() {
  if (seeded) return;
  seeded = true;
  try {
    const count = await Card.countDocuments();
    if (count === 0) {
      const seedFile = path.join(process.cwd(), "data", "db.json");
      if (fs.existsSync(seedFile)) {
        const raw = fs.readFileSync(seedFile, "utf-8");
        const json = JSON.parse(raw);
        if (json?.cards) {
          const cardList = Object.values(json.cards);
          if (cardList.length > 0) {
            await Card.insertMany(cardList);
            console.log(`[MongoDB Seed] Mengimpor ${cardList.length} kartu awal dari db.json`);
          }
        }
      }
    }
  } catch (err) {
    console.error("[MongoDB Seed Error]", err);
  }
}

async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((instance) => {
      return instance;
    });
  }

  try {
    cached.conn = await cached.promise;
    await seedIfEmpty();
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

function cleanDocument(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  delete obj._id;
  delete obj.__v;
  return obj;
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
  await connectToDatabase();
  const cardData = {
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
  const card = await Card.create(cardData);
  return cleanDocument(card);
}

export async function getCard(id) {
  await connectToDatabase();
  const card = await Card.findOne({ id }).lean();
  return cleanDocument(card);
}

export async function listCards() {
  await connectToDatabase();
  const cards = await Card.find({}).sort({ dibuat_pada: -1 }).lean();
  return cards.map(cleanDocument);
}

export async function listCardsByKontak(kontak) {
  await connectToDatabase();
  const norm = String(kontak).trim();
  const escaped = norm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const cards = await Card.find({
    owner_kontak: { $regex: new RegExp(`^${escaped}$`, "i") },
  })
    .sort({ dibuat_pada: -1 })
    .lean();
  return cards.map(cleanDocument);
}

export async function updateCard(id, patch) {
  await connectToDatabase();
  const updated = await Card.findOneAndUpdate({ id }, { $set: patch }, { new: true }).lean();
  return cleanDocument(updated);
}

export async function incrementScan(id, source) {
  await connectToDatabase();
  const inc = { jumlah_scan: 1 };
  if (source === "nfc") inc.jumlah_scan_nfc = 1;
  if (source === "qr") inc.jumlah_scan_qr = 1;

  const updated = await Card.findOneAndUpdate({ id }, { $inc: inc }, { new: true }).lean();
  return cleanDocument(updated);
}

export async function cardExists(id) {
  await connectToDatabase();
  const count = await Card.countDocuments({ id });
  return count > 0;
}
