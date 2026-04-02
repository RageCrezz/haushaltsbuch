import { requireApiUser, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireApiUser();

  if (!user) {
    return response;
  }

  return Response.json({
    username: user.username,
    salaryCents: user.salaryCents,
  });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireApiUser();

  if (!user) {
    return response;
  }

  const body = await request.json().catch(() => null) as
    | { username?: string; salaryCents?: number }
    | null;

  const username = body?.username?.trim() ?? "";
  const salaryCents = body?.salaryCents;

  if (!username) {
    return jsonError("Bitte einen gültigen Namen angeben.");
  }

  if (!Number.isInteger(salaryCents) || (salaryCents ?? 0) < 0) {
    return jsonError("Bitte ein gültiges Gehalt in Cent angeben.");
  }

  const existingUser = await prisma.user.findFirst({
    where: {
      username,
      id: {
        not: user.id,
      },
    },
    select: { id: true },
  });

  if (existingUser) {
    return jsonError("Dieser Benutzername ist bereits vergeben.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { username, salaryCents },
    select: {
      username: true,
      salaryCents: true,
    },
  });

  return Response.json(updatedUser);
}
