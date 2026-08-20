/* ---------- ⑤ 특정내역 ----------
   데이터(data/detail-codes.js)는 「특정내역코드_통합본.xlsx」가 마스터이고,
   세부작성요령 PDF의 자세한 작성요령(body)이 현재 판에만 붙어 있다.

   화면은 다른 카테고리와 같은 한 장의 표다(목록 + 상세 두 칸 구조를 걷어냈다).
   필터는 SAM 파일 레이아웃과 같은 두 줄 — 분야는 네모 칩(대분류),
   내역구분은 밝은 하이라이트 pill(소분류).                                */
const dt = { field: '', rec: '', showOld: false, open: {} };
const DT_FIELDS = ['의과', '산재', '자보', 'DRG', '신DRG', '한방', '요양병원'];
const DT_RECS   = ['일반내역', '진료내역', '처방일반내역', '처방줄단위내역'];

/* 열 너비 기본값 — ① 본인부담금 규칙과 같은 방식으로 **% 로** 적는다(합 100).
   px 로 박으면 창이 좁은 PC 에서 표가 창을 넘겨 가로 스크롤이 생긴다(전체 전제 위반).
   머리줄 손잡이로 끌어 바꾼 값이 있으면 그쪽이 이기고, 그 값은 그 브라우저에만 남는다. */
const DT_COLW = ['7%', '15%', '9%', '13%', '8%', '9%', '39%'];
const DT_TKEY = 'detail#dt';

function dtBase(){
  return dt.showOld ? DETAIL_CODES : DETAIL_CODES.filter(d => d.cur);
}
function dtMatch(d){
  if (dt.field && !d.fields.includes(dt.field)) return false;
  if (dt.rec && d.rec !== dt.rec) return false;
  return true;
}
function renderDtFilters(){
  const base = dtBase();
  chipRow($('dt-fields'), DT_FIELDS, dt.field, '전체 분야',
    v => base.filter(d => (!v || d.fields.includes(v)) && (!dt.rec || d.rec === dt.rec)).length,
    v => { dt.field = v; renderDtFilters(); renderDtTable(); });
  chipRow($('dt-recs'), DT_RECS, dt.rec, '전체 내역구분',
    v => base.filter(d => (!v || d.rec === v) && (!dt.field || d.fields.includes(dt.field))).length,
    v => { dt.rec = v; renderDtFilters(); renderDtTable(); });
}
// 세부작성요령 본문은 원본 변환에서 줄바꿈이 "\n" 두 글자로 들어와 있다 —
// 원본 글자는 그대로 두고 화면에 그릴 때만 실제 줄바꿈으로 바꾼다.
function dtBody(d){
  return String(d.body || '').replace(/\\n/g, '\n');
}
function dtHaystack(d){
  return (d.code + ' ' + d.name + ' ' + d.format + ' ' + d.guide + ' ' + dtBody(d)).toLowerCase();
}
function fieldTags(d){
  if (d.onlyPdf) return '<span class="ftag none">분야 미상</span>';
  if (!d.fields.length) return '<span class="saved-note">—</span>';
  return d.fields.map(f => '<span class="ftag">' + esc(f) + '</span>').join('');
}
const dtId = d => d.code + '|' + d.from;

function renderDtTable(){
  const needle = $('dt-search').value.trim().toLowerCase();
  let rows = dtBase().filter(dtMatch);
  if (needle){
    rows = rows.filter(d => dtHaystack(d).includes(needle));
    // 코드를 그대로 친 경우(MT002 등) 그 코드가 먼저 나오게 한다 —
    // 다른 코드의 작성요령이 그 코드를 언급만 해도 검색에는 걸리기 때문
    // 코드 > 특정내역명 > 본문 순으로 앞세운다
    const hit = d => d.code.toLowerCase().includes(needle) ? 0
                   : d.name.toLowerCase().includes(needle) ? 1 : 2;
    rows = rows.slice().sort((a, b) => hit(a) - hit(b));
  }

  $('dt-meta').innerHTML =
    '<span><b>' + esc(dt.field || '전체 분야') + '</b> · ' + esc(dt.rec || '전체 내역구분') + '</span>' +
    '<span>' + rows.length.toLocaleString() + '건' +
      (needle ? ' (검색)' : '') +
      (dt.showOld ? ' · 지난 판 포함' : '') + '</span>' +
    '<span class="meta-note">특정내역코드 통합본 + 세부작성요령(2025.8.1.) Ⅸ장</span>';

  if (!rows.length){
    $('dt-table').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
    return;
  }

  const mark = t => hilite(t, needle);
  const head = ['구분코드', '특정내역명', '내역구분', '기재형식', '분야', '적용기간', '작성요령'];
  const saved = colwOf(DT_TKEY, head.length);     // common.js — 열 개수가 같을 때만 돌려준다
  const colw  = saved ? saved.map(n => n + 'px') : DT_COLW;
  let html = '<table class="fields dt fixed" data-k="' + DT_TKEY + '"><thead><tr>' +
    head.map((h, i) => '<th style="width:' + colw[i] + '">' + esc(h) + '</th>').join('') +
    '</tr></thead><tbody>' +
    rows.map(d => {
      const id = dtId(d), body = dtBody(d);
      // 검색어가 본문에만 걸린 경우에는 어디에 걸렸는지 보이도록 펼친 채로 그린다
      const open = !!dt.open[id] || (!!needle && body.toLowerCase().includes(needle));
      let guide = '';
      if (d.guide) guide += '<div class="dt-note">' + mark(d.guide) + '</div>';
      if (body){
        guide += '<button class="dt-open" data-id="' + esc(id) + '">' +
                 (open ? '세부작성요령 접기' : '세부작성요령 펼치기 (' + d.page + '쪽)') + '</button>';
      }
      if (!guide) guide = '<span class="saved-note">—</span>';

      let tr = '<tr' + (d.cur ? '' : ' class="dt-past"') + '>' +
        '<td class="dt-code">' + mark(d.code) + '</td>' +
        '<td class="dt-name">' + mark(d.name) + '</td>' +
        '<td class="dt-rec">' + esc(d.rec) + '</td>' +
        '<td class="dt-fmt">' + mark(d.format) + '</td>' +
        '<td class="dt-field">' + fieldTags(d) + '</td>' +
        '<td class="dt-when">' + esc(ymd(d.from) || '?') + ' ~ ' + esc(ymd(d.to)) +
          (d.cur ? '' : '<span class="ftag old">지난 판</span>') + '</td>' +
        '<td class="dt-guide-cell">' + guide + '</td></tr>';

      // 세부작성요령 본문은 칸 안에 넣으면 너무 좁다 — 그 줄 아래에 표 전체 폭으로 펼친다.
      // 원문이 칸을 맞춘 글자 그림(고시 표)이라 줄바꿈을 하지 않고 pre 그대로 둔다.
      if (body && open){
        tr += '<tr class="dt-bodyrow"><td colspan="' + head.length + '">' +
              '<div class="dt-sec">세부작성요령 (2025.8.1. ' + d.page + '쪽) — ' + esc(d.code) + ' ' + esc(d.name) + '</div>' +
              '<pre class="dt-body">' + mark(body) + '</pre></td></tr>';
      }
      return tr;
    }).join('') + '</tbody></table>';

  $('dt-table').innerHTML = html;
  $('dt-table').querySelectorAll('.dt-open').forEach(b => {
    b.addEventListener('click', () => {
      const id = b.dataset.id;
      if (dt.open[id]) delete dt.open[id]; else dt.open[id] = true;
      renderDtTable();
    });
  });
}
$('dt-search').addEventListener('input', renderDtTable);
$('dt-old').addEventListener('change', () => {
  dt.showOld = $('dt-old').checked;
  renderDtFilters(); renderDtTable();
});
renderDtFilters();
renderDtTable();
