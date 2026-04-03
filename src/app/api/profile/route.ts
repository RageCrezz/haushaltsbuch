import { requireApiUser, jsonError } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireApiUser();

  if (!user) {
    return response;
  }

  return Response.json({
    name: user.name,
    salaryCents: user.salaryCents,
  });
}

export async function PATCH(request: Request) {
  const { user, response } = await requireApiUser();

  if (!user) {
    return response;
  }

  const body = await request.json().catch(() => null) as
    | { name?: string; salaryCents?: number }
    | null;

  const name = body?.name?.trim() ?? "";
  const salaryCents = body?.salaryCents;

  if (!name) {
    return jsonError("Bitte einen gültigen Namen angeben.");
  }

  if (!Number.isInteger(salaryCents) || (salaryCents ?? 0) < 0) {
    return jsonError("Bitte ein gültiges Gehalt in Cent angeben.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { name, salaryCents },
    select: {
      name: true,
      salaryCents: true,
    },
  });

  return Response.json(updatedUser);
}
