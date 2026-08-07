export type CsvColumn<T extends Record<string, unknown>> = {
  key: keyof T & string;
  header: string;
  format?: (value: unknown, row: T) => string;
};

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function rowsToCsv<T extends Record<string, unknown>>(
  columns: CsvColumn<T>[],
  rows: T[]
): string {
  const header = columns.map((c) => escapeCsvCell(c.header)).join(",");
  const body = rows
    .map((row) =>
      columns
        .map((col) => {
          const raw = row[col.key];
          const formatted = col.format ? col.format(raw, row) : raw;
          return escapeCsvCell(formatted);
        })
        .join(",")
    )
    .join("\n");
  return `${header}\n${body}`;
}

export function buildExportFilename(parts: (string | undefined)[]): string {
  const sanitized = parts
    .filter(Boolean)
    .map((p) =>
      String(p)
        .trim()
        .replace(/[^\w\-]+/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "")
    )
    .join("_");
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
  return `${sanitized || "export"}_${timestamp}.csv`;
}

export function downloadCsv(content: string, filename: string): void {
  const bom = "\uFEFF";
  const blob = new Blob([bom + content], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  anchor.click();
  window.URL.revokeObjectURL(url);
}

export function exportToCsv<T extends Record<string, unknown>>(
  columns: CsvColumn<T>[],
  rows: T[],
  filenameParts: (string | undefined)[]
): void {
  const csv = rowsToCsv(columns, rows);
  downloadCsv(csv, buildExportFilename(filenameParts));
}
