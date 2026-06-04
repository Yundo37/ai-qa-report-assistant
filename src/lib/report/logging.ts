import { createQaSummary } from "@/lib/qaSummary";
import type { CountSummary, CsvRecord } from "@/types/report";

export function logSummary(title: string, summary: CountSummary) {
  console.log(title);
  Object.entries(summary).forEach(([label, count]) => {
    console.log(`- ${label}: ${count}`);
  });
}

export function logQaSummary(title: string, records: CsvRecord[], includeRows = false) {
  console.log(title);
  if (includeRows) console.log(`- Rows: ${records.length}`);
  Object.entries(createQaSummary(records)).forEach(([label, count]) => {
    console.log(`- ${label}: ${count}`);
  });
}
