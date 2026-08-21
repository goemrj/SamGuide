/* ---------- ① 본인부담금 규칙 (심평원 안내표) ----------
   데이터: data/burden-hira.js — 심평원 「본인부담기준 안내 — 본인부담률 및 부담액」을 그대로 옮긴 것.

   화면은 「본인부담금 규칙2 가독성 개선」 핸드오프를 따른다.
   (사내 엑셀을 옮겼던 옛 ① 화면은 2026-08-19 삭제하고 이 화면이 그 자리로 왔다.
    변수·클래스 이름의 b2/B2 접두사는 그때의 흔적이다.)
     · 고정(sticky)은 사이드바뿐 — 툴바도 표 헤더도 페이지와 함께 스크롤한다.
     · 대분류는 세그먼트, 소분류는 pill 칩. 라벨 텍스트와 건수 숫자는 노출하지 않는다.
     · "근거"(시행령 조항) 열은 화면에서 감춘다. 데이터에는 그대로 남는다.
     · 병합 셀은 rowSpan 으로 되살린다(검색 중에는 행이 띄엄띄엄해지므로 묶지 않는다).
     · 비고의 "제외대상: …", "확대(…): …" 는 라벨 칩 + 본문 두 줄로 나눠 그린다.
------------------------------------------------------------------ */

const b2 = { sys: '건강보험', tab: 'hi-in' };

const B2_SRC = {
  '건강보험': ['https://www.hira.or.kr/dummy.do?pgmid=HIRAA030056020100', '2026.06.23. 수정'],
  '의료급여': ['https://www.hira.or.kr/dummy.do?pgmid=HIRAA030057020000', '2026.07.30. 수정'],
};
/* 카드 제목 앞에 붙이는 표식. 종별 이모지를 쓰다가 2026-08-20 에 액센트색 네모 하나로 바꿨다
   — 모든 카드에 같은 표식이 붙는다(데이터는 건드리지 않고 화면에서만 붙인다). */
function b2Icon(){ return '<span class="sq"></span>'; }

/* 열 너비 — 화면에 보이는 열 순서대로. 값이 있으면 그 표만 `table-layout:fixed` 가 된다.
   너비 없이 fixed 를 걸면 열이 균등분배되므로, 여기 없는 표는 auto 로 남긴다.
   `<th>` 인라인 style 로 준다(colgroup/col 금지 — 제거되면 균등분배).

   **% 로 적는다.** px 로 박으면 창이 좁은 PC 에서 표가 창을 넘겨 가로 스크롤이 생기는데,
   그건 SamGuide 전체 전제를 깬다. % 는 합이 100 이라 어느 창에서도 카드를 정확히 채운다.
   아래 값은 2026-08-20 에 사용자가 자기 화면에서 손잡이로 맞춘 px 을 비율로 옮긴 것이다
   (차상위 표의 핸드오프 지정값도 이때 사용자 조절값으로 덮였다).
   각자 브라우저에서 다시 끌어 조절할 수 있고, 그 값은 그 브라우저에만 남는다
   (localStorage `samguide_colw`). 손잡이를 두 번 누르면 여기 적힌 값으로 돌아온다. */
const B2_COLW = {
  // ── 건강보험 · 입원
  'hi-in|건강보험 입원 본인부담률#0':                    ['23.8%', '18%', '58.2%'],
  'hi-in|2·3인실 입원료 (공통 적용 항목)#0':             ['19.5%', '12%', '68.5%'],
  'hi-in|주1) 본인부담률을 달리 운영하고 있는 특정 항목 및 본인부담률#0': ['10.1%', '20.3%', '20.1%', '49.5%'],
  // ── 건강보험 · 외래
  'hi-out|상급종합병원#0':                                ['26.4%', '66.6%', '7%'],
  'hi-out|종합병원#0':                                    ['24.3%', '67.9%', '7.8%'],
  'hi-out|병원급 (병원, 치과병원, 한방병원, 요양병원, 정신병원)#0': ['24.5%', '67.7%', '7.8%'],
  'hi-out|의원급 (의원, 치과의원, 한의원 및 보건의료원)#0': ['18.1%', '81.9%'],
  'hi-out|의원급 (의원, 치과의원, 한의원 및 보건의료원)#1': ['14.7%', '17.3%', '68%'],
  'hi-out|의원급 (의원, 치과의원, 한의원 및 보건의료원)#2': ['16.4%', '75.1%', '8.5%'],
  'hi-out|의원급 (의원, 치과의원, 한의원 및 보건의료원)#3': ['28.7%', '66.1%', '5.2%'],
  'hi-out|약국 및 한국희귀·필수의약품센터#0':             ['25%', '65.2%', '9.8%'],
  // ── 건강보험 · 차상위
  'hi-cs|차상위 1종: C#0':                               ['100px', null],
  'hi-cs|차상위 1종: C#1':                               ['150px', null],
  'hi-cs|차상위 2종: E,F — 입원#0':                      ['14%', '25%', '23.2%', '11%', '26.8%'],
  'hi-cs|차상위 2종: E,F — 입원#1':                      ['150px', null],
  'hi-cs|차상위 2종: E,F — 외래#0':                      ['12%', '9.4%', '30.8%', '32.5%', '15.3%'],
  'hi-cs|약국 및 한국희귀·필수의약품센터#0':               ['35%', '65%'],
  // ── 건강보험 · 기타
  'hi-etc|본인일부부담금 차등 적용 대상자#0':             ['3.8%', '14.4%', '19.5%', '12.8%', '19.6%', '29.9%'],
  'hi-etc|주) 특정 항목 본인부담률 — ①②③ 구분별#0':      ['7.4%', '17.6%', '75%'],
  'hi-etc|등록 틀니#0':                                   ['9.1%', '41%', '49.9%'],
  'hi-etc|등록 치과임플란트#0':                           ['9.1%', '42.2%', '48.7%'],
  'hi-etc|요양급여의 100분의 100미만 범위에서 본인부담률을 달리하는 경우 (선별급여)#0': ['9.5%', '90.5%'],
  // ── 의료급여
  'mg-in|의료급여 입원 본인부담률 (식대 제외)#0':        ['13.1%', '9.3%', '13.7%', '63.9%'],
  'mg-out|의료급여 외래 본인부담률 및 부담액#0':          ['15.2%', '17.8%', '12.3%', '10.1%', '13.9%', '30.7%'],
  'mg-out|외래 본인부담 면제자#0':                        ['12.7%', '34.4%', '10.7%', '42.2%'],
  'mg-out|선택의료급여기관 적용자#0':                      ['13.4%', '64.7%', '9.3%', '12.6%'],
  'mg-out|본인부담률을 달리 운영하고 있는 특정 항목 본인부담률#0': ['19.4%', '25.2%', '13.5%', '13%', '15.1%', '13.8%'],
  'mg-in|본인부담률을 달리 운영하고 있는 특정 항목 본인부담률#0': ['15.6%', '36.4%', '48%'],
  'mg-in|본인부담률을 달리 운영하고 있는 경우 (특정기호)#0': ['15.2%', '31.7%', '14.4%', '38.7%'],
};
/* 표를 가리키는 이름. 제목만으로는 안 된다 — 「약국 및 한국희귀·필수의약품센터」와
   「본인부담률을 달리 운영하고 있는 특정 항목 본인부담률」은 서로 다른 탭에 같은 제목으로
   두 번 나오고 열 수도 다르다. 그래서 탭 키(hi-out · mg-in 등)를 앞에 붙인다. */
function b2TKey(tabKey, sec, pi){ return (tabKey || '?') + '|' + sec.h + '#' + pi; }
function b2ColW(tabKey, sec, pi){ return B2_COLW[b2TKey(tabKey, sec, pi)] || null; }

/* 사용자가 끌어서 바꾼 열 너비 — 표별(`제목#표번호`)로 px 배열을 담아 둔다.
   이 브라우저 localStorage 에 저장해 **새로고침해도 유지**된다(메모장과 같은 방식).
   손잡이를 두 번 누르면 그 표의 항목이 지워져 처음 너비로 돌아간다.
   전부 되돌리려면 콘솔에서 localStorage.removeItem('samguide_b2_colw') 를 한 번 실행한다. */
/* 열 너비를 손으로 바꾸는 기능은 모든 화면이 함께 쓰므로 common.js 에 있다
   (COLW 저장소 · colwOf · colwKey · addGrips). 이 화면은 표에 data-k 를 달아
   카드가 검색으로 걸러져 순서가 바뀌어도 같은 표를 가리키게 한다. */

// 표만 봐서는 알기 어려운 보조 문구 — 데이터가 아니라 화면 설명이라 여기 둔다
const B2_AUX = {
  '건강보험 입원 본인부담률': '식대총액은 전 구분 공통 (장기 적출 제외) · 끝수계산 10원 미만 절사',
  '건강보험 외래 본인부담률': '끝수계산은 전 종별 100원 미만 절사 (약국 정액 행은 절사 없음)',
  '요양급여의 100분의 100미만 범위에서 본인부담률을 달리하는 경우 (선별급여)': '끝수계산 10원 미만 절사',
};

function b2Systems(){
  const out = [];
  for (const t of HIRA_BURDEN) if (!out.includes(t.sys)) out.push(t.sys);
  return out;
}
function b2TabsOf(sys){ return HIRA_BURDEN.filter(t => t.sys === sys); }
function b2Needle(){ return $('b2-search').value.trim().toLowerCase(); }

/* 화면에서 감출 열. 데이터에는 그대로 남긴다.
   근거   — 시행령 조항. 화면이 좁아 처음부터 감춰 왔다.
   끝수계산 — 값이 전부 '10원 미만 절사' 라 열을 둘 이유가 없다(입원명세서는 전체가 10원 미만 절사).
             값은 카드 제목 옆 보조문구(B2_AUX)로 옮겼다. */
const B2_HIDE = ['근거', '끝수계산'];
function b2Hidden(sec){
  const out = [];
  sec.head.forEach((h, i) => { if (B2_HIDE.includes(h)) out.push(i); });
  return out;
}
function b2Keep(arr, hidden){ return arr.filter((_, i) => !hidden.includes(i)); }

/* 비고 문자열 → 라벨 칩 + 본문. "제외대상: …" / "확대('20.1.1.~): …" 형태를 나눈다. */
function b2Note(text, needle){
  const raw = String(text);
  if (!raw) return '';
  const parts = raw.split(' · ').filter(Boolean);
  const lines = parts.map(p => {
    const m = p.match(/^([^:]{1,24}):\s*(.*)$/);
    if (!m) return '<span class="ln">' + hilite(p, needle) + '</span>';
    return '<span class="ln"><span class="noteTag">' + hilite(m[1], needle) + '</span>' +
           '<span>' + hilite(m[2], needle) + '</span></span>';
  });
  return '<div class="b2-note">' + lines.join('') + '</div>';
}

/* 열마다 글자 무게·색이 다르다. 열 이름으로 정한다 —
   구분·세부(진하게) · 항목(600) · 부담률(500, 숫자정렬) · 식대총액(보조) · 끝수계산(캡션). */
function b2ColClass(head, i){
  if (i === 0) return 'c0';
  if (head === '항목') return 'c-item';
  if (head === '구분') return 'c-gubun';
  if (head === '세부') return 'c-detail';
  // 격리입원료·격리관리료도 부담률 칸이다 — 줄바꿈하지 않고 숫자를 강조한다
  if (/본인부담|부담률|부담액|요양급여비용총액|급여비용|인실|격리/.test(head)) return 'rate';
  if (/식대/.test(head)) return 'c-mid';
  if (/끝수계산|관련 ?근거|근거/.test(head)) return 'c-lite';
  return '';
}

/* 부담률·금액 칸의 숫자만 굵게 강조한다.
   % 나 원 으로 끝나는 덩어리만 잡으므로 "별표2", "15세", "16~30일" 같은 서술 숫자는 건드리지 않는다.
   "30·50(60)·80·90%" 처럼 · 로 이어진 목록은 통째로 하나로 잡는다. */
const B2_NUM = /\d[\d,.]*(?:\s*·\s*[\d()]+)*\s*[%원]/g;
function boldNums(html){
  return html.replace(B2_NUM, m => '<b>' + m + '</b>');
}

/* 특정기호 배지 한 개. 커서를 올리면 data/symbol-codes.js 의 한글명칭을 보여 준다. */
function b2Symb(code){
  const s = SYMBOLS[code];
  const tip = s ? s.n + (s.to && s.to !== '9999.12.31' ? ' (~' + s.to + ')' : '') : '목록에 없는 기호';
  // title 은 쓰지 않는다 — 브라우저 기본 툴팁이 아래 말풍선과 겹쳐서 두 개로 보인다
  return '<span class="symb" data-tip="' + esc(tip) + '">' + esc(code) + '</span>';
}

/* 구분 칸 뒤에 붙는 특정기호 배지 — 행 이름(sec.codes 의 키)으로 찾는다. */
function b2Symbols(sec, label){
  const list = (sec.codes || {})[label];
  if (!list) return '';
  return ' ' + list.map(b2Symb).join(' ');
}

/* 부담률 칸 줄머리에 붙는 특정기호.
   (임신부)·(1세미만) 은 따로 행이 있는 게 아니라 부담률 칸 안의 줄머리라서
   행 이름으로 찾는 sec.codes 로는 붙일 수 없어 여기서 따로 붙인다. */
const B2_LINE_SYMB = { '(임신부)': 'F015', '(1세미만)': 'F024' };

/* 구분 칸 **안의 낱말**에 특정기호 배지를 붙인다.
   sec.codes 는 "행 이름 → 기호" 라 한 칸에 낱말이 여럿이고 각각 기호가 다른 경우를 못 잡는다.
   키는 표(tkey) → 낱말 → 기호. 낱말은 원문 글자 그대로 적는다 — 원문은 고치지 않는다.
   원문에 글자로 적힌 기호(V191,V192,…)도 같이 배지로 바꾼다. */
const B2_TERM_SYMB = {
  'hi-cs|차상위 2종: E,F — 입원#0': {
    '고위험임신부':                  ['F011'],
    '치매':                          ['V800', 'V810'],
    '6~15세':                        ['F020'],
    '자연분만':                      ['F001'],
    '6세미만':                        ['F019'],
    '제왕절개분만':                  ['F013'],
    '장기 등 기증자의 장기등 적출':  ['F017'],
    '산정특례 결핵질환자':           ['V000'],
    '잠복결핵 감염자':               ['F009'],
  },
  'hi-cs|차상위 2종: E,F — 외래#0': {
    '건강검진 확진 의료비 지원':     ['F022'],
    '조산아·저체중아':               ['F016'],
    '산정특례 결핵질환자':           ['V000'],
    '잠복결핵 감염자':               ['F009'],
    '임신부':                        ['F015'],   // 이 표에 '고위험임신부' 는 없다
    '1세미만':                       ['F024'],
    '치매':                          ['V800', 'V810'],
  },
};
/* 한 번만 훑는다 — replace 콜백이 끼워 넣은 HTML 은 다시 검사되지 않아 배지 속 글자에
   또 배지가 붙는 일이 없다. 긴 낱말을 먼저 놓아 짧은 낱말이 먼저 걸리지 않게 한다. */
function b2Terms(html, tkey){
  const map = B2_TERM_SYMB[tkey];
  if (!map) return html;
  // 낱말에 정규식 특수문자가 없어(한글·숫자·물결표) 따로 이스케이프하지 않는다.
  const terms = Object.keys(map).sort((a, b) => b.length - a.length);
  const re = new RegExp('(' + terms.join('|') + ')|(V[0-9]{3}(?:[, ]+V[0-9]{3})*)', 'g');
  return html.replace(re, (m, term, codes) =>
    term ? term + ' ' + map[term].map(b2Symb).join(' ')
         : codes.split(',').map(s => s.trim()).filter(Boolean).map(b2Symb).join(' '));
}

/* ── 원문에 글자로 적힌 특정기호를 배지로 바꾼다 (의료급여 표) ────────────────
   의료급여 표는 기호가 따로 정리된 열에만 있는 게 아니라 "자연분만(F001)" 처럼
   대상 칸 글자 속에 섞여 있다. 그 글자를 찾아 배지(.symb)로 세운다 —
   커서를 올리면 다른 화면과 똑같이 한글명칭이 뜬다. 데이터(data/burden-hira.js)는
   손대지 않는다. 화면에서만 바꾼다.
     · 괄호가 기호만 감싸고 있으면 괄호는 지운다 — 6세미만 (F019) → 6세미만 [F019]
     · F·V 로 시작하고 숫자가 **세 자리**인 것만 기호로 본다.
       상병코드(F20~29 · B20~24)와 "1,000원" 같은 숫자는 걸리지 않는다.
     · M003 · B010 같은 **본인부담구분코드는 배지로 만들지 않는다** — 특정기호가 아니고
       SYMBOLS(특정기호 엑셀)에 없어 띄울 명칭도 없다. 글자 그대로 둔다.
       그래서 "B010·F015*" 는 B010 은 글자, F015 만 배지가 된다. */
const B2_CODE   = '[FV][0-9]{3}';
const B2_CODES  = B2_CODE + '(?:\\s*[,·]\\s*' + B2_CODE + ')*';
const B2_CODERE = new RegExp('\\(\\s*(' + B2_CODES + ')\\s*\\)|(' + B2_CODES + ')', 'g');

/* 아직 이스케이프하지 않은 **원문 글자**를 받는다 (hilite 앞에서 부른다는 뜻).
   기호가 아닌 부분만 hilite 에 태우므로 검색 강조는 그대로 남는다. */
function b2Coded(text, needle){
  const s = String(text);
  let out = '', last = 0, m;
  B2_CODERE.lastIndex = 0;
  while ((m = B2_CODERE.exec(s)) !== null){
    out += hilite(s.slice(last, m.index), needle) +
           (m[1] || m[2]).split(/[,·]/).map(c => b2Symb(c.trim())).join(' ');
    last = m.index + m[0].length;
  }
  return out + hilite(s.slice(last), needle);
}

/* 부담률 칸 그리기.
   · 줄바꿈(\n)은 그대로 줄을 나눈다 — (일반)/(임신부)/(1세미만) 이 한 줄에 뭉치지 않게.
   · 줄머리가 (임신부)·(1세미만) 이면 바로 뒤에 특정기호 배지를 붙인다.
   · 끝에 붙은 "(읍·면 45%)" 는 강조하지 않고 작은 회색으로 — 동지역 값과 구분만 되게. */
function b2Rate(text, needle){
  return String(text).split('\n').map(line => {
    let lead = '';
    const p = line.match(/^\((?:임신부|1세미만)\)\s*/);
    if (p && B2_LINE_SYMB[p[0].trim()]){
      lead = hilite(p[0].trim(), needle) + ' ' + b2Symb(B2_LINE_SYMB[p[0].trim()]) + ' ';
      line = line.slice(p[0].length);
    }
    const m = line.match(/^(.*?)\s*(\(읍·면[^()]*\))\s*$/);
    if (!m) return lead + boldNums(hilite(line, needle));
    return lead + boldNums(hilite(m[1], needle)) +
           ' <span class="alt">' + hilite(m[2], needle) + '</span>';
  }).join('<br>');
}

/* 셀 안의 "주2)" 를 카드 아래 각주로 링크한다 */
function b2Ref(html, cardId){
  return html.replace(/주(\d)\)/g, (m, n) =>
    '<a class="b2-ref" href="#' + cardId + '-note' + n + '">' + m + '</a>');
}

function renderB2Tabs(){
  $('b2-sys').innerHTML = b2Systems().map(s =>
    '<button class="' + (s === b2.sys ? 'on' : '') + '" data-s="' + esc(s) + '">' + esc(s) + '</button>'
  ).join('');
  $('b2-sys').querySelectorAll('button').forEach(c => {
    c.addEventListener('click', () => {
      b2.sys = c.dataset.s;
      b2.tab = b2TabsOf(b2.sys)[0].key;      // 대분류를 바꾸면 소분류는 첫 항목으로
      $('b2-search').value = '';
      renderB2Tabs(); renderB2();
    });
  });

  $('b2-tabs').innerHTML = b2TabsOf(b2.sys).map(t =>
    '<button class="' + (t.key === b2.tab ? 'on' : '') + '" data-k="' + t.key + '">' + esc(t.title) + '</button>'
  ).join('');
  $('b2-tabs').querySelectorAll('button').forEach(c => {
    c.addEventListener('click', () => {
      b2.tab = c.dataset.k;
      $('b2-search').value = '';
      renderB2Tabs(); renderB2();
    });
  });

  const src = B2_SRC[b2.sys];
  $('b2-src').innerHTML = '출처 <b>심평원 ' + esc(b2.sys) + '</b> · ' + src[1];
}

/* 표 중간 소제목 줄인지 본다 (data/burden-hira.js 의 B2_SUB).
   심평원 표의 "주) 본인부담률을 달리 운영하고 있는 특정 항목 및 본인부담률" 목록을
   같은 표 안에 이어 넣되 본표와 구분하려고 둔 줄이다.
   "칸이 하나면 소제목" 으로 보면 안 된다 — 의료급여 외래의 "* 그 밖의 외래진료" 처럼
   진짜로 한 열짜리인 표가 있어서, 값이 B2_SUB 인 것만 소제목으로 친다. */
function b2IsSub(r){ return r.length === 1 && r[0] === B2_SUB; }

/* 어떤 열이든 같은 값이 이어지는 만큼 rowSpan 으로 묶는다 */
function b2SpansCol(rows, ci){
  const span = rows.map(() => 0);
  for (let i = 0; i < rows.length; ){
    let j = i;
    while (j + 1 < rows.length && rows[j + 1][ci] === rows[i][ci] && rows[i][ci] !== '') j++;
    span[i] = j - i + 1;
    for (let k = i + 1; k <= j; k++) span[k] = -1;   // -1 = 위 칸에 흡수됨
    i = j + 1;
  }
  return span;
}
/* 왼쪽 열까지 함께 같아야 묶는다 (구분 열처럼 앞 열에 딸린 열).
   앞 열이 달라지면 끊어야 한다 — 종별이 바뀌었는데 구분 칸이 이어져 보이면 안 된다. */
function b2SpansHier(rows, ci){
  const same = (a, b) => { for (let c = 0; c <= ci; c++) if (a[c] !== b[c]) return false; return true; };
  const span = rows.map(() => 0);
  for (let i = 0; i < rows.length; ){
    let j = i;
    /* 빈 칸도 묶는다 — 앞 열이 모두 같아야 하는 조건이 이미 엄격해서 잘못 묶일 일이 없고,
       원문도 빈 칸을 하나로 병합해 둔다(의료급여 외래의 구분 칸). */
    while (j + 1 < rows.length && same(rows[j + 1], rows[i])) j++;
    span[i] = j - i + 1;
    for (let k = i + 1; k <= j; k++) span[k] = -1;
    i = j + 1;
  }
  return span;
}

/* 어떤 열을, 앞의 묶음 열(보통 요양종별) 경계 안에서만 묶는다.
   장애인 비고 칸이 이 경우다 — 문구가 같아도 종별이 바뀌면 끊어야 한다
   (핸드오프: 외래 표의 장애인 칸 rowspan 은 5 / 9 / 6, 종별 묶음과 같다). */
/* allowEmpty — 빈 칸이 이어질 때도 묶는다. 심평원 원문이 빈 칸도 하나로 병합해 두기 때문이다
   (건보 기타 첫 표의 비고 ① 5행이 그렇다). 기본값은 안 묶는 쪽이다. */
function b2SpansIn(rows, ci, bound, allowEmpty){
  const span = rows.map(() => 0);
  for (let i = 0; i < rows.length; ){
    let j = i;
    while (j + 1 < rows.length &&
           rows[j + 1][ci] === rows[i][ci] && rows[j + 1][bound] === rows[i][bound] &&
           (allowEmpty || rows[i][ci] !== '')) j++;
    span[i] = j - i + 1;
    for (let k = i + 1; k <= j; k++) span[k] = -1;
    i = j + 1;
  }
  return span;
}

/* 표 하나를 그린다. 한 카드에 표가 여럿인 섹션은 이 함수를 여러 번 부른다.
   part = { head, rows, sub? } · colw = 열 너비 배열(없으면 auto) ·
   hoisted = 이 표의 소제목을 카드 제목 옆으로 올렸다는 뜻. */
function b2TableHtml(part, sec, rows, needle, cardId, pi, hoisted, tabKey){
  const hidden = b2Hidden(part);
  const head = b2Keep(part.head, hidden);
  /* 아래 계산은 모두 **화면에 그릴 값**(vis)으로 한다 — 감춘 열(근거·끝수계산)을 빼고 나면
     열 번호가 밀리므로, 원본 배열과 화면 배열을 섞어 쓰면 자리가 어긋난다. */
  const vis = rows.map(r => b2Keep(r, hidden));
  const ix = name => head.indexOf(name);

  /* ── 옆 칸이 흡수하는 열(colspan) ─────────────────────────────
     원문에서 왼쪽 칸과 하나로 병합돼 있는 열이다. 조건이 두 가지다.
       세부   — 값이 비었을 때 (왼쪽이 그 자리까지 씀)
       6세미만 — 값이 왼쪽 칸과 같을 때 (원문도 두 칸을 합쳐 한 값만 적는다)
     "왼쪽 열이 흡수한다"로 두면 표마다 흡수하는 열을 따로 정할 필요가 없다 —
     차상위 외래에서는 구분이, 건보 기타에서는 대상이 세부를 흡수한다. */
  const ABSORB = { '세부': 'empty', '6세미만': 'same' };
  const absorb = [];                       // [{at, left}] — at 열이 left 열에 흡수된다
  for (const name in ABSORB){
    const at = ix(name);
    if (at > 0) absorb.push({ at, left: at - 1, how: ABSORB[name] });
  }
  const eaten = (ri, at) => {              // 이 행에서 at 열이 흡수되는가
    const a = absorb.find(x => x.at === at);
    if (!a) return false;
    const v = vis[ri];
    return a.how === 'empty' ? v[a.at] === '' : (v[a.at] !== '' && v[a.at] === v[a.left]);
  };
  const eats = (ri, left) => absorb.some(a => a.left === left && eaten(ri, a.at));

  /* ── 세로로 묶는 열(rowspan) ──────────────────────────────────
     심평원 원문에서 세로로 병합된 칸을 되살린다. 값이 같으면 원문도 병합돼 있다는 뜻으로 본다.
       HIER  — 0번째부터 그 열까지 **모두** 같아야 묶는다(앞 열에 딸린 이름 칸: 구분 · 대상).
               종별이 바뀌었는데 이름 칸이 이어져 보이면 안 되기 때문이다.
       그 외  — 그 열의 값과 **첫 열**이 같으면 묶는다. 첫 열 묶음을 넘지 않는다.
               빈 칸이 이어지는 것도 묶는다 — 원문이 빈 칸도 하나로 병합해 둔다
               (건보 기타 첫 표의 비고 ① 5행). */
  const HIER = ['구분', '대상'];
  const vspan = {};                         // 열번호 → span 배열
  head.forEach((name, at) => {
    if (at === 0) return;                   // 첫 열은 아래 spans 가 맡는다
    if (HIER.includes(name)){ vspan[at] = b2SpansHier(vis, at); return; }
    /* 흡수(colspan)된 행에는 그 칸이 아예 없다 — 세로 묶음 계산에서 떼어 놓는다.
       그러지 않으면 없는 칸을 묶으려 해서 격자가 어긋난다. */
    const rows2 = vis.map((v, ri) => {
      if (!eaten(ri, at)) return v;
      const c = v.slice(); c[at] = '\u0000' + ri; return c;   // 이 행에서는 이어지지 않게
    });
    vspan[at] = b2SpansIn(rows2, at, 0, true);
  });
  /* 첫 열도 같은 vspan 표에 넣는다 — 아래 그리는 쪽이 vspan 만 보기 때문이다.
     따로 두었다가 그리는 쪽에서 참조하지 않아 첫 열이 병합되지 않는 버그가 있었다. */
  vspan[0] = b2SpansCol(vis, 0);
  const spans = vspan[0];

  /* 아래 구분선 — 마지막 줄은 없음(nb) · 첫 열 묶음 경계는 2px(gsep) · 구분 경계는 1px(msep).
     rowSpan 칸은 자기 span 이 끝나는 줄을 기준으로 본다.
     첫 열이 실제로 묶는 표에서만 gsep 을 쓴다 — 첫 열이 항목처럼 행마다 다른 표에서는
     모든 행이 "묶음 끝"이 되어 굵은 선이 도배된다. msep 도 같다. */
  const ends = (sp, on) => {
    const e = rows.map(() => false);
    if (on && sp) for (let i = 0; i < rows.length; i++) if (sp[i] > 0) e[i + sp[i] - 1] = true;
    return e;
  };
  const gSp = vspan[ix('구분')];
  const gEnd = ends(spans, spans.some(s => s > 1));
  const mEnd = ends(gSp, !!gSp && gSp.some(s => s > 1));
  const sep = ri => ri >= rows.length - 1 ? ' nb'
                  : gEnd[ri] ? ' gsep'
                  : mEnd[ri] ? ' msep' : '';

  /* 손으로 바꾼 너비가 있으면 그것을 쓴다(핸드오프 지정값보다 사용자 조절이 우선) */
  const tkey = b2TKey(tabKey, sec, pi);
  /* 칸 글자를 그리는 함수. 의료급여 표는 글자 속 특정기호를 배지로 바꿔 그리고
     (b2Coded), 건강보험 표는 지금까지대로 글자만 그린다 — 건보 쪽 기호는
     sec.codes · B2_TERM_SYMB 로 이미 손봐 둔 자리가 있어 두 번 붙으면 안 된다. */
  const txt = /^mg-/.test(tabKey || '')
    ? cell => b2Coded(cell, needle)
    : cell => hilite(cell, needle);
  const saved = colwOf(tkey, head.length);      // common.js — 열 개수가 같을 때만 돌려준다
  const colw = saved ? saved.map(n => n + 'px') : b2ColW(tabKey, sec, pi);
  let html = (part.sub && !hoisted) ? '<div class="b2-subh">' + esc(part.sub) + '</div>' : '';

  html += '<div class="b2-scroll"><table class="b2' + (colw ? ' fixed' : '') +
          '" data-k="' + esc(tkey) + '"><thead><tr>' +
      head.map((h, i) => {
        const w = colw && colw[i] ? ' style="width:' + colw[i] + '"' : '';
        const last = i === head.length - 1;
        // 마지막 열 뒤에는 손잡이를 두지 않는다 — 잡을 오른쪽 짝이 없다
        return '<th' + w + (last ? ' class="lastcol"' : '') + '>' + esc(h) +
               (last ? '' : '<span class="rz" title="끌어서 열 너비 조절"></span>') + '</th>';
      }).join('') +
    '</tr></thead><tbody>';

  rows.forEach((r, ri) => {
      if (b2IsSub(r)){
        html += '<tr><td class="subh" colspan="' + head.length + '">' + esc(r[0]) + '</td></tr>';
        return;
      }
      const cells = vis[ri];
      const dim = needle && !sgHit(cells.join(' '), needle);
      html += '<tr' + (dim ? ' class="is-dim"' : '') + '>' + cells.map((cell, i) => {
        if (eaten(ri, i)) return '';                 // 왼쪽 칸에 흡수된 자리
        const sp = vspan[i];
        if (sp && sp[ri] === -1) return '';          // 위 칸에 흡수된 자리
        const n = sp ? sp[ri] : 1;                   // 세로로 묶는 줄 수
        const wide = eats(ri, i) ? 2 : 1;            // 옆 칸까지 쓰는가

        // 항목명 뒤에 붙은 괄호 보조 설명은 흐리게 — 앞쪽 이름 칸에만
        const sub = txt => i <= 1
          ? txt.replace(/\s?(\([^()]{2,}\))$/, (m, g, off) => off > 0 ? ' <span class="sub">' + g + '</span>' : m)
          : txt;

        const name = head[i];
        let cls, body;
        if (i === 0){
          cls  = n > 1 ? 'grp' : 'c0';
          body = n > 1 ? txt(cell)
                       : sub(txt(cell)) + b2Symbols(sec, cell);
        } else if (name === '장애인'){
          cls = 'note'; body = txt(cell);
        } else if (name === '비고'){
          cls = ''; body = cell ? b2Note(cell, needle) : '';
        } else if (name === '구분' || name === '세부'){
          // 구분·세부 칸은 낱말마다 특정기호 배지를 붙인다(B2_TERM_SYMB 에 등록된 표만).
          // 세부에도 임신부·조산아·1세미만 같은 낱말이 들어 있어 두 열을 같이 본다.
          cls = (name === '구분') ? 'c-gubun' : 'c-detail';
          body = b2Terms(sub(txt(cell)), tkey);
        } else {
          cls  = b2ColClass(name, i);
          body = b2Ref(/rate|c-mid/.test(cls) ? b2Rate(cell, needle) : sub(txt(cell)), cardId);
        }

        const attrs = (n > 1 ? ' rowspan="' + n + '"' : '') +
                      (wide > 1 ? ' colspan="' + wide + '"' : '');
        const c = (cls + (wide > 1 ? ' span2' : '') +
                   ((i + wide - 1 === head.length - 1) ? ' lastcol' : '') +
                   sep(ri + n - 1)).trim();
        return '<td' + (c ? ' class="' + c + '"' : '') + attrs + '>' + body + '</td>';
      }).join('') + '</tr>';
  });

  return html + '</tbody></table></div>';
}

function renderB2(){
  const needle = b2Needle();
  // 검색할 때는 그 대분류의 모든 소분류를 훑는다 — 탭을 옮겨 다니며 찾지 않아도 되게.
  const tabs = needle ? b2TabsOf(b2.sys) : [HIRA_BURDEN.find(x => x.key === b2.tab)];
  let total = 0, shown = 0, noteSecs = 0, html = '', ci = 0;

  for (const t of tabs) for (const sec of t.sections){
    // 한 카드 안에 표가 여럿인 섹션은 subs 로 나눠 둔다. 나머지는 표 하나짜리로 본다.
    const parts = sec.subs || [sec];
    // 소제목 줄은 건수에 넣지 않는다
    for (const p of parts) total += p.rows.filter(r => !b2IsSub(r)).length;

    /* 검색은 행을 지우지 않고 흐리게만 한다(핸드오프 불변규칙 6) — 행을 지우면 rowSpan 묶음이
       무너진다. 여기서는 "이 카드에 걸린 게 있나"만 세고, 흐리게 하는 것은 b2TableHtml 이 한다. */
    const hitCount = !needle ? 0 : parts.reduce((n, p) => {
      const hidden = b2Hidden(p);
      return n + p.rows.filter(r => !b2IsSub(r) &&
        sgHit(b2Keep(r, hidden).join(' '), needle)).length;
    }, 0);
    // 특정 항목 부담률은 주석에 적힌 것이 많아, 주석에만 걸려도 그 표를 보여 준다
    const noteHit = needle && (sec.notes || []).some(n => sgHit(n, needle));
    if (needle && !hitCount && !noteHit) continue;
    shown += hitCount;
    if (needle && !hitCount) noteSecs++;

    const cardId = 'b2c' + (++ci);
    // "주1) …" 처럼 앞머리가 붙은 제목은 앞머리를 흐리게
    const hm = sec.h.match(/^(주\d\)|\*)\s*(.*)$/);

    // 첫 표의 소제목은 표 위 띠로 두지 않고 카드 제목 옆으로 올린다(작은 회색 글씨).
    // 뒤따르는 표의 소제목("주) …")은 그대로 띠로 남아 카드 안에서 내용을 끊는다.
    const lead = (parts[0] && parts[0].sub) ? parts[0].sub : '';

    const title =
      (needle ? '<span class="b2-tabtag">' + esc(t.title) + '</span>' : '') +
      b2Icon() +
      (hm ? '<span class="pre">' + esc(hm[1]) + '</span>' + esc(hm[2]) : esc(sec.h));

    // plain:true 인 섹션은 카드(흰 상자) 없이 배경 위에 글줄로만 그린다
    if (sec.plain){
      html += '<div class="b2-plain" id="' + cardId + '">' +
        '<h2>' + title + '</h2>' +
        parts[0].rows.map(r => '<div class="ln"><b>' + hilite(r[0], needle) + '</b>' +
                               '<span>' + b2Rate(r[1], needle) + '</span></div>').join('') +
        '</div>';
      continue;
    }

    html += '<div class="b2-card" id="' + cardId + '">' +
      '<div class="b2-head"><h2>' + title +
        (lead ? '<span class="subtag">' + esc(lead) + '</span>' : '') + '</h2>' +
      (B2_AUX[sec.h] && !needle ? '<span class="aux">' + esc(B2_AUX[sec.h]) + '</span>' : '') +
      '</div>';

    // 행은 늘 전부 그린다 — 안 걸린 행은 흐려질 뿐이다
    parts.forEach((p, pi) => {
      if (!p.rows.length) return;
      html += b2TableHtml(p, sec, p.rows, needle, cardId, pi, pi === 0 && !!lead, t.key);
    });
    html += '</div>';

    // 각주는 카드 밖 — 배경 위에 글자만 놓는다
    for (const n of (sec.notes || [])){
      const nm = n.match(/^주(\d)\)\s*(.*)$/);
      html += '<div class="b2-foot"' + (nm ? ' id="' + cardId + '-note' + nm[1] + '"' : '') + '>' +
        (nm ? '<b>주' + nm[1] + ')</b> ' + hilite(nm[2], needle) : hilite(n, needle)) + '</div>';
    }
  }

  $('b2-count').textContent = !needle
    ? ''
    : (shown ? shown + '건 일치' : '해당 행 없음') +
      (noteSecs ? ' · 각주에 걸린 표 ' + noteSecs + '개' : '');
  $('b2-body').innerHTML = html ||
    '<div class="b2-card"><div class="empty">검색 결과가 없습니다.</div></div>';
}


$('b2-search').addEventListener('input', renderB2);
renderB2Tabs();
renderB2();
