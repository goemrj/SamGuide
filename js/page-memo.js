/* ---------- 메모장 — 이 브라우저 localStorage 에만 저장한다 ----------
   처음 열 때 data/memo-seed.js 의 기본 메모(사내 엑셀 Sheet2)를 한 번 넣어 준다.
   그 뒤로는 여느 메모와 똑같이 고치고 지울 수 있고, 이 파일이 되살리지 않는다.
------------------------------------------------------------------ */
const MEMO_KEY = 'samguide_memos';
const MEMO_SEED_KEY = 'samguide_memo_seeded';
let memos = [];
let memoCur = null;
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
/* 본문에서 걸린 자리 앞뒤를 잘라 목록에 한 줄 보여 준다 — 제목만으로는 왜 걸렸는지 모른다 */
function memoSnip(body, needle){
  const i = String(body).toLowerCase().indexOf(needle);
  if (i < 0) return '';
  const from = Math.max(0, i - 18);
  const cut = String(body).slice(from, i + needle.length + 42).replace(/\s+/g, ' ').trim();
  return (from > 0 ? '… ' : '') + cut + '…';
}

function renderMemoList(){
  const needle = $('memo-search').value.trim().toLowerCase();
  const list = needle
    ? memos.filter(m => ((m.title || '') + '\n' + (m.body || '')).toLowerCase().includes(needle))
    : memos;

  $('memo-count').textContent = needle
    ? list.length + '건 / 전체 ' + memos.length + '건'
    : (memos.length ? '전체 ' + memos.length + '건' : '');

  if (!list.length){
    $('memo-items').innerHTML = '<div class="saved-note" style="padding:10px;">' +
      (needle ? '검색 결과가 없습니다.' : '메모가 없습니다.') + '</div>';
    return;
  }
  $('memo-items').innerHTML = list.map(m => {
    const snip = needle ? memoSnip(m.body, needle) : '';
    return '<button class="memo-item' + (m.id === memoCur ? ' on' : '') + '" data-id="' + m.id + '">' +
      '<b>' + hilite(m.title || '제목 없음', needle) + '</b>' +
      (snip ? '<span class="snip">' + hilite(snip, needle) + '</span>' : '') +
      '<span>' + esc(memoStamp(m.updated)) + '</span></button>';
  }).join('');
  $('memo-items').querySelectorAll('.memo-item').forEach(b => {
    b.addEventListener('click', () => openMemo(b.dataset.id));
  });
}
function openMemo(id){
  const m = memos.find(x => x.id === id);
  if (!m) return;
  memoCur = id;
  $('memo-title').value = m.title;
  $('memo-body').value = m.body;
  $('memo-status').textContent = memoStamp(m.updated) + ' 저장됨';
  renderMemoList();
}
function newMemo(){
  const m = { id: String(Date.now()), title: '', body: '', updated: Date.now() };
  memos.unshift(m);
  saveMemos();
  openMemo(m.id);
  $('memo-title').focus();
}
function touchMemo(){
  if (!memoCur) newMemo();
  const m = memos.find(x => x.id === memoCur);
  if (!m) return;
  m.title = $('memo-title').value;
  m.body  = $('memo-body').value;
  m.updated = Date.now();
  memos.sort((a, b) => b.updated - a.updated);   // 최근 수정 순
  clearTimeout(memoTimer);
  memoTimer = setTimeout(() => {
    saveMemos();
    renderMemoList();
    $('memo-status').textContent = memoStamp(m.updated) + ' 저장됨';
  }, 400);
}
$('memo-search').addEventListener('input', renderMemoList);
$('memo-new').addEventListener('click', () => { $('memo-search').value = ''; newMemo(); });
$('memo-title').addEventListener('input', touchMemo);
$('memo-body').addEventListener('input', touchMemo);
$('memo-del').addEventListener('click', () => {
  if (!memoCur) return;
  const m = memos.find(x => x.id === memoCur);
  if (!confirm('"' + (m.title || '제목 없음') + '" 메모를 삭제할까요?')) return;
  memos = memos.filter(x => x.id !== memoCur);
  memoCur = null;
  saveMemos();
  $('memo-title').value = '';
  $('memo-body').value = '';
  $('memo-status').textContent = '';
  renderMemoList();
  if (memos.length) openMemo(memos[0].id);
});
$('memo-export').addEventListener('click', () => {
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
renderMemoList();
if (memos.length) openMemo(memos[0].id);
