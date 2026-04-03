import { ProfileSettings } from "@/components/profile-settings";
import { requireAuthenticatedUser } from "@/lib/auth";
import { getDashboardData } from "@/lib/finance";

export default async function ProfilePage() {
  const { user } = await requireAuthenticatedUser();
  const data = await getDashboardData(user.id);

  return (
    <ProfileSettings
      name={user.name}
      initialSalaryCents={user.salaryCents}
      initialFixedCosts={data.fixedCosts}
    />
  );
}
