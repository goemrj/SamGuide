/* ---------- ⑤ 특정내역 ----------
   데이터(data/detail-codes.js)는 「특정내역코드_통합본.xlsx」가 마스터이고,
   세부작성요령 PDF의 자세한 작성요령(body)이 현재 판에만 붙어 있다.        */
const dt = { field: '', rec: '', showOld: false, cur: null, rows: [] };
const DT_FIELDS = ['의과', '산재', '자보', 'DRG', '신DRG', '한방', '요양병원'];
const DT_RECS   = ['일반내역', '진료내역', '처방일반내역', '처방줄단위내역'];

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
    v => { dt.field = v; renderDtFilters(); renderDtList(); });
  chipRow($('dt-recs'), DT_RECS, dt.rec, '전체 내역구분',
    v => base.filter(d => (!v || d.rec === v) && (!dt.field || d.fields.includes(dt.field))).length,
    v => { dt.rec = v; renderDtFilters(); renderDtList(); });
}
function dtHaystack(d){
  return (d.code + ' ' + d.name + ' ' + d.format + ' ' + d.guide + ' ' + d.body).toLowerCase();
}
function fieldTags(d){
  if (d.onlyPdf) return '<span class="ftag none">분야 미상</span>';
  if (!d.fields.length) return '';
  return d.fields.map(f => '<span class="ftag">' + esc(f) + '</span>').join('');
}
function renderDtList(){
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
  dt.rows = rows;

  if (!rows.length){
    $('dt-items').innerHTML = '<div class="saved-note" style="padding:10px;">검색 결과가 없습니다.</div>';
    $('dt-detail').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
    return;
  }
  // 같은 코드의 지난 판이 섞여 있을 수 있어 코드+적용일자로 구분한다
  const idOf = d => d.code + '|' + d.from;
  $('dt-items').innerHTML = rows.map(d =>
    '<button class="memo-item' + (idOf(d) === dt.cur ? ' on' : '') + '" data-id="' + esc(idOf(d)) + '">' +
    '<b><span class="code-badge">' + esc(d.code) + '</span>' + esc(d.name) + '</b>' +
    '<span>' + fieldTags(d) + (d.cur ? '' : '<span class="ftag old">지난 판</span>') + '</span></button>'
  ).join('');
  $('dt-items').querySelectorAll('.memo-item').forEach(b => {
    b.addEventListener('click', () => { dt.cur = b.dataset.id; renderDtList(); });
  });

  if (!rows.some(d => idOf(d) === dt.cur)) dt.cur = idOf(rows[0]);
  renderDtDetail(needle, rows.find(d => idOf(d) === dt.cur));
}
function renderDtDetail(needle, d){
  if (!d){ $('dt-detail').innerHTML = ''; return; }
  const mark = txt => hilite(txt, needle);
  let html =
    '<div class="dt-head">' +
      '<span class="code">' + esc(d.code) + '</span><span class="name">' + esc(d.name) + '</span>' +
      '<div class="dt-meta">' +
        '<span class="m"><b>내역구분</b><span>' + esc(d.rec) + '</span></span>' +
        '<span class="m fmt"><b>기재형식</b><span>' + esc(d.format) + '</span></span>' +
        '<span class="m"><b>적용기간</b><span>' + esc(ymd(d.from) || '?') + ' ~ ' + esc(ymd(d.to)) + '</span></span>' +
      '</div>' +
      '<div class="dt-meta">' +
        (d.onlyPdf
          ? '<span class="m"><b>분야</b><span>통합본에 없는 코드 — 세부작성요령에만 있음</span></span>'
          : '<span class="m"><b>분야</b><span>' + (d.fields.length ? esc(d.fields.join(' · ')) : '없음') + '</span></span>') +
      '</div>' +
    '</div>';

  if (!d.cur) html += '<div class="res-warn">지난 판입니다. ' + esc(ymd(d.to)) + '까지 적용된 내용입니다.</div>';
  if (d.guide) html += '<div class="dt-guide"><b>작성요령 (통합본)</b>' + mark(d.guide) + '</div>';
  if (d.body){
    html += '<div class="dt-sec">세부작성요령 (2025.8.1. ' + d.page + '쪽)</div>' +
            '<pre class="dt-body">' + mark(d.body) + '</pre>';
  } else if (d.cur){
    html += '<div class="saved-note" style="margin-top:12px;">세부작성요령(건강보험 의과 Ⅸ장)에는 이 코드가 없습니다. 위 통합본 작성요령을 참고하세요.</div>';
  }
  $('dt-detail').innerHTML = html;
}
$('dt-search').addEventListener('input', renderDtList);
$('dt-old').addEventListener('change', () => {
  dt.showOld = $('dt-old').checked;
  renderDtFilters(); renderDtList();
});
renderDtFilters();
renderDtList();
