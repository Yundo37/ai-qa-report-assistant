---

# Input 최종 시안 구현 설계서 v1

## 0. 목적

현재 AI QA Report Assistant의 입력 화면은 기능적으로는 동작하지만, 포트폴리오 관점에서는 **설정값을 한 번에 모아둔 통짜 폼**에 가깝다.

이번 작업의 목적은 Input 최종 시안의 방향을 기준으로, 입력 화면을 **Step 기반 QA Report 생성 Dashboard**처럼 보이도록 개편하는 것이다.

디자인 결정 메모 기준으로 Input은 **3번 시안**을 채택했고, 선정 이유는 `Step 기반 입력 구조`, `Quick Scenario 강조`, `통짜 입력폼 개선`, `SaaS Dashboard 스타일`이다. 또한 전체 구현 원칙은 `웹 = 메인 QA Report`, `Google Sheet = Export / 공유용`으로 정리되어 있다. 

---

## 1. 이번 작업 범위

이번 v1 작업은 **Input 화면만** 대상으로 한다.

### 포함 범위

```text
Input 화면 레이아웃 개편
다크 테마 → 라이트 기반 SaaS Dashboard 톤 적용
Report Type 선택 영역 개선
Quick Scenario 영역 강조
Sheet 연결 영역 카드화
분석 범위 영역 카드화
Generate 영역 CTA 강화
입력 요약 카드 추가
```

### 제외 범위

```text
Report 결과 화면 개편
AI Analysis Prompt 수정
AI Analysis 자동 생성 흐름 추가
Google Sheet 생성 route 수정
Google Sheet Template 수정
API route 수정
데이터 집계 로직 수정
Generate 로직 구조 변경
```

즉, 이번 작업은 **기능 변경이 아니라 입력 UX와 화면 구조 개선**이다.

---

## 2. 현재 코드 구조 기준

최신 스냅샷 기준으로 입력 화면 관련 컴포넌트는 이미 어느 정도 분리되어 있다. 주요 컴포넌트는 `ReportInputPanel`, `ReportTypeSelector`, `QuickScenarioSelector`, `ReportBasicInfoForm`, `TestSheetInputList`, `JiraIssueSheetInput`, `JiraPeriodInput`, `JiraLabelInputList`, `ReportGenerateAction` 등이다. 

따라서 이번 작업은 새 기능을 만드는 것보다, 기존 컴포넌트를 **새로운 화면 구조에 맞게 재배치하고 스타일을 정리하는 작업**에 가깝다.

현재 구조를 단순화하면 다음과 같다.

```text
app/page.tsx
↓
ReportAssistantPageView
↓
ReportInputPanel
↓
ReportTypeSelector
QuickScenarioSelector
ReportBasicInfoForm
TestSheetInputList
JiraIssueSheetInput
JiraPeriodInput
JiraLabelInputList
ReportGenerateAction
```

이번 작업에서 `app/page.tsx`의 상태 관리와 Generate 로직은 건드리지 않는 것을 원칙으로 한다. `page.tsx`는 이미 상태와 실행 흐름을 담당하고 있고, 입력 UI는 컴포넌트로 분리되어 있으므로 UI 개편은 `components/report` 중심으로 진행한다.

---

## 3. 목표 화면 구조

Input 최종 시안은 “처음부터 모든 입력 필드가 펼쳐진 설정창”이 아니라, 사용자가 자연스럽게 리포트 생성 흐름을 따라가게 하는 구조가 핵심이다.

최종 구조는 아래처럼 잡는다.

```text
Hero / Intro
↓
Report Type 선택
↓
Quick Scenario
↓
Step 1. Basic Info
↓
Step 2. Sheet 연결
↓
Step 3. 분석 범위
↓
Step 4. Jira Filter
↓
Step 5. Generate
```

다만 실제 화면에서는 너무 딱딱한 Wizard처럼 만들지 않는다.

```text
좋은 방향
= Step 카드형 Dashboard

피해야 할 방향
= 다음 버튼을 눌러야만 넘어가는 Wizard
```

사용자는 언제든 위아래로 스크롤하며 입력값을 수정할 수 있어야 한다.

---

## 4. 화면 섹션별 설계

## 4-1. Hero / Intro 영역

### 역할

사용자가 첫 화면에서 이 서비스가 무엇인지 바로 이해하게 한다.

### 포함 내용

```text
AI QA Report Assistant
Google Sheet 기반 QA 데이터를 읽어 AI QA Report를 생성하는 도구
Overall QA Report가 메인 데모라는 인상
```

### 추천 문구

```text
AI QA Report Assistant

Google Spreadsheet의 TC / Jira / Remaining Issue 데이터를 기반으로
QA 리드 관점의 Feature / Overall QA Result Report를 생성합니다.
```

### 디자인 방향

```text
밝은 배경
넓은 여백
큰 타이틀
짧은 설명
오른쪽에는 간단한 요약 카드 가능
```

오른쪽 요약 카드에는 실제 데이터가 없어도 되는 정적 안내를 넣을 수 있다.

```text
Report Flow
1. Select Report Type
2. Apply Scenario
3. Connect Sheets
4. Generate QA Report
```

단, `최근 생성 리포트` 같은 기능은 실제 저장 기능이 없으므로 이번 v1에서는 넣지 않는다.

---

## 4-2. Report Type 선택 영역

### 현재 사용 컴포넌트

```text
ReportTypeSelector
```

### 목표

Report Type 선택이 단순 버튼이 아니라, 리포트 성격을 설명하는 선택 카드처럼 보이게 한다.

### 선택지

```text
Overall Report
Feature Report
```

### 설명 문구

Overall Report:

```text
릴리즈 / 버전 단위의 QA 상태, RC 흐름, Remaining Issue, Feature별 QA 결과를 종합합니다.
```

Feature Report:

```text
단일 기능의 Test Case, Jira Issue, Remaining Issue, QA Comment를 기준으로 기능 QA 결과를 요약합니다.
```

### 중요 기준

현재 프로젝트 방향상 Overall Report가 메인 데모이므로, 기본 선택은 Overall 상태를 유지한다. 기존에 반영한 `Overall 기본 진입` 동작을 유지해야 한다.

### 구현 방식

기존 `ReportTypeSelector`를 유지하되, 내부 UI를 버튼 2개에서 카드 2개 형태로 확장하는 것을 권장한다.

```text
Before:
[Overall] [Feature]

After:
┌────────────────────┐
│ Overall Report     │
│ Release QA Summary │
└────────────────────┘

┌────────────────────┐
│ Feature Report     │
│ Feature QA Result  │
└────────────────────┘
```

---

## 4-3. Quick Scenario 영역

### 현재 사용 컴포넌트

```text
QuickScenarioSelector
```

### 목표

Quick Scenario는 포트폴리오 데모에서 매우 중요하므로, 입력 화면 상단부에 강하게 노출한다.

### 위치

Report Type 선택 직후에 배치한다.

```text
Hero
↓
Report Type
↓
Quick Scenario
```

### 이유

Quick Scenario는 사용자가 복잡한 Google Sheet URL과 기간, Label을 직접 입력하지 않아도 빠르게 데모를 실행할 수 있게 해준다. 현재 코드에서도 Quick Scenario 적용 시 Report Title, Version, RC, Test Sheet, Jira Sheet, 기간, Label 등을 자동 세팅하는 흐름이 존재한다. 

### 디자인 방향

```text
카드형 시나리오 버튼
선택/적용 중 상태 명확히 표시
Overall용 시나리오가 먼저 보이도록 유지
```

### 추천 UI

```text
Quick Scenario

[Overall Release Demo]
전체 QA 결과, RC 진행 현황, Remaining Issue, AI Summary를 한 번에 확인합니다.

[Community Mission Event]
단일 Feature QA 결과를 확인합니다.

[알림 우선순위 정책 개선]
Sub Feature QA 결과를 확인합니다.
```

실제 시나리오 이름은 현재 코드에 있는 preset 이름을 그대로 사용한다.

---

## 4-4. Step 1. Basic Info

### 현재 사용 컴포넌트

```text
ReportBasicInfoForm
```

### 포함 항목

```text
Report Title
Version
RC Version
```

### 목표

단순 입력 폼이 아니라 “리포트 메타 정보” 카드처럼 보이게 한다.

### 추천 제목

```text
Step 1
Report Info
```

### 설명 문구

```text
생성할 QA Report의 제목과 대상 버전을 설정합니다.
Quick Scenario를 사용하면 자동으로 채워집니다.
```

### 구현 방향

기존 `ReportBasicInfoForm`의 기능은 그대로 유지하고, 카드 래퍼만 새로 적용한다.

---

## 4-5. Step 2. Sheet 연결

### 현재 사용 컴포넌트

```text
TestSheetInputList
JiraIssueSheetInput
SpreadsheetPreview
```

### 포함 항목

```text
Test Sheet URL
선택된 Sheet Tab
Jira Issue Sheet URL
자동 연결된 Jira Sheet 정보
Spreadsheet Preview
```

### 목표

지금은 Sheet 입력이 다소 기술적으로 보일 수 있으므로, “데이터 소스 연결”이라는 느낌으로 정리한다.

### 추천 제목

```text
Step 2
Data Source
```

### 설명 문구

```text
QA Test Case Sheet와 Jira Issue Sheet를 연결합니다.
선택된 Sheet 기준으로 QA Summary와 Jira Summary가 생성됩니다.
```

### 디자인 방향

```text
Test Sheet 영역
Jira Sheet 영역
연결 상태 표시
Preview는 접히거나 보조 영역으로 배치
```

### 연결 상태 예시

```text
Connected
Not connected
Auto linked
```

단, 새 상태 로직을 크게 만들 필요는 없다. 현재 값이 있으면 단순히 표시만 해도 충분하다.

```text
Test Sheet URL 존재 → Connected
Jira Sheet URL 존재 → Connected
autoLinkedJiraSheet 존재 → Auto linked
```

---

## 4-6. Step 3. 분석 범위

### 현재 사용 컴포넌트

```text
JiraPeriodInput
```

### 포함 항목

```text
Jira Analysis Start Date
Start Hour
Start Minute
Jira Analysis End Date
End Hour
End Minute
```

### 목표

기간 입력이 복잡하게 보이지 않도록 “분석 기간 설정” 카드로 묶는다.

### 추천 제목

```text
Step 3
Analysis Period
```

### 설명 문구

```text
Jira Issue를 분석할 기간을 설정합니다.
Overall Report는 기간 기준으로 전체 이슈 흐름을 집계합니다.
```

### 주의점

현재 프로젝트에서는 Jira 기간 필터가 Generate 과정에서 중요한 기준으로 사용된다. Generate 로직에서는 Test Sheet와 Jira Sheet URL 검증 후 기간과 Label 기준으로 Jira Issue를 필터링한다. 

따라서 UI만 바꾸고, 필터링 로직은 수정하지 않는다.

---

## 4-7. Step 4. Jira Filter

### 현재 사용 컴포넌트

```text
JiraLabelInputList
```

### 포함 항목

```text
Jira Label
Label Match Mode
```

### 목표

Feature와 Overall의 Label 사용 차이를 사용자가 이해할 수 있게 한다.

### 추천 제목

```text
Step 4
Jira Filter
```

### 설명 문구

Feature Report:

```text
Feature Report는 Label 기준으로 특정 기능의 Jira Issue를 필터링합니다.
```

Overall Report:

```text
Overall Report는 기본적으로 기간 기준으로 Jira Issue를 분석하며, Label은 필요 시 보조 필터로 사용할 수 있습니다.
```

### 주의점

현재 코드에서 Feature와 Overall은 Label 적용 방식이 다르게 안내되고 있다. 기존 동작을 유지하면서 문구만 더 명확히 정리한다.

---

## 4-8. Step 5. Generate

### 현재 사용 컴포넌트

```text
ReportGenerateAction
MessagePanel
```

### 목표

Generate 버튼을 단순 실행 버튼이 아니라 “최종 리포트 생성 CTA”처럼 보이게 한다.

### 추천 제목

```text
Step 5
Generate QA Report
```

### CTA 문구

기존 버튼 문구가 너무 기술적이면 아래처럼 변경 가능하다.

```text
Generate QA Report
```

또는

```text
Create QA Report
```

포트폴리오용으로는 `Generate QA Report`가 더 좋다.

### 입력 요약 카드 추가

1번 시안에서 가져올 요소로, Generate 영역 옆이나 아래에 입력 요약 카드를 둔다.

표시 항목:

```text
Report Type
Report Title
Version / RC
Test Sheet count
Jira Sheet 연결 여부
Analysis Period
Label count
```

이 요약 카드는 새 데이터 계산이 아니라 현재 state에서 표시만 한다.

---

## 5. 신규 컴포넌트 제안

기존 컴포넌트를 직접 모두 뜯어고치기보다, **레이아웃용 래퍼 컴포넌트**를 몇 개 추가하는 방식이 안전하다.

### 5-1. `InputHeroSection.tsx`

위치:

```text
components/report/InputHeroSection.tsx
```

역할:

```text
상단 Hero / Intro 표시
서비스 설명
간단한 Report Flow 안내
```

---

### 5-2. `InputStepCard.tsx`

위치:

```text
components/report/InputStepCard.tsx
```

역할:

```text
각 Step 섹션 공통 카드 래퍼
Step 번호
제목
설명
children 표시
```

예상 props:

```ts
type InputStepCardProps = {
  step: string;
  title: string;
  description?: string;
  children: React.ReactNode;
};
```

---

### 5-3. `InputSummaryCard.tsx`

위치:

```text
components/report/InputSummaryCard.tsx
```

역할:

```text
Generate 전 입력 요약 표시
```

표시 정보:

```text
Report Type
Title
Version / RC
Test Sheet count
Jira Sheet status
Period
Labels
```

---

### 5-4. 선택: `InputStepRail.tsx`

위치:

```text
components/report/InputStepRail.tsx
```

역할:

```text
왼쪽 Step Navigation 느낌의 보조 영역
```

단, 이건 v1에서 필수는 아니다. 구현 부담이 크면 생략하고, Step Card만으로도 충분하다.

---

## 6. 수정 대상 파일

### 우선 수정 대상

```text
components/report/ReportInputPanel.tsx
components/report/ReportTypeSelector.tsx
components/report/QuickScenarioSelector.tsx
components/report/ReportGenerateAction.tsx
```

### 신규 생성 후보

```text
components/report/InputHeroSection.tsx
components/report/InputStepCard.tsx
components/report/InputSummaryCard.tsx
```

### 필요 시 수정

```text
components/layout/ReportAssistantPageView.tsx
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

단, `hooks/useResultSheetAction.ts`는 Result Sheet 생성용이므로 이번 Input 개편에서는 건드리지 않는다.

---

## 7. 레이아웃 설계

## Desktop

권장 구조:

```text
전체 페이지 max-width: 1180~1280px

상단:
Hero Section

본문:
왼쪽 또는 상단 Step 흐름
오른쪽/아래 Input Cards
```

가장 현실적인 v1 구조:

```text
Hero

Report Type Card

Quick Scenario Card

2-column area:
- Main column: Step Cards
- Side column: Input Summary / Help Card
```

단, 구현을 단순화하려면 1-column 카드 구조로 시작해도 된다.

```text
Hero
Report Type
Quick Scenario
Step 1
Step 2
Step 3
Step 4
Step 5
```

이것만 해도 현재 통짜 입력폼보다 훨씬 좋아진다.

## Mobile

모바일에서는 무조건 single column.

```text
Hero
Report Type
Quick Scenario
Step Cards
Generate
```

---

## 8. UI 톤

디자인 방향은 라이트 기반 SaaS Dashboard다.

### 배경

```text
밝은 gray
예: bg-slate-50 / bg-zinc-50
```

### 카드

```text
white
border
soft shadow
rounded-2xl or rounded-3xl
```

### 텍스트

```text
title: slate-950 / zinc-950
body: slate-600 / zinc-600
muted: slate-400 / zinc-400
```

### Primary

```text
blue / indigo 계열
```

### 상태 색상

```text
Pass / 안정 = green
Fail / 위험 = red
Blocked / 주의 = orange
Next Event = blue 또는 indigo
N/A = gray
```

QA 상태 정의는 데이터셋 지침의 상태 정의를 따라야 한다. 특히 `Blocked`는 Fail과 다르게 기존 Remaining 영향으로 QA 진행이 불가능한 상태이고, `Next Event`는 현재 릴리즈 실패가 아니라 차기 업데이트 또는 후속 일정에서 확인 예정인 상태다. 

---

## 9. 동작 기준

이번 작업에서 동작은 기존과 동일해야 한다.

### 유지해야 하는 동작

```text
Report Type 변경 시 입력값 초기화
Quick Scenario 적용 시 입력값 자동 세팅
Test Sheet URL 입력 및 metadata 로딩
Sheet tab 선택
Jira Sheet 자동 연결
기간 입력
Label 입력
Generate 실행
Validation 메시지 표시
Generate 후 결과 영역 이동
```

현재 코드에는 Report Type 변경 시 입력값과 결과 상태를 reset하는 흐름이 있고, Quick Scenario 적용 시 Report Title, Version, RC, Test Sheet, Jira 기간, Label 등을 세팅하는 흐름이 있다. 

따라서 새 UI에서도 이 동작을 절대 깨면 안 된다.

---

## 10. 구현 순서 제안

## Phase 1. 디자인 기준 파일 커밋

현재 추가한 파일:

```text
docs/design/Input 최종 시안.png
docs/design/Report 최종 시안.png
docs/design/디자인-결정-메모.txt
```

먼저 별도 커밋으로 남기는 것을 추천한다.

```bash
git add docs
git commit -m "Add UI design references"
```

---

## Phase 2. Input 레이아웃 래퍼 추가

신규 파일:

```text
InputHeroSection.tsx
InputStepCard.tsx
InputSummaryCard.tsx
```

이 단계에서는 기존 기능을 건드리지 않고, UI 래퍼만 만든다.

---

## Phase 3. ReportInputPanel 재배치

`ReportInputPanel` 내부에서 기존 컴포넌트를 새 순서로 배치한다.

기존:

```text
Report Type
Quick Scenario
Basic Info
Sheets
Period
Labels
Generate
```

개선:

```text
Hero
Report Type Card
Quick Scenario Card
Step 1 Report Info
Step 2 Data Source
Step 3 Analysis Period
Step 4 Jira Filter
Step 5 Generate + Input Summary
```

---

## Phase 4. 개별 컴포넌트 스타일 정리

대상:

```text
ReportTypeSelector
QuickScenarioSelector
ReportGenerateAction
```

이 단계에서는 컴포넌트 기능은 유지하고, 카드형 / 라이트 테마 스타일로 정리한다.

---

## Phase 5. 브라우저 확인

확인 항목:

```text
첫 진입 시 Overall Report 기본 선택 유지
Overall Quick Scenario 노출
Quick Scenario 적용 시 입력값 정상 세팅
Feature Report 전환 시 기존 Feature 흐름 유지
Test Sheet 선택 정상
Jira Sheet 자동 연결 정상
Generate 정상
Validation 메시지 정상
```

---

## 11. 수동 테스트 체크리스트

```text
1. 앱 첫 진입
- Overall Report가 기본 선택되어 있는지 확인
- 화면이 라이트 테마로 보이는지 확인
- Quick Scenario가 상단에서 잘 보이는지 확인

2. Overall Quick Scenario
- 시나리오 적용
- Test Sheet / Jira Sheet / 기간 / Label 자동 세팅 확인
- Generate 실행
- Overall 결과 생성 확인

3. Feature 전환
- Feature Report 선택
- 기존 입력값 reset 확인
- Feature Quick Scenario 노출 확인
- Feature Generate 정상 확인

4. Sheet 연결
- Test Sheet 추가 / 삭제
- Sheet tab 선택
- Jira Sheet 자동 연결
- Spreadsheet Preview 표시 확인

5. Validation
- 필수값 누락 시 메시지 표시 확인
- 잘못된 URL 입력 시 메시지 표시 확인

6. 회귀 확인
- AI Analysis 버튼 기존 동작 유지
- Result Sheet 생성 버튼 기존 동작 유지
```

---

## 12. Codex 작업 시 주의 문구

나중에 Codex에 요청할 때는 아래 조건을 반드시 포함하는 게 좋다.

```text
이번 작업은 Input 화면 UI 개편입니다.

Google Sheet route는 수정하지 않습니다.
AI Analysis prompt는 수정하지 않습니다.
Generate 데이터 처리 로직은 수정하지 않습니다.
API route는 수정하지 않습니다.

현재 components/report에 분리되어 있는 입력 컴포넌트를 재사용해서
Input 최종 시안의 Step 기반 Dashboard 구조로 재배치합니다.

기능 변경이 아니라 레이아웃/가독성/포트폴리오 완성도 개선 작업입니다.
```

---

## 13. v1 최종 목표

이번 Input 개편이 완료되면 첫 화면 인상이 아래처럼 바뀌어야 한다.

### 현재 인상

```text
개발자가 만든 설정 폼
Google Sheet URL 입력 도구
```

### 목표 인상

```text
QA Release Report를 생성하는 SaaS Dashboard
포트폴리오 첫 화면으로 보여도 어색하지 않은 제품형 UI
Overall QA Report 데모를 바로 실행할 수 있는 구조
```

---

## 14. 다음 단계

이 설계서 기준으로 다음에 할 일은 둘 중 하나야.

```text
1. 이 설계서를 docs/design/input-implementation-plan-v1.md로 저장
2. 바로 Codex 요청서로 변환
```

