import type { CsvRecord } from "@/types/report";

export function getRecordValueByFields(record: CsvRecord, fieldNames: string[]) {
  for (const fieldName of fieldNames) {
    const value = record[fieldName]?.trim();

    if (value) return value;
  }

  return "";
}

export function createTopValues(values: string[], limit: number) {
  const counts = values.reduce<Map<string, number>>((summary, value) => {
    const normalizedValue = value.trim().replace(/\s+/g, " ");

    if (!normalizedValue) return summary;

    summary.set(normalizedValue, (summary.get(normalizedValue) ?? 0) + 1);
    return summary;
  }, new Map());

  return Array.from(counts.entries())
    .sort(
      (first, second) =>
        second[1] - first[1] || first[0].localeCompare(second[0])
    )
    .slice(0, limit)
    .map(([value]) => value);
}
