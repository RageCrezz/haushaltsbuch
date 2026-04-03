"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart,
  ArcElement,
  Tooltip,
  Legend,
  DoughnutController,
  type ChartData,
  type ChartOptions,
} from "chart.js";
import { useSession } from "next-auth/react";
import { format } from "date-fns";
import { NameAmountModal } from "@/components/name-amount-modal";
import type { DashboardData, ExpenseDto } from "@/lib/finance";
import { digitsToCents, formatCurrency } from "@/lib/money";

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

type EntryRow = {
  id: string;
  label: string;
  type: "Einnahme" | "Ausgabe";
  amountCents: number;
  date: string;
};

const donutChartOptions: ChartOptions<"doughnut"> = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: "62%",
  layout: {
    padding: 12,
  },
  plugins: {
    legend: {
      position: "right",
      labels: {
        boxWidth: 16,
        boxHeight: 16,
        color: "#1d1e1f",
        font: {
          family: "var(--font-nunito)",
          size: 16,
          weight: "bold",
        },
        padding: 24,
      },
    },
    tooltip: {
      callbacks: {
        label(context) {
          const label = context.label ?? "";
          const value = Number(context.raw ?? 0);
          return `${label}: ${formatCurrency(value)}`;
        },
      },
    },
  },
};

export function DashboardClient({ data }: { data: DashboardData }) {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState(data);
  const [modalMode, setModalMode] = useState<"INCOME" | "EXPENSE" | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [error, setError] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);
  const budgetChartRef = useRef<HTMLCanvasElement | null>(null);
  const incomeChartRef = useRef<HTMLCanvasElement | null>(null);
  const username = session?.user?.name ?? "";

  useEffect(() => {
    if (!budgetChartRef.current || !incomeChartRef.current) {
      return;
    }

    const budgetChart = new Chart(budgetChartRef.current, {
      type: "doughnut",
      data: {
        labels: ["Einnahmen", "Ausgaben", "Fixkosten", "Restbudget"],
        datasets: [
          {
            data: [
              dashboardData.totalAvailableIncomeCents,
              dashboardData.totalExpensesCents,
              dashboardData.totalFixedCostsCents,
              Math.max(dashboardData.remainingBudgetCents, 0),
            ],
            backgroundColor: ["#f7a7b2", "#ef6d7c", "#f9c5cc", "#f26474"],
            borderColor: "#000",
            borderWidth: 1,
          },
        ],
      } satisfies ChartData<"doughnut">,
      options: donutChartOptions,
    });

    const incomeChart = new Chart(incomeChartRef.current, {
      type: "doughnut",
      data: {
        labels: ["Erspartes", "Salary"],
        datasets: [
          {
            data: [
              Math.max(dashboardData.remainingBudgetCents, 0),
              dashboardData.salaryCents,
            ],
            backgroundColor: ["#f26474", "#f9c5cc"],
            borderColor: "#000",
            borderWidth: 1,
          },
        ],
      } satisfies ChartData<"doughnut">,
      options: donutChartOptions,
    });

    return () => {
      budgetChart.destroy();
      incomeChart.destroy();
    };
  }, [
    dashboardData.remainingBudgetCents,
    dashboardData.salaryCents,
    dashboardData.totalAvailableIncomeCents,
    dashboardData.totalExpensesCents,
    dashboardData.totalFixedCostsCents,
  ]);

  const entries: EntryRow[] = [
    ...dashboardData.incomes,
    ...dashboardData.expenses,
  ]
    .map((entry) => ({
      id: entry.id,
      label: entry.name,
      type: (entry.type === "INCOME"
        ? "Einnahme"
        : "Ausgabe") as EntryRow["type"],
      amountCents: entry.amountCents,
      date: entry.expenseDate,
    }))
    .sort((left, right) => right.date.localeCompare(left.date));

  function closeModal() {
    setModalMode(null);
    setNameInput("");
    setAmountInput("");
    setError("");
    setIsPending(false);
  }

  async function handleCreateEntry(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!modalMode) {
      return;
    }

    setIsPending(true);
    setError("");

    const name = nameInput.trim();
    const amountCents = digitsToCents(amountInput);
    const response = await fetch("/api/expenses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        amountCents,
        type: modalMode,
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | ({ error?: string } & Partial<ExpenseDto>)
      | null;

    if (!response.ok) {
      setError(
        payload?.error ?? "Der Eintrag konnte nicht gespeichert werden.",
      );
      setIsPending(false);
      return;
    }

    const createdEntry = payload as ExpenseDto;

    setDashboardData((current) => {
      const isIncome = createdEntry.type === "INCOME";

      return {
        ...current,
        incomes: isIncome
          ? [createdEntry, ...current.incomes]
          : current.incomes,
        expenses: isIncome
          ? current.expenses
          : [createdEntry, ...current.expenses],
        totalAdditionalIncomeCents: isIncome
          ? current.totalAdditionalIncomeCents + createdEntry.amountCents
          : current.totalAdditionalIncomeCents,
        totalAvailableIncomeCents: isIncome
          ? current.totalAvailableIncomeCents + createdEntry.amountCents
          : current.totalAvailableIncomeCents,
        totalExpensesCents: isIncome
          ? current.totalExpensesCents
          : current.totalExpensesCents + createdEntry.amountCents,
        remainingBudgetCents: isIncome
          ? current.remainingBudgetCents + createdEntry.amountCents
          : current.remainingBudgetCents - createdEntry.amountCents,
      };
    });

    closeModal();
  }

  async function handleDeleteEntry(entry: EntryRow) {
    setDeletingEntryId(entry.id);

    const response = await fetch(`/api/expenses/${entry.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setDeletingEntryId(null);
      return;
    }

    setDashboardData((current) => {
      const isIncome = entry.type === "Einnahme";

      return {
        ...current,
        incomes: isIncome
          ? current.incomes.filter((item) => item.id !== entry.id)
          : current.incomes,
        expenses: isIncome
          ? current.expenses
          : current.expenses.filter((item) => item.id !== entry.id),
        totalAdditionalIncomeCents: isIncome
          ? current.totalAdditionalIncomeCents - entry.amountCents
          : current.totalAdditionalIncomeCents,
        totalAvailableIncomeCents: isIncome
          ? current.totalAvailableIncomeCents - entry.amountCents
          : current.totalAvailableIncomeCents,
        totalExpensesCents: isIncome
          ? current.totalExpensesCents
          : current.totalExpensesCents - entry.amountCents,
        remainingBudgetCents: isIncome
          ? current.remainingBudgetCents - entry.amountCents
          : current.remainingBudgetCents + entry.amountCents,
      };
    });

    setDeletingEntryId(null);
  }

  return (
    <>
      <div className="w-full flex flex-col gap-y-8">
        <div className="text-primary">
          <div className="w-full flex flex-row items-center justify-between">
            <h1 className="text-3xl">Willkommen zurück, {username}!</h1>
            <p className="text-xl font-bold">
              Monat: {format(new Date(), "MMMM")}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6 lg:flex-row">
          <section className="shadow-cute w-full gap-y-6 border border-primary/10 bg-white p-6 text-foreground lg:w-1/2 text-primary rounded-2xl">
            <h2 className="text-2xl font-semibold">
              Einnahmen, Ausgaben & Restbudget
            </h2>
            <div className="h-[240px] w-full max-w-[420px]">
              <canvas ref={budgetChartRef} />
            </div>
          </section>

          <section className="shadow-cute w-full gap-y-6 border border-primary/10 bg-white p-6 text-foreground lg:w-1/2 text-primary rounded-2xl">
            <h2 className="text-2xl font-semibold">Gehalt & Erspartes</h2>
            <div className="h-[240px] w-full max-w-[420px]">
              <canvas ref={incomeChartRef} />
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4 md:flex-row gap-x-4 justify-end pt-12">
          <button
            className="button-primary"
            type="button"
            data-testid="dashboard-add-income"
            onClick={() => {
              setModalMode("INCOME");
              setNameInput("");
              setAmountInput("");
              setError("");
            }}
          >
            Einnahmen hinzufügen
          </button>
          <button
            className="button-primary"
            type="button"
            data-testid="dashboard-add-expense"
            onClick={() => {
              setModalMode("EXPENSE");
              setNameInput("");
              setAmountInput("");
              setError("");
            }}
          >
            Ausgaben hinzufügen
          </button>
        </div>

        <div className="card flex flex-col gap-y-8 border border-primary/10 bg-white p-6 text-foreground shadow-cute">
          <div className="flex flex-col gap-y-4">
            {entries.length ? (
              entries.map((entry) => (
                <article
                  key={`${entry.type}-${entry.id}`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-primary/10 bg-background px-4 py-4"
                >
                  <p className="text-lg font-semibold">{entry.label}</p>
                  <div className="flex items-center gap-3">
                    <p
                      className={`text-lg font-semibold ${
                        entry.type === "Einnahme"
                          ? "text-emerald-600"
                          : "text-rose-500"
                      }`}
                    >
                      {entry.type === "Einnahme" ? "+" : "-"}{" "}
                      {formatCurrency(entry.amountCents)}
                    </p>
                    <button
                      className="button-secondary inline-flex h-[28] w-[28px] items-center justify-center p-0 text-[10px] leading-none"
                      type="button"
                      onClick={() => void handleDeleteEntry(entry)}
                      disabled={deletingEntryId === entry.id}
                    >
                      X
                    </button>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-primary/10 bg-background px-4 py-6 text-sm text-foreground/70">
                Für diesen Monat gibt es noch keine Einnahmen oder Ausgaben.
              </div>
            )}
          </div>
        </div>
      </div>

      {modalMode ? (
        <NameAmountModal
          title={
            modalMode === "INCOME"
              ? "Einnahme hinzufügen"
              : "Ausgabe hinzufügen"
          }
          nameLabel={modalMode === "INCOME" ? "Einnahme" : "Ausgabe"}
          namePlaceholder={modalMode === "INCOME" ? "Einnahme" : "Ausgabe"}
          nameInput={nameInput}
          amountInput={amountInput}
          error={error}
          isPending={isPending}
          onNameChange={setNameInput}
          onAmountChange={setAmountInput}
          onCancel={closeModal}
          onSubmit={handleCreateEntry}
        />
      ) : null}
    </>
  );
}
