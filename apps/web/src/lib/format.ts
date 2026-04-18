export const formatCurrency = (value: number | null, currency = "USD") => {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value > 100 ? 2 : 4
  }).format(value);
};

export const formatCompactNumber = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return new Intl.NumberFormat("en-US", {
    notation: "compact",
    maximumFractionDigits: 2
  }).format(value);
};

export const formatPercent = (value: number | null) => {
  if (value === null || Number.isNaN(value)) {
    return "--";
  }

  return `${value.toFixed(2)}%`;
};

export const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
