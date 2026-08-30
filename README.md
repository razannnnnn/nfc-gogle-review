# Review Scan

Website pengelola kartu NFC/QR untuk redirect otomatis ke halaman "Tulis
Ulasan" Google Maps toko — sesuai PRD `PRD-KitaScan.md` (tidak disertakan di
sini, tapi seluruh fitur MVP di PRD sudah diimplementasikan).

## Tech stack

- **Next.js 15** (App Router, JavaScript — bukan TypeScript)
- **Tailwind CSS v4**
- **Framer Motion** untuk animasi form & transisi halaman
- **Sonner** untuk toast notifikasi, dibungkus wrapper "gooey" custom di
  `lib/toast.js` (lihat catatan di bawah)
- **Web NFC API** (`NDEFReader`) — native browser API, tanpa library tambahan
- **qrcode** untuk generate QR code PNG
- Penyimpanan data: file JSON lokal (`data/db.json`) — lihat catatan migrasi
  ke Vercel KV di bawah

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # lalu ganti ADMIN_PASSWORD
npm run dev
```

Buka `http://localhost:3000`.

- **Landing page**: `/`
- **Login admin**: `/admin` (password dari `ADMIN_PASSWORD`, default `admin123`)
- **Login owner**: `/dashboard` (pakai no. HP/email yang didaftarkan saat aktivasi kartu)
- **Halaman kartu**: `/k/[id]` — ini yang dituju oleh QR code & chip NFC

### Alur coba cepat (tanpa kartu fisik / HP Android)

1. Buka `/admin`, login, klik "Buat Kartu Baru" → dapat ID kartu (mis. `abc123`).
2. Buka `/k/abc123` di tab baru → isi form aktivasi (nama toko + link Google
   Maps + kontak) → submit.
3. Buka lagi `/k/abc123` → sekarang langsung redirect ke link ulasan yang
   sudah dikonversi.
4. Login ke `/dashboard` pakai kontak yang tadi diisi → bisa edit link &
   download QR / tulis ulang NFC dari sana.

Menulis chip NFC sungguhan (`/admin/tulis/[id]` dan
`/dashboard/tulis-ulang/[id]`) **hanya bisa diuji di HP Android dengan Chrome**
dan situs harus diakses lewat **HTTPS** (kecuali `localhost`, yang dikecualikan
oleh spesifikasi Web NFC). Untuk uji coba di HP, deploy dulu ke Vercel (otomatis
HTTPS) atau gunakan tunnel HTTPS (ngrok, dsb) ke server dev.

## Struktur proyek (ringkas)

```
app/
  page.js                        Landing page
  k/[id]/page.js                 Halaman pintar: form aktivasi / redirect
  admin/page.js                  Dashboard admin (login + generate + list)
  admin/tulis/[id]/page.js       Tulis chip NFC (admin)
  dashboard/page.js              Dashboard owner (login + kelola kartu)
  dashboard/tulis-ulang/[id]/    Tulis ulang chip NFC (owner)
  api/...                        Route handlers (lihat di bawah)
components/                      Komponen client (form, dashboard, NFC writer, dst)
lib/
  db.js                          Lapisan penyimpanan data (JSON file, siap diganti KV)
  auth.js                        Sesi admin & owner berbasis cookie
  google-review.js               Konversi link Maps → link "tulis ulasan"
  toast.js                       Wrapper toast gooey (Sonner + Framer Motion)
  id.js / url.js                 Helper ID kartu & base URL
data/db.json                     "Database" JSON lokal (dev only)
```

### API routes

| Route | Fungsi |
|---|---|
| `POST /api/admin/login`, `/api/admin/logout` | Sesi admin |
| `GET/POST /api/admin/cards` | List & generate kartu (admin) |
| `POST /api/owner/login`, `/api/owner/logout` | Sesi owner |
| `GET /api/cards/[id]` | Info kartu (dipakai internal) |
| `POST /api/cards/[id]/activate` | Submit form aktivasi (publik, sekali per kartu) |
| `PATCH /api/cards/[id]` | Update nama toko / link (admin atau owner kartu itu) |
| `POST /api/cards/[id]/scan` | Increment counter statistik scan |
| `GET /api/qr/[id]` | Generate & kembalikan QR code PNG |

## Catatan implementasi penting

### 1. Konversi link Google Maps → "Tulis Ulasan" (`lib/google-review.js`)

Owner cukup tempel link share biasa dari Google Maps. Sistem mencoba, secara
berurutan:

1. Deteksi kalau link sudah berformat `search.google.com/local/writereview`.
2. Cari `place_id`/`cid` langsung di query string URL.
3. Ikuti redirect (berguna untuk link pendek `maps.app.goo.gl`), lalu cari pola
   Feature ID Google (`!1s0xHEX1:0xHEX2`) di URL hasil redirect — bagian kedua
   adalah CID toko dalam heksadesimal, dikonversi ke desimal untuk membentuk
   link `writereview`.
4. Kalau semua gagal, fallback ke link asli apa adanya supaya kartu tetap
   berfungsi (pelanggan masih bisa cari tombol ulasan manual).

Ini pendekatan best-effort — akurasinya tergantung format link yang dibagikan
Google, yang bisa berubah sewaktu-waktu. Untuk hasil 100% pasti, arahkan owner
untuk mencari place ID resminya lewat
[Place ID Finder](https://developers.google.com/maps/documentation/places/web-service/place-id)
lalu tempel link `writereview` langsung.

### 2. `goey-toast` → wrapper custom di `lib/toast.js`

PRD awalnya menyebut paket `goey-toast` (Sonner + Framer Motion). Setelah
dicoba, paket ini menyebabkan error saat `next build` di kombinasi Next.js 15 +
React 19 (`Class extends value undefined`, dari error-boundary internal
paketnya). Supaya proyek tetap bisa di-build dan dijalankan, dibuat wrapper
tipis sendiri (`lib/toast.js`) langsung di atas `sonner` + `framer-motion`
dengan API yang sengaja dibuat mirip (`gooeyToast(...)`, `gooeyToast.success`,
`gooeyToast.update`, `<GooeyToaster />`) — jadi seluruh komponen lain tidak
perlu tahu soal penggantian ini. Kalau suatu saat versi `goey-toast` yang lebih
baru sudah kompatibel, tinggal ganti isi file ini kembali ke import paket asli.

### 3. Autentikasi (MVP, disederhanakan)

- **Admin**: satu password (`ADMIN_PASSWORD`) → cookie sesi. Cukup untuk satu
  operator; untuk banyak admin, ganti dengan sistem user/role sungguhan.
- **Owner**: login hanya dengan kontak (no HP/email) yang sama persis dengan
  yang diisi saat aktivasi — tanpa OTP/password. Ini disengaja untuk MVP
  (kartu fisik = "sesuatu yang dimiliki" sebagai faktor keamanan awal).
  **Sebelum produksi**, sangat disarankan menambah verifikasi OTP (kirim kode
  ke HP/email tsb) sebelum sesi owner dibuat, supaya orang lain yang menebak
  kontak pemilik tidak bisa mengambil alih kartu.

### 4. Statistik sumber scan (NFC vs QR)

Link yang ditulis ke chip NFC memakai `?src=nfc`, sedangkan yang di-encode ke
QR memakai `?src=qr` — keduanya menuju route yang sama (`/k/[id]`), tinggal
dibedakan lewat query param ini untuk mengisi `jumlah_scan_nfc` /
`jumlah_scan_qr`.

### 5. Anti-spam aktivasi

Form aktivasi punya honeypot field tersembunyi (bot yang mengisi semua field
otomatis akan mengisi honeypot juga → ditolak). Untuk proteksi lebih kuat,
tambahkan rate limiting per IP di `api/cards/[id]/activate`.

## Migrasi ke database produksi (Vercel KV)

`lib/db.js` sengaja dibuat sebagai satu-satunya file yang menyentuh
penyimpanan data, dengan interface (nama & bentuk fungsi) yang meniru
`@vercel/kv`. Untuk pindah ke Vercel KV (Upstash Redis) sesuai PRD:

```bash
npm install @vercel/kv
```

Lalu ganti isi `lib/db.js` — contoh untuk `getCard`/`saveCard`:

```js
import { kv } from '@vercel/kv';

export async function getCard(id) {
  return await kv.get(`card:${id}`);
}

export async function createCard(id) {
  const card = { id, status: 'belum_aktif', /* ...field lain... */ };
  await kv.set(`card:${id}`, card);
  await kv.sadd('card:index', id);
  return card;
}

export async function listCards() {
  const ids = await kv.smembers('card:index');
  const cards = await Promise.all(ids.map((id) => kv.get(`card:${id}`)));
  return cards.filter(Boolean).sort((a, b) => new Date(b.dibuat_pada) - new Date(a.dibuat_pada));
}
```

Tidak ada file lain yang perlu diubah karena semua pemanggil hanya bergantung
pada fungsi-fungsi di `lib/db.js`.

## Deploy ke Vercel

1. Push proyek ini ke repo Git, import ke Vercel.
2. Set environment variable `ADMIN_PASSWORD` (wajib diganti dari default).
3. (Opsional) Set `NEXT_PUBLIC_BASE_URL` kalau ingin memaksa domain tertentu
   dipakai di link QR/NFC (kalau tidak diisi, otomatis dideteksi dari domain
   yang diakses).
4. Ikuti langkah di atas untuk pindah ke Vercel KV sebelum kartu dipakai
   sungguhan — penyimpanan file JSON di repo **tidak persisten** di
   lingkungan serverless Vercel.

## Di luar cakupan MVP ini (sesuai PRD bagian 12 & fitur "nice to have")

- Pembayaran/e-commerce penjualan kartu fisik
- Notifikasi WhatsApp/email otomatis saat kartu diaktivasi
- Custom desain QR dengan logo toko di tengah
- Deteksi otomatis dukungan Web NFC di browser pelanggan (yang ada baru
  deteksi untuk halaman *tulis* NFC oleh admin/owner)
- Multi-kartu per toko dengan agregasi statistik gabungan
