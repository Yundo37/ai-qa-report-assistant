import { InputVisualIcon } from "@/components/report/InputVisualIcon";
import { SpreadsheetPreview } from "@/components/report/SpreadsheetPreview";
import type { TestSheetInputListProps } from "@/components/report/reportInputTypes";

const sheetInputClassName =
  "min-h-12 min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100";

export function TestSheetInputList({
  testSheets,
  testSheetMetadataList,
  selectedTestSheetGids,
  expandedTestSheetSelections,
  maxTestSheets: MAX_TEST_SHEETS,
  updateTestSheet,
  finishEditingTestSheet,
  editTestSheet,
  removeTestSheet,
  addTestSheet,
  getAutoLinkedJiraSheetForTestSheet,
  toggleTestSheetSelectionExpanded,
  closeTestSheetSelection,
  toggleSelectedTestSheetGid,
}: TestSheetInputListProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="mb-2 flex items-center gap-2">
          <InputVisualIcon variant="test-sheet" className="size-7 rounded-lg" />
          <label className="block text-sm font-semibold text-slate-800">
            테스트 시트
          </label>
        </div>
        <p className="text-sm leading-6 text-slate-500">
          TC, CL, Smoke Test 등 QA 진행 내용을 확인할 Google Sheet URL을
          입력하세요. TC 또는 CL 문서가 별도 링크로 관리되는 경우 Add를 통해
          추가할 수 있습니다.
        </p>
      </div>

      <div className="space-y-4">
        {testSheets.map((sheet, index) => (
          <div key={index} className="space-y-3">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row">
              {sheet.isEditing ? (
                <input
                  type="text"
                  value={sheet.url}
                  onChange={(event) => updateTestSheet(index, event.target.value)}
                  onBlur={() => finishEditingTestSheet(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") finishEditingTestSheet(index);
                  }}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  className={sheetInputClassName}
                />
              ) : (
                <div className="flex min-h-12 min-w-0 flex-1 items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4">
                  <a
                    href={sheet.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-w-0 flex-1 truncate text-sm text-indigo-600 underline-offset-4 transition hover:text-indigo-800 hover:underline"
                  >
                    {sheet.url}
                  </a>
                  <button
                    onClick={() => editTestSheet(index)}
                    title="Edit URL"
                    className="ml-4 shrink-0 text-sm font-semibold text-slate-500 transition hover:text-indigo-700"
                  >
                    Edit
                  </button>
                </div>
              )}
              {testSheets.length > 1 && (
                <button
                  onClick={() => removeTestSheet(index)}
                  className="min-h-12 shrink-0 rounded-xl border border-slate-300 px-4 text-sm font-medium text-slate-600 transition hover:border-red-300 hover:text-red-600"
                >
                  Remove
                </button>
              )}
            </div>

            {testSheetMetadataList[index] && (
              <SpreadsheetPreview
                spreadsheetInfo={testSheetMetadataList[index]!}
                selectedGids={selectedTestSheetGids[index] ?? []}
                autoLinkedJiraSheet={getAutoLinkedJiraSheetForTestSheet(
                  sheet.url
                )}
                isExpanded={expandedTestSheetSelections[index] ?? false}
                onToggleExpanded={() => toggleTestSheetSelectionExpanded(index)}
                onCloseSelection={() => closeTestSheetSelection(index)}
                onToggleSheet={(sheetInfo) =>
                  toggleSelectedTestSheetGid(index, sheetInfo)
                }
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <button
          onClick={addTestSheet}
          disabled={testSheets.length >= MAX_TEST_SHEETS}
          className="rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-slate-600 transition hover:border-indigo-400 hover:text-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          + 테스트 시트 추가
        </button>
        <span className="text-xs text-slate-500">
          {testSheets.length}/{MAX_TEST_SHEETS}
        </span>
      </div>
    </div>
  );
}
