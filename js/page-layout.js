/* ---------- ③ SAM 파일 레이아웃 ----------
   레이아웃 데이터는 SamEditor 에서 복사해 온 js/layout-*.js 가 들고 있고,
   여기서는 보여주기만 한다. 청구분야 이름·목록은 common.js 에 있다. */
const lo = { claim: 'GEN', rec: 'H', rows: [] };

// 레코드 전체 길이 = 필드들의 끝 위치 중 최대값
function recordBytes(layout){
  return layout.fields.reduce((m, f) => Math.max(m, f.pos + f.len - 1), 0);
}

function renderClaims(){
  $('lo-claims').innerHTML = availableClaims().map(([key, label, note]) =>
    '<button class="chip' + (key === lo.claim ? ' on' : '') + '" data-claim="' + key + '">' + esc(label) +
    (note ? '<small>' + esc(note) + '</small>' : '') + '</button>'
  ).join('');
  $('lo-claims').querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      lo.claim = c.dataset.claim;
      const recs = Object.keys(layoutsOf(lo.claim));
      if (!recs.includes(lo.rec)) lo.rec = recs[0];
      renderClaims(); renderRecs(); renderTable();
    });
  });
}
function renderRecs(){
  const L = layoutsOf(lo.claim);
  $('lo-recs').innerHTML = Object.keys(L).map(k =>
    '<button class="chip' + (k === lo.rec ? ' on' : '') + '" data-rec="' + k + '">' + esc(k) +
    '<small>' + esc(L[k].name) + '</small></button>'
  ).join('');
  $('lo-recs').querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => { lo.rec = c.dataset.rec; renderRecs(); renderTable(); });
  });
}

function fmtLabel(f){
  if (f.fmt === 'money') return '금액';
  if (typeof f.fmt === 'number') return '소수 ' + f.fmt + '자리';
  return '';
}
function codeMatches(k, v, needle){
  return !!needle && (sgHit(k, needle) || sgHit(String(v), needle));
}
function codeChip(k, v, needle){
  return '<span class="code' + (codeMatches(k, v, needle) ? ' mark' : '') + '"><b>' +
    esc(k === '' ? '(공란)' : k) + '</b><span>' + esc(v) + '</span></span>';
}
// 코드값이 많으면 8개까지만 보여주고 접는다. 단, 검색어에 걸린 코드가 뒤쪽에 있으면 처음부터 펼친다.
const CODE_LIMIT = 8;
function codesHtml(f, needle, expanded){
  if (!f.codes) return '';
  const order = codesOrder(f.codes);
  const hitBeyond = needle && order.slice(CODE_LIMIT).some(k => codeMatches(k, f.codes[k], needle));
  const collapsed = !expanded && !hitBeyond && order.length > CODE_LIMIT;
  const shown = collapsed ? order.slice(0, CODE_LIMIT) : order;
  return '<div class="codes">' +
    shown.map(k => codeChip(k, f.codes[k], needle)).join('') +
    (collapsed ? '<button class="more">+' + (order.length - CODE_LIMIT) + '개 더</button>' : '') +
    '</div>';
}

// 검색 대상 — 항목명·설명·코드값·코드뜻을 모두 합친 문자열
function haystack(f){
  let s = f.name + ' ' + f.desc;
  if (f.codes) for (const k of codesOrder(f.codes)) s += ' ' + k + ' ' + f.codes[k];
  return s.toLowerCase();
}

function renderTable(){
  const needle = $('lo-search').value.trim().toLowerCase();
  const posQ = parseInt($('lo-pos').value, 10);
  const searchAll = $('lo-all').checked && !!needle;

  let rows = [];   // {claim, rec, f}
  if (searchAll){
    for (const [key] of availableClaims()){
      const L = layoutsOf(key);
      for (const rk of Object.keys(L))
        for (const f of L[rk].fields) rows.push({claim: key, rec: rk, f});
    }
  } else {
    const L = layoutsOf(lo.claim);
    for (const f of L[lo.rec].fields) rows.push({claim: lo.claim, rec: lo.rec, f});
  }
  if (needle) rows = rows.filter(r => sgHit(haystack(r.f), needle));
  lo.rows = rows;

  const cur = layoutsOf(lo.claim)[lo.rec];
  let meta = '<span><b>' + esc(claimLabel(lo.claim)) + '</b> · ' + esc(lo.rec) + ' ' + esc(cur.name) + '</span>' +
             '<span>필드 <b>' + cur.fields.length + '</b>개</span>' +
             '<span>레코드 길이 <b>' + recordBytes(cur).toLocaleString() + '</b> byte</span>';
  if (searchAll) meta += '<span>전체 청구분야 검색 <b>' + rows.length + '</b>건</span>';
  else if (needle) meta += '<span>검색 <b>' + rows.length + '</b>건</span>';
  meta += '<span class="meta-note">위치·길이는 바이트(EUC-KR, 한글 2byte) 기준</span>';
  $('lo-meta').innerHTML = meta;

  if (!rows.length){
    $('lo-table').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
    return;
  }

  const showSrc = searchAll;
  let html = '<table class="fields"><thead><tr>' +
    (showSrc ? '<th>서식</th>' : '') +
    '<th>위치(byte)</th><th>길이</th><th>형식</th><th>항목명</th><th>설명 · 코드값</th></tr></thead><tbody>';
  rows.forEach((r, i) => {
    const f = r.f, end = f.pos + f.len - 1;
    const hit = !isNaN(posQ) && !searchAll && posQ >= f.pos && posQ <= end;
    html += '<tr data-i="' + i + '"' + (hit ? ' class="hit" id="lo-hit"' : '') + '>' +
      (showSrc ? '<td class="rec-src">' + esc(claimLabel(r.claim)) + '<br>' + esc(r.rec) + '</td>' : '') +
      '<td class="c-pos">' + f.pos + ' ~ ' + end + '</td>' +
      '<td class="c-len">' + f.len + '</td>' +
      '<td class="c-type"><span class="tag ' + esc(f.mode) + '">' + esc(f.mode) + '</span>' +
        (fmtLabel(f) ? '<span class="tag fmt">' + esc(fmtLabel(f)) + '</span>' : '') + '</td>' +
      '<td class="c-name">' + esc(f.name) + '</td>' +
      '<td class="c-desc">' + esc(f.desc) + codesHtml(f, needle, false) + '</td>' +
    '</tr>';
  });
  $('lo-table').innerHTML = html + '</tbody></table>';

  // "+N개 더" — 그 줄의 코드값만 전부 펼친다
  $('lo-table').querySelectorAll('.more').forEach(b => {
    b.addEventListener('click', () => {
      const tr = b.closest('tr');
      const f = lo.rows[Number(tr.dataset.i)].f;
      tr.querySelector('.codes').outerHTML = codesHtml(f, needle, true);
    });
  });

  const hitRow = $('lo-hit');
  if (hitRow) hitRow.scrollIntoView({block: 'center', behavior: 'smooth'});
}

$('lo-search').addEventListener('input', renderTable);
$('lo-pos').addEventListener('input', renderTable);
$('lo-all').addEventListener('change', renderTable);

renderClaims(); renderRecs(); renderTable();
