import { jsonError, requireApiUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireApiUser();

  if (!user) {
    return response;
  }

  const { id } = await params;
  const body = await request.json().catch(() => null) as
    | { name?: string; amountCents?: number }
    | null;

  const name = body?.name?.trim() ?? "";
  const amountCents = body?.amountCents;

  if (!name) {
    return jsonError("Bitte einen Namen für die Fixkosten angeben.");
  }

  if (!Number.isInteger(amountCents) || (amountCents ?? 0) <= 0) {
    return jsonError("Bitte einen gültigen Betrag in Cent angeben.");
  }

  const fixedCost = await prisma.fixedCost.updateMany({
    where: {
      id,
      userId: user.id,
    },
    data: {
      name,
      amountCents,
    },
  });

  if (fixedCost.count === 0) {
    return jsonError("Fixkosteneintrag nicht gefunden.", 404);
  }

  const updated = await prisma.fixedCost.findUniqueOrThrow({
    where: { id },
  });

  return Response.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireApiUser();

  if (!user) {
    return response;
  }

  const { id } = await params;
  const result = await prisma.fixedCost.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  });

  if (result.count === 0) {
    return jsonError("Fixkosteneintrag nicht gefunden.", 404);
  }

  return Response.json({ ok: true });
}
