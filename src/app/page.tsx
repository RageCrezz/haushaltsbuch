import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { requireUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    registered?: string | string[];
    verified?: string | string[];
    verificationError?: string | string[];
  }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthForm
      mode="login"
      registrationSuccess={params.registered === "1"}
      verificationSuccess={params.verified === "1"}
      verificationError={params.verificationError === "1"}
    />
  );
}
