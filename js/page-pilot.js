/* ---------- 시범사업 ----------
   data/pilot-codes.js 는 사내 엑셀 「총진료비,본인부담금 계산식.xlsx」의 시범사업 시트를 옮긴 것이다.
   엑셀에는 S001~S050 이 모두 적혀 있지만 내용이 채워진 것은 일부라, 나머지는 PILOT_BLANK 로 따로 두고
   체크박스를 켜야 보이게 했다 — "본인부담금이 없는 것"이 아니라 "아직 안 적은 것"이기 때문이다.
------------------------------------------------------------------ */

const pl = { blank: false };

function plFiltered(){
  const needle = $('pl-search').value.trim().toLowerCase();
  const filled = PILOT_CODES.filter(d =>
    !needle || sgHit([d.sym, d.name, d.hi, d.mg].join(' '), needle));
  if (!pl.blank) return { filled, blank: [] };
  const blank = (typeof PILOT_BLANK === 'undefined' ? [] : PILOT_BLANK)
    .filter(s => !needle || sgHit(s, needle));
  return { filled, blank };
}

function renderPlTable(){
  const needle = $('pl-search').value.trim().toLowerCase();
  const { filled, blank } = plFiltered();

  $('pl-meta').innerHTML =
    '<span><b>시범사업 특정기호</b></span>' +
    '<span>' + filled.length + '건' +
      (filled.length === PILOT_CODES.length ? '' : ' / 내용 있는 것 ' + PILOT_CODES.length + '건') +
      (blank.length ? ' · 내용 없는 기호 ' + blank.length + '건' : '') + '</span>' +
    '<span class="meta-note">사내 엑셀 「총진료비,본인부담금 계산식」 시범사업 시트</span>';

  if (!filled.length && !blank.length){
    $('pl-table').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
    return;
  }

  const mark = t => hilite(t || '', needle);
  const cell = t => t ? mark(t).replace(/\n/g, '<br>') : '<span class="saved-note">—</span>';

  let html = '<table class="fields pl"><thead><tr>' +
    '<th>특정기호</th><th>사업명</th><th>건강보험</th><th>의료급여 · 차상위</th>' +
    '</tr></thead><tbody>' +
    filled.map(d =>
      '<tr><td class="pl-sym">' + mark(d.sym) + '</td>' +
      '<td class="pl-name">' + cell(d.name) + '</td>' +
      '<td class="pl-rate">' + cell(d.hi) + '</td>' +
      '<td class="pl-rate">' + cell(d.mg) + '</td></tr>'
    ).join('') +
    blank.map(s =>
      '<tr class="pl-empty"><td class="pl-sym">' + mark(s) + '</td>' +
      '<td colspan="3"><span class="saved-note">엑셀에 내용이 비어 있음</span></td></tr>'
    ).join('') +
    '</tbody></table>';

  $('pl-table').innerHTML = html;
}

$('pl-search').addEventListener('input', renderPlTable);
$('pl-blank').addEventListener('change', () => { pl.blank = $('pl-blank').checked; renderPlTable(); });
renderPlTable();
