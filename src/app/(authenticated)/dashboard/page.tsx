import { DashboardClient } from "@/components/dashboard-client";
import { getDashboardData } from "@/lib/finance";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function DashboardPage() {
  const { user } = await requireAuthenticatedUser();

  const data = await getDashboardData(user.id);
  return <DashboardClient data={data} />;
}
