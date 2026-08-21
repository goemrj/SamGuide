/* ---------- 상해외인 ----------
   data/injury-codes.js 는 사내 엑셀 「총진료비,본인부담금 계산식.xlsx」의 상해외인 시트를 옮긴 것이다.
   원문 표는 병합 셀이 여러 줄로 풀려 있어 데이터를 만들 때 구분 코드 단위로 다시 묶었다.
   엑셀 F열(사내 메모)은 note 로 들어와 있고, 원문 표에는 없는 내용이라 회색 상자로 따로 그린다.
------------------------------------------------------------------ */

function ijFiltered(){
  const needle = $('ij-search').value.trim().toLowerCase();
  if (!needle) return INJURY_CODES;
  return INJURY_CODES.filter(d =>
    sgHit([d.code, d.what, d.inday, d.days, d.start, d.note].join(' '), needle));
}

function renderIjTable(){
  const needle = $('ij-search').value.trim().toLowerCase();
  const rows = ijFiltered();

  $('ij-meta').innerHTML =
    '<span><b>상해외인 구분</b></span>' +
    '<span>' + rows.length + '건' + (rows.length === INJURY_CODES.length ? '' : ' / 전체 ' + INJURY_CODES.length + '건') + '</span>' +
    '<span class="meta-note">사내 엑셀 「총진료비,본인부담금 계산식」 상해외인 시트</span>';

  if (!rows.length){ $('ij-table').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>'; return; }

  const mark = t => hilite(t || '', needle);
  $('ij-table').innerHTML =
    '<table class="fields ij"><thead><tr>' +
      '<th>구분</th><th>어떤 경우</th><th>입(내)원일수</th><th>요양급여일수</th><th>진료개시일</th>' +
    '</tr></thead><tbody>' +
    rows.map(d =>
      '<tr><td class="ij-code">' + mark(d.code) + '</td>' +
      '<td class="ij-what">' + mark(d.what) +
        (d.note ? '<div class="ij-note"><b>사내 메모</b>' + mark(d.note).replace(/\n/g, '<br>') + '</div>' : '') +
      '</td>' +
      '<td class="ij-day">' + mark(d.inday) + '</td>' +
      '<td class="ij-days">' + mark(d.days) + '</td>' +
      '<td class="ij-start">' + mark(d.start) + '</td></tr>'
    ).join('') + '</tbody></table>';
}

/* 표 아래 각주 — 엑셀 맨 아래 두 줄(MT037 · MT065) */
function renderIjNotes(){
  const needle = $('ij-search').value.trim().toLowerCase();
  $('ij-notes').innerHTML = (typeof INJURY_NOTES === 'undefined' ? [] : INJURY_NOTES)
    .map(n => '<div class="b2-foot">' + hilite(n, needle) + '</div>').join('');
}

$('ij-search').addEventListener('input', () => { renderIjTable(); renderIjNotes(); });
renderIjTable(); renderIjNotes();
