"use client";

import {
  digitsToCents,
  formatCurrencyInput,
  normalizeCurrencyDigits,
  removeLastCurrencyDigit,
} from "@/lib/money";

type NameAmountModalProps = {
  title: string;
  nameLabel: string;
  namePlaceholder: string;
  amountLabel?: string;
  submitLabel?: string;
  nameInput: string;
  amountInput: string;
  error: string;
  isPending: boolean;
  onNameChange: (value: string) => void;
  onAmountChange: (value: string) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function NameAmountModal({
  title,
  nameLabel,
  namePlaceholder,
  amountLabel = "Betrag",
  submitLabel = "Speichern",
  nameInput,
  amountInput,
  error,
  isPending,
  onNameChange,
  onAmountChange,
  onCancel,
  onSubmit,
}: NameAmountModalProps) {
  function handleAmountKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace") {
      return;
    }

    event.preventDefault();
    onAmountChange(removeLastCurrencyDigit(amountInput));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onCancel}
    >
      <div
        className="shadow-cute w-full max-w-md border border-primary/10 bg-white p-6 text-foreground rounded-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="text-2xl font-semibold text-primary">{title}</h2>

        <form className="mt-6 flex flex-col gap-y-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-y-2">
            <span className="text-sm font-medium text-foreground/80">
              {nameLabel}
            </span>
            <input
              className="input-field text-lg"
              value={nameInput}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder={namePlaceholder}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-y-2">
            <span className="text-sm font-medium text-foreground/80">
              {amountLabel}
            </span>
            <input
              className="input-field text-lg"
              inputMode="numeric"
              value={formatCurrencyInput(digitsToCents(amountInput))}
              onChange={(event) =>
                onAmountChange(normalizeCurrencyDigits(event.target.value))
              }
              onKeyDown={handleAmountKeyDown}
              placeholder="0,00 €"
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600">
              {error}
            </div>
          ) : null}

          <div className="mt-4 flex items-center justify-between gap-3">
            <button
              className="button-secondary"
              type="button"
              onClick={onCancel}
            >
              Abbrechen
            </button>
            <button
              className="button-primary"
              type="submit"
              disabled={
                isPending ||
                !nameInput.trim() ||
                digitsToCents(amountInput) <= 0
              }
            >
              {isPending ? "Speichert..." : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
