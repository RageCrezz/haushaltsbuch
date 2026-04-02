import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth-form";
import { requireUser } from "@/lib/auth";

export default async function RegisterPage() {
  const user = await requireUser();

  if (user) {
    redirect("/dashboard");
  }

  return <AuthForm mode="register" />;
}
