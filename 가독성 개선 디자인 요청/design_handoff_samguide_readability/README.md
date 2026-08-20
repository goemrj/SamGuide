# Handoff: SamGuide 가독성 개선 리디자인

## Overview

SamGuide(심사청구 점검 참고자료)의 **본인부담금 규칙** 화면 리디자인입니다.
기존 화면은 4열 테이블(구분 / 항목 / 본인부담 / 비고)에 텍스트만 나열되어 있어, 계산식이 눈에 들어오지 않고 비고가 화면 오른쪽 끝에 흐리게 떨어져 있었습니다.

이번 리디자인이 해결하는 것:

1. 구분(병원 종별) 셀 병합 → **sticky 섹션 헤더**로 대체. 스크롤 중에도 현재 종별이 유지됩니다.
2. 비고 열 삭제 → 비고를 **해당 행 안쪽, 계산식 바로 아래**로 이동.
3. 계산식의 **퍼센트 값만 액센트 블루 + semibold**로 강조. tabular-nums 적용.
4. 코드(F003, MT051 등)를 항목명에서 분리해 **모노스페이스 배지**로 표기.
5. 색 테마 전체를 **SAM 파일 편집기와 동일한 팔레트**로 통일.
6. 구분·항목·계산식·비고 전체를 대상으로 하는 검색.

대상 파일: 사용자 로컬의 `D:\Documents\Desktop\SamGuide\index.html`.

## About the Design Files

이 번들의 `SamGuide.dc.html`은 **디자인 레퍼런스**입니다. 의도한 모양과 동작을 보여주는 프로토타입이며, 그대로 복사해 넣을 프로덕션 코드가 아닙니다.

SamGuide는 현재 단일 정적 `index.html`(바닐라 HTML/CSS/JS, 로컬 전용, 외부 전송 없음)로 되어 있습니다. **기존 구조와 데이터를 유지한 채 위의 마크업/스타일 변경만 반영**하세요. 프레임워크를 도입하거나 파일을 분리할 필요는 없습니다.

특히 다음은 절대 바꾸지 마세요:

- 원본 데이터(항목명, 계산식 문자열, 비고 문구, 코드) — **일자일획 그대로**. 심사 기준 문서입니다.
- 로컬 전용 동작, localStorage 메모 저장.
- 사이드바 7개 메뉴 구성과 순서.

## Fidelity

**High-fidelity.** 아래 색·타이포·간격 값을 그대로 쓰세요.

---

## Design Tokens

SAM 파일 편집기 스크린샷에서 직접 샘플링한 팔레트입니다.

### Color

| 역할 | Hex | 사용처 |
|---|---|---|
| Page background | `#EFF2F6` | 문서 배경 |
| Surface | `#FFFFFF` | 사이드바, 상단 바, 카드 |
| Hairline | `#E3E8EF` | 모든 1px 경계선 |
| Row divider | `#EEF1F6` | 표 행 구분선 (hairline보다 한 단계 옅음) |
| Ink | `#16233C` | 제목, 항목명, 강조 숫자 아닌 본문 |
| Body | `#3E4C63` | 계산식 본문, 비활성 탭 라벨 |
| Muted | `#8593A9` | 컬럼 헤더, 카운트, 출처, 서브헤드 |
| Note text | `#6B7A91` | 비고 본문 |
| Note label | `#A0ACBE` | "비고" 라벨 |
| Accent | `#2F6BDE` | 활성 탭 배경, 코드 배지 텍스트, 퍼센트 값, 링크, 로고 마크 |
| Accent hover | `#1F51B0` | 링크 hover |
| Accent tint | `#EAF1FF` | 활성 사이드바 항목, 코드 배지 배경, 절사 배지 |
| Group tint | `#F5F8FD` | 구분(병원 종별) 섹션 헤더 배경 |
| Row hover | `#F7F9FD` | 표 행 hover |
| Sidebar hover | `#F5F8FD` | 비활성 메뉴 hover |
| Focus ring | `rgba(47,107,222,0.16)` | 입력 focus, 3px |

**팔레트는 이 목록이 전부입니다.** 새 색상을 추가하지 마세요. 남색(#002F6C), 웜 그레이, 앰버 계열은 이전 시안에서 폐기된 색이므로 쓰지 않습니다.

### Typography

- Family: `'Pretendard','Pretendard Variable', system-ui, sans-serif`
- 코드 배지만: `'JetBrains Mono', ui-monospace, monospace`
- `-webkit-font-smoothing: antialiased`

| 요소 | Size | Weight | 비고 |
|---|---|---|---|
| 페이지 제목 | 26px | 700 | `letter-spacing:-0.02em` |
| 페이지 서브헤드 | 13px | 400 | muted |
| 사이드바 로고 | 16px | 700 | `letter-spacing:-0.01em` |
| 사이드바 태그라인 | 11.5px | 400 | muted |
| 사이드바 메뉴 | 13.5px | 400 / 활성 600 | |
| 탭 | 13.5px | 500 / 활성 700 | |
| 탭 카운트 | 11.5px | 400 | muted, tabular-nums |
| 검색 입력 | 13.5px | 400 | |
| 카드 제목 | 15px | 600 | |
| 절사 배지 | 11.5px | 600 | accent on tint |
| 출처 | 11.5px | 400 | muted |
| 컬럼 헤더 | 11.5px | 700 | `letter-spacing:0.04em`, muted |
| 구분 헤더 | 13px | 600 | `letter-spacing:-0.01em`, ink |
| 항목명 | 13.5px | 500 | ink, `line-height:1.45` |
| 코드 배지 | 10.5px | 600 | mono, `letter-spacing:0.02em` |
| 계산식 | 13.5px | 400 | body, `line-height:1.5`, tabular-nums |
| 계산식 퍼센트 | 13.5px | 600 | **accent** |
| 비고 라벨 | 10.5px | 600 | `letter-spacing:0.04em` |
| 비고 본문 | 12.5px | 400 | `line-height:1.55` |

한글 블록 전체에 `word-break: keep-all` 적용 — 어절 중간에서 끊기는 것을 막습니다.

### Radius / Shadow / Spacing

- Radius: 카드 7px, 버튼·탭 5px, 사이드바 항목·로고 6px, 입력 4px, 배지 3px
- Shadow: 카드 `0 1px 2px rgba(22,35,60,0.05)`. 그 외 없음.
- Spacing base 8px. 본문 좌우 패딩 32px, 카드 내부 좌우 20px.
- 밀도는 **조밀**하게 — 행 세로 패딩 9px.

---

## Layout

```
┌──────────┬────────────────────────────────────────────┐
│ Sidebar  │  Sticky top bar                            │
│ 232px    │   · 제목 + 서브헤드                          │
│ fixed    │   · 탭 5개                                  │
│ sticky   │   · 검색 + 결과 카운트                       │
│ 100vh    ├────────────────────────────────────────────┤
│          │  Card                                      │
│          │   · 카드 헤더 (라벨 · 절사 배지 · 출처)       │
│          │   · Sticky 컬럼 헤더                        │
│          │   · Sticky 구분 헤더 + 데이터 행 (반복)       │
└──────────┴────────────────────────────────────────────┘
```

루트: `display:flex; min-height:100vh; align-items:stretch; word-break:keep-all;`

### Sidebar

`width:232px; flex:0 0 232px; background:#FFFFFF; border-right:1px solid #E3E8EF; position:sticky; top:0; height:100vh; display:flex; flex-direction:column;`

**헤더** — `padding:20px 20px 16px; border-bottom:1px solid #E3E8EF; display:flex; align-items:center; gap:10px;`
- 로고 마크: 26×26, `border-radius:6px; background:#2F6BDE; color:#fff;` 중앙에 "S" 14px/700
- 우측: "SamGuide" 16px/700 ink + "심사청구 점검 참고자료" 11.5px muted (`margin-top:2px`)

**네비게이션** — `padding:12px; display:flex; flex-direction:column; gap:2px;`

항목 7개, 각각 `display:flex; align-items:center; gap:10px; padding:9px 12px; border-radius:5px; cursor:pointer;`
번호 글리프는 원문자 ①②③④⑤⑥⑦, 12px, tabular-nums.

| 상태 | 배경 | 텍스트 | 번호 | weight | radius |
|---|---|---|---|---|---|
| 활성 | `#EAF1FF` | `#2F6BDE` | `#7FA5EC` | 600 | 6px |
| 기본 | 없음 | `#3E4C63` | `#8593A9` | 400 | 5px |
| hover | `#F5F8FD` | `#16233C` | — | 400 | 5px |

> 번호 글리프에 `opacity`를 겹쳐 쓰지 마세요. 이전 시안에서 행 색상 위에 `opacity:0.55`가 중첩되어 대비 2.86:1로 떨어졌습니다. 고정 색상값만 사용합니다.

메뉴 순서: ① 본인부담금 규칙 · ② 본인부담금 계산기 · ③ SAM 파일 레이아웃 · ④ 항 · 목 코드 · ⑤ 특정내역 · ⑥ 산정특례 특정기호 · ⑦ 메모장

**푸터** — `margin-top:auto; padding:18px 20px 22px; border-top:1px solid #E3E8EF; font-size:11.5px; line-height:1.7; color:#8593A9;`
```
브라우저 안에서만 동작하고 외부로 아무것도 보내지 않습니다.
메모는 이 PC 브라우저에 저장됩니다.
```

### Top bar

`position:sticky; top:0; z-index:30; background:rgba(255,255,255,0.96); backdrop-filter:blur(12px); border-bottom:1px solid #E3E8EF;`

1. **제목 줄** — `padding:22px 32px 0;` / `display:flex; align-items:baseline; gap:14px;`
   "본인부담금 규칙" (26/700/ink) + "건강보험 · 차상위 · 의료급여 본인부담 산정 기준" (13/muted)

2. **탭** — `padding:16px 32px 0; display:flex; gap:6px; flex-wrap:wrap;`
   각 탭: `display:flex; align-items:center; gap:7px; padding:8px 15px; border-radius:5px; font-size:13.5px; cursor:pointer;`

   | 상태 | border | background | text | count |
   |---|---|---|---|---|
   | 활성 | `1px #2F6BDE` | `#2F6BDE` | `#fff` / 700 | `rgba(255,255,255,0.58)` |
   | 기본 | `1px #E3E8EF` | `#fff` | `#3E4C63` / 500 | `#8593A9` |
   | hover | `1px #2F6BDE` | `#fff` | `#2F6BDE` | — |

   탭 5개: 건강보험 외래 79 · 차상위 외래 25 · 건강보험 입원 33 · 차상위 입원 23 · 의료급여 106

3. **검색 줄** — `padding:14px 32px 16px; display:flex; align-items:center; gap:12px;`
   - 입력(flex:1): `padding:9px 12px 9px 32px; border:1px solid #E3E8EF; border-radius:4px; font-size:13.5px;`
     focus: `border-color:#2F6BDE; box-shadow:0 0 0 3px rgba(47,107,222,0.16);`
     placeholder: `구분 · 항목 · 계산식 · 비고 검색 (예: 임신부, 선별급여, F025)`
     아이콘 `⌕` — `position:absolute; left:13px; font-size:13px; color:#8593A9;`
   - 결과 라벨: 12.5px muted, tabular-nums, `white-space:nowrap`
     검색 중 `N건 표시 / 전체 M건`, 아니면 `전체 M건`

### Card

`background:#fff; border:1px solid #E3E8EF; border-radius:7px; box-shadow:0 1px 2px rgba(22,35,60,0.05);`

> **`overflow:hidden`을 카드에 걸지 마세요.** 카드가 sticky 자손의 스크롤포트가 되어 `top` 오프셋이 문서 최상단이 아닌 카드 상단 기준으로 계산됩니다. 헤더가 ~167px 아래로 밀려 데이터 행 위에 겹칩니다. 모서리 라운딩은 첫/마지막 자식에 직접 주세요.

**카드 헤더** — `display:flex; align-items:center; justify-content:space-between; gap:16px; padding:14px 20px; border-bottom:1px solid #E3E8EF; border-radius:7px 7px 0 0;`
- 좌: 탭 라벨 (15/600/ink) + 절사 배지 `padding:2px 8px; border-radius:3px; background:#EAF1FF; color:#2F6BDE; font-size:11.5px; font-weight:600;`
  - 외래 탭 → `100원 미만 절사` / 입원 탭 → `10원 미만 절사` / 의료급여 → `정액 · 정률 혼합`
- 우: `출처: 총진료비,본인부담금 계산식.xlsx` (11.5px muted)

**컬럼 헤더** (sticky) — `display:grid; grid-template-columns:minmax(240px,300px) 1fr; background:#fff; border-bottom:1px solid #E3E8EF; z-index:20;`
각 셀 `padding:9px 20px`, 라벨 `항목` / `본인부담 산정`

**구분 헤더** (sticky) — `display:flex; align-items:center; gap:9px; padding:8px 20px; background:#F5F8FD; border-top:1px solid #E3E8EF; border-bottom:1px solid #E3E8EF; z-index:10;`
- 액센트 바: `width:3px; height:12px; background:#2F6BDE; border-radius:2px;`
- 종별명 (13/600/ink) + `N건` (11.5px muted, tabular-nums)

**데이터 행** — `display:grid; grid-template-columns:minmax(240px,300px) 1fr; border-bottom:1px solid #EEF1F6;` / hover `background:#F7F9FD;`

- 좌 셀: `padding:9px 20px; display:flex; flex-wrap:wrap; align-items:baseline; gap:6px; align-content:start;`
  - 항목명 (13.5/500/ink)
  - 코드 배지 0..n개: `font-family:mono; font-size:10.5px; font-weight:600; letter-spacing:0.02em; color:#2F6BDE; background:#EAF1FF; border-radius:3px; padding:1.5px 5px; white-space:nowrap;`
- 우 셀: `padding:9px 20px; display:flex; flex-direction:column; gap:5px; border-left:1px solid #EEF1F6;`
  - 계산식: `font-size:13.5px; line-height:1.5; color:#3E4C63; font-variant-numeric:tabular-nums; white-space:pre-wrap;`
  - 비고(있을 때만): `display:flex; gap:8px; align-items:flex-start;` — **배경·테두리 없음**
    - 라벨 "비고": `flex:0 0 auto; font-size:10.5px; font-weight:600; letter-spacing:0.04em; color:#A0ACBE; padding-top:2px;`
    - 본문: `font-size:12.5px; line-height:1.55; color:#6B7A91;`

**빈 상태** — `padding:56px 20px; text-align:center; border-radius:0 0 7px 7px;`
- 제목 "표시할 규칙이 없습니다" (14/600/`#3E4C63`)
- 안내 (12.5px muted, `line-height:1.7`, `margin-top:7px`):
  - 검색 중: `검색어와 일치하는 규칙이 없습니다. 다른 키워드로 검색해 보세요.`
  - 데이터 없음: `이 탭의 원본 데이터가 아직 연결되지 않았습니다.`

---

## Interactions & Behavior

### Sticky 스택 (중요 — 하드코딩 금지)

세 요소가 위에서부터 쌓입니다: 상단 바(문서 상단 고정) → 컬럼 헤더 → 구분 헤더.
상단 바 높이는 탭 줄바꿈·폰트 로드에 따라 변합니다. 픽셀 하드코딩하면 어긋납니다.

```js
const bar = document.querySelector('[data-topbar]');
const col = document.querySelector('[data-col-header]');
const groups = document.querySelectorAll('[data-group-header]');

function syncSticky() {
  const barH = Math.round(bar.getBoundingClientRect().height);
  const colH = Math.round(col.getBoundingClientRect().height);
  col.style.top = (barH - 1) + 'px';
  groups.forEach(g => { g.style.top = (barH - 1 + colH) + 'px'; });
}

new ResizeObserver(syncSticky).observe(bar);
new ResizeObserver(syncSticky).observe(col);
window.addEventListener('resize', syncSticky);
document.fonts?.ready.then(syncSticky);
syncSticky();
```

- `-1px`은 헤어라인이 겹쳐 보이는 1px 틈을 없앱니다.
- 구분 헤더 오프셋은 컬럼 헤더의 **실측 높이**여야 합니다. 고정값(33px 등)을 쓰면 실제 높이(37px)와 어긋나 종별명 상단 4px이 잘립니다.
- z-index: 상단 바 30 > 컬럼 헤더 20 > 구분 헤더 10.
- 폰트 로드 완료 후 반드시 재측정. 최초 측정만 하면 높이가 확정 전 값(219px)에 고정되어 상단 바와 컬럼 헤더 사이 9px 틈으로 행 텍스트가 비칩니다.

### 계산식 퍼센트 강조

퍼센트 값과 `A:50` 형태의 급여율만 강조합니다. `6세미만`의 "6", `18세미만`의 "18" 같은 서술 숫자는 강조하지 않습니다.

```js
const RE = /\d+(?:[.,]\d+)?%|:\d+/g;
```

`:50` 매칭 시 콜론은 일반 텍스트로 두고 숫자만 강조합니다. 토큰 사이에 공백이 끼지 않도록 조각을 붙여서 렌더링하고, 컨테이너에 `white-space: pre-wrap`을 둡니다.

### 검색

- 대상: 구분명 + 항목명 + 계산식 + 비고 + 코드. 대소문자 무시, 부분 일치.
- 매칭 행이 하나도 없는 구분은 헤더째 숨김.
- 탭 전환 시 검색어 초기화.

### 탭 전환

클릭 시 활성 탭 변경 + 해당 데이터셋 렌더 + 검색어 초기화. 페이지 이동 없음.

---

## State

| 상태 | 초기값 | 트리거 |
|---|---|---|
| `activeTab` | `hi_out` (건강보험 외래) | 탭 클릭 |
| `activeNav` | `0` (본인부담금 규칙) | 사이드바 클릭 |
| `query` | `""` | 입력 / 탭 전환 시 초기화 |
| `topBarH`, `colHeaderH` | 실측 | ResizeObserver, fonts.ready, resize |

데이터 페칭 없음. 기존 인라인 데이터 유지.

---

## 데이터 상태

디자인 프로토타입에는 **건강보험 외래 → 상급종합병원 15행만** 채워져 있습니다(첨부해 주신 스크린샷 범위). 나머지 종별·탭은 빈 상태 UI로 남아 있습니다.

구현 시에는 **기존 `index.html`의 전체 데이터를 그대로 사용**하세요. 프로토타입 데이터로 덮어쓰지 마세요.

행 데이터 구조:

```js
{
  item: "일반환자 / 의약분업",     // 코드 괄호를 제거한 항목명
  codes: ["F003"],                // 항목명 뒤 괄호 안 코드 배열
  f: "진찰료총액 + 약가총액 * 30% + 나머지 60%",
  note: "선별급여 적용할 수 없음. ..." // 없으면 생략
}
```

기존 데이터가 `일반환자 / 의약분업 (F003)`처럼 항목명에 코드를 포함하고 있다면, 렌더 단계에서 말미 괄호를 파싱해 배지로 분리하세요. 원본 문자열은 수정하지 않습니다.

## Assets

외부 에셋 없음. 로고는 CSS로 그린 26px 블루 스퀘어 + "S" 글리프입니다.
폰트: Pretendard, JetBrains Mono — 기존 index.html의 로드 방식을 그대로 씁니다.

## Files

- `SamGuide.dc.html` — 리디자인 레퍼런스 프로토타입. 브라우저에서 바로 열립니다.
  마크업은 `<x-dc>` 안에, 로직은 하단 `<script>`의 `class Component` 안에 있습니다.
  스타일은 전부 인라인이므로, 위 표의 값과 대조하며 읽으면 됩니다.
