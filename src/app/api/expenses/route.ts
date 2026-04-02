import { endOfMonth, startOfMonth } from "date-fns";
import { jsonError, requireApiUser } from "@/lib/http";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const { user, response } = await requireApiUser();

  if (!user) {
    return response;
  }

  const body = await request.json().catch(() => null) as
    | { name?: string; amountCents?: number; expenseDate?: string; type?: "EXPENSE" | "INCOME" }
    | null;

  const name = body?.name?.trim() ?? "";
  const amountCents = body?.amountCents;
  const expenseDate = body?.expenseDate ? new Date(body.expenseDate) : new Date();
  const type = body?.type ?? "EXPENSE";

  if (!name) {
    return jsonError(
      type === "INCOME"
        ? "Bitte einen Namen für die Einnahme angeben."
        : "Bitte einen Namen für die Ausgabe angeben.",
    );
  }

  if (!Number.isInteger(amountCents) || (amountCents ?? 0) <= 0) {
    return jsonError("Bitte einen gültigen Betrag in Cent angeben.");
  }

  if (type !== "EXPENSE" && type !== "INCOME") {
    return jsonError("Der Buchungstyp ist ungültig.");
  }

  if (Number.isNaN(expenseDate.getTime())) {
    return jsonError("Das Datum der Ausgabe ist ungültig.");
  }

  const nextAmountCents = amountCents as number;

  const expense = await prisma.expense.create({
    data: {
      userId: user.id,
      name,
      amountCents: nextAmountCents,
      type,
      expenseDate,
    },
  });

  return Response.json(expense, { status: 201 });
}

export async function GET(request: Request) {
  const { user, response } = await requireApiUser();

  if (!user) {
    return response;
  }

  const { searchParams } = new URL(request.url);
  const year = Number.parseInt(searchParams.get("year") ?? "", 10);
  const month = Number.parseInt(searchParams.get("month") ?? "", 10);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return jsonError("Bitte gültige Jahr- und Monatswerte übergeben.");
  }

  const monthDate = new Date(year, month - 1, 1);
  const expenses = await prisma.expense.findMany({
    where: {
      userId: user.id,
      expenseDate: {
        gte: startOfMonth(monthDate),
        lte: endOfMonth(monthDate),
      },
    },
    orderBy: { expenseDate: "desc" },
  });

  return Response.json(expenses);
}
