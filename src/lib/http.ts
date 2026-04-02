import { requireUser } from "@/lib/auth";

export function jsonError(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

type SessionUser = NonNullable<Awaited<ReturnType<typeof requireUser>>>;

export async function requireApiUser(): Promise<
  | { user: SessionUser; response: null }
  | { user: null; response: Response }
> {
  const user = await requireUser();

  if (!user) {
    return {
      user: null,
      response: jsonError("Nicht eingeloggt.", 401),
    };
  }

  return { user, response: null };
}
