/* ---------- 응급의료행위 ----------
   data/emergency-codes.js 는 수가책(「건강보험 행위 급여･비급여 목록표 및 급여
   상대가치점수」) 제1편 제2부 제19장 응급의료수가의 (별표 1) ~ (별표 4),
   709~763쪽을 옮긴 것이다. 변환은 tools/emergency.awk.

   원문 표 모양이 별표마다 다르다.
     (별표 1)(별표 2)(별표 3)  장 · 분류번호 · 코드 · 분 류      4열
     (별표 4)                 분류번호 · 행위명(한글)          2열
   (별표 4)의 장 · 코드는 원문에 없어서 같은 수가책 안에서 분류번호로 찾아 채운 값이다.
   **원문 값과 구분해서 보여 준다** — 밑줄을 점선으로 두고 어디서 찾았는지를 붙인다
   (데이터의 f: "t3" = 같은 문서의 (별표1)~(별표3), "p<쪽>" = 제9장 본문 <쪽>쪽).
   심사 기준이라 "원문에 적혀 있던 값" 과 "찾아 채운 값" 이 같아 보이면 안 된다.

   장 번호(02 · 09 …)는 원문에 번호만 있다. 칩에 붙는 장 이름은 수가책 목차의
   장 제목이고 data/emergency-codes.js 의 EMG_CHAPTERS 에 있다.
------------------------------------------------------------------ */
const emg = { t: '', ch: '' };

const EMG_CHS = [...new Set(EMG_CODES.map(d => d.ch).filter(Boolean))].sort();

/* 칩 라벨을 값과 다르게 붙여야 해서(02 → "02 검사료") common.js 의 chipRow 를 쓰지 않는다
   — 한 화면에서만 쓰는 것은 그 화면 파일에 둔다(CLAUDE.md 소스 나누는 규칙). */
function emgChips(el, list, cur, allLabel, label, counter, onPick){
  const mk = (v, txt) =>
    '<button class="chip' + (cur === v ? ' on' : '') + '" data-v="' + esc(v) + '">' +
    esc(txt) + '<small>' + counter(v) + '</small></button>';
  el.innerHTML = mk('', allLabel) + list.map(v => mk(v, label(v))).join('');
  el.querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => onPick(c.dataset.v)));
}

function emgTitle(t){
  const row = EMG_TABLES.find(x => String(x.no) === String(t));
  return row ? row.title : '';
}

/* 찾아 채운 값에 붙이는 설명. 커서를 올리면 근거가 보인다(브라우저 기본 툴팁 — 이 화면에는
   말풍선이 없어서 겹칠 것이 없다). */
function emgWhere(f){
  if (f === 't3') return '(별표 4) 원문에는 없는 값 — 같은 문서 (별표 1)~(별표 3)의 같은 분류번호에서 찾음';
  if (f && f[0] === 'p') return '(별표 4) 원문에는 없는 값 — 수가책 제9장 본문 상대가치점수표 ' + f.slice(1) + '쪽에서 찾음';
  return '';
}
function emgCell(cls, txt, f, mark){
  if (!f) return '<td class="' + cls + '">' + mark(txt) + '</td>';
  return '<td class="' + cls + '"><span class="emg-fill" title="' + esc(emgWhere(f)) + '">' +
         mark(txt) + '</span></td>';
}

/* 별표 · 장을 고른 뒤 검색어로 다시 거른다.
   검색은 분류번호 · 코드 · 분류(행위명) · 장 번호 · 장 이름에 걸린다. */
function emgFiltered(){
  const needle = $('emg-search').value.trim().toLowerCase();
  return EMG_CODES.filter(d =>
    (!emg.t  || String(d.t) === emg.t) &&
    (!emg.ch || d.ch === emg.ch) &&
    (!needle || sgHit(d.no + ' ' + d.code + ' ' + d.name + ' ' + d.ch + ' ' +
                      (EMG_CHAPTERS[d.ch] || ''), needle)));
}

/* 첫 줄 = 별표 (대분류 .chips-seg) */
function renderEmgTabs(){
  emgChips($('emg-tabs'), ['1', '2', '3', '4'], emg.t, '전체',
    v => '별표 ' + v,
    v => (v ? EMG_CODES.filter(d => String(d.t) === v).length : EMG_CODES.length),
    v => { emg.t = v; renderEmgTabs(); renderEmgChs(); renderEmgTable(); });
}

/* 둘째 줄 = 장 (소분류 .chips-rec) */
function renderEmgChs(){
  const inTab = d => !emg.t || String(d.t) === emg.t;
  const list  = EMG_CHS.filter(c => EMG_CODES.some(d => inTab(d) && d.ch === c));
  // 고른 별표에 없는 장이 걸려 있으면 풀어 준다((별표 4)는 09 하나뿐이다)
  if (emg.ch && list.indexOf(emg.ch) < 0) emg.ch = '';
  emgChips($('emg-chs'), list, emg.ch, '전체 장',
    v => v + ' ' + (EMG_CHAPTERS[v] || ''),
    v => EMG_CODES.filter(d => inTab(d) && (!v || d.ch === v)).length,
    v => { emg.ch = v; renderEmgChs(); renderEmgTable(); });
}

function renderEmgTable(){
  const needle = $('emg-search').value.trim().toLowerCase();
  const rows = emgFiltered();
  const mark = t => hilite(t, needle);
  const only4 = emg.t === '4';                 // (별표 4) 하나만 보는 중
  const one   = !!emg.t;                       // 별표 하나만 보는 중 → 별표 열이 필요없다
  const filled = rows.filter(d => d.f).length;

  $('emg-meta').innerHTML =
    '<span><b>' + (emg.t ? '별표 ' + emg.t : '별표 1~4') + '</b>' +
      (emg.t ? ' ' + esc(emgTitle(emg.t)) : '') + '</span>' +
    (emg.ch ? '<span>제' + Number(emg.ch) + '장 ' + esc(EMG_CHAPTERS[emg.ch] || '') + '</span>' : '') +
    '<span>' + rows.length + '행' +
      (rows.length === EMG_CODES.length ? '' : ' / 전체 ' + EMG_CODES.length + '행') + '</span>' +
    '<span class="meta-note">' +
      (filled ? '점선 밑줄 ' + filled + '건은 (별표 4) 원문에 없어 수가책에서 찾아 채운 장 · 코드입니다'
              : '수가책 709~763쪽 (제1편 제2부 제19장 응급의료수가)') +
    '</span>';

  if (!rows.length){ $('emg-table').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>'; return; }

  const th =
    (one ? '' : '<th>별표</th>') +
    '<th>장</th><th>분류번호</th><th>코드</th>' +
    '<th>' + (only4 ? '행위명(한글)' : one ? '분 류' : '분류 · 행위명') + '</th>';

  $('emg-table').innerHTML =
    '<table class="fields emg"><thead><tr>' + th + '</tr></thead><tbody>' +
    rows.map(d =>
      '<tr>' +
      (one ? '' : '<td class="emg-t">' + d.t + '</td>') +
      emgCell('emg-ch',   d.ch,   d.f, mark) +
      '<td class="emg-no">' + mark(d.no) + '</td>' +
      emgCell('emg-code', d.code, d.f, mark) +
      '<td class="emg-name">' + mark(d.name) + '</td>' +
      '</tr>'
    ).join('') + '</tbody></table>';
}

$('emg-search').addEventListener('input', renderEmgTable);
renderEmgTabs(); renderEmgChs(); renderEmgTable();
