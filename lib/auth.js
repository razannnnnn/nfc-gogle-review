// lib/auth.js
//
// Autentikasi MVP yang sengaja disederhanakan supaya proyek bisa langsung
// dijalankan tanpa provider auth eksternal:
//
//  - Admin  : satu password tunggal dari env ADMIN_PASSWORD (default "admin123"
//             untuk development — WAJIB diganti sebelum deploy produksi).
//  - Owner  : login cukup dengan kontak (no HP/email) yang sama persis dengan
//             yang diisi saat aktivasi kartu. Ini cukup untuk MVP karena kartu
//             fisik sudah jadi "faktor kepemilikan"-nya; untuk produksi,
//             tambahkan verifikasi OTP ke kontak tsb (lihat catatan di README).
//
// Session disimpan sebagai cookie httpOnly sederhana (bukan JWT) — cukup untuk
// MVP satu server. Untuk multi-instance/produksi, ganti dengan session store
// (mis. iron-session / next-auth) sesuai kebutuhan keamanan.

import { cookies } from "next/headers";

const ADMIN_COOKIE = "rs_admin";
const OWNER_COOKIE = "rs_owner";

export function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || "admin123";
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "ok", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 jam
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.delete(ADMIN_COOKIE);
}

export async function isAdmin() {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === "ok";
}

export async function setOwnerSession(kontak) {
  const store = await cookies();
  store.set(OWNER_COOKIE, kontak, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 hari
  });
}

export async function clearOwnerSession() {
  const store = await cookies();
  store.delete(OWNER_COOKIE);
}

export async function getOwnerKontak() {
  const store = await cookies();
  return store.get(OWNER_COOKIE)?.value || null;
}
