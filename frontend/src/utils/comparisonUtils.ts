export type ComparisonDirection = "up" | "down" | "neutral";
export type ComparisonWinner = "left" | "right" | "tie";

export interface ComparisonResult {
  left: number;
  right: number;
  difference: number;
  percentChange: number | null;
  direction: ComparisonDirection;
  winner: ComparisonWinner;
}

export function computeComparison(left: number, right: number): ComparisonResult {
  const difference = right - left;
  let percentChange: number | null = null;
  if (left === 0) {
    percentChange = right === 0 ? 0 : null;
  } else {
    percentChange = (difference / left) * 100;
  }

  const direction: ComparisonDirection =
    difference > 0 ? "up" : difference < 0 ? "down" : "neutral";
  const winner: ComparisonWinner =
    difference > 0 ? "right" : difference < 0 ? "left" : "tie";

  return { left, right, difference, percentChange, direction, winner };
}

export function formatComparisonValue(
  value: number,
  format: "currency" | "number" | "percent"
): string {
  if (format === "currency") {
    if (value >= 1e7) return `₹${(value / 1e7).toFixed(2)} Cr`;
    if (value >= 1e5) return `₹${(value / 1e5).toFixed(2)} L`;
    return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  }
  if (format === "percent") return `${value.toFixed(2)}%`;
  return value.toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

export function directionIcon(direction: ComparisonDirection): string {
  if (direction === "up") return "▲";
  if (direction === "down") return "▼";
  return "→";
}

export function directionColorClass(direction: ComparisonDirection): string {
  if (direction === "up") return "text-emerald-600 dark:text-emerald-400";
  if (direction === "down") return "text-rose-600 dark:text-rose-400";
  return "text-gray-500 dark:text-gray-400";
}

export function isSameSelection(
  leftStore: number | null,
  leftMonth: string | null,
  rightStore: number | null,
  rightMonth: string | null,
  leftDate?: string | null,
  rightDate?: string | null
): boolean {
  return (
    leftStore !== null &&
    rightStore !== null &&
    leftMonth !== null &&
    rightMonth !== null &&
    leftStore === rightStore &&
    leftMonth === rightMonth &&
    (leftDate ?? null) === (rightDate ?? null)
  );
}

export function formatSelectionLabel(
  storeName: string,
  month: string,
  date?: string | null
): string {
  const parts = [storeName, month];
  if (date) parts.push(date);
  return parts.join(" · ");
}
