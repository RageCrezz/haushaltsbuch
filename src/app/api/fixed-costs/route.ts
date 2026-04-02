import { jsonError, requireApiUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, response } = await requireApiUser();

  if (!user) {
    return response;
  }

  const fixedCosts = await prisma.fixedCost.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });

  return Response.json(fixedCosts);
}

export async function POST(request: Request) {
  const { user, response } = await requireApiUser();

  if (!user) {
    return response;
  }

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

  const nextAmountCents = amountCents as number;

  const fixedCost = await prisma.fixedCost.create({
    data: {
      userId: user.id,
      name,
      amountCents: nextAmountCents,
    },
  });

  return Response.json(fixedCost, { status: 201 });
}
