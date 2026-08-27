/* ---------- ③ SAM 파일 레이아웃 ----------
   레이아웃 데이터는 SamEditor 에서 복사해 온 js/layout-*.js 가 들고 있고,
   여기서는 보여주기만 한다. 청구분야 이름·목록은 common.js 에 있다.

   서식버전 (2026-08-27)
     지금 쓰는 레이아웃 말고 **지난 서식버전**도 고를 수 있다. 버전별 자료는
     data/layout-versions.js (심평원 레이아웃 문서에서 뽑은 것) 에 있고,
     고르면 그 버전의 필드 목록으로 표를 다시 그린다.
     지난 버전에는 코드값 배지가 없다 — 문서에서는 코드가 「코드 및 유형」 글 안에 섞여 있어
     따로 떼어내지 않았다. 설명 글에 그대로 들어 있다.                              */
const lo = { claim: 'GEN', rec: 'H', ver: '', rows: [] };

// 레코드 전체 길이 = 필드들의 끝 위치 중 최대값
function recordBytes(layout){
  return layout.fields.reduce((m, f) => Math.max(m, f.pos + f.len - 1), 0);
}

/* ---------- 서식버전 ---------- */
function loVerData(){ return typeof SG_LAYOUT_VERSIONS === 'undefined' ? null : SG_LAYOUT_VERSIONS; }

// 지금 고른 청구분야 · 레코드를 담고 있는 문서 종류 (청구서와 명세서는 버전이 따로 매겨진다)
function loDocKind(claim, rec){
  const D = loVerData();
  if (!D) return '';
  const mine = Object.keys(D).filter(k => D[k].claim === claim);
  const hit = mine.find(k => Object.keys(D[k].vers).some(v => D[k].vers[v][rec]));
  return hit || '';
}
function loVersions(){
  const D = loVerData(), kind = loDocKind(lo.claim, lo.rec);
  if (!D || !kind) return [];
  return Object.keys(D[kind].vers).filter(v => D[kind].vers[v][lo.rec]).sort();
}

// 버전 자료의 배열 한 줄 → 화면이 쓰는 필드 모양. 실제 바이트 = 길이 + 소수부.
function loVerField(a){
  const dec = a[2] || 0;
  return {pos: a[0], len: a[1] + dec, mode: a[3], name: a[4], desc: a[5] || '',
          codes: null, fmt: dec ? dec : undefined};
}
// 지금 그려야 할 레코드 — 버전을 골랐으면 그 버전 자료, 아니면 지금 레이아웃
function loLayout(){
  const D = loVerData(), kind = loDocKind(lo.claim, lo.rec);
  if (lo.ver && D && kind && D[kind].vers[lo.ver] && D[kind].vers[lo.ver][lo.rec])
    return {name: D[kind].label + ' ' + lo.ver, fields: D[kind].vers[lo.ver][lo.rec].map(loVerField)};
  return layoutsOf(lo.claim)[lo.rec];
}
function loRecKeys(){
  const D = loVerData(), kind = loDocKind(lo.claim, lo.rec);
  if (lo.ver && D && kind && D[kind].vers[lo.ver]) return Object.keys(D[kind].vers[lo.ver]);
  return Object.keys(layoutsOf(lo.claim));
}

function renderClaims(){
  $('lo-claims').innerHTML = availableClaims().map(([key, label, note]) =>
    '<button class="chip' + (key === lo.claim ? ' on' : '') + '" data-claim="' + key + '">' + esc(label) +
    (note ? '<small>' + esc(note) + '</small>' : '') + '</button>'
  ).join('');
  $('lo-claims').querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      lo.claim = c.dataset.claim;
      lo.ver = '';                                   // 청구분야를 바꾸면 지금 레이아웃으로 되돌린다
      const recs = Object.keys(layoutsOf(lo.claim));
      if (!recs.includes(lo.rec)) lo.rec = recs[0];
      renderClaims(); renderRecs(); renderVers(); renderTable();
    });
  });
}
function renderRecs(){
  const live = layoutsOf(lo.claim);
  $('lo-recs').innerHTML = loRecKeys().map(k =>
    '<button class="chip' + (k === lo.rec ? ' on' : '') + '" data-rec="' + k + '">' + esc(k) +
    '<small>' + esc(live[k] ? live[k].name : '') + '</small></button>'
  ).join('');
  $('lo-recs').querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      lo.rec = c.dataset.rec;
      if (lo.ver && loVersions().indexOf(lo.ver) < 0) lo.ver = '';   // 그 레코드에 없는 버전이면 되돌린다
      renderRecs(); renderVers(); renderTable();
    });
  });
}

// 서식버전 고르는 칸 — 자료가 없는 청구분야(첩약 · 신포괄 · 자보)는 잠근다
function renderVers(){
  const sel = $('lo-ver'), vers = loVersions();
  if (!sel) return;
  if (!vers.length){
    sel.innerHTML = '<option value="">지금 쓰는 레이아웃</option>';
    sel.disabled = true;
    sel.title = '이 청구분야는 지난 서식버전 자료가 없습니다';
    return;
  }
  sel.disabled = false;
  sel.title = '';
  sel.innerHTML = '<option value="">지금 쓰는 레이아웃</option>' +
    vers.map(v => '<option value="' + esc(v) + '"' + (v === lo.ver ? ' selected' : '') + '>' +
      esc(v) + ' 버전</option>').join('');
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
    for (const f of loLayout().fields) rows.push({claim: lo.claim, rec: lo.rec, f});
  }
  if (needle) rows = rows.filter(r => sgHit(haystack(r.f), needle));
  lo.rows = rows;

  const cur = loLayout();
  const live = layoutsOf(lo.claim)[lo.rec];
  let meta = '<span><b>' + esc(claimLabel(lo.claim)) + '</b> · ' + esc(lo.rec) + ' ' +
               esc(live ? live.name : cur.name) + '</span>' +
             '<span>서식버전 <b>' + (lo.ver ? esc(lo.ver) : '지금') + '</b></span>' +
             '<span>필드 <b>' + cur.fields.length + '</b>개</span>' +
             '<span>레코드 길이 <b>' + recordBytes(cur).toLocaleString() + '</b> byte</span>';
  if (searchAll) meta += '<span>전체 청구분야 검색 <b>' + rows.length + '</b>건</span>';
  else if (needle) meta += '<span>검색 <b>' + rows.length + '</b>건</span>';
  meta += '<span class="meta-note">위치·길이는 바이트(EUC-KR, 한글 2byte) 기준</span>';
  $('lo-meta').innerHTML = meta;

  // 지난 버전을 보는 동안은 지금 기준이 아님을 띠로 알린다 (지난 판 보기와 같은 결)
  const kind = loDocKind(lo.claim, lo.rec);
  $('lo-verbar').innerHTML = !lo.ver ? '' :
    '<div class="upd-banner"><b>' + esc(lo.ver) + ' 버전</b> 레이아웃입니다 — 지금 기준이 아닙니다.' +
    ' <span class="sc-dim">' + esc(kind ? SG_LAYOUT_VERSIONS[kind].label : '') +
    ' · 코드값 배지는 지난 버전에 없습니다(설명 글에 그대로 들어 있습니다).</span>' +
    '<button id="lo-vernow">지금 레이아웃으로</button></div>';
  const now = $('lo-vernow');
  if (now) now.addEventListener('click', () => {
    lo.ver = ''; renderRecs(); renderVers(); renderTable();
  });

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

$('lo-ver').addEventListener('change', e => {
  lo.ver = e.target.value;
  const keys = loRecKeys();
  if (!keys.includes(lo.rec)) lo.rec = keys[0];
  renderRecs(); renderTable();
});
$('lo-search').addEventListener('input', renderTable);
$('lo-pos').addEventListener('input', renderTable);
$('lo-all').addEventListener('change', renderTable);

renderClaims(); renderRecs(); renderVers(); renderTable();
