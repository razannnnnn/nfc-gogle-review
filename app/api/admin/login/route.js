import { NextResponse } from "next/server";
import { getAdminPassword, setAdminSession } from "@/lib/auth";

export async function POST(req) {
  const { password } = await req.json();

  if (!password || password !== getAdminPassword()) {
    return NextResponse.json(
      { ok: false, error: "Password salah." },
      { status: 401 }
    );
  }

  await setAdminSession();
  return NextResponse.json({ ok: true });
}
