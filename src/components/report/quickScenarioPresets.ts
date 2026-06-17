import type { QuickScenarioPreset } from "@/components/report/reportInputTypes";

const MAIN_FEATURE_SCENARIO = {
  featureName: "커뮤니티 미션 이벤트",
  version: "2.0.0",
  rcVersion: "RC2",
  spreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1PjBH8lwT8gRvWW_Gbio07CmlYjibOzFPdPXyHgonfr8/edit?gid=1971538612#gid=1971538612",
  testSheetTitles: [
    "메인피쳐1",
    "메인피쳐2",
    "메인피쳐3",
    "메인피쳐4",
  ],
  jiraSheetTitle: "지라 데이터",
  startDate: "2026-05-01",
  startHour: "09",
  startMinute: "30",
  endDate: "2026-05-11",
  endHour: "20",
  endMinute: "00",
  labels: ["커뮤니티미션"],
  labelMatchMode: "ANY",
} satisfies QuickScenarioPreset;
const SUB_FEATURE_SCENARIO = {
  featureName: "알림 우선순위 정책 개선",
  version: "2.0.0",
  rcVersion: "RC3",
  spreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1gl3yDCtZn71XeFEa3JSyOu7UrMluLO3x8ezN9Ag96eI/edit?gid=982602155#gid=982602155",
  testSheetTitles: ["서브피쳐1", "서브피쳐2"],
  jiraSheetTitle: "지라 데이터",
  startDate: "2026-05-08",
  startHour: "19",
  startMinute: "00",
  endDate: "2026-05-13",
  endHour: "13",
  endMinute: "00",
  labels: ["알림"],
  labelMatchMode: "ANY",
} satisfies QuickScenarioPreset;

function createFeatureScenario(
  baseScenario: QuickScenarioPreset,
  spreadsheetUrl: string
) {
  return {
    ...baseScenario,
    spreadsheetUrl,
  } satisfies QuickScenarioPreset;
}

const MAIN_FEATURE_RISK_1_SCENARIO = {
  ...MAIN_FEATURE_SCENARIO,
  testSheetTitles: [
    "메인피쳐1 TC",
    "메인피쳐2 TC",
    "메인피쳐3 TC",
    "메인피쳐4 TC",
  ],
} satisfies QuickScenarioPreset;
const SUB_FEATURE_RISK_1_SCENARIO = {
  ...SUB_FEATURE_SCENARIO,
  testSheetTitles: ["서브피쳐1 TC", "서브피쳐2 TC"],
  startDate: "2025-12-01",
  startHour: "11",
  startMinute: "16",
  endDate: "2026-05-13",
  endHour: "10",
  endMinute: "01",
} satisfies QuickScenarioPreset;
const MAIN_FEATURE_RISK_2_SCENARIO = createFeatureScenario(
  MAIN_FEATURE_SCENARIO,
  "https://docs.google.com/spreadsheets/d/1PYUF8FrojmdmyH-QzH3e3OORRCFQpQjqmlphhfe1tB4/edit?gid=56886862#gid=56886862"
);
const MAIN_FEATURE_CAUTION_SCENARIO = {
  ...createFeatureScenario(
    MAIN_FEATURE_SCENARIO,
    "https://docs.google.com/spreadsheets/d/1RXVzMylgOZdX-9nMGlCFPG1WO1UMwt70UF5l5TWl-eA/edit?gid=1324222698#gid=1324222698"
  ),
  startDate: "2026-05-01",
  startHour: "08",
  startMinute: "30",
  endDate: "2026-05-14",
  endHour: "10",
  endMinute: "33",
} satisfies QuickScenarioPreset;
const MAIN_FEATURE_STABLE_SCENARIO = {
  ...createFeatureScenario(
    MAIN_FEATURE_SCENARIO,
    "https://docs.google.com/spreadsheets/d/1F2SQAstP_iaJHmiDYEDg5o15jMh6BFR0Q5KbPKFBDx8/edit?gid=1977195543#gid=1977195543"
  ),
  startDate: "2026-05-01",
  startHour: "08",
  startMinute: "30",
  endDate: "2026-05-14",
  endHour: "00",
  endMinute: "04",
} satisfies QuickScenarioPreset;
const SUB_FEATURE_RISK_2_SCENARIO = {
  ...createFeatureScenario(
    SUB_FEATURE_SCENARIO,
    "https://docs.google.com/spreadsheets/d/1WWNvtrspGmOrK0yZWWWmiWHc4piLEdagRYV0WnswjUQ/edit?gid=1324240821#gid=1324240821"
  ),
  startDate: "2025-12-01",
  startHour: "11",
  startMinute: "16",
  endDate: "2026-05-13",
  endHour: "10",
  endMinute: "01",
} satisfies QuickScenarioPreset;
const SUB_FEATURE_CAUTION_SCENARIO = {
  ...createFeatureScenario(
    SUB_FEATURE_SCENARIO,
    "https://docs.google.com/spreadsheets/d/1tCBPDSFfwhm2uxDC73ZdxAdlyh7i_jrlFrF-S0kMh90/edit?gid=318563170#gid=318563170"
  ),
  startDate: "2026-05-01",
  startHour: "08",
  startMinute: "30",
  endDate: "2026-05-14",
  endHour: "10",
  endMinute: "33",
} satisfies QuickScenarioPreset;
const SUB_FEATURE_STABLE_SCENARIO = {
  ...createFeatureScenario(
    SUB_FEATURE_SCENARIO,
    "https://docs.google.com/spreadsheets/d/1VDVe6qKkah9LRVo0TrOERIbMmAiPugG4-xxfdMbsU8U/edit?gid=803334489#gid=803334489"
  ),
  startDate: "2026-05-01",
  startHour: "08",
  startMinute: "30",
  endDate: "2026-05-14",
  endHour: "00",
  endMinute: "04",
} satisfies QuickScenarioPreset;
function createOverallScenario({
  mainSpreadsheetUrl,
  subSpreadsheetUrl,
}: {
  mainSpreadsheetUrl: string;
  subSpreadsheetUrl: string;
}) {
  return {
    featureName: "A프로젝트 v2.0.0",
    version: "2.0.0",
    rcVersion: "RC3",
    spreadsheetUrl: mainSpreadsheetUrl,
    testSheetTitles: ["메인피쳐1", "메인피쳐2", "메인피쳐3", "메인피쳐4"],
    jiraSheetTitle: "지라 데이터",
    testSheetGroups: [
      {
        spreadsheetUrl: mainSpreadsheetUrl,
        testSheetTitles: ["메인피쳐1", "메인피쳐2", "메인피쳐3", "메인피쳐4"],
        jiraSheetTitle: "지라 데이터",
      },
      {
        spreadsheetUrl: subSpreadsheetUrl,
        testSheetTitles: ["서브피쳐1", "서브피쳐2"],
      },
    ],
    startDate: "2026-05-01",
    startHour: "09",
    startMinute: "30",
    endDate: "2026-05-13",
    endHour: "13",
    endMinute: "00",
    labels: [],
    labelMatchMode: "ANY",
  } satisfies QuickScenarioPreset;
}

const OVERALL_SCENARIO = {
  featureName: "A프로젝트 v2.0.0",
  version: "2.0.0",
  rcVersion: "RC3",
  spreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1PjBH8lwT8gRvWW_Gbio07CmlYjibOzFPdPXyHgonfr8/edit?gid=1971538612#gid=1971538612",
  testSheetTitles: [
    "메인피쳐1 TC",
    "메인피쳐2 TC",
    "메인피쳐3 TC",
    "메인피쳐4 TC",
    "지라 데이터",
  ],
  jiraSheetTitle: "지라 데이터",
  testSheetGroups: [
    {
      spreadsheetUrl:
        "https://docs.google.com/spreadsheets/d/1PjBH8lwT8gRvWW_Gbio07CmlYjibOzFPdPXyHgonfr8/edit?gid=1971538612#gid=1971538612",
      testSheetTitles: [
        "메인피쳐1 TC",
        "메인피쳐2 TC",
        "메인피쳐3 TC",
        "메인피쳐4 TC",
        "지라 데이터",
      ],
      jiraSheetTitle: "지라 데이터",
    },
    {
      spreadsheetUrl:
        "https://docs.google.com/spreadsheets/d/1gl3yDCtZn71XeFEa3JSyOu7UrMluLO3x8ezN9Ag96eI/edit?gid=982602155#gid=982602155",
      testSheetTitles: ["서브피쳐1 TC", "서브피쳐2 TC"],
    },
  ],
  startDate: "2026-05-01",
  startHour: "09",
  startMinute: "30",
  endDate: "2026-05-13",
  endHour: "13",
  endMinute: "00",
  labels: [],
  labelMatchMode: "ANY",
} satisfies QuickScenarioPreset;
const OVERALL_STABLE_SCENARIO = {
  ...createOverallScenario({
    mainSpreadsheetUrl:
      "https://docs.google.com/spreadsheets/d/1F2SQAstP_iaJHmiDYEDg5o15jMh6BFR0Q5KbPKFBDx8/edit?gid=1977195543#gid=1977195543",
    subSpreadsheetUrl:
      "https://docs.google.com/spreadsheets/d/1VDVe6qKkah9LRVo0TrOERIbMmAiPugG4-xxfdMbsU8U/edit?gid=803334489#gid=803334489",
  }),
  startDate: "2026-05-01",
  startHour: "08",
  startMinute: "30",
  endDate: "2026-05-14",
  endHour: "00",
  endMinute: "30",
} satisfies QuickScenarioPreset;
const OVERALL_CAUTION_SCENARIO = {
  ...createOverallScenario({
    mainSpreadsheetUrl:
      "https://docs.google.com/spreadsheets/d/1RXVzMylgOZdX-9nMGlCFPG1WO1UMwt70UF5l5TWl-eA/edit?gid=1324222698#gid=1324222698",
    subSpreadsheetUrl:
      "https://docs.google.com/spreadsheets/d/1tCBPDSFfwhm2uxDC73ZdxAdlyh7i_jrlFrF-S0kMh90/edit?gid=318563170#gid=318563170",
  }),
  startDate: "2026-05-01",
  startHour: "08",
  startMinute: "30",
  endDate: "2026-05-14",
  endHour: "11",
  endMinute: "00",
} satisfies QuickScenarioPreset;
const OVERALL_RISK_SCENARIO = createOverallScenario({
  mainSpreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1PYUF8FrojmdmyH-QzH3e3OORRCFQpQjqmlphhfe1tB4/edit?gid=56886862#gid=56886862",
  subSpreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1WWNvtrspGmOrK0yZWWWmiWHc4piLEdagRYV0WnswjUQ/edit?gid=1324240821#gid=1324240821",
});
export const QUICK_SCENARIO_PRESETS = {
  "메인피쳐 : 위험 1": MAIN_FEATURE_RISK_1_SCENARIO,
  "메인피쳐 : 위험 2": MAIN_FEATURE_RISK_2_SCENARIO,
  "메인피쳐 : 주의 필요": MAIN_FEATURE_CAUTION_SCENARIO,
  "메인피쳐 : 안정": MAIN_FEATURE_STABLE_SCENARIO,
  "서브피쳐 : 위험 1": SUB_FEATURE_RISK_1_SCENARIO,
  "서브피쳐 : 위험 2": SUB_FEATURE_RISK_2_SCENARIO,
  "서브피쳐 : 주의 필요": SUB_FEATURE_CAUTION_SCENARIO,
  "서브피쳐 : 안정": SUB_FEATURE_STABLE_SCENARIO,
} satisfies Record<string, QuickScenarioPreset>;
export const OVERALL_QUICK_SCENARIO_PRESETS = {
  "전체 결과 : 위험 1": OVERALL_SCENARIO,
  "전체 결과 : 위험 2": OVERALL_RISK_SCENARIO,
  "전체 결과 : 주의 필요": OVERALL_CAUTION_SCENARIO,
  "전체 결과 : 안정": OVERALL_STABLE_SCENARIO,
} satisfies Record<string, QuickScenarioPreset>;
