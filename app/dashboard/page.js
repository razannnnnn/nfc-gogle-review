import { getOwnerKontak } from "@/lib/auth";
import { listCardsByKontak } from "@/lib/db";
import OwnerLoginForm from "@/components/OwnerLoginForm";
import OwnerDashboard from "@/components/OwnerDashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const kontak = await getOwnerKontak();
  if (!kontak) {
    return <OwnerLoginForm />;
  }

  const cards = await listCardsByKontak(kontak);
  if (cards.length === 0) {
    return <OwnerLoginForm />;
  }

  return <OwnerDashboard initialCards={cards} />;
}
