import { isAdmin } from "@/lib/auth";
import { getCard } from "@/lib/db";
import AdminLoginForm from "@/components/AdminLoginForm";
import NfcWriter from "@/components/NfcWriter";

export const dynamic = "force-dynamic";

export default async function TulisNfcPage({ params }) {
  if (!(await isAdmin())) {
    return <AdminLoginForm />;
  }

  const { id } = await params;
  const card = await getCard(id);

  if (!card) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <p className="text-slate-500">Kartu {id} tidak ditemukan.</p>
      </main>
    );
  }

  return <NfcWriter id={id} backHref="/admin" backLabel="Kembali ke Dashboard Admin" />;
}
