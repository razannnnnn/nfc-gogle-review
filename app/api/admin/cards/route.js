import { NextResponse } from "next/server";
import { isAdmin } from "@/lib/auth";
import { createCard, listCards } from "@/lib/db";
import { generateCardId } from "@/lib/id";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const cards = await listCards();
  return NextResponse.json({ ok: true, cards });
}

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  const id = generateCardId();
  const card = await createCard(id);
  return NextResponse.json({ ok: true, card });
}
