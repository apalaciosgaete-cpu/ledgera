export const formatterClp = new Intl.NumberFormat("es-CL", {
  style: "currency",
  currency: "CLP",
  maximumFractionDigits: 0,
});

export const formatterUsd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

export const formatterUsdClpRate = new Intl.NumberFormat("es-CL", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const formatterNumber = new Intl.NumberFormat("es-CL", {
  maximumFractionDigits: 8,
});

export const formatterDate = new Intl.DateTimeFormat("es-CL", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function clp(value: number): string {
  return formatterClp.format(value || 0);
}

export function usd(value: number): string {
  return formatterUsd.format(value || 0);
}

export function usdClpRate(value: number): string {
  return `$${formatterUsdClpRate.format(value || 0)} CLP`;
}

export function percent(value: number | null): string {
  if (value === null) return "Sin base";
  return `${value.toLocaleString("es-CL", { maximumFractionDigits: 2 })}%`;
}

export function date(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("es-CL");
}
