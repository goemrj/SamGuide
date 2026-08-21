/* ---------- common.js — 카테고리 화면들이 함께 쓰는 것만 모아 둔다 ----------

   파일 나누는 규칙
     js/common.js        여기. 화면 전환 + 두 개 이상의 화면이 쓰는 도우미 함수
     js/page-<이름>.js   카테고리 한 개당 한 파일. 그 화면에서만 쓰는 것은 전부 그 안에 둔다
     data/<이름>.js      원본 자료를 변환한 데이터 (tools/ 의 스크립트가 자동 생성)

   카테고리를 새로 만들 때
     1. index.html 에 사이드바 버튼(data-page="<이름>")과 <section id="page-<이름>"> 을 넣는다
     2. js/page-<이름>.js 를 새로 만들고 index.html 맨 아래에 <script> 로 건다
     3. 한 화면에서만 쓰는 함수·상수는 절대 common.js 에 넣지 않는다
        (두 번째 화면이 같은 것을 쓰게 되는 순간에만 여기로 옮긴다)
   ------------------------------------------------------------------------ */

function esc(s){
  return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}
function $(id){ return document.getElementById(id); }

/* ---------- 화면 전환 ---------- */
document.querySelectorAll('.navbtn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.navbtn').forEach(b => b.classList.toggle('on', b === btn));
    const id = btn.dataset.page;
    document.querySelectorAll('.page').forEach(p => p.classList.toggle('on', p.id === 'page-' + id));
    localStorage.setItem('samguide_page', id);
    setStickTop();                       // 화면마다 상단 바 높이가 다르다
    window.scrollTo(0, 0);
  });
});
// 마지막에 보던 화면으로 되돌린다. 각 page-*.js 가 다 로드된 뒤에 눌러야 하므로 맨 끝에서 실행한다.
function restoreLastPage(){
  const saved = localStorage.getItem('samguide_page');
  if (!saved) return;
  const btn = document.querySelector('.navbtn[data-page="' + saved + '"]');
  if (btn) btn.click();
}

/* ---------- 청구분야 — ③ SAM 레이아웃과 ④ 항·목이 함께 쓴다 ---------- */
const CLAIM_LABELS = [
  ['GEN',        '건강보험·의료급여',  '의·치과'],
  ['DRG',        '질병군(DRG)',        '포괄수가'],
  ['NDRG',       '신포괄',             ''],
  ['MG',         '의료급여정액',       ''],
  ['WANHWA',     '완화(호스피스)',     'GEN과 동일'],
  ['HANBANG',    '한방',               ''],
  ['CHUB',       '한방 첩약',          ''],
  ['SANJAE',     '산재',               ''],
  ['SANJAE_HAN', '산재 한방',          ''],
  ['JABO',       '자보',               ''],
  ['JABO_HAN',   '자보 한방',          ''],
];
function claimLabel(key){
  const row = CLAIM_LABELS.find(r => r[0] === key);
  return row ? row[1] : key;
}
function availableClaims(){
  return CLAIM_LABELS.filter(r => CLAIM_TYPES[r[0]] && CLAIM_TYPES[r[0]].layouts);
}
function layoutsOf(claim){ return CLAIM_TYPES[claim].layouts; }

/* ---------- 화면 도우미 ---------- */

// "전체 + 항목들" 형태의 필터 칩 한 줄. counter(값)는 그 칩에 붙일 개수를 돌려준다.
function chipRow(el, list, curVal, allLabel, counter, onPick){
  const mk = (val, label) =>
    '<button class="chip' + (curVal === val ? ' on' : '') + '" data-v="' + esc(val) + '">' +
    esc(label) + '<small>' + counter(val) + '</small></button>';
  el.innerHTML = mk('', allLabel) + list.map(v => mk(v, v)).join('');
  el.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => onPick(c.dataset.v)));
}

// 검색어에 걸린 부분을 노란색으로. 반드시 esc 를 먼저 해서 태그가 끼어들 여지를 없앤다.
function hilite(text, needle){
  const s = esc(text);
  if (!needle) return s;
  const re = new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  return s.replace(re, m => '<mark>' + m + '</mark>');
}

// CCYYMMDD → 2025.01.01 (99991231 은 "현재")
function ymd(s){
  if (!s) return '';
  if (s === '99991231') return '현재';
  return s.slice(0, 4) + '.' + s.slice(4, 6) + '.' + s.slice(6, 8);
}

/* ---------- 숫자 ---------- */
function pct(r){ return (Math.round(r * 1000) / 10) + '%'; }
function won(n){ return Math.round(n).toLocaleString(); }
function won2(n){
  const r = Math.round(n * 100) / 100;
  return r.toLocaleString(undefined, {maximumFractionDigits: 2});
}
function parseMoney(v){ return Math.max(0, Math.round(Number(String(v).replace(/[^0-9.]/g, '')) || 0)); }

/* ---------- 상단 바 고정 높이 ----------
   화면마다 상단 바(① 은 .b2-top, 나머지는 .page-head)의 높이가 달라서,
   표의 머리줄을 그 아래에 붙이려면 높이를 재서 CSS 변수로 넘겨야 한다.
   th { top: var(--stick) } 가 이 값을 쓴다. */
function setStickTop(){
  const p = document.querySelector('.page.on');
  const bar = p && (p.querySelector(".b2-top") || p.querySelector(".page-top") || p.querySelector(".page-head"));
  const h = bar ? Math.round(bar.getBoundingClientRect().height) : 0;
  document.documentElement.style.setProperty('--stick', h + 'px');
}
window.addEventListener('resize', setStickTop);

/* ---------- 열 너비 손으로 조절 (모든 화면의 표) ----------
   머리줄 칸 사이 경계를 끌어서 너비를 바꾼다. **두 열이 폭을 주고받아** 표 전체 폭은
   변하지 않는다 — 좌우 스크롤을 만들지 않는다는 전제(CLAUDE.md)를 지키기 위한 것이다.
   바꾼 값은 localStorage 에 남아 새로고침해도 유지되고, 손잡이를 두 번 누르면 초기화된다. */
const COLW_KEY = 'samguide_colw';
const COLW = (() => {
  try {
    const v = JSON.parse(localStorage.getItem(COLW_KEY) || '{}');
    return (v && typeof v === 'object' && !Array.isArray(v)) ? v : {};
  } catch (e) { return {}; }
})();
function saveColW(){
  try { localStorage.setItem(COLW_KEY, JSON.stringify(COLW)); } catch (e) {}
}
/* 너비는 두 겹이다 (2026-08-21).
     COLW_DEFAULTS  data/colw-defaults.js — 소스에 박아 둔 기본값. 깃에 올라가므로
                    브라우저 데이터를 지우든 다른 PC 에서 열든 같은 너비로 열린다.
     COLW           localStorage — 이 브라우저에서만 쓰는 덧쓰기. 있으면 이쪽이 이긴다.
   손잡이를 두 번 누르면 덧쓰기만 지워 소스 기본값으로 돌아간다. */
function colwRaw(key){
  if (Object.prototype.hasOwnProperty.call(COLW, key)) return COLW[key];
  const D = (typeof COLW_DEFAULTS === 'undefined') ? {} : COLW_DEFAULTS;
  return D[key];
}
/* 저장값은 열 개수가 지금과 같을 때만 쓴다 — 열을 감추거나 늘리면 자리가 어긋난다.
   0 이나 음수처럼 말이 안 되는 값이 섞이면 통째로 버린다 — 그대로 쓰면 열이 사라져
   표를 읽을 수 없게 되고, 사용자는 "너비가 저절로 이상해졌다"로만 느낀다. */
function colwOf(key, n){
  const v = colwRaw(key);
  if (!Array.isArray(v) || v.length !== n) return null;
  return v.every(x => typeof x === 'number' && isFinite(x) && x >= 24) ? v : null;
}
/* 너비를 재고 손잡이를 꽂을 줄. 보통은 머리줄이고, 세부작성요령 안의 표(table.dt-tb)처럼
   <thead> 가 없는 표는 첫 줄을 쓴다. 칸이 하나뿐이면(colspan 한 줄) 조절할 짝이 없어 null. */
function headCells(table){
  const r = (table.tHead && table.tHead.rows[0]) ||
            (table.tBodies[0] && table.tBodies[0].rows[0]);
  if (!r || r.cells.length < 2) return null;
  return [...r.cells];
}
/* 표를 가리키는 이름. 스스로 data-k 를 달아 둔 표(① 카드들 · 특정내역)는 그것을 쓰고,
   나머지는 "화면id#표순서#열수" 로 만든다. */
function colwKey(table){
  if (table.dataset.k) return table.dataset.k;
  const page = table.closest('.page');
  const all = [...(page || document).querySelectorAll('table')];
  return (page ? page.id : 'x') + '#' + all.indexOf(table) +
         '#' + (headCells(table) || []).length;
}
const COLW_MIN = 48;
/* 이 행 수까지는 끌 때 표가 바로 따라 움직이고, 넘으면 안내선만 움직인다.
   ① 본인부담금 규칙의 카드들(대개 수십 행)은 바로 따라 움직이고,
   특정내역·산정특례·소아가산·응급의료행위처럼 긴 표는 안내선으로 넘어간다. */
const RZ_LIVE_ROWS = 60;

/* 표 전체 폭(맨 오른쪽 세로줄 자리)도 저장한다 — 열 너비와 같은 저장소에 "이름|w" 로 둔다.
   끝선을 옮길 수 있는 표는 **본문 안의 표**(table.dt-tb)뿐이다. 카테고리 화면의 큰 표는
   카드 폭을 꽉 채우는 것이 규칙이라(가로 스크롤 금지 전제) 끝선을 두지 않는다. */
const RZ_END_SEL = 'table.dt-tb:not(.dt-ex)';
function colwEndOf(key){
  const v = colwRaw(key + '|w');
  return (typeof v === 'number' && isFinite(v) && v >= 120) ? v : null;
}

/* 머리줄 칸마다 오른쪽 경계에 손잡이를 하나씩 넣는다.
   마지막 열에는 짝이 없어 보통은 넣지 않지만, 본문 안의 표는 그 자리가 **표 끝선**이라
   끝선을 옮기는 손잡이(.rz-end)를 넣는다.
   화면을 다시 그릴 때마다 없어지므로 아래 MutationObserver 가 다시 넣는다. */
function addGrips(root){
  /* 계산기의 입력 표(table.fields.items — 원장 · MG·병원 비교)는 뺀다.
     자료 표가 아니라 입력 UI 라 열을 끌 일이 없고, 예전에 저장해 둔 픽셀 너비가
     되살아나면 카드보다 넓어져 옆 카드와 겹친다 (2026-08-21). */
  const sel = 'table.b2, table.fields:not(.items), table.dt-tb:not(.dt-ex)';
  (root || document).querySelectorAll(sel).forEach(t => {
    const ths = headCells(t);
    if (!ths) return;
    const canEnd = t.matches(RZ_END_SEL);
    ths.forEach((th, i) => {
      const last = i === ths.length - 1;
      if (th.querySelector('.rz')) return;
      if (last && !canEnd) return;
      const g = document.createElement('span');
      g.className = last ? 'rz rz-end' : 'rz';
      g.title = last ? '끌어서 표 끝선 옮기기 (두 번 누르면 원래대로)'
                     : '끌어서 열 너비 조절 (두 번 누르면 원래대로)';
      th.appendChild(g);
    });
    applyColW(t);
  });
}

/* 정해 둔 너비(덧쓰기 → 소스 기본값)를 표에 입힌다. 둘 다 없으면 손대지 않는다
   — 그 표는 page-*.js 의 % 기본값이나 내용에 맞춘 폭 그대로 둔다. */
function applyColW(t){
  const ths = headCells(t);
  if (!ths) return;
  const key = colwKey(t);
  const saved = colwOf(key, ths.length);
  const endW = t.matches(RZ_END_SEL) ? colwEndOf(key) : null;
  if (!saved && !endW) return;
  t.classList.add('fixed');
  t.style.width = endW ? endW + 'px' : '100%';
  if (saved) ths.forEach((th, i) => { th.style.width = saved[i] + 'px'; });
}

/* 끌기 시작할 때 지금 보이는 너비를 그대로 못박고 표를 fixed 로 바꾼다.
   그러지 않으면 한 열만 건드려도 브라우저가 나머지 열을 제멋대로 다시 계산한다. */
function pinWidths(table){
  const ths = headCells(table);
  if (!ths) return null;
  const w = ths.map(th => th.getBoundingClientRect().width);
  const tw = table.getBoundingClientRect().width;
  table.classList.add('fixed');
  // 끝선을 옮겨 둔 표(폭이 px)는 그 폭을 그대로 둔다 — 100% 로 되돌리면 끝선이 튄다
  if (!/px$/.test(table.style.width)) table.style.width = '100%';
  ths.forEach((th, i) => { th.style.width = w[i] + 'px'; });
  return { ths, w, tw };                    // 잰 너비도 함께 — 끝날 때 다시 재지 않으려고
}

document.addEventListener('mousedown', e => {
  const grip = e.target.closest('.rz');
  if (!grip) return;
  const th = grip.parentElement, table = th.closest('table');
  if (!table) return;
  const pin = pinWidths(table);
  if (!pin) return;
  const ths = pin.ths;
  const i = ths.indexOf(th), next = ths[i + 1];
  /* 끝선 손잡이(.rz-end)는 짝이 없다 — 마지막 열과 **표 전체 폭**을 같이 늘리고 줄인다.
     칸(부모)보다 넓어지지 않게 자른다: 표가 칸을 넘으면 페이지에 가로 스크롤이 생긴다. */
  const endMode = grip.classList.contains('rz-end');
  if (!endMode && !next) return;

  e.preventDefault();                       // 끌 때 글자가 선택되지 않게
  const x0 = e.clientX;
  const w0 = pin.w[i], n0 = endMode ? 0 : pin.w[i + 1];
  const t0 = pin.tw;
  const room = table.parentElement ? table.parentElement.clientWidth : t0;
  document.body.classList.add('rz-on');

  /* 끌 때 표를 건드릴지, 안내선만 옮길지 — 행 수로 정한다.
     열 폭을 1px 바꾸면 table-layout:fixed 라도 그 두 열의 글자를 모든 행에서 다시 흘려야 해서
     표 전체가 다시 배치된다. 재어 보니 한 번에 특정내역(164행) 13ms · 소아가산(618행) 32ms ·
     응급의료행위(1,277행) 54ms 라, 마우스를 움직이는 내내 화면이 멎은 것처럼 느껴졌다.
     그래서 큰 표는 **엑셀처럼 세로 안내선만 옮기고 폭은 놓을 때 한 번만** 준다.
     작은 표는 원래대로 바로 따라 움직인다 — 공짜(1ms 미만)이고 그 편이 보기 좋다. */
  const body = table.tBodies[0];
  const live = !body || body.rows.length <= RZ_LIVE_ROWS;

  let d = 0, raf = 0, line = null, edge = 0;
  if (!live){
    // 안내선은 마우스를 누른 자리가 아니라 **지금 열 경계**에서 시작한다
    // (손잡이가 9px 폭이라 누른 자리는 경계에서 몇 px 어긋나 있다)
    edge = th.getBoundingClientRect().right;
    line = document.createElement('div');
    line.className = 'rz-line';
    line.style.left = edge + 'px';
    document.body.appendChild(line);
  }
  // 표를 따라 움직이는 쪽만 프레임당 한 번으로 모은다(레이아웃이 비싸다).
  // 안내선은 위치만 바꾸면 되니 바로 옮긴다 — rAF 는 화면이 가려지면 멈춘다.
  const draw = () => {
    raf = 0;
    th.style.width = (w0 + d) + 'px';
    if (endMode) table.style.width = (t0 + d) + 'px';
    else next.style.width = (n0 - d) + 'px';
  };
  const move = ev => {
    const dx = ev.clientX - x0;
    // 끝선은 마지막 열 최소 폭과 칸(부모) 폭 사이로, 열 경계는 두 열 최소 폭 사이로 자른다
    d = endMode ? Math.max(COLW_MIN - w0, Math.min(dx, room - t0))
                : Math.max(COLW_MIN - w0, Math.min(dx, n0 - COLW_MIN));
    if (line) line.style.left = (edge + d) + 'px';
    else if (!raf) raf = requestAnimationFrame(draw);
  };
  const up = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    if (raf) cancelAnimationFrame(raf);
    if (line) line.remove();
    document.body.classList.remove('rz-on');
    // 안내선으로 끌었으면 여기서 딱 한 번 폭을 준다(표를 한 번만 다시 배치한다)
    th.style.width = (w0 + d) + 'px';
    if (endMode) table.style.width = (t0 + d) + 'px';
    else next.style.width = (n0 - d) + 'px';
    // 저장값은 계산으로 만든다 — 여기서 다시 재면 방금 준 폭 때문에 레이아웃이 한 번 더 돈다
    const out = pin.w.map(v => Math.round(v));
    out[i] = Math.round(w0 + d);
    if (!endMode) out[i + 1] = Math.round(n0 - d);
    const key = colwKey(table);
    COLW[key] = out;
    if (endMode) COLW[key + '|w'] = Math.round(t0 + d);
    saveColW();
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
});

/* 손잡이를 두 번 누르면 이 브라우저의 덧쓰기를 버리고 **소스 기본값**으로 돌아간다.
   기본값도 없으면 page-*.js 의 % 기본값(= 처음 모양)으로 돌아간다. */
document.addEventListener('dblclick', e => {
  const grip = e.target.closest('.rz');
  if (!grip) return;
  const table = grip.closest('table');
  if (!table) return;
  const key = colwKey(table);
  delete COLW[key];
  delete COLW[key + '|w'];                  // 표 끝선도 처음 자리로
  saveColW();
  table.classList.remove('fixed');
  table.style.width = '';
  (headCells(table) || []).forEach(th => { th.style.width = ''; });
  applyColW(table);                         // 소스 기본값이 있으면 그것으로
});

/* ---------- 지금 너비를 소스 기본값으로 굳히기 (2026-08-21) ----------
   끌어서 바꾼 너비는 localStorage 에만 남아 그 브라우저에서만 유효하다.
   사이드바 맨 아래 버튼을 누르면 지금 너비를 **data/colw-defaults.js 에 써서** 깃에 올릴 수
   있게 만든다 — 그러면 브라우저 데이터를 지우든 다른 PC 에서 열든 같은 너비로 열린다.

   serve.ps1 로 열었으면(http://localhost:8392) 그 파일을 바로 덮어쓰고,
   index.html 을 더블클릭해 연 경우(file://)에는 파일을 내려받아 준다 — data/ 에 덮어 넣으면 된다. */
const COLW_FILE = 'data/colw-defaults.js';

function colwDefaultsText(){
  const D = (typeof COLW_DEFAULTS === 'undefined') ? {} : COLW_DEFAULTS;
  const merged = Object.assign({}, D, COLW);          // 이 브라우저의 덧쓰기가 이긴다
  const keys = Object.keys(merged).sort();
  const head = [
    '/* ---------- 열 너비 기본값 (자동 생성 — 「열 너비 기본값으로 굳히기」가 다시 쓴다) ----------',
    '   끌어서 바꾼 너비를 소스에 박아 둔 것이다. 깃에 올라가므로 브라우저 데이터를 지우든',
    '   다른 PC · 다른 브라우저에서 열든 같은 너비로 열린다. 자세한 것은 README 참조.',
    '   모양: {"표이름": [열 너비 px, …], "표이름|w": 표 전체 폭 px}',
    '------------------------------------------------------------------ */',
    'const COLW_DEFAULTS = {',
  ];
  const body = keys.map(k =>
    '  ' + JSON.stringify(k) + ': ' + JSON.stringify(merged[k]) + ',');
  return head.concat(body, ['};', '']).join('\n');
}

async function freezeColW(say){
  const text = colwDefaultsText();
  const n = Object.keys(Object.assign({}, (typeof COLW_DEFAULTS === 'undefined' ? {} : COLW_DEFAULTS), COLW))
              .filter(k => !k.endsWith('|w')).length;
  /* 성공 판정은 **204** 로만 한다. 예전 serve.ps1 은 메서드를 안 보고 무조건 파일을 돌려줘서
     PUT 에도 200 을 준다 — r.ok 로 보면 "저장했다"고 해 놓고 아무것도 안 쓴 꼴이 된다.
     새 serve.ps1 만 쓰고 나서 204(No Content)를 준다. */
  let ok = false;
  try {
    const r = await fetch(COLW_FILE, { method: 'PUT', body: text });
    ok = (r.status === 204);
  } catch (e) { ok = false; }

  if (ok){
    // 파일에 들어갔으니 이 브라우저의 덧쓰기는 지운다 — 안 지우면 덧쓰기가 계속 기본값을 가린다
    if (typeof COLW_DEFAULTS !== 'undefined'){
      Object.keys(COLW).forEach(k => { COLW_DEFAULTS[k] = COLW[k]; });
    }
    Object.keys(COLW).forEach(k => delete COLW[k]);
    saveColW();
    say(n + '개 표의 너비를 기본값으로 굳혔습니다. (' + COLW_FILE + ')');
    return;
  }
  // file:// 로 열었거나 서버가 PUT 을 안 받는 경우 — 파일로 내려받아 data/ 에 덮어 넣게 한다
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type: 'text/javascript' }));
  a.download = 'colw-defaults.js';
  a.click();
  URL.revokeObjectURL(a.href);
  say('colw-defaults.js 를 내려받았습니다. data/ 폴더에 덮어 넣어 주세요. (serve.ps1 로 열면 바로 저장됩니다)');
}

function initFreezeColW(){
  const btn = $('colw-freeze'), out = $('colw-msg');
  if (!btn) return;
  const say = m => {
    out.textContent = m;
    clearTimeout(say.t);
    say.t = setTimeout(() => { out.textContent = ''; }, 6000);
  };
  btn.addEventListener('click', () => { say('저장하는 중…'); freezeColW(say); });
}

/* 어느 화면이든 표를 다시 그리면 손잡이가 사라진다 — 바뀔 때마다 다시 넣는다.
   페이지마다 렌더 함수를 고치지 않아도 되도록 #main 전체를 지켜본다. */
function watchTables(){
  const main = document.getElementById('main');
  if (!main) return;
  wrapPageTops();
  showUpdated();
  addGrips(main);
  setStickTop();
  initFreezeColW();
  let timer = null;
  new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(() => { addGrips(main); setStickTop(); }, 40);
  }).observe(main, { childList: true, subtree: true });
}

/* ---------- 상단 바 묶기 ----------
   ① 은 제목·필터·검색이 이미 .b2-top 한 덩어리인데, 나머지 화면은 .page-head 와
   .toolbar 들이 형제로 나열돼 있다. 흰 띠 하나로 붙여 고정하려면 감싸는 상자가 필요하다.
   index.html 9곳을 고치는 대신 화면을 열 때 한 번 감싼다. */
function wrapPageTops(){
  document.querySelectorAll('.page').forEach(p => {
    const head = p.querySelector(':scope > .page-head');
    if (!head || p.querySelector(':scope > .page-top')) return;
    const box = document.createElement('div');
    box.className = 'page-top';
    p.insertBefore(box, head);
    box.appendChild(head);
    // 제목 바로 뒤에 이어지는 툴바까지 같은 띠에 넣는다(중간에 다른 것이 나오면 멈춘다)
    while (box.nextElementSibling && box.nextElementSibling.classList.contains('toolbar'))
      box.appendChild(box.nextElementSibling);
  });
}

/* 화면 제목 뒤에 자료 갱신일을 작게 붙인다 (data/updated.js).
   고시가 바뀌면 그 파일의 날짜를 고치는 것이 유일한 할 일이 되도록 한 곳에 모아 뒀다.
   날짜가 '' 인 카테고리는 "갱신일 미확인" 으로 두고 추측해 채우지 않는다. */
function showUpdated(){
  if (typeof SG_UPDATED === 'undefined') return;
  document.querySelectorAll('.page').forEach(p => {
    const h1 = p.querySelector('.page-head h1');
    const info = SG_UPDATED[p.id];
    if (!h1 || !info || h1.querySelector('.upd')) return;
    const s = document.createElement('span');
    s.className = 'upd' + (info.d ? '' : ' none');
    s.textContent = info.d ? '자료 갱신 ' + info.d : '갱신일 미확인';
    if (info.src) s.title = '출처: ' + info.src;
    h1.appendChild(s);
  });
}
