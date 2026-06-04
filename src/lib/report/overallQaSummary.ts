import type { CsvRecord, OverallQaSummary } from "@/types/report";

export function createOverallQaSummary(records: CsvRecord[]): OverallQaSummary {
  return records.reduce<OverallQaSummary>(
    (summary, record) => {
      const qaCheck = record["QA Check"]?.trim().toLowerCase() ?? "";
      const normalizedQaCheck = qaCheck.replace(/[\s_]+/g, "");

      if (!qaCheck) {
        return summary;
      }

      summary.Total += 1;

      if (qaCheck === "pass") summary.Pass += 1;
      if (qaCheck === "fail") summary.Fail += 1;
      if (qaCheck === "blocked") summary.Blocked += 1;
      if (normalizedQaCheck === "nextevent") summary.NextEvent += 1;
      if (normalizedQaCheck === "n/a" || normalizedQaCheck === "na") {
        summary["N/A"] += 1;
      }

      return summary;
    },
    {
      Total: 0,
      Pass: 0,
      Fail: 0,
      Blocked: 0,
      NextEvent: 0,
      "N/A": 0,
    }
  );
}
