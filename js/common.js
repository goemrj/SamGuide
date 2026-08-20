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
/* 저장값은 열 개수가 지금과 같을 때만 쓴다 — 열을 감추거나 늘리면 자리가 어긋난다 */
function colwOf(key, n){
  const v = COLW[key];
  return (Array.isArray(v) && v.length === n) ? v : null;
}
/* 표를 가리키는 이름. 스스로 data-k 를 달아 둔 표(① 카드들)는 그것을 쓰고,
   나머지는 "화면id#표순서#열수" 로 만든다. */
function colwKey(table){
  if (table.dataset.k) return table.dataset.k;
  const page = table.closest('.page');
  const all = [...(page || document).querySelectorAll('table')];
  return (page ? page.id : 'x') + '#' + all.indexOf(table) +
         '#' + table.tHead.rows[0].cells.length;
}
const COLW_MIN = 48;

/* 머리줄 칸마다 오른쪽 경계에 손잡이를 하나씩 넣는다(마지막 열은 뺀다 — 잡을 짝이 없다).
   화면을 다시 그릴 때마다 없어지므로 아래 MutationObserver 가 다시 넣는다. */
function addGrips(root){
  (root || document).querySelectorAll('table.b2, table.fields').forEach(t => {
    if (!t.tHead || !t.tHead.rows[0]) return;
    const ths = [...t.tHead.rows[0].cells];
    ths.forEach((th, i) => {
      if (i === ths.length - 1 || th.querySelector('.rz')) return;
      const g = document.createElement('span');
      g.className = 'rz';
      g.title = '끌어서 열 너비 조절 (두 번 누르면 원래대로)';
      th.appendChild(g);
    });
    // 저장해 둔 너비가 있으면 되살린다
    const saved = colwOf(colwKey(t), ths.length);
    if (saved){
      t.classList.add('fixed');
      t.style.width = '100%';
      ths.forEach((th, i) => { th.style.width = saved[i] + 'px'; });
    }
  });
}

/* 끌기 시작할 때 지금 보이는 너비를 그대로 못박고 표를 fixed 로 바꾼다.
   그러지 않으면 한 열만 건드려도 브라우저가 나머지 열을 제멋대로 다시 계산한다. */
function pinWidths(table){
  const ths = [...table.tHead.rows[0].cells];
  const w = ths.map(th => th.getBoundingClientRect().width);
  table.classList.add('fixed');
  table.style.width = '100%';
  ths.forEach((th, i) => { th.style.width = w[i] + 'px'; });
  return ths;
}

document.addEventListener('mousedown', e => {
  const grip = e.target.closest('.rz');
  if (!grip) return;
  const th = grip.parentElement, table = th.closest('table');
  if (!table || !table.tHead) return;
  const ths = pinWidths(table);
  const i = ths.indexOf(th), next = ths[i + 1];
  if (!next) return;

  e.preventDefault();                       // 끌 때 글자가 선택되지 않게
  const x0 = e.clientX;
  const w0 = th.getBoundingClientRect().width;
  const n0 = next.getBoundingClientRect().width;
  document.body.classList.add('rz-on');

  const move = ev => {
    // 두 열 다 최소 폭을 지키는 범위로 자른다
    const d = Math.max(COLW_MIN - w0, Math.min(ev.clientX - x0, n0 - COLW_MIN));
    th.style.width   = (w0 + d) + 'px';
    next.style.width = (n0 - d) + 'px';
  };
  const up = () => {
    document.removeEventListener('mousemove', move);
    document.removeEventListener('mouseup', up);
    document.body.classList.remove('rz-on');
    COLW[colwKey(table)] = ths.map(t => Math.round(t.getBoundingClientRect().width));
    saveColW();
  };
  document.addEventListener('mousemove', move);
  document.addEventListener('mouseup', up);
});

/* 손잡이를 두 번 누르면 그 표의 너비를 처음 상태로 돌린다 */
document.addEventListener('dblclick', e => {
  const grip = e.target.closest('.rz');
  if (!grip) return;
  const table = grip.closest('table');
  if (!table) return;
  delete COLW[colwKey(table)];
  saveColW();
  table.classList.remove('fixed');
  table.style.width = '';
  [...table.tHead.rows[0].cells].forEach(th => { th.style.width = ''; });
});

/* 어느 화면이든 표를 다시 그리면 손잡이가 사라진다 — 바뀔 때마다 다시 넣는다.
   페이지마다 렌더 함수를 고치지 않아도 되도록 #main 전체를 지켜본다. */
function watchTables(){
  const main = document.getElementById('main');
  if (!main) return;
  wrapPageTops();
  addGrips(main);
  setStickTop();
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
