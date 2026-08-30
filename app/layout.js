import "./globals.css";
import { Outfit } from "next/font/google";
import { GooeyToaster } from "@/lib/toast";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "Review Scan — Kartu NFC/QR untuk Google Review",
  description:
    "Kartu tap NFC & scan QR yang langsung membuka halaman tulis ulasan Google Maps toko Anda.",
  icons: { icon: "/favicon.ico" },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#10b981",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={outfit.variable}>
      <body>
        {children}
        <GooeyToaster position="top-center" />
      </body>
    </html>
  );
}
