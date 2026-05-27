import { getRecordValue } from "@/lib/jira";
import type { CountSummary, CsvRecord } from "@/types/report";

export function createQaSummary(records: CsvRecord[]): CountSummary {
  const summary: CountSummary = {
    Pass: 0,
    Fail: 0,
    Blocked: 0,
    NextEvent: 0,
  };

  records.forEach((record) => {
    const qaCheck = record["QA Check"]?.trim().toLowerCase();
    const normalizedQaCheck = qaCheck?.replace(/[\s_]+/g, "");

    if (qaCheck === "pass") {
      summary.Pass += 1;
      return;
    }

    if (qaCheck === "fail") {
      summary.Fail += 1;
      return;
    }

    if (qaCheck === "blocked") {
      summary.Blocked += 1;
      return;
    }

    if (normalizedQaCheck === "nextevent") {
      summary.NextEvent += 1;
    }
  });
  return summary;
}

export function createFieldSummaryByFields(
  records: CsvRecord[],
  fieldNames: string[]
): CountSummary {
  return records.reduce<CountSummary>((summary, record) => {
    const value = getRecordValue(record, fieldNames);

    if (!value) {
      return summary;
    }

    summary[value] = (summary[value] ?? 0) + 1;
    return summary;
  }, {});
}

export function extractQaFollowUps(records: CsvRecord[]) {
  const followUps = records.flatMap((record) =>
    (record.Comment ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.startsWith("##"))
      .map((line) => line.replace(/^##\s*/, "").trim())
      .filter(Boolean)
  );

  return Array.from(new Set(followUps));
}
