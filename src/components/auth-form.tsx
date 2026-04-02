"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

type AuthMode = "login" | "register";

export function AuthForm({
  mode,
  registrationSuccess = false,
}: {
  mode: AuthMode;
  registrationSuccess?: boolean;
}) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsPending(true);

    try {
      // Wenn wir uns einloggen möchten, Next.Auth nutzen um Session zu erstellen
      if (mode === "login") {
        const result = await signIn("credentials", {
          username,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError("Benutzername oder Passwort ist falsch.");
          return;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      // Wenn wir uns nicht einloggen, dann Registrierung durchführen
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setError(payload?.error ?? "Etwas ist schiefgelaufen.");
        return;
      }

      // Suchparameter wird hier gesetzt, damit Frontend im Parent Component die Meldung für Registrierung erfolgreich anzeigt.
      router.push("/?registered=1");
      router.refresh();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col justify-center px-4 py-10 md:px-6">
      <section className="rounded-xl border-1 border-primary/25 bg-white p-8 shadow-md">
        <h2 className="mt-3 text-3xl font-semibold text-primary">
          {mode === "login" ? "Willkommen zurück" : "Registrier dich!"}
        </h2>

        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm">Benutzername</span>
            <input
              className="input-field"
              name="username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="grid gap-2">
            <span className="text-sm">Passwort</span>
            <input
              className="input-field"
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {registrationSuccess && mode === "login" ? (
            <div className="rounded-2xl border border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
              Registrierung erfolgreich. Bitte jetzt einloggen.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
              {error}
            </div>
          ) : null}

          <div className="mt-8 flex w-full flex-row items-center justify-between">
            <p className="text-sm text-primary underline">
              <Link
                href={mode === "login" ? "/register" : "/"}
                className="font-medium"
              >
                {mode === "login" ? "Neu hier?" : "Zurück zum Login"}
              </Link>
            </p>

            <button
              className="button-primary"
              type="submit"
              disabled={isPending}
            >
              {isPending
                ? "Bitte warten..."
                : mode === "login"
                  ? "Einloggen"
                  : "Registrieren"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
