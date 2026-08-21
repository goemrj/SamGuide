/* ---------- ⑥ 산정특례 특정기호 ----------
   data/special-codes.js 는 「산정특례 질환별 등록기준」 엑셀에서
   특정기호·상병코드·상병일련번호·질환명(국문)만 뽑은 것이다(3,600건이 넘는다).
   여기에 data/symbol-codes.js(「특정기호_20260819.xlsx」 전체 263건)에만 있는 기호를
   「F코드」·「중증질환」·「이식·공여자」·「가정간호」·「중증화상」·「기타 V코드」 구분으로 더해,
   특정기호 263개를 한 화면에서 다 찾을 수 있게 한다. */
const sp = { group: '', page: 0 };
const SP_PAGE = 300;                      // 3,600행이 넘어 한 번에 다 그리면 느리다

/* 특정기호 목록(data/symbol-codes.js)에는 있는데 질환별 등록기준에는 없는 기호가 69개 있다.
   F 기호 27개(본인부담 특례)와, 상병목록이 딸리지 않는 V 기호 42개
   (뇌혈관·심장·중증외상·이식·공여자·가정간호·호스피스·약국 특례 등)다.
   기호 하나를 어느 화면에서 찾을지 헷갈리지 않게 같은 표에 붙인다.
   상병코드·상병일련번호는 이 기호들에 없는 값이라 비워 둔다(추측해 채우지 않는다).
   질환명 칸에는 특정기호 목록의 한글명칭을 원문 그대로 넣고, 끝난 기호만 종료일자를 덧붙인다. */
const SP_F_GROUP = 'F코드';
const SP_V_ETC = '기타 V코드';

/* V 42개는 무엇을 가리키는 기호인지로 나눠 구분(필터)을 따로 둔다.
   배정은 특정기호 목록의 한글명칭을 읽어 손으로 적은 것이다 — 원문에서 자동으로 갈라지지 않는다.
   - 중증질환 5개는 ① 본인부담금 규칙 원문의 표현
     ("중증질환자 중 특정기호 V191,V192,V268,V273,V275 환자")과 같은 묶음이다.
   - 중증화상 5개는 명칭이 「본인일부부담금 산정특례에 관한 기준」[별첨 3](중증도·체표면적 기준)인 것이다.
   - 가정간호는 명칭이 "…가정간호를 받은 경우"인 것 전부다(대상 질환은 달라도 한 묶음).
   - 남는 10개(고엽제 V006 · 약국 특례 V100·V252·V352·V452 · 가정형 호스피스 V301~V304 ·
     희귀질환 V999)는 「기타 V코드」에 둔다. */
const SP_V_GROUPS = [
  ['중증질환',    ['V191', 'V192', 'V268', 'V273', 'V275']],
  ['이식·공여자', ['V073', 'V074', 'V075', 'V076', 'V077', 'V078',
                   'V081', 'V082', 'V083', 'V084', 'V085', 'V086', 'V087', 'V088']],
  ['가정간호',    ['V008', 'V194', 'V231', 'V251', 'V274', 'V293', 'V801', 'V811']],
  ['중증화상',    ['V247', 'V248', 'V250', 'V305', 'V306']]
];
/* 특정기호 목록에서 온 구분들 — 출처 표기(meta-note)와 표의 행 순서에 쓴다.
   화면에 나오는 칩 순서는 아래 spGroups() 가 따로 정한다. */
const SP_SYM_ORDER = [SP_F_GROUP].concat(SP_V_GROUPS.map(g => g[0]), SP_V_ETC);

const SP_IN_SPEC = SPECIAL_CODES.reduce((o, d) => (o[d.sym] = 1, o), {});
const SP_V_OF = {};
for (const [g, list] of SP_V_GROUPS){
  for (const k of list){
    // 특정기호 목록을 갈아 끼웠을 때 없어진/등록기준으로 옮겨간 기호를 조용히 흘리지 않는다
    if (!SYMBOLS[k] || SP_IN_SPEC[k]) console.warn('산정특례 구분에 배정한 기호가 목록에 없다:', k, g);
    SP_V_OF[k] = g;
  }
}
const SP_SYM_ROWS = Object.keys(SYMBOLS).filter(k => !SP_IN_SPEC[k]).sort().map(k => ({
  g: k.charAt(0) === 'F' ? SP_F_GROUP : (SP_V_OF[k] || SP_V_ETC), sym: k, code: '', seq: '',
  name: SYMBOLS[k].n +
        (SYMBOLS[k].to && SYMBOLS[k].to !== '9999.12.31' ? ' (~' + SYMBOLS[k].to + ')' : '')
})).sort((a, b) =>
  SP_SYM_ORDER.indexOf(a.g) - SP_SYM_ORDER.indexOf(b.g) || a.sym.localeCompare(b.sym));
const SP_ROWS = SPECIAL_CODES.concat(SP_SYM_ROWS);

/* 칩 순서 — 자주 보는 다섯 개를 앞에 못 박고(전체 다음), 나머지는 건수 많은 순이다.
   건수가 같으면 원래 순서(등록기준 엑셀 → 특정기호 목록)를 지킨다. */
const SP_HEAD_ORDER = ['F코드', '이식·공여자', '가정간호', '희귀질환', '중증난치질환'];
function spCounts(){
  const n = {};
  for (const d of SP_ROWS) n[d.g] = (n[d.g] || 0) + 1;
  return n;
}
function spGroups(){
  const seen = [];
  for (const d of SP_ROWS) if (!seen.includes(d.g)) seen.push(d.g);
  const n = spCounts();
  const head = SP_HEAD_ORDER.filter(g => seen.includes(g));
  const rest = seen.filter(g => !head.includes(g))
    .sort((a, b) => n[b] - n[a] || seen.indexOf(a) - seen.indexOf(b));
  return head.concat(rest);
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
  const n = spCounts();
  $('sp-groups').innerHTML =
    mk('', '전체', SP_ROWS.length) +
    spGroups().map(g => mk(g, g, n[g])).join('');
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
      (SP_SYM_ORDER.includes(sp.group) ? '특정기호 목록 (2026.8.19. 기준)'
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
