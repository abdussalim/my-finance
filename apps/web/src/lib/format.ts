export function formatCurrency(amount: number): string {
  const formatted = new Intl.NumberFormat("id-ID").format(Math.abs(amount));
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function relativeDate(dateStr: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  if (dateStr === today) return "Hari ini";
  if (dateStr === yesterday) return "Kemarin";
  return formatDate(dateStr);
}
