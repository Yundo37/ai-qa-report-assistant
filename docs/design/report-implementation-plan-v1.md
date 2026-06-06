
---

# Report 최종 시안 구현 설계서 v1

## 0. 목적

현재 AI QA Report Assistant의 웹 결과 화면은 기능적으로는 QA Summary, Jira Summary, Remaining Issue, QA Comment, AI Analysis를 보여주고 있지만, 포트폴리오 관점에서는 아직 **로우데이터 요약 화면**에 가깝다.

이번 작업의 목적은 Report 최종 시안의 방향을 기준으로, 웹 결과 화면을 **QA Release Dashboard 수준의 리포트 화면**으로 끌어올리는 것이다.

디자인 결정 메모 기준으로 Report는 **2번 시안**을 채택했고, 선정 이유는 `AI Executive Summary 강조`, `QA Release Dashboard 방향`, `현재 프로젝트 데이터 구조와 적합`, `구현 범위와 난이도 균형`이다. 전체 구현 원칙은 `웹 = 메인 QA Report`, `Google Sheet = Export / 공유용`으로 정리되어 있다. 

---

## 1. 이번 작업 범위

이번 v1 작업은 **Report 결과 화면**을 대상으로 한다.

### 포함 범위

```text
Overall Report 결과 화면을 Dashboard 구조로 개편
AI Executive Summary 상단 강조
QA 상태 / KPI 카드 구성
Release Risk Summary 구성
RC Progress 구성
Feature QA Summary 구성
Remaining Issue 영역 개선
QA Comment / Follow-up 영역 개선
Google Sheet 생성 버튼을 Export 기능처럼 배치
라이트 기반 SaaS Dashboard 톤 적용
```

### 제외 범위

```text
Input 화면 개편
AI Analysis Prompt 수정
AI Analysis 자동 생성 흐름 추가
Google Sheet 생성 route 수정
Google Sheet Template 수정
API route 수정
Jira / QA 집계 로직 수정
새로운 데이터 산식 추가
가짜 차트 / 가짜 최근 리포트 / 가짜 Release Note 추가
```

이번 작업은 **데이터 처리 변경이 아니라, 기존 결과 데이터를 더 리포트답게 보여주는 UI 개편**이다.

---

## 2. 현재 코드 구조 기준

최신 스냅샷 기준 결과 화면 관련 컴포넌트는 이미 일부 분리되어 있다.

현재 주요 컴포넌트는 다음과 같다.

```text
OverallReportResultSection
FeatureReportResultSection
JiraSummarySection
AnalysisResultSection
AiAnalysisPreview
OverallReportPreview
OverallQaSummaryCard
OverallFeatureSummaryCard
VersionIssueSummaryCard
RemainingIssueList
QaFollowUpList
ResultSheetActionPanel
SummaryCard
```

현재 프로젝트 구조는 `components/layout`, `components/report`, `hooks`, `lib/report`로 분리되어 있으며, 결과 화면 관련 UI 컴포넌트도 `components/report` 아래에 존재한다. 

따라서 이번 작업은 `app/page.tsx`의 Generate 로직을 건드리기보다, `components/report` 내부 결과 화면 컴포넌트를 중심으로 진행한다.

---

## 3. 목표 화면 구조

Report 최종 시안은 **Overall QA Result Report**를 메인 Dashboard처럼 보여주는 구조다.

최종 목표 구조는 다음과 같다.

```text
Report Header / Hero
↓
QA Status & KPI Strip
↓
AI Executive Summary
↓
Release Risk Summary + RC Progress
↓
Feature QA Summary + Remaining Issues
↓
QA Comment / Follow-up
↓
Google Sheet Export
```

가장 중요한 변화는 **AI Analysis를 중간에 숨기지 않고, 리포트 상단의 핵심 콘텐츠로 끌어올리는 것**이다.

---

## 4. 화면 섹션별 설계

## 4-1. Report Header / Hero

### 역할

사용자가 결과 화면에 진입했을 때, 현재 리포트의 정체를 즉시 이해하게 한다.

### 포함 정보

```text
Report Title
Report Type
Version / RC
QA 기간
Generated 기준 시간
Export to Google Sheet 버튼
```

### 추천 표시

```text
Overall QA Result Report
2.0.0 RC3
QA Period: 2026.05.01 ~ 2026.05.20
Generated from Google Spreadsheet QA Data
```

### 디자인 방향

```text
큰 제목
짧은 메타 정보
상단 우측 Export 버튼
밝은 배경
넓은 여백
```

### 주의점

시안에 있는 좌측 사이드바는 v1에서는 필수 구현 대상이 아니다. 현재 앱은 단일 페이지 구조이므로, 사이드바를 억지로 추가하면 구현 범위가 커진다.

v1에서는 아래처럼 간단하게 간다.

```text
상단 Header + 본문 Dashboard
```

사이드바는 포트폴리오 완성도 추가 작업으로 P2에 둔다.

---

## 4-2. QA Status & KPI Strip

### 역할

리포트의 핵심 상태를 한눈에 보여준다.

### 포함 정보

```text
QA 최종 상태
Total TC
Pass Rate
Remaining
High Risk
Blocked
Next Event
```

### 상태 값

QA 최종 상태는 아래 3단계로 표시한다.

```text
안정
주의 필요
위험
```

QA 상태 판단은 데이터셋 작성 지침의 QA 상태 판단 기준을 따른다. 해당 지침에서는 단순 이슈 개수보다 `Remaining 우선순위`, `Remaining 비율`, `Blocked 비율`, `Next Event 비율` 등을 함께 고려하도록 정의되어 있다. 

### 추천 상태 판단 기준

v1에서는 너무 복잡한 산식을 만들지 않고, 기존 데이터 기반으로 단순하게 표시한다.

```text
위험
- High / Highest Remaining 존재
- Blocked 비율이 높음
- Remaining 비율이 높음

주의 필요
- Medium Remaining 존재
- Remaining Issue 존재
- Blocked 일부 존재
- Next Event 다수 존재

안정
- High / Highest Remaining 없음
- Medium Remaining 없음
- Remaining 대부분 Low 수준
- Blocked 영향 낮음
```

### 구현 방식

새 helper를 만들 수 있다.

```text
components/report/reportDashboardUtils.ts
```

또는

```text
lib/report/reportStatus.ts
```

추천은 `components/report/reportDashboardUtils.ts`다.
이유는 v1에서는 UI 표시용 판단에 가깝고, 핵심 집계 로직이 아니기 때문이다.

### 표시 예시

```text
QA Status
주의 필요

Total TC
148

Pass Rate
91.2%

Remaining
14

High Risk
2

Blocked
4

Next Event
11
```

### 주의점

`Next Event`는 위험으로 과장하면 안 된다. 데이터셋 지침에서 Next Event는 현재 릴리즈 실패가 아니라 차기 업데이트 또는 후속 일정에서 확인 예정인 상태로 정의되어 있다. 

---

## 4-3. AI Executive Summary

### 역할

이 프로젝트의 핵심 차별점이다.

기존에는 AI Analysis가 결과 화면 중간이나 하단에서 별도 액션처럼 보였지만, Report 최종 시안에서는 **리포트의 핵심 인사이트 카드**로 보여야 한다.

### 현재 사용 데이터

```text
aiAnalysisText
isAiAnalyzing
onAnalyze
```

현재 AI Analysis는 `useAiAnalysisAction` 훅을 통해 실행되고, `aiAnalysisText`로 결과가 저장된다. 최신 코드 구조에서도 AI Analysis 관련 훅과 컴포넌트가 분리되어 있다. 

### 목표 UI

```text
AI Executive Summary

[AI Analysis 실행 전]
- AI 분석을 실행하면 QA 리드 관점의 요약이 표시됩니다.
- [AI Analysis 생성하기]

[AI Analysis 실행 중]
- AI Analysis 생성 중...

[AI Analysis 완료 후]
- 3~4문단 요약 표시
- 문단 간 여백 적용
- Jira Key / 숫자 나열보다 인사이트가 강조되는 카드 형태
```

### 디자인 방향

```text
연한 보라 / 인디고 계열 배경
카드 내부 넓은 여백
AI Summary 제목 강조
본문은 읽기 좋은 line-height
버튼은 우측 상단 또는 하단에 배치
```

### 중요 원칙

AI Analysis를 과장해서 표현하지 않는다.

피해야 할 표현:

```text
AI가 배포 가능 여부를 결정
AI가 최종 승인
AI가 위험도를 확정
AI Confidence 72%
```

사용할 표현:

```text
AI Executive Summary
AI 기반 QA 요약
QA 데이터 기반 AI Analysis
QA 리드 관점 요약
```

### 이유

현재 프로젝트는 AI 모델 자체를 검증한 것이 아니라, **AI가 생성한 QA 리포트 결과가 실제 QA 리포트로 쓸 수 있는지 검증하고 개선한 프로젝트**이기 때문이다.

---

## 4-4. QA Overview

### 역할

TC 결과를 한눈에 보여준다.

### 사용 데이터

```text
analysisSummary.qaTotal
analysisSummary.overallQaSummary
analysisSummary.testSheets
analysisSummary.overallTestSheets
```

### 표시 항목

```text
Total
Pass
Fail
Blocked
Next Event
N/A
Pass Rate
```

### 색상 규칙

```text
Pass = Green
Fail = Red
Blocked = Orange
Next Event = Blue / Indigo
N/A = Gray
```

### 구현 방향

기존 `OverallQaSummaryCard`를 그대로 유지하기보다, Dashboard 카드 형태로 개선한다.

기존 컴포넌트는 `Total`, `Pass`, `Fail`, `Blocked`, `NextEvent`, `N/A`를 단순 카드로 표시하는 구조다. 이전 스냅샷에서도 `OverallQaSummaryCard`가 Overall QA Check 결과를 합산해 보여주는 카드 역할을 하고 있었다. 

v1에서는 다음 중 하나를 선택한다.

### 선택 A

`OverallQaSummaryCard`를 리디자인한다.

장점:

```text
수정 파일 적음
기존 props 유지
회귀 위험 낮음
```

### 선택 B

`QaOverviewDashboardCard` 신규 생성

장점:

```text
새 디자인과 기존 컴포넌트 분리
기존 카드 보존 가능
Report 2번 시안 반영 쉬움
```

추천은 **선택 B**다.

---

## 4-5. Release Risk Summary

### 역할

릴리즈 기준 주요 위험 신호를 요약한다.

### 사용 데이터

```text
analysisSummary.remainingIssues
analysisSummary.jiraFiltered
analysisSummary.jiraPriority
analysisSummary.qaIssueOverview
```

### 표시 항목

```text
Remaining Issue 총합
High / Highest Remaining
Medium Remaining
Low / Lowest Remaining
Blocked
Next Event
Reopened
```

### UI 구성

```text
Release Risk Summary 카드

- Remaining Issue: 14
- High / Highest: 2
- Medium: 8
- Low: 5
- Blocked: 4
- Next Event: 11
```

### 강조 기준

```text
High / Highest
강하게 강조

Medium
주의 색상

Low / Lowest
보조 정보

Blocked
Fail과 다른 색상으로 구분

Next Event
현재 위험이 아니라 후속 확인 항목으로 표현
```

### 주의점

`Blocked`와 `Next Event`는 Fail과 다르게 해석해야 한다. 데이터셋 지침에서 Blocked는 기존 Remaining 영향으로 QA 진행이 불가능한 상태이고, Next Event는 차기 업데이트 또는 후속 일정에서 확인 예정인 상태로 정의되어 있다. 

따라서 Release Risk Summary에서 Next Event를 빨간색 위험처럼 보여주면 안 된다.

---

## 4-6. RC Progress

### 역할

RC별 이슈 흐름을 보여준다.

### 사용 데이터

```text
analysisSummary.rcProgress
analysisSummary.rcProgress.items
```

### 표시 항목

```text
RC
New
Resolved
Remaining
Reopened
Progress
```

### UI 구성

```text
RC Progress

RC1  New 28  Resolved 26  Remaining 2  Reopened 0
RC2  New 19  Resolved 16  Remaining 3  Reopened 1
RC3  New 17  Resolved 12  Remaining 5  Reopened 2
```

### 중요 해석 기준

RC Progress에서는 반드시 아래를 구분해야 한다.

```text
RC별 신규 / 해결 / 잔여 흐름
≠
전체 릴리즈 Remaining Issue 상태
```

특히 다음 해석을 막아야 한다.

```text
RC3 신규 이슈가 모두 처리됨
=
전체 Remaining Issue 없음
```

이건 잘못된 해석이다.

### UI 표현 제안

RC 카드 하단에 작은 안내 문구를 넣는다.

```text
RC별 Remaining은 해당 RC 흐름 기준이며,
전체 Remaining Issue 상태는 Release Risk Summary를 기준으로 확인합니다.
```

### 구현 방향

`RcProgressCard` 신규 생성 추천.

```text
components/report/RcProgressCard.tsx
```

---

## 4-7. Feature QA Summary

### 역할

Overall Report가 여러 Feature를 종합했다는 것을 보여준다.

### 사용 데이터

```text
analysisSummary.overallTestSheets
analysisSummary.testSheets
analysisSummary.overallQaSummary
```

### 표시 항목

```text
Feature Name
Total TC
Pass
Fail
Blocked
Next Event
Pass Rate
Status
```

### UI 구성

```text
Feature QA Summary

Community Mission Event
Total 412 / Pass Rate 95.1% / Remaining 10 / Status 주의 필요

알림 우선순위 정책 개선
Total 256 / Pass Rate 92.2% / Remaining 8 / Status 주의 필요
```

### 구현 방향

기존 `OverallFeatureSummaryCard`를 활용하거나 리디자인한다.

시안처럼 테이블형으로 가는 것이 좋다.

```text
Feature | Total TC | Pass Rate | Fail | Blocked | Next Event | Status
```

### 주의점

Feature Summary에서는 Feature 간 비교를 보여줄 수 있지만, AI Analysis처럼 과한 판단 문구를 넣지 않는다.

---

## 4-8. Remaining Issues

### 역할

남아 있는 주요 이슈를 보여준다.

### 사용 데이터

```text
analysisSummary.remainingIssues
```

### 표시 항목

```text
Key
Summary
Priority
Status
Version / RC
```

### UI 방향

기존 `RemainingIssueList`는 테이블형 Raw 데이터 느낌이 강할 수 있다. v1에서는 다음처럼 개선한다.

```text
Top Remaining Issues

High / Highest 우선 노출
Medium 일부 노출
Low는 요약 처리 가능
```

### 표시 개수

```text
상위 5~8개
```

나머지는 다음처럼 요약한다.

```text
+ 6 more Remaining Issues
```

### 주의점

Jira Key와 개별 이슈 제목을 너무 강조하면 Report 화면이 Jira 복사본처럼 보일 수 있다.

우선순위는 다음과 같다.

```text
Priority
Status
Summary
Key
```

Key는 보조 정보로 둔다.

### 구현 방향

기존 `RemainingIssueList`를 직접 수정하거나, `TopRemainingIssuesCard` 신규 생성.

추천은 신규 생성이다.

```text
components/report/TopRemainingIssuesCard.tsx
```

---

## 4-9. QA Comment / Follow-up

### 역할

QA가 정리한 협의 사항, 후속 확인 사항, 운영 참고 내용을 보여준다.

### 사용 데이터

```text
analysisSummary.qaFollowUps
```

### 표시 방향

```text
QA Comments / Follow-up

- 차기 수정 예정
- 운영 정책 협의
- 배포 후 확인
- 기타 후속 조치
```

현재 데이터에서 카테고리 정보가 명확하지 않다면 v1에서는 억지 분류하지 않고 리스트형으로 표시한다.

### 주의점

QA Comment를 AI Analysis의 분석 근거처럼 보이게 하면 안 된다.

QA Comment는 다음 성격이다.

```text
코멘트
협의 사항
주의 사항
후속 참고 내용
```

### 구현 방향

기존 `QaFollowUpList`를 라이트 테마 카드로 리디자인한다.

---

## 4-10. Google Sheet Export

### 역할

Google Sheet Result Report 생성 기능은 유지하되, 웹 화면의 메인 기능처럼 보이지 않게 한다.

### 현재 사용 컴포넌트

```text
ResultSheetActionPanel
```

### 목표

버튼명을 가능하면 Export 역할처럼 표현한다.

기존:

```text
Create Result Report
Create Result Sheet
```

개선:

```text
Export to Google Sheet
```

### 배치

시안처럼 상단 우측 버튼으로 두거나, 하단 Export 카드로 둔다.

v1 추천:

```text
상단 Header 우측
+
하단 Export Card
```

하지만 중복이 부담되면 하단만 둔다.

### 주의점

Google Sheet route는 수정하지 않는다.
버튼 문구와 배치만 바꾼다.

---

## 5. 신규 컴포넌트 제안

## 5-1. `OverallReportDashboard.tsx`

위치:

```text
components/report/OverallReportDashboard.tsx
```

역할:

```text
Overall Report 결과 화면 전체 레이아웃 담당
```

props 예시:

```ts
type OverallReportDashboardProps = {
  analysisSummary: Exclude<AnalysisSummaryState, null>;
  aiAnalysisText: string;
  isAiAnalyzing: boolean;
  onAnalyze: () => void;
  onCreateResultSheet: () => void;
  isCreatingResultSheet: boolean;
  resultSheetMessage: MessageState;
  resultSheetUrl: string;
  reportScopeText: string;
};
```

---

## 5-2. `ReportDashboardHeader.tsx`

역할:

```text
Report Title
Version / RC
QA Period
Export 버튼
```

---

## 5-3. `ReportStatusKpiStrip.tsx`

역할:

```text
QA 상태
Total TC
Pass Rate
Remaining
High Risk
Blocked
Next Event
```

---

## 5-4. `AiExecutiveSummaryCard.tsx`

역할:

```text
AI Analysis 실행 전 / 실행 중 / 완료 상태 표시
AI Analysis 본문 강조
```

기존 `AiAnalysisPreview`와 역할이 겹친다.

v1에서는 둘 중 하나 선택.

### 선택 A

`AiAnalysisPreview`를 리디자인

### 선택 B

`AiExecutiveSummaryCard` 신규 생성

추천은 **선택 B**다.

이유:

```text
기존 Feature 화면 영향 최소화
Overall Dashboard 전용 디자인 가능
```

---

## 5-5. `ReleaseRiskSummaryCard.tsx`

역할:

```text
Remaining Issue priority 요약
High / Medium / Low / Blocked / Next Event 표시
```

---

## 5-6. `RcProgressCard.tsx`

역할:

```text
RC별 New / Resolved / Remaining / Reopened 표시
```

---

## 5-7. `FeatureQaSummaryTable.tsx`

역할:

```text
Feature별 QA 결과 테이블
```

---

## 5-8. `TopRemainingIssuesCard.tsx`

역할:

```text
주요 Remaining Issue 상위 목록 표시
```

---

## 5-9. `QaFollowUpCard.tsx`

역할:

```text
QA Comment / Follow-up 표시
```

기존 `QaFollowUpList` 리디자인으로 대체 가능.

---

## 6. 기존 컴포넌트 재사용 전략

### 재사용 가능

```text
OverallFeatureSummaryCard
OverallQaSummaryCard
VersionIssueSummaryCard
RemainingIssueList
QaFollowUpList
ResultSheetActionPanel
```

### 신규 생성 추천

```text
OverallReportDashboard
ReportDashboardHeader
ReportStatusKpiStrip
AiExecutiveSummaryCard
ReleaseRiskSummaryCard
RcProgressCard
TopRemainingIssuesCard
```

### 수정 최소화 원칙

기존 컴포넌트를 전부 갈아엎지 말고, Overall Dashboard 전용 컴포넌트를 새로 만들고 `OverallReportResultSection`에서 연결하는 방식이 안전하다.

---

## 7. 수정 대상 파일

### 우선 수정 대상

```text
components/report/OverallReportResultSection.tsx
components/report/AnalysisResultSection.tsx
components/report/ResultSheetActionPanel.tsx
```

### 신규 생성 후보

```text
components/report/OverallReportDashboard.tsx
components/report/ReportDashboardHeader.tsx
components/report/ReportStatusKpiStrip.tsx
components/report/AiExecutiveSummaryCard.tsx
components/report/ReleaseRiskSummaryCard.tsx
components/report/RcProgressCard.tsx
components/report/FeatureQaSummaryTable.tsx
components/report/TopRemainingIssuesCard.tsx
components/report/QaFollowUpCard.tsx
components/report/reportDashboardUtils.ts
```

### 필요 시 수정

```text
components/report/OverallQaSummaryCard.tsx
components/report/OverallFeatureSummaryCard.tsx
components/report/RemainingIssueList.tsx
components/report/QaFollowUpList.tsx
app/globals.css
```

### 수정하지 않을 파일

```text
app/api/*
lib/report/*
hooks/useAiAnalysisAction.ts
hooks/useResultSheetAction.ts
Google Sheet 생성 route
AI Analysis route
```

---

## 8. 데이터 매핑 설계

## 8-1. QA KPI

### Source

```text
analysisSummary.qaTotal
analysisSummary.overallQaSummary
```

### 계산

```text
Total = Pass + Fail + Blocked + NextEvent + N/A
Pass Rate = Pass / (Pass + Fail + Blocked + NextEvent)
```

`N/A`는 Pass Rate 분모에서 제외하는 것을 권장한다.

---

## 8-2. Remaining Summary

### Source

```text
analysisSummary.remainingIssues
analysisSummary.qaIssueOverview.remaining.prioritySummary
analysisSummary.jiraFiltered
```

### 계산

```text
High Risk = Highest + High
Medium = Medium
Low = Low + Lowest
Remaining Total = remainingIssues.length 또는 jiraFiltered.Remaining
```

우선순위는 `qaIssueOverview`가 있으면 그것을 우선 사용하고, 없으면 `remainingIssues`에서 fallback 계산한다.

---

## 8-3. RC Progress

### Source

```text
analysisSummary.rcProgress.items
```

### 표시

```text
RC
New
Resolved
Remaining
Reopened
```

### Progress 계산

v1에서 정확한 progress 산식이 애매하면 Progress bar는 선택 사항이다.

추천:

```text
Progress bar는 v1에서 생략 가능
```

또는 단순 산식:

```text
resolvedIssues / newIssues
```

단, 산식이 오해될 수 있으므로 처음에는 숫자 중심 테이블이 안전하다.

---

## 8-4. Feature QA Summary

### Source

```text
analysisSummary.overallTestSheets
```

Fallback:

```text
analysisSummary.testSheets
```

### 표시

```text
Feature
Total TC
Pass
Fail
Blocked
Next Event
Pass Rate
Status
```

---

## 8-5. AI Executive Summary

### Source

```text
aiAnalysisText
isAiAnalyzing
onAnalyze
```

### 표시 상태

```text
empty
loading
done
```

---

## 9. 디자인 톤

Report 최종 시안은 라이트 기반의 SaaS Dashboard 스타일이다.

### 배경

```text
bg-slate-50
```

### 카드

```text
bg-white
border border-slate-200
rounded-2xl
shadow-sm
```

### 텍스트

```text
title: text-slate-950
body: text-slate-600
muted: text-slate-400
```

### Primary

```text
indigo / violet 계열
```

### 상태 색상

```text
Pass / 안정 = emerald
Fail / 위험 = red
Blocked / 주의 = amber
Next Event = indigo
N/A = slate
```

---

## 10. Feature Report 적용 범위

v1의 메인 개편 대상은 **Overall Report**다.

Feature Report는 이번 작업에서 전체 대시보드 수준으로 뜯어고치지 않는다.

다만 최소한 아래는 맞춘다.

```text
라이트 테마
카드 스타일
AI Analysis 카드 톤
Remaining Issue / QA Comment 카드 톤
Export 버튼 문구
```

즉, Feature Report는 v1에서 **톤 통일 정도만 적용**하고, 구조 개편은 P1로 둔다.

---

## 11. 구현 순서 제안

## Phase 1. Report 설계서 저장

현재 문서를 아래 경로로 저장한다.

```text
docs/design/report-implementation-plan-v1.md
```

---

## Phase 2. Dashboard 유틸 추가

신규 파일:

```text
components/report/reportDashboardUtils.ts
```

포함 함수 예시:

```text
calculatePassRate
createQaStatus
createRemainingPrioritySummary
formatPercent
getStatusTone
sortTopRemainingIssues
```

---

## Phase 3. Overall Dashboard 컴포넌트 추가

신규 파일:

```text
OverallReportDashboard.tsx
ReportDashboardHeader.tsx
ReportStatusKpiStrip.tsx
AiExecutiveSummaryCard.tsx
ReleaseRiskSummaryCard.tsx
RcProgressCard.tsx
FeatureQaSummaryTable.tsx
TopRemainingIssuesCard.tsx
QaFollowUpCard.tsx
```

이 단계에서는 기존 컴포넌트를 삭제하지 않는다.

---

## Phase 4. OverallReportResultSection 연결

기존 Overall 결과 섹션에서 새 Dashboard 컴포넌트를 사용하도록 연결한다.

```text
OverallReportResultSection
↓
OverallReportDashboard
```

기존 props와 동작을 유지해야 한다.

---

## Phase 5. ResultSheetActionPanel 톤 조정

버튼 문구와 스타일을 Export 역할로 조정한다.

```text
Create Result Sheet
↓
Export to Google Sheet
```

단, route와 hook은 수정하지 않는다.

---

## Phase 6. Feature Report 최소 톤 통일

Feature Result 화면은 구조 변경보다 색상/카드 톤만 맞춘다.

---

## 12. 수동 테스트 체크리스트

```text
1. Overall Quick Scenario 적용
- Generate 실행
- Overall Dashboard 표시 확인

2. AI Analysis
- AI Analysis 버튼 표시 확인
- AI Analysis 실행
- Summary 카드에 본문 표시 확인
- 입력값 변경 시 기존처럼 AI Analysis 초기화 확인

3. KPI
- Total TC
- Pass
- Fail
- Blocked
- Next Event
- N/A
- Pass Rate 표시 확인

4. Release Risk
- Remaining Issue 수 확인
- High / Highest 표시 확인
- Blocked와 Next Event가 Fail처럼 보이지 않는지 확인

5. RC Progress
- RC1 / RC2 / RC3 표시 확인
- RC Remaining과 전체 Remaining이 혼동되지 않는지 확인

6. Feature Summary
- Overall Test Sheet별 요약 표시 확인
- Jira Sheet가 Feature로 표시되지 않는지 확인

7. Remaining Issues
- High / Highest 우선 정렬 확인
- Status / Priority 표시 확인

8. QA Comment
- Follow-up 리스트 표시 확인
- 없을 때 empty state 확인

9. Export
- Export to Google Sheet 버튼 정상 동작
- Result Sheet 생성 성공 / 실패 메시지 정상 표시

10. Feature Report
- Feature Report 전환 후 Generate 정상
- 기존 Feature 동작 깨지지 않는지 확인
```

---

## 13. Codex 작업 시 주의 문구

Codex 요청 시 아래 조건을 반드시 포함한다.

```text
이번 작업은 Report 결과 화면 UI 개편입니다.

Overall Report 결과 화면을 Report 최종 시안 기준의 QA Release Dashboard 형태로 개선합니다.

Google Sheet route는 수정하지 않습니다.
AI Analysis prompt는 수정하지 않습니다.
Generate 데이터 처리 로직은 수정하지 않습니다.
API route는 수정하지 않습니다.
Jira / QA 집계 로직은 수정하지 않습니다.

기존 analysisSummary, aiAnalysisText, rcProgress, remainingIssues, qaFollowUps 데이터를 재사용해서 화면 구조와 가독성만 개선합니다.

Feature Report는 이번 작업에서 큰 구조 변경 없이 라이트 테마와 카드 톤만 맞춥니다.
```

---

## 14. v1 최종 목표

이번 Report 개편이 완료되면 결과 화면 인상이 아래처럼 바뀌어야 한다.

### 현재 인상

```text
QA Summary와 Jira Summary를 나열한 개발자용 결과 화면
Google Sheet 생성을 위한 중간 확인 화면
```

### 목표 인상

```text
웹에서 바로 읽을 수 있는 QA Release Dashboard
AI Executive Summary가 중심이 되는 포트폴리오용 결과 리포트
Google Sheet는 Export / 공유용으로 보이는 구조
```

---

## 15. 다음 단계

이 문서를 저장한 후 다음 단계는 다음 중 하나다.

```text
1. docs/design/report-implementation-plan-v1.md로 저장
2. docs/design 폴더 전체 커밋
3. Input 구현 요청서 작성
4. Report 구현 요청서 작성
```

추천 순서는 다음과 같다.

```text
1. input-implementation-plan-v1.md 저장
2. report-implementation-plan-v1.md 저장
3. docs/design 커밋
4. Input 구현 요청서 작성
5. Input 작업
6. Report 구현 요청서 작성
7. Report 작업
```

이 순서가 가장 안전하다.
