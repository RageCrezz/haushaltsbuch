"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { SessionProvider } from "next-auth/react";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/profil", label: "Einstellungen" },
];

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <header className="border-b border-primary/25 bg-white shadow-cute">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
            <h2 className="text-primary text-xl font-bold">Haushaltsbuch</h2>

            <nav className="flex flex-wrap items-center gap-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-pill ${pathname === item.href ? "nav-pill-active" : ""}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <LogoutButton />
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </SessionProvider>
  );
}
