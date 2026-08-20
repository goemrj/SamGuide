# Handoff: 본인부담금 규칙2 (SamGuide) — 가독성 개선

## Overview
SamGuide(심사청구 점검 참고자료) 내부 도구의 **② 본인부담금 규칙2** 화면을 가독성 중심으로 재정리한 디자인입니다.
심평원 「본인부담기준 안내 — 본인부담률 및 부담액」 표를 그대로 옮긴 참조 화면이며, 넓은 데스크톱(1920+)에서
한 화면에 최대한 많은 정보를 스캔할 수 있는 것이 최우선 요구사항입니다.

기존 화면 대비 바뀐 점은 다음 5가지입니다.

1. **필터 위계** — 상단 대분류(건강보험 / 의료급여)는 세그먼트 컨트롤, 하위 소분류(입원진료시 / 외래진료시 /
   차상위 본인부담경감대상자 / 기타)는 pill 칩으로 시각적 위계를 분리. 라벨 텍스트("대분류/소분류")와
   각 항목 뒤 건수 숫자는 노출하지 않음.
2. **스크롤 고정 없음** — 제목 · 필터 · 검색 툴바와 표 헤더는 페이지와 함께 스크롤됩니다(sticky 미사용).
   좌측 사이드바만 `position:sticky; top:0`으로 화면에 유지됩니다.
3. **표 레이아웃** — 열을 균등 분배(퍼센트 고정)하지 않고 내용 폭에 맞춰 좌측정렬, 열 사이 여백을 크게(44px, 첫 표는 64px).
   열 구분선 없음, 행 구분선은 1px 헤어라인.
4. **비고 열 정리** — 원본에서 한 문단으로 흐르던 긴 비고 텍스트를 `제외대상` / `확대 ’20.1.1.~` 라벨 칩 + 본문
   두 줄로 분리. 비고가 없는 행은 완전히 비움(placeholder 문자 없음).
5. **근거 열 제거** — 원본의 `근거`(시행령 조항) 열은 화면에서 제거.

## About the Design Files
이 폴더의 HTML 파일은 **디자인 레퍼런스**입니다. 의도한 레이아웃 · 타이포그래피 · 색 · 인터랙션을 보여주는
프로토타입이며, 그대로 배포할 프로덕션 코드가 아닙니다. 실제 구현은 대상 코드베이스(React/Vue/기존 SamGuide
프론트엔드 등)의 기존 컴포넌트 · 스타일 관례에 맞게 **재구현**해야 합니다. 대상 환경이 아직 없다면 프로젝트에
적합한 프레임워크를 선택해 구현하십시오.

파일은 이 워크스페이스의 Design Component 형식(`.dc.html`)입니다. `<x-dc>` 안의 마크업과 하단
`class Component extends DCLogic` 로직만 참고하면 되고, 런타임(`support.js`)은 이식 대상이 아닙니다.

## Fidelity
**High-fidelity.** 색 · 타입 · 여백 · 상태가 모두 확정된 값입니다. 아래 토큰과 수치를 그대로 사용해
픽셀 단위로 재현하되, 컴포넌트 구현은 대상 코드베이스의 기존 라이브러리를 사용하십시오.
데이터는 정적 하드코딩 상태이며, 실제 구현에서는 기존 데이터 소스에 연결해야 합니다.

## Screens / Views

### Screen: 본인부담금 규칙2
- **Purpose**: 심사 담당자가 입원/외래 등 구분별 본인부담률을 사내 엑셀(① 화면)과 대조하며 확인.
- **Layout**: 최상위 `display:flex`, 높이 `100vh`.
  - **좌측 사이드바** — `width:210px; flex:0 0 210px`, 배경 `#FFFFFF`, 우측 경계선 `1px solid #E5E7EB`,
    `position:sticky; top:0; height:100vh`, 내부 `display:flex; flex-direction:column`.
  - **본문 영역** — `flex:1; min-width:0`. 페이지 자체가 스크롤되며 별도 스크롤 컨테이너는 없습니다.
    - 툴바: 배경 `#FFFFFF`, 하단 경계선 `1px solid #E5E7EB`, `padding:12px 24px 10px` (sticky 아님).
    - 콘텐츠: `padding:16px 24px 48px; display:flex; flex-direction:column; gap:16px`.
      카드에는 `flex:0 0 auto`를 지정합니다(컬럼 flex 컨테이너에서 축소 방지).

#### Component: 사이드바 브랜드 락업
- 아이콘: 30×30, `border-radius:5px`, 배경 `#2563EB`, 흰색 `S`, 15px/700.
- 제목 `SamGuide` 17px/700, `letter-spacing:-0.01em`, `#111827`.
- 부제 `심사청구 점검 참고자료` 12px, `#6B7280`.
- 컨테이너 `padding:14px 14px 12px`, 하단 경계선 `1px solid #F3F4F6`.

#### Component: 사이드바 내비게이션
- 항목: `display:flex; gap:8px; align-items:center; padding:7px 12px; border-radius:5px; font-size:15px;
  color:#4B5563`, 앞에 원문자(①–⑧) 11px `#9CA3AF`.
- Hover: 배경 `#F9FAFB`, 텍스트 `#111827`.
- 활성(② 본인부담금 규칙2): 배경 `#EFF6FF`, 텍스트 `#2563EB`, `font-weight:600`,
  `box-shadow: inset 2px 0 0 #2563EB`.
- 항목 순서: ① 본인부담금 규칙 / ② 본인부담금 규칙2 / ③ 본인부담금 계산기 / ④ SAM 파일 레이아웃 /
  ⑤ 항 · 목 코드 / ⑥ 특정내역 / ⑦ 산정특례 특정기호 / ⑧ 메모장.
- 하단 고정 문구(`margin-top:auto`, `padding:12px 14px`, 상단 경계선 `1px solid #F3F4F6`, 12px, `#6B7280`,
  `line-height:1.6`): "브라우저 안에서만 동작하고 외부로 아무것도 보내지 않습니다. 메모는 이 PC 브라우저에 저장됩니다."

#### Component: 툴바 1행 (제목)
- `display:flex; align-items:center; gap:14px; flex-wrap:wrap`.
- H1 `본인부담금 규칙2` — 24px/700, `letter-spacing:-0.02em`, `#111827`.
- 설명 13.5px, `#6B7280`, `line-height:1.45`, `max-width:70ch`:
  "심평원 「본인부담기준 안내 — 본인부담률 및 부담액」을 그대로 옮긴 표입니다. ①(사내 엑셀)과 대조용."
- 우측(`margin-left:auto`) 13px `#6B7280`: "출처 **심평원 건강보험**(`#2563EB`, 700) · 2026.06.23. 수정".

#### Component: 툴바 2행 (필터 + 검색)
- 래퍼 `display:flex; align-items:center; gap:10px; margin-top:10px; flex-wrap:wrap`.
- **세그먼트(대분류)**: 컨테이너 `display:flex; gap:4px; padding:3px; background:#F3F4F6; border-radius:6px`.
  - 선택: `padding:5px 16px; border-radius:4px; background:#2563EB; color:#fff; font-size:14px; font-weight:600`.
  - 비선택: 배경 transparent, `color:#4B5563; font-weight:500`; hover `color:#111827`.
  - 항목: 건강보험(선택), 의료급여.
- 구분선: `width:1px; height:20px; background:#E5E7EB; margin:0 4px`.
- **칩(소분류)**: `display:inline-flex; align-items:center; gap:6px; padding:5px 13px; border-radius:999px;
  border:1px solid #E5E7EB; background:#fff; color:#4B5563; font-size:14px; font-weight:500`.
  - Hover: `border-color:#D1D5DB; color:#111827`.
  - 선택: `border-color:#2563EB; background:#EFF6FF; color:#2563EB; font-weight:600`.
  - 항목: 입원진료시(선택), 외래진료시, 차상위 본인부담경감대상자, 기타.
- **검색**: `margin-left:auto`, `height:34px; padding:0 12px; border:1px solid #D1D5DB; border-radius:5px;
  background:#fff; min-width:320px`, 내부 `display:flex; align-items:center; gap:8px`.
  - 아이콘: 15×15 돋보기(stroke 2, `#9CA3AF`) — Lucide `search` 등가.
  - 입력: 14px, `color:#111827`, placeholder "대상 · 코드 · 부담률 검색 (예: M003, 자연분만, 무료, CT)".

#### Component: 표 카드 (공통)
- `flex:0 0 auto; background:#FFFFFF; border:1px solid #E5E7EB; border-radius:6px;
  box-shadow:0 1px 2px rgba(14,26,44,0.06)`. `overflow:hidden`은 사용하지 않습니다.
- 카드 헤더: `display:flex; align-items:center; gap:10px; padding:10px 14px; border-bottom:1px solid #E5E7EB`.
  - H2 17px/700, `letter-spacing:-0.01em`, `#111827`.
- 표: `border-collapse:collapse; width:auto`(균등 분배 금지, 내용 폭 기준 좌측정렬).
  - `th`: 좌측정렬, 13px/600, `color:#6B7280`, 배경 `#FFFFFF`, `padding:8px 44px 8px 0`,
    `border-bottom:1px solid #E5E7EB`, `white-space:nowrap` (고정 없음).
  - `td`: `font-size:14px; line-height:1.5; color:#374151; padding:8px 44px 8px 0`,
    `border-bottom:1px solid #F3F4F6; vertical-align:top; text-align:left`.
  - 첫 열: `padding-left:18px`.
  - 행 hover: 배경 `#F9FAFB`.
  - 그룹 셀(`.grp`, rowSpan): 배경 `#FFFFFF`, 14px/700, `#111827`, `white-space:nowrap`.
  - 밀도 옵션(아래 State 참고)은 `--sg-fs`(글자 크기) / `--sg-pad`(세로 패딩)로 제어.

#### Screen block 1: 건강보험 입원 본인부담률
- 카드 헤더 우측(`margin-left:auto`) 보조 문구 12.5px `#9CA3AF`:
  "식대총액 · 끝수계산은 전 구분 공통 (장기 적출 제외)".
- 이 표만 여백 확대(클래스 `roomy`): `th/td padding-right:64px`, 첫 열 `padding-left:32px`,
  마지막 열 `padding-right:32px`.
- 열: 구분 / 요양급여비용총액 / 식대총액 / 끝수계산.
- 행(8):
  | 구분 | 요양급여비용총액 | 식대총액 | 끝수계산 |
  |---|---|---|---|
  | 일반환자 | 총액의 20% | 식대총액의 50% | 10원 미만 절사 |
  | 15세 이하 (2세 미만 영유아 제외) | 총액의 5% | 식대총액의 50% | 10원 미만 절사 |
  | 2세 미만 영유아 | 면제 | 식대총액의 50% | 10원 미만 절사 |
  | 자연분만 | (원본 공란) | 식대총액의 50% | 10원 미만 절사 |
  | 고위험 임신부 | 총액의 10% | 식대총액의 50% | 10원 미만 절사 |
  | 제왕절개분만 | 면제 | 식대총액의 50% | 10원 미만 절사 |
  | 선택입원군 (요양병원 해당) | 총액의 40% | 식대총액의 50% | 10원 미만 절사 |
  | 장기 등 기증자의 장기등 적출 | 면제 | 면제 주2) | 10원 미만 절사 |
- 구분 셀은 `font-weight:600 / #111827`, 괄호 보조 설명은 `font-weight:400 / 14px / #6B7280`.
- 부담률(`.rate`)은 `color:#374151; font-weight:500; font-variant-numeric:tabular-nums`(강조색 없음).
- "주2)"는 카드 하단 각주로 링크(`#note2`, 12.5px, `#2563EB`).
- 각주 행: `padding:8px 14px; background:#F9FAFB; border-top:1px solid #E5E7EB;
  border-radius:0 0 5px 5px; font-size:12.5px; color:#6B7280` —
  "**주2)** 관련근거: 보건복지부 고시 제2017-118호(2017.6.30.)".

#### Screen block 2: 주1) 본인부담률을 달리 운영하고 있는 특정 항목 및 본인부담률
- H2 앞머리 "주1)"은 `#9CA3AF`, `margin-right:6px`.
- 열: 구분 / 항목 / 본인부담률 / 비고 (원본의 `근거` 열은 제거).
- `구분`은 rowSpan 그룹 셀 2개: **일반환자 해당 항목**(5행, `일반환자<br>해당 항목`),
  **공통 적용 항목**(10행, `공통<br>적용 항목`).
- 행(15):
  | 구분 | 항목 | 본인부담률 | 비고 |
  |---|---|---|---|
  | 일반환자 해당 항목 | 특수장비 | S항 산정비용 × 외래 본인부담률 | |
  | | 격리입원료 | 해당 비용의 10% | |
  | | 16일 이상 입원료 본인부담률 차등 | 16~30일 5% 상향 / 31일~ 10% 상향 (두 줄) | 아래 비고 블록 참조 |
  | | 16세 이상 18세 이하 아동의 치아홈메우기 | 해당 비용의 10% | |
  | | 상급종합병원 4인실 입원료 | 해당 비용의 30% | |
  | 공통 적용 항목 | 선별급여 항목 | 해당 비용의 30 · 50(60) · 80 · 90% | |
  | | 2 · 3인실 입원료 — 상급종합병원 (’18.7.1.~) | 2인실 50% / 3인실 40% | |
  | | 2 · 3인실 입원료 — 종합병원 (’18.7.1.~) | 2인실 40% / 3인실 30% | |
  | | 2 · 3인실 입원료 — 병원 · 한방병원 (’19.7.1.~) | 2인실 40% / 3인실 30% | |
  | | 2 · 3인실 입원료 — 요양병원 중 의료재활시설, 정신병원 (’19.7.1.~’19.10.31.) | 2 · 3인실: 시행령 별표2에 따른 본인부담률 | |
  | | 2 · 3인실 입원료 — 요양병원 중 의료재활시설, 정신병원 (’19.11.1.~) | 2인실 40% / 3인실 30% | |
  | | 한방 추나요법 | 해당 비용의 50% 또는 80% | |
  | | 원격협의진찰료 자문료 | 해당 비용의 0% | |
  | | 상급종합병원 회송료 | 해당 비용의 0% | |
  | | 코로나 치료제 | 경구제 5% / 주사제 1.6% | |
- 항목 셀의 시행 시기 괄호는 `font-weight:400; color:#6B7280`.
- **비고 블록(16일 이상 입원료 행)** — 셀 `font-size:13px; color:#4B5563; line-height:1.6`,
  두 줄 각각 `display:flex; gap:6px`(둘째 줄 `margin-top:4px`), 라벨 칩(`.noteTag`)은
  `display:inline-block; min-width:64px; font-size:12px; font-weight:700; color:#2563EB;
  background:#EFF6FF; border-radius:3px; padding:1px 6px; margin-right:6px`.
  - `제외대상` — 장기입원 불가피 환자(F014), 보훈, 산정특례 및 차상위 등 본인부담경감환자
  - `확대 ’20.1.1.~` — 4인실 이상 입원료(상급종합병원 5인실 이상) → 병원급 이상 2인실 이상 입원료(치과병원 · 요양병원 · 정신병원 제외)
- 비고가 없는 행은 빈 셀(대시나 placeholder 없음).

## Interactions & Behavior
- 대분류 세그먼트 / 소분류 칩 / 검색 입력은 현재 **시각 상태만** 구현됨. 실제 구현 시:
  - 대분류 전환 → 데이터 세트 교체(건강보험 ↔ 의료급여), 소분류 선택 초기화.
  - 소분류 전환 → 표 목록 교체.
  - 검색 → 대상 · 코드 · 부담률 텍스트에 대해 필터 또는 하이라이트(요청 시 하이라이트 방식 협의 필요).
- 스크롤: 페이지 전체가 스크롤되며 고정(sticky) 요소는 좌측 사이드바뿐입니다.
- Hover: 표 행 `#F9FAFB`, 내비 항목 `#F9FAFB`, 칩 `border-color:#D1D5DB`.
- 애니메이션 없음(기능적 상태 변화만).
- 반응형: 1920+ 데스크톱 기준. 폭이 좁아지면 표는 페이지 가로 스크롤로 처리(열 축소·줄바꿈 금지).
- 한국어 줄바꿈: `word-break: keep-all` 전역 적용.

## State Management
- `activeMajor`: "건강보험" | "의료급여" (기본 "건강보험")
- `activeMinor`: "입원진료시" | "외래진료시" | "차상위 본인부담경감대상자" | "기타" (기본 "입원진료시")
- `query`: 검색 문자열
- 표시 옵션(프로토타입에서는 Tweaks 프롭, 실제 구현에서는 사용자 설정 또는 상수로 처리):
  - `density`: "촘촘하게"(13.5px / 5px, **기본값**) | "보통"(14px / 8px) | "여유 있게"(15px / 12px)
    → CSS 변수 `--sg-fs`, `--sg-pad`
  - `zebra`: 홀짝 행 배경(`--sg-zebra`, on `#FBFCFE` / off `#FFFFFF`) — **기본값 off**
  - `columnLines`: 열 구분선(`--sg-vline`, on `#F3F4F6` / off `transparent`) — 현재 표에는 미적용
- 데이터 페칭: 없음(정적). 실제로는 규칙 테이블을 서버/로컬 JSON에서 로드.

## Design Tokens
**Colors**
| 용도 | 값 |
|---|---|
| Accent (선택·링크·강조) | `#2563EB` |
| Accent 배경 tint | `#EFF6FF` |
| Accent 보조(칩 카운트) | `#93C5FD` |
| 텍스트 강 | `#111827` |
| 텍스트 본문 | `#374151` |
| 텍스트 보조 | `#4B5563` |
| 텍스트 캡션 | `#6B7280` |
| 텍스트 흐림 | `#9CA3AF` |
| 경계선 강 | `#D1D5DB` |
| 경계선 | `#E5E7EB` |
| 헤어라인 / 트랙 | `#F3F4F6` |
| 배경 alt / hover | `#F9FAFB` |
| 페이지 배경 | `#F3F4F6` |
| 카드 배경 | `#FFFFFF` |
| Zebra(옵션) | `#FBFCFE` |

**Typography** — Pretendard(웹폰트), fallback `-apple-system, "Apple SD Gothic Neo", "Noto Sans KR", system-ui, sans-serif`
| 역할 | 크기/굵기 |
|---|---|
| H1 | 24px / 700 / `-0.02em` |
| 카드 H2 | 17px / 700 / `-0.01em` |
| 사이드바 브랜드 | 17px / 700 |
| 내비 항목 | 15px / 400 (활성 600) |
| 표 셀 | 14px / 400 (구분 600) / `line-height:1.5` |
| 칩 · 세그먼트 · 검색 | 14px / 500 (선택 600) |
| 표 헤더 | 13px / 600 |
| 설명 텍스트 | 13.5px |
| 비고 본문 | 13px / `line-height:1.6` |
| 각주 · 보조 | 12.5px |
| 라벨 칩 · 캡션 | 12px / 700 |
| 원문자 번호 | 11px |
- 숫자는 `font-variant-numeric: tabular-nums`.

**Spacing** — 4px 배수. 주요 값: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 24 / 32 / 44 / 64px.
**Radius** — 3px(라벨 칩) / 4px(세그먼트 버튼) / 5px(입력 · 내비 항목 · 아이콘) / 6px(카드 · 세그먼트 트랙) / 999px(칩).
**Shadow** — 카드 `0 1px 2px rgba(14,26,44,0.06)`.
**Sizes** — 사이드바 210px, 검색 높이 34px / min-width 320px, 브랜드 아이콘 30px, 검색 아이콘 15px.

## Assets
- 이미지 없음. 돋보기 아이콘은 인라인 SVG(원 + 선, stroke 2) — Lucide `search`로 대체 가능.
- 폰트: Pretendard (CDN). 로고는 텍스트 락업 + 파란 사각형 `S`(실 로고 있으면 교체).

## Files
- `본인부담금 규칙2.dc.html` — 최종 디자인(Design Component: `<x-dc>` 마크업 + 하단 로직 클래스).
- `screens/original-before.png`, `screens/original-before-2.png` — 개선 전 원본 화면 캡처.
- `screens/theme-reference.png` — 기존 색 테마 참조 캡처.
