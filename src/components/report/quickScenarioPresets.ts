import type { QuickScenarioPreset } from "@/components/report/reportInputTypes";

const MAIN_FEATURE_SCENARIO = {
  featureName: "커뮤니티 미션 이벤트",
  version: "2.0.0",
  rcVersion: "RC2",
  spreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1PjBH8lwT8gRvWW_Gbio07CmlYjibOzFPdPXyHgonfr8/edit?gid=1971538612#gid=1971538612",
  testSheetTitles: [
    "메인피쳐1 TC",
    "메인피쳐2 TC",
    "메인피쳐3 TC",
    "메인피쳐4 TC",
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
  testSheetTitles: ["서브피쳐1 TC", "서브피쳐2 TC"],
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
const STABLE_DUMMY_SCENARIO = {
  featureName: "더미 결과 : 안정",
  version: "",
  rcVersion: "",
  spreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1KrAeYbhgiTpp4v-9ibcdKnTGkoyI_jk9qfGhLwOe68Y/edit?gid=846682949#gid=846682949",
  testSheetTitles: ["Dummy_TC_안정"],
  jiraSheetTitle: "Dummy_Jira_안정",
  startDate: "2026-05-20",
  startHour: "00",
  startMinute: "00",
  endDate: "2026-05-22",
  endHour: "17",
  endMinute: "00",
  labels: ["안정", "더미"],
  labelMatchMode: "ALL",
} satisfies QuickScenarioPreset;
const CAUTION_DUMMY_SCENARIO = {
  featureName: "더미 결과 : 주의 필요",
  version: "",
  rcVersion: "",
  spreadsheetUrl:
    "https://docs.google.com/spreadsheets/d/1KrAeYbhgiTpp4v-9ibcdKnTGkoyI_jk9qfGhLwOe68Y/edit?gid=2000456795#gid=2000456795",
  testSheetTitles: ["Dummy_TC_주의필요"],
  jiraSheetTitle: "Dummy_Jira_주의필요",
  startDate: "2026-05-20",
  startHour: "00",
  startMinute: "00",
  endDate: "",
  endHour: "00",
  endMinute: "00",
  labels: ["주의필요", "더미"],
  labelMatchMode: "ALL",
} satisfies QuickScenarioPreset;
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
export const QUICK_SCENARIO_PRESETS = {
  메인피쳐: MAIN_FEATURE_SCENARIO,
  서브피쳐: SUB_FEATURE_SCENARIO,
  "더미:안정": STABLE_DUMMY_SCENARIO,
  "더미:주의필요": CAUTION_DUMMY_SCENARIO,
} satisfies Record<string, QuickScenarioPreset>;
export const OVERALL_QUICK_SCENARIO_PRESETS = {
  "전체 결과": OVERALL_SCENARIO,
} satisfies Record<string, QuickScenarioPreset>;
