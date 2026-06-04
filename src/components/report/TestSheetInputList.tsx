import { SpreadsheetPreview } from "@/components/report/SpreadsheetPreview";
import type { TestSheetInputListProps } from "@/components/report/reportInputTypes";

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
    <div className="mb-8">
      <label className="mb-2 block text-sm font-semibold text-zinc-200">
        Test Sheets
      </label>
      <p className="mb-4 text-sm leading-6 text-zinc-500">
        TC, CL, Smoke Test 등 QA 진행 내용을 확인할 Google Sheet URL을
        입력하세요. TC 또는 CL 문서가 별도 링크로 관리되는 경우 Add를
        통해 추가할 수 있습니다.
      </p>
      <div className="mb-4 text-sm leading-6 text-zinc-500">
        <p>
      결과 리포트에 포함할 코멘트에는 &quot;##&quot;를 함께
      작성해주세요.
        </p>
        <p className="mt-1">예: ## 다음 버전 수정 예정</p>
      </div>
      <div className="space-y-3">
        {testSheets.map((sheet, index) => (
      <div key={index} className="space-y-3">
        <div className="flex min-w-0 gap-3">
        {sheet.isEditing ? (
          <input
        type="text"
        value={sheet.url}
        onChange={(event) =>
          updateTestSheet(index, event.target.value)
        }
        onBlur={() => finishEditingTestSheet(index)}
        onKeyDown={(event) => {
          if (event.key === "Enter") finishEditingTestSheet(index);
        }}
        placeholder="https://docs.google.com/spreadsheets/..."
        className="min-h-12 min-w-0 flex-1 rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-zinc-400"
          />
        ) : (
          <div className="flex min-h-12 min-w-0 flex-1 items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950 px-4">
        <a
          href={sheet.url}
          target="_blank"
          rel="noopener noreferrer"
          className="min-w-0 flex-1 truncate text-sm text-blue-400 underline-offset-4 transition hover:text-blue-300 hover:underline"
        >
          {sheet.url}
        </a>
        <button
          onClick={() => editTestSheet(index)}
          title="Edit URL"
          className="ml-4 shrink-0 text-zinc-500 transition hover:text-zinc-300"
        >
          ✎
        </button>
          </div>
        )}
        {testSheets.length > 1 && (
          <button
        onClick={() => removeTestSheet(index)}
        className="min-h-12 shrink-0 rounded-xl border border-zinc-700 px-4 text-sm text-zinc-300 transition hover:border-red-400 hover:text-red-300"
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
          onToggleSheet={(sheet) =>
        toggleSelectedTestSheetGid(index, sheet)
          }
        />
        )}
      </div>
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between gap-4">
        <button
      onClick={addTestSheet}
      disabled={testSheets.length >= MAX_TEST_SHEETS}
      className="rounded-xl border border-dashed border-zinc-600 px-4 py-3 text-sm text-zinc-300 transition hover:border-zinc-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
      + Add Test Sheet
        </button>
        <span className="text-xs text-zinc-500">
      {testSheets.length}/{MAX_TEST_SHEETS}
        </span>
      </div>
    </div>
  );
}
