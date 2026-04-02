const euroFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function formatCurrency(cents: number) {
  return euroFormatter.format(cents / 100);
}

export function formatCurrencyInput(cents: number) {
  const euros = (cents / 100).toFixed(2).replace(".", ",");
  return `${euros} €`;
}

export function digitsToCents(value: string) {
  const digits = value.replace(/\D/g, "");
  return digits ? Number.parseInt(digits, 10) : 0;
}

export function normalizeCurrencyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function removeLastCurrencyDigit(value: string) {
  return normalizeCurrencyDigits(value).slice(0, -1);
}
