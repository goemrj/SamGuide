/* ---------- ⑥ 산정특례 특정기호 ----------
   data/special-codes.js 는 「산정특례 질환별 등록기준」 엑셀에서
   특정기호·상병코드·상병일련번호·질환명(국문)만 뽑은 것이다(3,600건이 넘는다).
   여기에 data/symbol-codes.js(「특정기호_20260819.xlsx」 전체 263건)에만 있는 기호를
   「F코드」·「기타 V코드」 구분으로 더해, 특정기호 263개를 한 화면에서 다 찾을 수 있게 한다. */
const sp = { group: '', page: 0 };
const SP_PAGE = 300;                      // 3,600행이 넘어 한 번에 다 그리면 느리다

/* 특정기호 목록(data/symbol-codes.js)에는 있는데 질환별 등록기준에는 없는 기호가 69개 있다.
   F 기호 27개(본인부담 특례)와, 상병목록이 딸리지 않는 V 기호 42개
   (뇌혈관·심장·중증외상·이식·공여자·가정간호·호스피스·약국 특례 등)다.
   기호 하나를 어느 화면에서 찾을지 헷갈리지 않게 같은 표에 붙인다.
   상병코드·상병일련번호는 이 기호들에 없는 값이라 비워 둔다(추측해 채우지 않는다).
   질환명 칸에는 특정기호 목록의 한글명칭을 원문 그대로 넣고, 끝난 기호만 종료일자를 덧붙인다. */
const SP_F_GROUP = 'F코드';
const SP_V_GROUP = '기타 V코드';
const SP_IN_SPEC = SPECIAL_CODES.reduce((o, d) => (o[d.sym] = 1, o), {});
const SP_SYM_ROWS = Object.keys(SYMBOLS).filter(k => !SP_IN_SPEC[k]).sort().map(k => ({
  g: k.charAt(0) === 'F' ? SP_F_GROUP : SP_V_GROUP, sym: k, code: '', seq: '',
  name: SYMBOLS[k].n +
        (SYMBOLS[k].to && SYMBOLS[k].to !== '9999.12.31' ? ' (~' + SYMBOLS[k].to + ')' : '')
}));
const SP_ROWS = SPECIAL_CODES.concat(SP_SYM_ROWS);

function spGroups(){
  const seen = [];
  for (const d of SP_ROWS) if (!seen.includes(d.g)) seen.push(d.g);
  return seen;
}
function spFiltered(){
  const needle = $('sp-search').value.trim().toLowerCase();
  const rows = SP_ROWS.filter(d =>
    (!sp.group || d.g === sp.group) &&
    (!needle || (d.sym + ' ' + d.code + ' ' + d.seq + ' ' + d.name).toLowerCase().includes(needle)));
  /* 전체(구분을 고르지 않은 상태)는 특정기호 오름차순으로 본다.
     구분을 고르면 원본 엑셀 순서(질환 등록기준 순서)를 그대로 둔다. */
  if (!sp.group){
    rows.sort((a, b) =>
      a.sym.localeCompare(b.sym) || a.code.localeCompare(b.code) || a.seq.localeCompare(b.seq));
  }
  return rows;
}
function renderSpGroups(){
  const mk = (v, label, n) =>
    '<button class="chip' + (sp.group === v ? ' on' : '') + '" data-v="' + esc(v) + '">' +
    esc(label) + '<small>' + n + '</small></button>';
  $('sp-groups').innerHTML =
    mk('', '전체', SP_ROWS.length) +
    spGroups().map(g => mk(g, g, SP_ROWS.filter(d => d.g === g).length)).join('');
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
    '<span class="meta-note">' +
      (sp.group === SP_F_GROUP || sp.group === SP_V_GROUP ? '특정기호 목록 (2026.8.19. 기준)'
       : sp.group ? '산정특례 질환별 등록기준 (2026.1.1. 기준)'
       : '산정특례 질환별 등록기준 (2026.1.1. 기준) · 특정기호 목록 (2026.8.19. 기준)') +
    '</span>';

  if (!view.length){ $('sp-table').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>'; return; }

  const mark = t => hilite(t, needle);
  let html = '<table class="fields sp"><thead><tr>' +
    '<th>구분</th><th>특정기호</th><th>상병코드</th><th>상병일련번호</th><th>질환명 (국문)</th>' +
    '</tr></thead><tbody>' +
    view.map(d =>
      '<tr><td class="sp-g">' + esc(d.g) + '</td>' +
      '<td class="sp-sym">' + mark(d.sym) + '</td>' +
      '<td class="sp-code">' + (d.code ? mark(d.code) : '<span class="saved-note">—</span>') + '</td>' +
      '<td class="sp-seq">' + (d.seq ? esc(d.seq) : '<span class="saved-note">—</span>') + '</td>' +
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
