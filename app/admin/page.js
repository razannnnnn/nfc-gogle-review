import { isAdmin } from "@/lib/auth";
import { listCards } from "@/lib/db";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await isAdmin())) {
    return <AdminLoginForm />;
  }

  const cards = await listCards();
  return <AdminDashboard initialCards={cards} />;
}
