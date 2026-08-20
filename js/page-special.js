/* ---------- ⑥ 산정특례 특정기호 ----------
   data/special-codes.js 는 「산정특례 질환별 등록기준」 엑셀에서
   특정기호·상병코드·상병일련번호·질환명(국문)만 뽑은 것이다(3,600건이 넘는다). */
const sp = { group: '', page: 0 };
const SP_PAGE = 300;                      // 3,600행이 넘어 한 번에 다 그리면 느리다

function spGroups(){
  const seen = [];
  for (const d of SPECIAL_CODES) if (!seen.includes(d.g)) seen.push(d.g);
  return seen;
}
function spFiltered(){
  const needle = $('sp-search').value.trim().toLowerCase();
  return SPECIAL_CODES.filter(d =>
    (!sp.group || d.g === sp.group) &&
    (!needle || (d.sym + ' ' + d.code + ' ' + d.seq + ' ' + d.name).toLowerCase().includes(needle)));
}
function renderSpGroups(){
  const mk = (v, label, n) =>
    '<button class="chip' + (sp.group === v ? ' on' : '') + '" data-v="' + esc(v) + '">' +
    esc(label) + '<small>' + n + '</small></button>';
  $('sp-groups').innerHTML =
    mk('', '전체', SPECIAL_CODES.length) +
    spGroups().map(g => mk(g, g, SPECIAL_CODES.filter(d => d.g === g).length)).join('');
  $('sp-groups').querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => { sp.group = c.dataset.v; sp.page = 0; renderSpGroups(); renderSpTable(); });
  });
}
function renderSpTable(){
  const needle = $('sp-search').value.trim().toLowerCase();
  const rows = spFiltered();
  const start = sp.page * SP_PAGE;
  const view = rows.slice(start, start + SP_PAGE);

  $('sp-meta').innerHTML =
    '<span><b>' + (sp.group || '전체') + '</b></span>' +
    '<span>' + rows.length.toLocaleString() + '건' +
      (rows.length > SP_PAGE ? ' 중 ' + (start + 1).toLocaleString() + '~' +
        Math.min(start + SP_PAGE, rows.length).toLocaleString() : '') + '</span>' +
    '<span class="meta-note">산정특례 질환별 등록기준 (2026.1.1. 기준)</span>';

  if (!view.length){ $('sp-table').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>'; return; }

  const mark = t => hilite(t, needle);
  let html = '<table class="fields sp"><thead><tr>' +
    '<th>구분</th><th>특정기호</th><th>상병코드</th><th>상병일련번호</th><th>질환명 (국문)</th>' +
    '</tr></thead><tbody>' +
    view.map(d =>
      '<tr><td class="sp-g">' + esc(d.g) + '</td>' +
      '<td class="sp-sym">' + mark(d.sym) + '</td>' +
      '<td class="sp-code">' + (d.code ? mark(d.code) : '<span class="saved-note">—</span>') + '</td>' +
      '<td class="sp-seq">' + esc(d.seq) + '</td>' +
      '<td class="sp-name">' + mark(d.name) + '</td></tr>'
    ).join('') + '</tbody></table>';

  const pages = Math.ceil(rows.length / SP_PAGE);
  if (pages > 1){
    html += '<div class="pager">' +
      '<button class="btn" data-p="prev"' + (sp.page === 0 ? ' disabled' : '') + '>이전</button>' +
      '<span>' + (sp.page + 1) + ' / ' + pages + '</span>' +
      '<button class="btn" data-p="next"' + (sp.page >= pages - 1 ? ' disabled' : '') + '>다음</button>' +
    '</div>';
  }
  $('sp-table').innerHTML = html;
  $('sp-table').querySelectorAll('.pager .btn').forEach(b => {
    b.addEventListener('click', () => {
      sp.page += (b.dataset.p === 'next' ? 1 : -1);
      renderSpTable();
      $('sp-table').scrollIntoView({block: 'start', behavior: 'smooth'});
    });
  });
}
$('sp-search').addEventListener('input', () => { sp.page = 0; renderSpTable(); });
renderSpGroups(); renderSpTable();
