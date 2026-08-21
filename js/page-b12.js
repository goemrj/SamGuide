/* ---------- [별표12] 소아가산 ----------
   data/b12-codes.js 는 심평원 「★ 별표12 신포괄 보상률 정리본_(별첨)별도보상마스터
   (기관안내용).xlsx」의 2.소아가산관련행위목록 시트를 옮긴 것이다 (변환: tools/b12.ps1).

   필터는 구분 한 줄뿐이라 **대분류(.chips-seg)** 로 그린다 — 필터 두 줄 규칙(CLAUDE.md).
   연령(6세 미만 / 6세 이상~16세 미만)은 칩 줄을 늘리지 않고 검색줄의 선택상자로 뒀다.
   (같은 엑셀의 3-1.마취료 코드조합 표도 한때 이 화면에 있었으나 내렸다 — 2026-08-21)
------------------------------------------------------------------ */

/* 열 너비 기본값은 % 로 적는다(합 100) — px 로 박으면 좁은 창에서 가로 스크롤이 생긴다.
   머리줄 손잡이로 끌어 바꾼 값이 있으면 그쪽이 이긴다(common.js). */
const BT_ACT_COLW = ['12%', '9%', '36%', '11%', '8%', '11%', '13%'];
const BT_ACT_TKEY = 'b12#acts7';
const BT_GBS = [...new Set(B12_ACTS.map(d => d.gb))];

const bt = { gb: '', age: '' };

function btNeedle(){ return $('bt-search').value.trim().toLowerCase(); }
function btMark(t){ return hilite(t || '', btNeedle()); }
// 빈 칸은 "값 없음" 이 보이도록 — 로 채운다 (원문에서는 비어 있는 칸)
function btCell(t){ return t ? btMark(t) : '<span class="saved-note">—</span>'; }

function renderBtGbs(){
  chipRow($('bt-gbs'), BT_GBS, bt.gb, '전체',
    v => (v ? B12_ACTS.filter(d => d.gb === v).length : B12_ACTS.length),
    v => { bt.gb = v; renderBtGbs(); renderBtTable(); });
}

function btFiltered(){
  const needle = btNeedle();
  return B12_ACTS.filter(d =>
    (!bt.gb  || d.gb === bt.gb) &&
    (!bt.age || d[bt.age] === '해당') &&
    (!needle || sgHit([d.cls, d.code, d.name, d.gb, d.note].join(' '), needle)));
}

function renderBtTable(){
  const rows = btFiltered();
  const ageLabel = bt.age === 'u6' ? B12_ACT_HEAD[4] : bt.age === 'a16' ? B12_ACT_HEAD[5] : '';

  $('bt-meta').innerHTML =
    '<span><b>' + esc(bt.gb || '전체') + '</b>' + (ageLabel ? ' · ' + esc(ageLabel) : '') + '</span>' +
    '<span>' + rows.length + '행' +
      (rows.length === B12_ACTS.length ? '' : ' / 전체 ' + B12_ACTS.length + '행') + '</span>' +
    '<span class="meta-note">' + esc(B12_ACT_TITLE) + '</span>';

  if (!rows.length){ $('bt-table').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>'; return; }

  // common.js — 저장해 둔 너비를 비율(%)로 돌려준다. px 로 넣으면 좁은 창에서 표가 창을 넘는다
  const w = colwCss(BT_ACT_TKEY, BT_ACT_COLW.length) || BT_ACT_COLW;
  // '해당' 은 값이 있다는 뜻이라 눈에 띄게, 빈 칸은 —
  const yn = v => v === '해당' ? '<b class="b12-y">' + btMark(v) + '</b>' : '<span class="saved-note">—</span>';

  $('bt-table').innerHTML =
    '<table class="fields b12-act fixed" data-k="' + BT_ACT_TKEY + '"><thead><tr>' +
    B12_ACT_HEAD.map((h, i) => '<th style="width:' + w[i] + '">' + esc(h) + '</th>').join('') +
    '</tr></thead><tbody>' +
    rows.map(d =>
      '<tr><td class="b12-cls">'  + btMark(d.cls)  + '</td>' +
      '<td class="b12-code">'     + btMark(d.code) + '</td>' +
      '<td class="b12-name">'     + btMark(d.name) + '</td>' +
      '<td class="b12-gb">'       + btMark(d.gb)   + '</td>' +
      '<td class="b12-yn">'       + yn(d.u6)       + '</td>' +
      '<td class="b12-yn">'       + yn(d.a16)      + '</td>' +
      '<td class="b12-note">'     + btCell(d.note) + '</td></tr>').join('') +
    '</tbody></table>';
}

/* 시트 머리말(엑셀 2행) — 어떤 기준으로 '해당' 이 붙었는지가 여기 적혀 있다.
   원문의 ' - ' 로 시작하는 줄만 한 단 들여쓴다(글자는 그대로다). */
function renderBtIntro(){
  $('bt-intro').innerHTML =
    '<div class="card b12-intro"><div class="card-pad">' +
    '<div class="b12-intro-h">원문 머리말</div>' +
    B12_ACT_INTRO.map(s =>
      '<p class="b12-note-p' + (/^\s*-/.test(s) ? ' d1' : '') + '">' + btMark(s.trim()) + '</p>').join('') +
    '</div></div>';
}

$('bt-search').addEventListener('input', () => { renderBtTable(); renderBtIntro(); });
$('bt-age').addEventListener('change', () => { bt.age = $('bt-age').value; renderBtTable(); });
renderBtGbs(); renderBtTable(); renderBtIntro();
