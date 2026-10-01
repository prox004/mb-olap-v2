/**
 * Formats categorical / descriptive values for UI presentation.
 * 
 * Rules:
 * - if value is null → "Others"
 * - if value is undefined → "Others"
 * - if value is empty string → "Others"
 * - if value.trim().toUpperCase() === "NA" → "Others"
 * - if value.trim().toUpperCase() === "N/A" → "Others"
 * - "UNKNOWN_VENDOR" is preserved as-is and NEVER replaced with "Others".
 * - otherwise return the original value.
 */
export function formatDisplayValue(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "Others";
  }
  const str = String(value);
  const trimmed = str.trim();
  if (trimmed === "") {
    return "Others";
  }
  const upper = trimmed.toUpperCase();
  // Preserve UNKNOWN_VENDOR explicitly
  if (upper === "UNKNOWN_VENDOR") {
    return value;
  }
  if (upper === "NA" || upper === "N/A") {
    return "Others";
  }
  return value;
}
