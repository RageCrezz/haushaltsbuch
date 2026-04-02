import { endOfMonth, startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";

export type FixedCostDto = {
  id: string;
  name: string;
  amountCents: number;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseDto = {
  id: string;
  name: string;
  amountCents: number;
  type: "EXPENSE" | "INCOME";
  expenseDate: string;
  createdAt: string;
};

export type DashboardData = {
  salaryCents: number;
  totalAdditionalIncomeCents: number;
  totalAvailableIncomeCents: number;
  totalFixedCostsCents: number;
  totalExpensesCents: number;
  remainingBudgetCents: number;
  fixedCosts: FixedCostDto[];
  expenses: ExpenseDto[];
  incomes: ExpenseDto[];
};

function serializeFixedCost(item: {
  id: string;
  name: string;
  amountCents: number;
  createdAt: Date;
  updatedAt: Date;
}): FixedCostDto {
  return {
    id: item.id,
    name: item.name,
    amountCents: item.amountCents,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  };
}

function serializeExpense(item: {
  id: string;
  name: string;
  amountCents: number;
  type: "EXPENSE" | "INCOME";
  expenseDate: Date;
  createdAt: Date;
}): ExpenseDto {
  return {
    id: item.id,
    name: item.name,
    amountCents: item.amountCents,
    type: item.type,
    expenseDate: item.expenseDate.toISOString(),
    createdAt: item.createdAt.toISOString(),
  };
}

function sumCents(items: Array<{ amountCents: number }>) {
  return items.reduce((total, item) => total + item.amountCents, 0);
}

export async function getDashboardData(
  userId: string,
  referenceDate = new Date(),
): Promise<DashboardData> {
  const monthStart = startOfMonth(referenceDate);
  const monthEnd = endOfMonth(referenceDate);

  const [user, fixedCosts, monthEntries] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { salaryCents: true },
    }),
    prisma.fixedCost.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.expense.findMany({
      where: {
        userId,
        expenseDate: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
      orderBy: { expenseDate: "desc" },
    }),
  ]);

  const monthExpenses = monthEntries.filter((entry) => entry.type === "EXPENSE");
  const monthIncomes = monthEntries.filter((entry) => entry.type === "INCOME");

  const totalFixedCostsCents = sumCents(
    fixedCosts.filter((item) => item.createdAt <= monthEnd),
  );
  const totalExpensesCents = sumCents(monthExpenses);
  const totalAdditionalIncomeCents = sumCents(monthIncomes);
  const totalAvailableIncomeCents = user.salaryCents + totalAdditionalIncomeCents;
  const remainingBudgetCents =
    totalAvailableIncomeCents - totalFixedCostsCents - totalExpensesCents;

  return {
    salaryCents: user.salaryCents,
    totalAdditionalIncomeCents,
    totalAvailableIncomeCents,
    totalFixedCostsCents,
    totalExpensesCents,
    remainingBudgetCents,
    fixedCosts: fixedCosts.map(serializeFixedCost),
    expenses: monthExpenses.map(serializeExpense),
    incomes: monthIncomes.map(serializeExpense),
  };
}
