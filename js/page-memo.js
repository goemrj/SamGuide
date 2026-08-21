/* ---------- 메모장 — 이 브라우저 localStorage 에만 저장한다 ----------
   화면은 다른 카테고리와 같은 **표 한 장**이다 (2026-08-21 — 목록 + 편집 두 칸 구조를 걷어냈다).
   열은 제목 / 내용 / 수정 세 개. 줄을 누르면 그 줄이 그 자리에서 입력칸으로 바뀌어 고칠 수 있고,
   「완료」를 누르면 다시 읽는 모양으로 돌아온다.

   처음 열 때 data/memo-seed.js 의 기본 메모(사내 엑셀 Sheet2)를 한 번 넣어 준다.
   그 뒤로는 여느 메모와 똑같이 고치고 지울 수 있고, 이 파일이 되살리지 않는다.
------------------------------------------------------------------ */
const MEMO_KEY = 'samguide_memos';
const MEMO_SEED_KEY = 'samguide_memo_seeded';
/* 열 너비 기본값 — 다른 화면과 같이 **% 로** 적는다(합 100).
   px 로 박으면 창이 좁은 PC 에서 표가 창을 넘겨 가로 스크롤이 생긴다(전체 전제 위반).
   머리줄 손잡이로 끌어 바꾼 값이 있으면 그쪽이 이긴다. */
const MM_COLW = ['22%', '62%', '16%'];
const MM_TKEY = 'memo#mm3';

let memos = [];
let memoCur = null;          // 지금 고치고 있는 메모 id (없으면 표 전체가 읽는 모양)
let memoTimer = null;

function loadMemos(){
  try { memos = JSON.parse(localStorage.getItem(MEMO_KEY) || '[]'); }
  catch(e){ memos = []; }
  if (!Array.isArray(memos)) memos = [];
}
function saveMemos(){ localStorage.setItem(MEMO_KEY, JSON.stringify(memos)); }

function memoStamp(ts){
  const d = new Date(ts), p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) + ' ' + p(d.getHours()) + ':' + p(d.getMinutes());
}

function memoFiltered(){
  const needle = $('memo-search').value.trim().toLowerCase();
  if (!needle) return memos.slice();
  return memos.filter(m => ((m.title || '') + '\n' + (m.body || '')).toLowerCase().includes(needle));
}

/* 읽는 줄 — 본문은 줄바꿈을 그대로 살려 통째로 보여 준다(칸이 pre-wrap).
   접지 않는다 — 표 한 장에서 다 읽히는 것이 이 화면의 목적이다. */
function memoViewRow(m, mark){
  return '<tr class="mm-row" data-id="' + esc(m.id) + '">' +
    '<td class="mm-title" data-f="t">' + mark(m.title || '제목 없음') + '</td>' +
    '<td class="mm-body" data-f="b">' +
      (m.body ? mark(m.body) : '<span class="saved-note">—</span>') + '</td>' +
    '<td class="mm-when">' + esc(memoStamp(m.updated)) + '</td></tr>';
}
/* 고치는 줄 — 같은 세 칸 자리에 입력칸을 넣는다. 표 모양이 흐트러지지 않게
   제목은 <input>, 내용은 내용 길이에 맞춰 늘어나는 <textarea> 다. */
function memoEditRow(m){
  return '<tr class="mm-row hit mm-on" data-id="' + esc(m.id) + '">' +
    '<td><input class="mm-in" id="memo-title" placeholder="제목"></td>' +
    '<td><textarea class="mm-ta" id="memo-body" placeholder="내용을 적어주세요."></textarea></td>' +
    '<td class="mm-when">' + esc(memoStamp(m.updated)) +
      '<div class="mm-acts">' +
        '<button class="btn mini" id="memo-done">완료</button>' +
        '<button class="btn mini danger" id="memo-del">삭제</button>' +
      '</div></td></tr>';
}

function renderMemoTable(){
  const needle = $('memo-search').value.trim().toLowerCase();
  const rows = memoFiltered();

  $('memo-meta').innerHTML =
    '<span><b>메모</b></span>' +
    '<span>' + (needle ? rows.length + '건 / 전체 ' + memos.length + '건'
                       : memos.length + '건') + '</span>' +
    '<span class="meta-note">줄을 누르면 그 자리에서 고칠 수 있습니다 · 이 브라우저에만 저장</span>';

  if (!rows.length){
    $('memo-table').innerHTML = '<div class="empty">' +
      (needle ? '검색 결과가 없습니다.' : '메모가 없습니다. 위의 「+ 새 메모」로 만듭니다.') + '</div>';
    return;
  }

  const mark = t => hilite(t || '', needle);
  const head = ['제목', '내용', '수정'];
  const saved = colwOf(MM_TKEY, head.length);      // common.js — 열 개수가 같을 때만 돌려준다
  const colw  = saved ? saved.map(n => n + 'px') : MM_COLW;

  $('memo-table').innerHTML =
    '<table class="fields mm fixed" data-k="' + MM_TKEY + '"><thead><tr>' +
    head.map((h, i) => '<th style="width:' + colw[i] + '">' + esc(h) + '</th>').join('') +
    '</tr></thead><tbody>' +
    rows.map(m => m.id === memoCur ? memoEditRow(m) : memoViewRow(m, mark)).join('') +
    '</tbody></table>';

  bindMemoRows();
}

/* 입력칸 값은 innerHTML 로 넣지 않고 .value 로 넣는다 — 원문 글자를 그대로 담기 위해서다 */
function bindMemoRows(){
  document.querySelectorAll('#memo-table .mm-row').forEach(tr => {
    if (tr.dataset.id === memoCur) return;
    tr.addEventListener('click', e => {
      const td = e.target.closest('td');
      openMemo(tr.dataset.id, td && td.dataset.f === 'b' ? 'b' : 't');
    });
  });

  const ti = $('memo-title'), ta = $('memo-body');
  if (!ti || !ta) return;
  const m = memos.find(x => x.id === memoCur);
  if (!m) return;
  ti.value = m.title || '';
  ta.value = m.body || '';
  mmGrow(ta);
  ti.addEventListener('input', touchMemo);
  ta.addEventListener('input', () => { mmGrow(ta); touchMemo(); });
  // Esc 로도 읽는 모양으로 돌아온다
  [ti, ta].forEach(el => el.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMemo();
  }));
  $('memo-done').addEventListener('click', closeMemo);
  $('memo-del').addEventListener('click', delMemo);
}
// 내용 칸은 스크롤을 두지 않고 글자 수만큼 늘린다 — 표 안에서 다 읽히게
function mmGrow(ta){
  ta.style.height = 'auto';
  ta.style.height = (ta.scrollHeight + 2) + 'px';
}

function openMemo(id, focus){
  const m = memos.find(x => x.id === id);
  if (!m) return;
  saveMemoNow();                 // 앞서 고치던 줄을 먼저 저장한다
  memoCur = id;
  renderMemoTable();
  const el = $(focus === 'b' ? 'memo-body' : 'memo-title');
  if (el) el.focus();
}
function closeMemo(){
  saveMemoNow();
  memoCur = null;
  renderMemoTable();
}
function newMemo(){
  saveMemoNow();
  const m = { id: String(Date.now()), title: '', body: '', updated: Date.now() };
  memos.unshift(m);
  saveMemos();
  memoCur = m.id;
  renderMemoTable();
  if ($('memo-title')) $('memo-title').focus();
}
/* 입력할 때마다 데이터에는 바로 넣고, 저장·상태 표시만 0.4초 미룬다.
   표를 다시 그리지는 않는다 — 그리면 입력칸이 사라져 글자를 이어 쓸 수 없다. */
function touchMemo(){
  const m = memos.find(x => x.id === memoCur);
  if (!m) return;
  m.title = $('memo-title').value;
  m.body  = $('memo-body').value;
  m.updated = Date.now();
  memos.sort((a, b) => b.updated - a.updated);   // 최근 수정 순
  clearTimeout(memoTimer);
  memoTimer = setTimeout(() => {
    saveMemos();
    $('memo-status').textContent = memoStamp(m.updated) + ' 저장됨';
  }, 400);
}
// 미뤄 둔 저장이 남아 있으면 지금 끝낸다 (줄을 옮기거나 닫을 때)
function saveMemoNow(){
  if (!memoTimer) return;
  clearTimeout(memoTimer);
  memoTimer = null;
  saveMemos();
  const m = memos.find(x => x.id === memoCur);
  if (m) $('memo-status').textContent = memoStamp(m.updated) + ' 저장됨';
}
function delMemo(){
  const m = memos.find(x => x.id === memoCur);
  if (!m) return;
  if (!confirm('"' + (m.title || '제목 없음') + '" 메모를 삭제할까요?')) return;
  clearTimeout(memoTimer);
  memoTimer = null;
  memos = memos.filter(x => x.id !== memoCur);
  memoCur = null;
  saveMemos();
  $('memo-status').textContent = '';
  renderMemoTable();
}

$('memo-search').addEventListener('input', () => { saveMemoNow(); memoCur = null; renderMemoTable(); });
$('memo-new').addEventListener('click', () => { $('memo-search').value = ''; newMemo(); });
$('memo-export').addEventListener('click', () => {
  saveMemoNow();
  if (!memos.length){ alert('내보낼 메모가 없습니다.'); return; }
  const text = memos.map(m =>
    '=== ' + (m.title || '제목 없음') + ' (' + memoStamp(m.updated) + ') ===\n' + m.body).join('\n\n');
  const url = URL.createObjectURL(new Blob(['﻿' + text], {type: 'text/plain;charset=utf-8'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'SamGuide_메모.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* 기본 메모 넣기 — 딱 한 번만. 이미 넣었으면(플래그) 아무것도 하지 않는다.
   같은 제목의 메모가 이미 있으면 그것도 건너뛴다 — 사용자가 적어 둔 것을 덮지 않게. */
function seedMemos(){
  if (typeof MEMO_SEED === 'undefined') return;
  if (localStorage.getItem(MEMO_SEED_KEY)) return;
  localStorage.setItem(MEMO_SEED_KEY, '1');
  const have = new Set(memos.map(m => m.title));
  const now = Date.now();
  // 엑셀에 적힌 순서를 지키려고 updated 를 1초씩 앞당겨 둔다(목록은 최근 수정 순 정렬)
  const add = MEMO_SEED
    .filter(s => s.t && !have.has(s.t))
    .map((s, i) => ({ id: 'seed-' + (i + 1), title: s.t, body: s.b, updated: now - i * 1000 }));
  if (!add.length) return;
  memos = memos.concat(add);      // 사용자가 쓰던 메모가 위에 남게 뒤에 붙인다
  saveMemos();
}

loadMemos();
seedMemos();
renderMemoTable();
