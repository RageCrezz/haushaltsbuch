import { AppShell } from "@/components/app-shell";
import { requireAuthenticatedUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthenticatedUser();

  return <AppShell>{children}</AppShell>;
}
