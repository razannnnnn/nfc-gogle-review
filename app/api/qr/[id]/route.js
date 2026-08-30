import QRCode from "qrcode";
import { cardExists } from "@/lib/db";
import { getBaseUrl } from "@/lib/url";

export async function GET(req, { params }) {
  const { id } = await params;

  if (!(await cardExists(id))) {
    return new Response("Kartu tidak ditemukan", { status: 404 });
  }

  const url = `${getBaseUrl(req)}/k/${id}?src=qr`;
  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 640,
    margin: 2,
    color: { dark: "#0f172a", light: "#ffffff" },
  });

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `inline; filename="reviewscan-${id}.png"`,
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    },
  });
}
