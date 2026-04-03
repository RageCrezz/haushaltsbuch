"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  getRegisterValidationErrors,
  MIN_PASSWORD_LENGTH,
} from "@/lib/register-validation";

type AuthMode = "login" | "register";

export function AuthForm({
  mode,
  registrationSuccess = false,
  verificationSuccess = false,
  verificationError = false,
}: {
  mode: AuthMode;
  registrationSuccess?: boolean;
  verificationSuccess?: boolean;
  verificationError?: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordMatch, setPasswordMatch] = useState("");
  const [error, setError] = useState("");
  const [registerErrors, setRegisterErrors] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setRegisterErrors([]);

    try {
      // Wenn wir uns einloggen möchten, Next.Auth nutzen um Session zu erstellen
      if (mode === "login") {
        setIsPending(true);
        const result = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (result?.error) {
          setError(
            "E-Mail oder Passwort ist falsch oder die E-Mail-Adresse wurde noch nicht bestätigt.",
          );
          return;
        }

        router.push("/dashboard");
        router.refresh();
        return;
      }

      const validationErrors = getRegisterValidationErrors(
        name,
        email,
        password,
        passwordMatch,
      );

      if (validationErrors.length > 0) {
        setRegisterErrors(validationErrors);
        return;
      }

      setIsPending(true);

      // Wenn wir uns nicht einloggen, dann Registrierung durchführen
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password, passwordMatch }),
      });

      const payload = (await response.json().catch(() => null)) as {
        error?: string;
      } | null;

      if (!response.ok) {
        setRegisterErrors([payload?.error ?? "Etwas ist schiefgelaufen."]);
        return;
      }

      // Suchparameter wird hier gesetzt, damit Frontend im Parent Component die Meldung für Registrierung erfolgreich anzeigt.
      router.push("/?registered=1");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Etwas ist schiefgelaufen.",
      );
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
            <span className="text-sm">
              {mode === "login" ? "E-Mail-Adresse" : "Name"}
            </span>
            <input
              className="input-field"
              name={mode === "login" ? "email" : "name"}
              type={mode === "login" ? "email" : "text"}
              data-testid={mode === "login" ? "login-email" : "register-name"}
              value={mode === "login" ? email : name}
              onChange={(event) =>
                mode === "login"
                  ? setEmail(event.target.value)
                  : setName(event.target.value)
              }
            />
          </label>

          {mode === "register" ? (
            <label className="grid gap-2">
              <span className="text-sm">E-Mail-Adresse</span>
              <input
                className="input-field"
                type="email"
                name="email"
                data-testid="register-email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>
          ) : null}

          <label className="grid gap-2">
            <span className="text-sm">Passwort</span>
            <input
              className="input-field"
              type="password"
              name="password"
              data-testid={mode === "login" ? "login-password" : "register-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {mode === "register" ? (
            <>
              <label className="grid gap-2">
                <span className="text-sm">Passwort wiederholen</span>
                <input
                  className="input-field"
                  type="password"
                  name="passwordMatch"
                  data-testid="register-password-match"
                  value={passwordMatch}
                  onChange={(event) => setPasswordMatch(event.target.value)}
                />
              </label>

              <div className="text-sm text-primary/80">
                Bitte Name und E-Mail-Adresse angeben, Passwort mindestens{" "}
                {MIN_PASSWORD_LENGTH} Zeichen und beide Passwortfelder müssen
                übereinstimmen.
              </div>
            </>
          ) : null}

          {registrationSuccess && mode === "login" ? (
            <div className="rounded-2xl border border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
              Registrierung erfolgreich. Bitte bestätige jetzt zuerst deine
              E-Mail-Adresse über den Link in der E-Mail.
            </div>
          ) : null}

          {verificationSuccess && mode === "login" ? (
            <div className="rounded-2xl border border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
              E-Mail-Adresse erfolgreich bestätigt. Bitte jetzt einloggen.
            </div>
          ) : null}

          {verificationError && mode === "login" ? (
            <div className="rounded-2xl border border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
              Der Bestätigungslink ist ungültig oder abgelaufen.
            </div>
          ) : null}

          {error ? (
            <div className="rounded-2xl border border-primary bg-primary/10 px-4 py-3 text-sm text-primary">
              {error}
            </div>
          ) : null}

          {mode === "register" && registerErrors.length > 0 ? (
            <>
              {registerErrors.map((registerError) => (
                <div
                  key={registerError}
                  data-testid="register-error"
                  className="rounded-2xl border border-primary bg-primary/10 px-4 py-3 text-sm text-primary"
                >
                  {registerError}
                </div>
              ))}
            </>
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
              data-testid={mode === "login" ? "login-submit" : "register-submit"}
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
