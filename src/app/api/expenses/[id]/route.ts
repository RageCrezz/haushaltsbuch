import { jsonError, requireApiUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { user, response } = await requireApiUser();

  if (!user) {
    return response;
  }

  const { id } = await params;

  const expense = await prisma.expense.findFirst({
    where: {
      id,
      userId: user.id,
    },
  });

  if (!expense) {
    return jsonError("Der Eintrag wurde nicht gefunden.", 404);
  }

  await prisma.expense.delete({
    where: {
      id: expense.id,
    },
  });

  return Response.json({ id: expense.id, type: expense.type, amountCents: expense.amountCents });
}
