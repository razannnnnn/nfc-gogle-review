import Link from "next/link";
import { CreditCard, Zap, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <main className="page-wrapper">
      {/* ─── Header ─── */}
      <header className="container-wide py-5">
        <div className="site-header">
          <span className="font-bold text-lg tracking-tight text-slate-900">
            <span className="text-gradient">Review</span> Scan
          </span>
          <nav className="flex gap-2">
            <Link
              href="/dashboard"
              className="btn-secondary !py-2 !px-4 text-sm"
            >
              Login Owner
            </Link>
            <Link
              href="/admin"
              className="btn-primary !py-2 !px-4 text-sm"
            >
              Login Admin
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        {/* Decorative gradient orbs */}
        <div
          className="hero-orb"
          style={{
            width: "600px",
            height: "600px",
            background: "radial-gradient(circle, rgba(16,185,129,0.15), transparent 70%)",
            top: "-200px",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        />
        <div
          className="hero-orb"
          style={{
            width: "400px",
            height: "400px",
            background: "radial-gradient(circle, rgba(6,182,212,0.1), transparent 70%)",
            bottom: "-100px",
            right: "-100px",
          }}
        />

        <div className="container-narrow relative z-10 text-center pt-12 pb-16 sm:pt-20 sm:pb-24">
          <h1
            className="animate-fade-in-up font-extrabold tracking-tight text-slate-900"
            style={{ fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.15 }}
          >
            Satu tap, satu scan,
            <br />
            langsung jadi{" "}
            <span className="text-gradient">ulasan bintang 5</span>.
          </h1>
          <p
            className="animate-fade-in-up mt-5 text-slate-600 mx-auto"
            style={{
              fontSize: "clamp(1rem, 2.5vw, 1.125rem)",
              maxWidth: "36rem",
              animationDelay: "100ms",
            }}
          >
            Kartu NFC &amp; QR untuk toko Anda. Pelanggan tinggal tap atau scan,
            langsung diarahkan ke halaman tulis ulasan Google Maps — tanpa perlu
            mencari nama toko sendiri.
          </p>
          <div
            className="animate-fade-in-up mt-8 flex flex-col sm:flex-row justify-center gap-3"
            style={{ animationDelay: "200ms" }}
          >
            <Link href="/dashboard" className="btn-primary">
              Aktivasi Kartu Saya
            </Link>
            <Link href="/admin" className="btn-secondary">
              Masuk sebagai Admin
            </Link>
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="container-wide pb-16 sm:pb-24">
        <div className="feature-grid stagger-children">
          {[
            {
              icon: CreditCard,
              title: "1. Terima kartu",
              desc: "Kartu fisik NFC/QR dengan ID unik, siap dipasang di meja kasir.",
            },
            {
              icon: Zap,
              title: "2. Aktivasi sendiri",
              desc: "Tap/scan pertama kali membuka form aktivasi. Isi nama toko & link Google Review.",
            },
            {
              icon: Star,
              title: "3. Pelanggan review",
              desc: "Setelah aktif, setiap tap/scan langsung membuka halaman tulis ulasan toko Anda.",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="card-shell p-6 animate-fade-in-up">
                <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                  {s.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="mt-auto text-center text-xs text-slate-400 py-6 px-4">
        Review Scan — dibangun dengan Next.js, Tailwind CSS &amp; Web NFC API.
      </footer>
    </main>
  );
}
