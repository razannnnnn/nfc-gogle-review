export function getBaseUrl(req) {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;

  if (req) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const host = req.headers.get("host");
    if (host) return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}
