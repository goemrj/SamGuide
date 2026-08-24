/* ---------- 약국 산정특례 ----------
   data/pharm-codes.js 는 「본인일부부담금 산정특례에 관한 기준」 [별표 6]
   (약국 요양급여비용총액의 본인부담률 산정특례 대상, 제6조 관련) hwpx 를 옮긴 것이다.
   변환은 tools/pharm.ps1 — hwpx 는 zip+XML 이라 한글(HWP) COM 을 띄우지 않고 읽는다.

   원문 표는 구분 · 대상 · 특정기호 3열이고 구분·특정기호가 병합 셀로 묶여 있다.
   데이터에서는 병합을 풀어 행마다 값을 넣었고, 화면에서도 **행마다 그대로 적는다.**
   (원문처럼 첫 행만 적고 아래를 비우면, 걸러 보거나 검색해 행이 흩어졌을 때
    빈 칸이 "위와 같음" 인지 "값 없음" 인지 헷갈린다 — 심사 기준이라 비우지 않는다.)

   본문 1호(상급종합 50% · 종합병원 40%)와 2호(V100 으로 제외하는 경우)는
   표 아래에 원문 문단 그대로 둔다.
------------------------------------------------------------------ */
const ph = { sym: '' };

/* 특정기호 배지 — ① 본인부담금 규칙 화면과 같은 모양(.symb).
   커서를 올리면 data/symbol-codes.js 의 한글명칭을 보여 준다.
   화면 하나에서만 쓰는 코드는 그 화면 파일에 둔다(CLAUDE.md 소스 나누는 규칙). */
function phSymb(code){
  const s = SYMBOLS[code];
  const tip = s ? s.n + (s.to && s.to !== '9999-12-31' ? ' (~' + s.to + ')' : '') : '목록에 없는 기호';
  // title 은 쓰지 않는다 — 브라우저 기본 툴팁이 말풍선과 겹쳐 두 개로 보인다
  return '<span class="symb" data-tip="' + esc(tip) + '">' + esc(code) + '</span>';
}

const PH_SYMS   = [...new Set(PHARM_CODES.map(d => d.sym))].sort();
const PH_GROUPS = new Set(PHARM_CODES.map(d => d.no)).size;

function phFiltered(){
  const needle = $('ph-search').value.trim().toLowerCase();
  return PHARM_CODES.filter(d =>
    (!ph.sym || d.sym === ph.sym) &&
    (!needle || sgHit(d.no + ' ' + d.name + ' ' + d.sym, needle)));
}

/* 특정기호 한 줄뿐이라 대분류(.chips-seg)로 그린다 — 디자인 규칙의 필터 두 줄 규칙 */
function renderPhSyms(){
  chipRow($('ph-syms'), PH_SYMS, ph.sym, '전체',
    v => (v ? PHARM_CODES.filter(d => d.sym === v).length : PHARM_CODES.length),
    v => { ph.sym = v; renderPhSyms(); renderPhTable(); });
}

function renderPhTable(){
  const needle = $('ph-search').value.trim().toLowerCase();
  const rows = phFiltered();
  const groups = new Set(rows.map(d => d.no)).size;

  $('ph-meta').innerHTML =
    '<span><b>' + (ph.sym || '전체') + '</b></span>' +
    '<span>' + groups + '구분 ' + rows.length + '행' +
      (rows.length === PHARM_CODES.length ? '' : ' / 전체 ' + PH_GROUPS + '구분 ' + PHARM_CODES.length + '행') +
    '</span>' +
    '<span class="meta-note">본인일부부담금 산정특례에 관한 기준 [별표 6] (제6조 관련)</span>';

  if (!rows.length){ $('ph-table').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>'; return; }

  const mark = t => hilite(t, needle);
  $('ph-table').innerHTML =
    '<table class="fields ph"><thead><tr>' +
      '<th>구분</th><th>대상</th><th>특정기호</th>' +
    '</tr></thead><tbody>' +
    rows.map(d =>
      '<tr><td class="ph-no">' + mark(d.no) + '</td>' +
      '<td class="ph-name">' + mark(d.name) + '</td>' +
      '<td class="ph-sym">' + phSymb(d.sym) + '</td></tr>'
    ).join('') + '</tbody></table>';
}

/* 표 아래 원문 문단. 1. / 가. / 1) 로 시작하는 머리표를 보고 들여쓰기 단을 정한다
   (원문의 앞 공백은 데이터에서 정리해 두었다 — 글자는 그대로다). */
function phDepth(s){
  if (/^\d+\)/.test(s)) return 2;
  if (/^[가-힣]\./.test(s)) return 1;
  return 0;
}
function renderPhNotes(){
  const needle = $('ph-search').value.trim().toLowerCase();
  $('ph-notes').innerHTML =
    '<div class="card ph-notes"><div class="card-pad">' +
    '<div class="ph-notes-h">원문 규정</div>' +
    (typeof PHARM_NOTES === 'undefined' ? [] : PHARM_NOTES)
      .map(n => '<p class="ph-note d' + phDepth(n) + '">' + hilite(n, needle) + '</p>').join('') +
    '</div></div>';
}

$('ph-search').addEventListener('input', () => { renderPhTable(); renderPhNotes(); });
renderPhSyms(); renderPhTable(); renderPhNotes();
