import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { requireUser } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ registered?: string | string[] }>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  if (user) {
    redirect("/dashboard");
  }

  return (
    <AuthForm mode="login" registrationSuccess={params.registered === "1"} />
  );
}
