"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { NameAmountModal } from "@/components/name-amount-modal";
import type { FixedCostDto } from "@/lib/finance";
import {
  digitsToCents,
  formatCurrencyInput,
  normalizeCurrencyDigits,
  removeLastCurrencyDigit,
} from "@/lib/money";

type ProfileSettingsProps = {
  name: string;
  initialSalaryCents: number;
  initialFixedCosts: FixedCostDto[];
};

type FixedCostFormItem = {
  id: string | null;
  key: string;
  name: string;
  amountInput: string;
  isEditing: boolean;
};

function mapFixedCostItem(item: FixedCostDto): FixedCostFormItem {
  return {
    id: item.id,
    key: item.id,
    name: item.name,
    amountInput: String(item.amountCents),
    isEditing: false,
  };
}

export function ProfileSettings({
  name: initialName,
  initialSalaryCents,
  initialFixedCosts,
}: ProfileSettingsProps) {
  const { update } = useSession();
  const [name, setName] = useState(initialName);
  const [salaryInput, setSalaryInput] = useState(String(initialSalaryCents));
  const [fixedCosts, setFixedCosts] = useState(
    initialFixedCosts.map(mapFixedCostItem),
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [modalName, setModalName] = useState("");
  const [modalAmountInput, setModalAmountInput] = useState("");
  const [error, setError] = useState("");
  const [modalError, setModalError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [activeFixedCostKey, setActiveFixedCostKey] = useState<string | null>(
    null,
  );

  function handleSalaryKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Backspace") {
      return;
    }

    event.preventDefault();
    setSalaryInput((current) => removeLastCurrencyDigit(current));
  }

  function handleFixedCostAmountKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
    key: string,
  ) {
    if (event.key !== "Backspace") {
      return;
    }

    event.preventDefault();
    setFixedCosts((current) =>
      current.map((item) =>
        item.key === key
          ? { ...item, amountInput: removeLastCurrencyDigit(item.amountInput) }
          : item,
      ),
    );
  }

  function openModal() {
    setModalOpen(true);
    setModalName("");
    setModalAmountInput("");
    setModalError("");
  }

  function closeModal() {
    setModalOpen(false);
    setModalName("");
    setModalAmountInput("");
    setModalError("");
  }

  function updateFixedCost(
    key: string,
    updater: (item: FixedCostFormItem) => FixedCostFormItem,
  ) {
    setFixedCosts((current) =>
      current.map((item) => (item.key === key ? updater(item) : item)),
    );
  }

  function removeFixedCost(key: string) {
    setFixedCosts((current) => current.filter((item) => item.key !== key));
  }

  async function handleAddFixedCost(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!modalName.trim() || digitsToCents(modalAmountInput) <= 0) {
      setModalError("Bitte Name und gültigen Betrag angeben.");
      return;
    }

    setActiveFixedCostKey("create");

    const response = await fetch("/api/fixed-costs", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: modalName.trim(),
        amountCents: digitsToCents(modalAmountInput),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | ({ error?: string } & Partial<FixedCostDto>)
      | null;

    if (!response.ok) {
      setModalError(
        payload?.error ?? "Fixkosten konnten nicht gespeichert werden.",
      );
      setActiveFixedCostKey(null);
      return;
    }

    const createdItem = payload as FixedCostDto;
    setFixedCosts((current) => [...current, mapFixedCostItem(createdItem)]);
    setActiveFixedCostKey(null);
    closeModal();
  }

  async function handleSaveFixedCost(item: FixedCostFormItem) {
    if (!item.name.trim() || digitsToCents(item.amountInput) <= 0) {
      setError("Bitte Name und gültigen Betrag für die Fixkosten angeben.");
      return;
    }

    setError("");
    setActiveFixedCostKey(item.key);

    const response = await fetch(`/api/fixed-costs/${item.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: item.name.trim(),
        amountCents: digitsToCents(item.amountInput),
      }),
    });

    const payload = (await response.json().catch(() => null)) as
      | ({ error?: string } & Partial<FixedCostDto>)
      | null;

    if (!response.ok) {
      setError(payload?.error ?? "Fixkosten konnten nicht gespeichert werden.");
      setActiveFixedCostKey(null);
      return;
    }

    const updatedItem = payload as FixedCostDto;
    setFixedCosts((current) =>
      current.map((entry) =>
        entry.key === item.key
          ? { ...mapFixedCostItem(updatedItem), isEditing: false }
          : entry,
      ),
    );
    setActiveFixedCostKey(null);
  }

  async function handleDeleteFixedCost(item: FixedCostFormItem) {
    if (!item.id) {
      removeFixedCost(item.key);
      return;
    }

    setError("");
    setActiveFixedCostKey(item.key);

    const response = await fetch(`/api/fixed-costs/${item.id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      setError("Fixkosten konnten nicht gelöscht werden.");
      setActiveFixedCostKey(null);
      return;
    }

    removeFixedCost(item.key);
    setActiveFixedCostKey(null);
  }

  async function handleSave() {
    setError("");
    setModalError("");

    const trimmedName = name.trim();
    const salaryCents = digitsToCents(salaryInput);

    if (!trimmedName) {
      setError("Bitte einen gültigen Namen angeben.");
      return;
    }

    if (salaryCents < 0) {
      setError("Bitte ein gültiges Gehalt angeben.");
      return;
    }

    setIsSaving(true);

    const profileResponse = await fetch("/api/profile", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: trimmedName,
        salaryCents,
      }),
    });

    const profilePayload = (await profileResponse.json().catch(() => null)) as {
      error?: string;
      name?: string;
      salaryCents?: number;
    } | null;

    if (!profileResponse.ok) {
      setError(
        profilePayload?.error ?? "Profil konnte nicht gespeichert werden.",
      );
      setIsSaving(false);
      return;
    }
    await update({ name: trimmedName });
    window.location.reload();
  }

  return (
    <>
      <div className="w-full flex flex-col gap-y-8">
        <div className="w-full flex flex-row gap-x-8">
          <div className="w-full flex flex-col gap-y-3">
            <label className="text-sm font-semibold text-primary">Name</label>
            <input
              className="input-field bg-white"
              data-testid="profile-name-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Name"
            />
          </div>

          <div className="w-full flex flex-col gap-y-3">
            <label className="text-sm font-semibold text-primary">Gehalt</label>
            <input
              className="input-field bg-white"
              data-testid="profile-salary-input"
              inputMode="numeric"
              value={formatCurrencyInput(digitsToCents(salaryInput))}
              onKeyDown={handleSalaryKeyDown}
              onChange={(event) =>
                setSalaryInput(normalizeCurrencyDigits(event.target.value))
              }
              placeholder="0,00 €"
            />
          </div>
        </div>

        <div className="card flex flex-col gap-y-8 border border-primary/10 bg-white p-6 text-foreground shadow-cute">
          <h2 className="text-2xl font-semibold text-white">Fixkosten</h2>

          <div className="flex flex-col gap-y-4">
            {fixedCosts.length ? (
              fixedCosts.map((item) => (
                <div
                  key={item.key}
                  className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-background px-4 py-4 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="grid flex-1 gap-3 md:grid-cols-2">
                    <input
                      className={`input-field ${
                        item.isEditing
                          ? "bg-white text-foreground"
                          : "bg-primary/10 text-foreground/80"
                      }`}
                      value={item.name}
                      disabled={!item.isEditing}
                      onChange={(event) =>
                        updateFixedCost(item.key, (current) => ({
                          ...current,
                          name: event.target.value,
                        }))
                      }
                    />
                    <input
                      className={`input-field ${
                        item.isEditing
                          ? "bg-white text-foreground"
                          : "bg-primary/10 text-foreground/80"
                      }`}
                      inputMode="numeric"
                      value={formatCurrencyInput(
                        digitsToCents(item.amountInput),
                      )}
                      disabled={!item.isEditing}
                      onKeyDown={(event) =>
                        handleFixedCostAmountKeyDown(event, item.key)
                      }
                      onChange={(event) =>
                        updateFixedCost(item.key, (current) => ({
                          ...current,
                          amountInput: normalizeCurrencyDigits(
                            event.target.value,
                          ),
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-end gap-3">
                    <button
                      className="button-secondary"
                      type="button"
                      onClick={() =>
                        item.isEditing
                          ? void handleSaveFixedCost(item)
                          : updateFixedCost(item.key, (current) => ({
                              ...current,
                              isEditing: true,
                            }))
                      }
                      disabled={activeFixedCostKey === item.key}
                    >
                      {item.isEditing ? "Speichern" : "Bearbeiten"}
                    </button>
                    <button
                      className="button-secondary inline-flex h-[14px] w-[14px] items-center justify-center p-0 text-[10px] leading-none"
                      type="button"
                      onClick={() => void handleDeleteFixedCost(item)}
                      disabled={activeFixedCostKey === item.key}
                    >
                      X
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-primary/10 bg-background px-4 py-6 text-sm text-foreground/70">
                Es gibt noch keine Fixkosten.
              </div>
            )}
          </div>

          <div>
            <button
              className="button-secondary"
              type="button"
              data-testid="profile-add-fixed-cost"
              onClick={openModal}
            >
              + weitere hinzufügen
            </button>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-600">
            {error}
          </div>
        ) : null}

        <div className="flex justify-end">
          <button
            className="button-primary"
            type="button"
            data-testid="profile-save"
            onClick={() => void handleSave()}
          >
            {isSaving ? "Speichert..." : "Speichern"}
          </button>
        </div>
      </div>

      {modalOpen ? (
        <NameAmountModal
          title="Fixkosten hinzufügen"
          nameLabel="Fixkosten"
          namePlaceholder="z. B. Miete"
          nameInput={modalName}
          amountInput={modalAmountInput}
          error={modalError}
          isPending={false}
          onNameChange={setModalName}
          onAmountChange={setModalAmountInput}
          onCancel={closeModal}
          onSubmit={handleAddFixedCost}
        />
      ) : null}
    </>
  );
}
