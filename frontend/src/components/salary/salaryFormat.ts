export const salaryMoney = new Intl.NumberFormat("en-EG", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const salaryDate = new Intl.DateTimeFormat("en-EG", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

export const salaryDateTime = new Intl.DateTimeFormat("en-EG", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatSalaryDateRange(departureAt: string, returnAt: string): string {
  return `${salaryDate.format(new Date(departureAt))} – ${salaryDate.format(new Date(returnAt))}`;
}
