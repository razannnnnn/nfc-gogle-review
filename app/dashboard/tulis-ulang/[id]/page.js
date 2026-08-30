import { getOwnerKontak } from "@/lib/auth";
import { getCard } from "@/lib/db";
import OwnerLoginForm from "@/components/OwnerLoginForm";
import NfcWriter from "@/components/NfcWriter";

export const dynamic = "force-dynamic";

export default async function TulisUlangPage({ params }) {
  const { id } = await params;
  const kontak = await getOwnerKontak();
  const card = await getCard(id);

  if (!card) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-slate-500">Kartu {id} tidak ditemukan.</p>
      </main>
    );
  }

  const isOwner =
    kontak && card.owner_kontak && kontak.trim().toLowerCase() === card.owner_kontak.trim().toLowerCase();

  if (!isOwner) {
    return <OwnerLoginForm />;
  }

  return <NfcWriter id={id} backHref="/dashboard" backLabel="Kembali ke Kartu Saya" />;
}
