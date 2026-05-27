"use client";

import { useEffect, useRef } from "react";
import type { SpreadsheetInfo } from "@/types/report";

export function SpreadsheetPreview({
  spreadsheetInfo,
  selectedGids,
  isExpanded,
  onToggleExpanded,
  onCloseSelection,
  onToggleSheet,
}: {
  spreadsheetInfo: SpreadsheetInfo;
  selectedGids: string[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onCloseSelection: () => void;
  onToggleSheet: (gid: string) => void;
}) {
  const previewRef = useRef<HTMLElement | null>(null);
  const selectedSheets = spreadsheetInfo.sheets.filter((sheet) =>
    selectedGids.includes(sheet.gid)
  );

  useEffect(() => {
    if (!isExpanded) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (
        previewRef.current &&
        !previewRef.current.contains(event.target as Node)
      ) {
        onCloseSelection();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isExpanded, onCloseSelection]);

  return (
    <section
      ref={previewRef}
      className="rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-4"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">
          Spreadsheet Preview
        </h3>

        <button
          type="button"
          onClick={onToggleExpanded}
          className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-400 hover:text-white"
        >
          {isExpanded ? "Done" : "Edit Sheet Selection"}
        </button>
      </div>

      <div className="mt-4 space-y-4 text-sm text-zinc-300">
        <div>
          <p className="text-xs font-medium text-zinc-500">
            Spreadsheet Title
          </p>
          <p className="mt-1 text-zinc-100">{spreadsheetInfo.title || "-"}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-500">
            Selected Sheets: {selectedSheets.length}
          </p>
          {selectedSheets.length > 0 ? (
            <ul className="mt-2 space-y-2">
              {selectedSheets.map((sheet) => (
                <li
                  key={`${sheet.gid}-${sheet.title}`}
                  className="border-b border-zinc-900 pb-2 last:border-b-0 last:pb-0"
                >
                  {sheet.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-zinc-500">선택된 시트가 없습니다.</p>
          )}
        </div>

        {isExpanded && (
          <div>
            <p className="text-xs font-medium text-zinc-500">Sheet List</p>
            {spreadsheetInfo.sheets.length > 0 ? (
              <ul className="mt-2 space-y-2">
                {spreadsheetInfo.sheets.map((sheet) => (
                  <li
                    key={`${sheet.gid}-${sheet.title}`}
                    className="border-b border-zinc-900 pb-2 last:border-b-0 last:pb-0"
                  >
                    <label className="flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedGids.includes(sheet.gid)}
                        onChange={() => onToggleSheet(sheet.gid)}
                        className="h-4 w-4 accent-white"
                      />
                      <span>{sheet.title}</span>
                    </label>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-zinc-500">Sheet 목록이 없습니다.</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
