/* ---------- [별표12] 소아가산 ----------
   data/b12-codes.js 는 심평원 「★ 별표12 신포괄 보상률 정리본_(별첨)별도보상마스터
   (기관안내용).xlsx」의 두 시트를 옮긴 것이다 (변환: tools/b12.ps1).
     2.소아가산관련행위목록  → B12_ACTS      618행
     3-1.마취료 코드조합     → B12_MAP 24행 · B12_COMBO 36행 · B12_RATE 참고표

   한 화면에 성격이 다른 표 두 덩어리가 들어와서, 필터 두 줄 규칙(CLAUDE.md)을 이렇게 쓴다.
     첫 줄  .chips-seg  대분류 = 무엇을 보는지 (행위 목록 / 마취료 코드조합)
     둘째 줄 .chips-rec 소분류 = 행위 목록 안의 구분 ([별표12] 신설 · 기존 · 외이도재건술)
   연령(6세 미만 / 6세 이상~16세 미만)은 셋째 칩 줄을 만들지 않고 검색줄의 선택상자로 둔다.

   원문 3-1 가운데 표는 첫·둘·셋째 자리가 2행짜리 병합 셀이라 같은 코드조합에
   신설(별표12)·기존(별표12) 두 줄이 달린다. 약국 산정특례와 같은 이유로 화면에서도
   병합을 되살리지 않고 **행마다 그대로 적는다** — 걸러 보거나 검색해 행이 흩어졌을 때
   빈 칸이 "위와 같음" 인지 "값 없음" 인지 헷갈리면 안 되기 때문이다.
------------------------------------------------------------------ */

/* 열 너비 기본값은 % 로 적는다(합 100) — px 로 박으면 좁은 창에서 가로 스크롤이 생긴다.
   머리줄 손잡이로 끌어 바꾼 값이 있으면 그쪽이 이긴다(common.js). */
const BT_ACT_COLW   = ['12%', '9%', '36%', '11%', '8%', '11%', '13%'];
const BT_ACT_TKEY   = 'b12#acts7';
const BT_MAP_COLW   = ['22%', '22%', '34%', '22%'];
const BT_MAP_TKEY   = 'b12#map4';
const BT_COMBO_COLW = ['11%', '11%', '9%', '10%', '10%', '9%', '19%', '21%'];
const BT_COMBO_TKEY = 'b12#combo8';

const BT_VIEWS = [['acts', '소아가산 관련 행위 목록'], ['anes', '마취료 코드조합']];
const BT_GBS   = [...new Set(B12_ACTS.map(d => d.gb))];

const bt = { view: 'acts', gb: '', age: '' };

function btNeedle(){ return $('bt-search').value.trim().toLowerCase(); }
function btMark(t){ return hilite(t || '', btNeedle()); }
// 원문 줄바꿈은 살리고, 빈 칸은 "값 없음" 이 보이도록 — 로 채운다
function btCell(t){ return t ? btMark(t).replace(/\n/g, '<br>') : '<span class="saved-note">—</span>'; }
function btHead(head, colw){
  return '<thead><tr>' + head.map((h, i) =>
    '<th style="width:' + colw[i] + '">' + esc(h).replace(/\n/g, '<br>') + '</th>').join('') + '</tr></thead>';
}
function btColw(key, def){
  const saved = colwOf(key, def.length);            // common.js — 열 개수가 같을 때만 돌려준다
  return saved ? saved.map(n => n + 'px') : def;
}

/* ---------- 대분류: 무엇을 보는지 ----------
   chipRow() 는 "전체 + 값" 꼴이라 여기서는 쓰지 않는다(전체가 없는 두 갈래 선택). */
function renderBtViews(){
  const n = v => v === 'acts' ? B12_ACTS.length : (B12_MAP.length + B12_COMBO.length);
  $('bt-views').innerHTML = BT_VIEWS.map(([v, label]) =>
    '<button class="chip' + (bt.view === v ? ' on' : '') + '" data-v="' + v + '">' +
    esc(label) + '<small>' + n(v) + '</small></button>').join('');
  $('bt-views').querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    bt.view = c.dataset.v;
    renderBtViews(); renderBtRow2(); renderBtBody();
  }));
}

/* ---------- 소분류: 행위 목록 안의 구분 ---------- */
function renderBtGbs(){
  chipRow($('bt-gbs'), BT_GBS, bt.gb, '전체',
    v => (v ? B12_ACTS.filter(d => d.gb === v).length : B12_ACTS.length),
    v => { bt.gb = v; renderBtGbs(); renderBtBody(); });
}
// 마취료 코드조합에는 구분·연령이 없다 — 줄을 통째로 감춘다(상단 바 높이가 바뀌므로 다시 잰다)
function renderBtRow2(){
  const on = bt.view === 'acts';
  $('bt-gb-row').style.display   = on ? '' : 'none';
  $('bt-age-wrap').style.display = on ? '' : 'none';
  if (on) renderBtGbs();
  setStickTop();
}

/* ---------- ② 소아가산 관련 행위 목록 ---------- */
function btActs(){
  const needle = btNeedle();
  return B12_ACTS.filter(d =>
    (!bt.gb  || d.gb === bt.gb) &&
    (!bt.age || d[bt.age] === '해당') &&
    (!needle || [d.cls, d.code, d.name, d.gb, d.note].join(' ').toLowerCase().includes(needle)));
}
function btActsHtml(){
  const rows = btActs();
  const colw = btColw(BT_ACT_TKEY, BT_ACT_COLW);
  const ageLabel = bt.age === 'u6' ? B12_ACT_HEAD[4] : bt.age === 'a16' ? B12_ACT_HEAD[5] : '';

  const meta =
    '<div class="meta-bar">' +
      '<span><b>' + esc(bt.gb || '전체') + '</b>' + (ageLabel ? ' · ' + esc(ageLabel) : '') + '</span>' +
      '<span>' + rows.length + '행' +
        (rows.length === B12_ACTS.length ? '' : ' / 전체 ' + B12_ACTS.length + '행') + '</span>' +
      '<span class="meta-note">' + esc(B12_ACT_TITLE) + '</span>' +
    '</div>';

  if (!rows.length) return '<div class="card">' + meta + '<div class="empty">검색 결과가 없습니다.</div></div>';

  const yn = v => v === '해당' ? '<b class="b12-y">' + btMark(v) + '</b>' : '<span class="saved-note">—</span>';

  return '<div class="card">' + meta +
    '<table class="fields b12-act fixed" data-k="' + BT_ACT_TKEY + '">' +
    btHead(B12_ACT_HEAD, colw) + '<tbody>' +
    rows.map(d =>
      '<tr><td class="b12-cls">'  + btMark(d.cls)  + '</td>' +
      '<td class="b12-code">'     + btMark(d.code) + '</td>' +
      '<td class="b12-name">'     + btMark(d.name) + '</td>' +
      '<td class="b12-gb">'       + btMark(d.gb)   + '</td>' +
      '<td class="b12-yn">'       + yn(d.u6)       + '</td>' +
      '<td class="b12-yn">'       + yn(d.a16)      + '</td>' +
      '<td class="b12-note">'     + btCell(d.note) + '</td></tr>').join('') +
    '</tbody></table></div>' +
    /* 시트 머리말(엑셀 2행) — 어떤 기준으로 '해당' 이 붙었는지가 여기 적혀 있다 */
    '<div class="card b12-intro"><div class="card-pad">' +
      '<div class="b12-intro-h">원문 머리말</div>' +
      B12_ACT_INTRO.map(s =>
        '<p class="b12-note-p' + (/^\s*-/.test(s) ? ' d1' : '') + '">' + btMark(s.trim()) + '</p>').join('') +
    '</div></div>';
}

/* ---------- ③-1 마취료 코드조합 ---------- */
function btAnesHtml(){
  const needle = btNeedle();
  const hit = arr => !needle || arr.join(' ').toLowerCase().includes(needle);

  const map   = B12_MAP.filter(d => hit([d.c5, d.cm]));
  const combo = B12_COMBO.filter(d => hit([d.d1, d.d2, d.d3, d.rate, d.dose, d.g1, d.g2, d.g3]));
  const mc = btColw(BT_MAP_TKEY, BT_MAP_COLW);
  const cc = btColw(BT_COMBO_TKEY, BT_COMBO_COLW);
  const o  = v => v ? '<b class="b12-y">' + btMark(v) + '</b>' : '<span class="saved-note">—</span>';

  let html =
    '<div class="card"><div class="meta-bar">' +
      '<span><b>' + esc(B12_MAP_TITLE) + '</b></span>' +
      '<span>' + map.length + '행' + (map.length === B12_MAP.length ? '' : ' / 전체 ' + B12_MAP.length + '행') + '</span>' +
      '<span class="meta-note">3-1.마취료 코드조합</span>' +
    '</div>' +
    (map.length
      ? '<table class="fields b12-map fixed" data-k="' + BT_MAP_TKEY + '">' + btHead(B12_MAP_HEAD, mc) + '<tbody>' +
        map.map(d =>
          '<tr><td class="b12-code">' + btMark(d.c5) + '</td>' +
          '<td class="b12-code">'     + btMark(d.cm) + '</td>' +
          '<td class="b12-yn">'       + o(d.sa)      + '</td>' +
          '<td class="b12-yn">'       + o(d.em)      + '</td></tr>').join('') +
        '</tbody></table>'
      : '<div class="empty">검색 결과가 없습니다.</div>') +
    '</div>';

  html +=
    '<div class="card"><div class="meta-bar">' +
      '<span><b>' + esc(B12_COMBO_TITLE) + '</b></span>' +
      '<span>' + combo.length + '행' + (combo.length === B12_COMBO.length ? '' : ' / 전체 ' + B12_COMBO.length + '행') + '</span>' +
      '<span class="meta-note">첫·둘·셋째 자리는 원문 병합 셀을 풀어 행마다 적었다</span>' +
    '</div>' +
    (combo.length
      ? '<table class="fields b12-combo fixed" data-k="' + BT_COMBO_TKEY + '">' + btHead(B12_COMBO_HEAD, cc) + '<tbody>' +
        combo.map(d =>
          '<tr><td class="b12-dig">'  + btCell(d.d1)   + '</td>' +
          '<td class="b12-dig">'      + btCell(d.d2)   + '</td>' +
          '<td class="b12-dig">'      + btCell(d.d3)   + '</td>' +
          '<td class="b12-num">'      + btMark(d.rate) + '</td>' +
          '<td class="b12-num">'      + btMark(d.dose) + '</td>' +
          '<td class="b12-yn">'       + o(d.g1)        + '</td>' +
          '<td class="b12-yn">'       + o(d.g2)        + '</td>' +
          '<td class="b12-yn">'       + o(d.g3)        + '</td></tr>').join('') +
        '</tbody></table>'
      : '<div class="empty">검색 결과가 없습니다.</div>') +
    '</div>';

  /* 참고 보상율 — 원문은 4열 한 덩어리(머리줄 두 줄 병합)라, 화면에서는 2열짜리 작은 표 둘로 나눈다.
     행이 다섯 줄뿐이라 머리줄을 고정하지 않는다(.b12-rate th{position:static}). */
  const mini = (title, sub, pairs) =>
    '<div class="b12-rate-col">' +
      '<div class="b12-rate-h">' + esc(title) + '</div>' +
      '<table class="fields b12-rate"><thead><tr>' +
        '<th>' + esc(sub[0]) + '</th><th>' + esc(sub[1]) + '</th>' +
      '</tr></thead><tbody>' +
      pairs.map(([k, v]) =>
        '<tr><td class="b12-dig">' + btCell(k) + '</td>' +
        '<td class="b12-num">' + btMark(v) + '</td></tr>').join('') +
      '</tbody></table>' +
    '</div>';

  html +=
    '<div class="card b12-intro"><div class="card-pad">' +
      '<div class="b12-intro-h">' + esc(B12_RATE_TITLE) + '</div>' +
      '<div class="b12-rate-wrap">' +
        mini(B12_RATE_HEAD[0], [B12_RATE_SUB[0], B12_RATE_SUB[1]], B12_RATE.sa) +
        mini(B12_RATE_HEAD[1], [B12_RATE_SUB[2], B12_RATE_SUB[3]], B12_RATE.em) +
      '</div>' +
      '<p class="b12-note-p">' + btMark(B12_RATE_NOTE) + '</p>' +
    '</div></div>';

  return html;
}

function renderBtBody(){
  $('bt-body').innerHTML = bt.view === 'acts' ? btActsHtml() : btAnesHtml();
}

$('bt-search').addEventListener('input', renderBtBody);
$('bt-age').addEventListener('change', () => { bt.age = $('bt-age').value; renderBtBody(); });
renderBtViews(); renderBtRow2(); renderBtBody();
