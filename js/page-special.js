/* ---------- ⑥ 특정기호 (2026-08-21 이름 바꿈 — 예전 「산정특례 특정기호」) ----------
   data/special-codes.js 는 「산정특례 질환별 등록기준」 엑셀에서
   특정기호·상병코드·상병일련번호·질환명(국문)만 뽑은 것이다(3,600건이 넘는다).
   여기에 data/symbol-codes.js(「특정기호_20260824.xlsx」 전체 285개)에만 있는 기호를
   「F코드」·「중증질환」·「이식·공여자」·「가정간호」·「중증화상」·「기타 V코드」 구분으로 더해,
   특정기호 285개를 한 화면에서 다 찾을 수 있게 한다.
   적용일자·종료일자도 같은 파일에서 온다 — 종료일자가 오늘보다 지난 기호는 글자를 흐리게 죽인다. */
const sp = { group: '', page: 0 };
const SP_PAGE = 300;                      // 3,600행이 넘어 한 번에 다 그리면 느리다

/* 적용일자·종료일자는 기호마다 하나라 행(SPECIAL_CODES)에는 없다 — 기호로 찾아 쓴다.
   날짜는 CCYY-MM-DD 라 글자 그대로 비교하면 날짜 순서가 된다(오늘도 같은 꼴로 만든다). */
const p2 = n => (n < 10 ? '0' : '') + n;
const SP_TODAY = (d => d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-' + p2(d.getDate()))(new Date());
const spFrom = sym => (SYMBOLS[sym] || {}).from || '';
const spTo   = sym => (SYMBOLS[sym] || {}).to   || '';
const spPast = sym => { const t = spTo(sym); return !!t && t < SP_TODAY; };   // 종료일자가 오늘보다 지난 기호

/* 특정기호 목록(data/symbol-codes.js)에는 있는데 질환별 등록기준에는 없는 기호가 91개 있다.
   F 기호 31개(본인부담 특례)와, 상병목록이 딸리지 않는 V 기호 60개
   (뇌혈관·심장·중증외상·이식·공여자·가정간호·호스피스·약국 특례 등)다.
   끝난 기호 22개(F002·F004·F008·F010 과 V007~V249 의 열여덟)도 여기 들어 있다 —
   지난 청구를 들여다볼 때 필요하니 지우지 않고 글자를 흐리게 죽여 둔다.
   기호 하나를 어느 화면에서 찾을지 헷갈리지 않게 같은 표에 붙인다.
   상병코드·상병일련번호는 이 기호들에 없는 값이라 비워 둔다(추측해 채우지 않는다).
   질환명 칸에는 특정기호 목록의 한글명칭을 원문 그대로 넣는다. */
const SP_F_GROUP = 'F코드';
const SP_V_ETC = '기타 V코드';

/* V 42개는 무엇을 가리키는 기호인지로 나눠 구분(필터)을 따로 둔다.
   배정은 특정기호 목록의 한글명칭을 읽어 손으로 적은 것이다 — 원문에서 자동으로 갈라지지 않는다.
   - 중증질환 5개는 ① 본인부담금 규칙 원문의 표현
     ("중증질환자 중 특정기호 V191,V192,V268,V273,V275 환자")과 같은 묶음이다.
   - 중증화상 5개는 명칭이 「본인일부부담금 산정특례에 관한 기준」[별첨 3](중증도·체표면적 기준)인 것이다.
   - 가정간호는 명칭이 "…가정간호를 받은 경우"인 것 전부다(대상 질환은 달라도 한 묶음).
   - 남는 10개(고엽제 V006 · 약국 특례 V100·V252·V352·V452 · 가정형 호스피스 V301~V304 ·
     희귀질환 V999)는 「기타 V코드」에 둔다. */
const SP_V_GROUPS = [
  ['중증질환',    ['V191', 'V192', 'V268', 'V273', 'V275']],
  ['이식·공여자', ['V073', 'V074', 'V075', 'V076', 'V077', 'V078',
                   'V081', 'V082', 'V083', 'V084', 'V085', 'V086', 'V087', 'V088']],
  ['가정간호',    ['V008', 'V194', 'V231', 'V251', 'V274', 'V293', 'V801', 'V811']],
  ['중증화상',    ['V247', 'V248', 'V250', 'V305', 'V306']]
];
/* 특정기호 목록에서 온 구분들 — 출처 표기(meta-note)와 표의 행 순서에 쓴다.
   화면에 나오는 칩 순서는 아래 spGroups() 가 따로 정한다. */
const SP_SYM_ORDER = [SP_F_GROUP].concat(SP_V_GROUPS.map(g => g[0]), SP_V_ETC);

const SP_IN_SPEC = SPECIAL_CODES.reduce((o, d) => (o[d.sym] = 1, o), {});
const SP_V_OF = {};
for (const [g, list] of SP_V_GROUPS){
  for (const k of list){
    // 특정기호 목록을 갈아 끼웠을 때 없어진/등록기준으로 옮겨간 기호를 조용히 흘리지 않는다
    if (!SYMBOLS[k] || SP_IN_SPEC[k]) console.warn('산정특례 구분에 배정한 기호가 목록에 없다:', k, g);
    SP_V_OF[k] = g;
  }
}
const SP_SYM_ROWS = Object.keys(SYMBOLS).filter(k => !SP_IN_SPEC[k]).sort().map(k => ({
  g: k.charAt(0) === 'F' ? SP_F_GROUP : (SP_V_OF[k] || SP_V_ETC), sym: k, code: '', seq: '',
  name: SYMBOLS[k].n
})).sort((a, b) =>
  SP_SYM_ORDER.indexOf(a.g) - SP_SYM_ORDER.indexOf(b.g) || a.sym.localeCompare(b.sym));
const SP_ROWS = SPECIAL_CODES.concat(SP_SYM_ROWS);

/* F 기호 명칭에서 **눈으로 먼저 찾는 문구**만 파랑 볼드로 띄운다 (2026-08-21 사용자 지정).
   문구는 명칭 원문에서 그대로 잘라낸 것이다 — 원문 글자는 고치지 않는다.
   - F007 은 사용자가 "정신의학과"로 적었으나 원문이 "정신건강의학과"라 원문 글자를 쓴다.
   - F025·F026 은 떨어진 두 군데("상급종합병원" + "외래 재진/초진 진료")라 문구를 두 개 적는다.
   - F006(요양병원 입원 본인부담율 40% 적용환자)은 지정하지 않아 하이라이트가 없다.
   명칭에서 문구를 못 찾으면 콘솔에 경고가 찍힌다(특정기호 목록을 갈아 끼웠을 때를 위해). */
const SP_F_KEY = {
  F001: ['자연분만'],
  F003: ['의약분업 예외환자'],
  F005: ['신생아 입원진료'],
  F007: ['정신건강의학과 입원진료'],
  F009: ['잠복결핵감염 검진비지원대상자'],
  F011: ['고위험 임신부 입원진료'],
  F012: ['사람유두종바이러스(HPV) 예방접종'],
  F013: ['제왕절개 분만 입원진료'],
  F014: ['16일이상 장기입원'],
  F015: ['임신부 외래진료'],
  F016: ['조산아 및 저체중 출생아의 외래진료'],
  F017: ['장기등 기증자'],
  F018: ['15세이하 아동의 입원진료'],
  F019: ['6세미만 아동의 입원진료'],
  F020: ['6세이상 15세이하 아동의 입원진료'],
  F021: ['난임진료'],
  F022: ['본인부담 면제 대상자'],
  F023: ['연장승인(선택의료급여기관) 미신청자(불승인자)'],
  F024: ['1세미만 외래진료'],
  F025: ['상급종합병원', '외래 재진 진료'],
  F026: ['상급종합병원', '외래 초진 진료'],
  F027: ['2세 미만 영유아의 입원진료'],
  F028: ['자립준비청년 의료비'],
  F029: ['연간 외래진료 횟수가 365회를 초과'],
  F030: ['만성질환 통합관리 대상자'],
  F031: ['응급실 진료']
};
/* 명칭 뒤에 작은 회색 글씨로 덧붙이는 설명 — 고시 원문이 아니라 화면 설명이라 따로 둔다. */
const SP_F_NOTE = {
  F022: '국가건강검진 시 시행한 보건복지부 장관이 정하여 고시하는 확진검사'
};
for (const k of Object.keys(SP_F_KEY)){
  for (const p of SP_F_KEY[k]){
    if (!SYMBOLS[k] || SYMBOLS[k].n.indexOf(p) < 0)
      console.warn('F 기호 하이라이트 문구를 명칭에서 못 찾았다:', k, p);
  }
}

/* 칩 순서 — 자주 보는 다섯 개를 앞에 못 박고(전체 다음), 나머지는 건수 많은 순이다.
   건수가 같으면 원래 순서(등록기준 엑셀 → 특정기호 목록)를 지킨다. */
const SP_HEAD_ORDER = ['F코드', '이식·공여자', '가정간호', '희귀질환', '중증난치질환'];
function spCounts(){
  const n = {};
  for (const d of SP_ROWS) n[d.g] = (n[d.g] || 0) + 1;
  return n;
}
function spGroups(){
  const seen = [];
  for (const d of SP_ROWS) if (!seen.includes(d.g)) seen.push(d.g);
  const n = spCounts();
  const head = SP_HEAD_ORDER.filter(g => seen.includes(g));
  const rest = seen.filter(g => !head.includes(g))
    .sort((a, b) => n[b] - n[a] || seen.indexOf(a) - seen.indexOf(b));
  return head.concat(rest);
}
function spFiltered(){
  const needle = $('sp-search').value.trim().toLowerCase();
  const rows = SP_ROWS.filter(d =>
    (!sp.group || d.g === sp.group) &&
    (!needle || sgHit(d.sym + ' ' + d.code + ' ' + d.seq + ' ' + d.name + ' ' +
                      spFrom(d.sym) + ' ' + spTo(d.sym), needle)));
  /* 전체(구분을 고르지 않은 상태)는 특정기호 오름차순으로 본다.
     구분을 고르면 원본 엑셀 순서(질환 등록기준 순서)를 그대로 둔다. */
  if (!sp.group){
    rows.sort((a, b) =>
      a.sym.localeCompare(b.sym) || a.code.localeCompare(b.code) || a.seq.localeCompare(b.seq));
  }
  return rows;
}
function renderSpGroups(){
  const mk = (v, label, n) =>
    '<button class="chip' + (sp.group === v ? ' on' : '') + '" data-v="' + esc(v) + '">' +
    esc(label) + '<small>' + n + '</small></button>';
  const n = spCounts();
  $('sp-groups').innerHTML =
    mk('', '전체', SP_ROWS.length) +
    spGroups().map(g => mk(g, g, n[g])).join('');
  $('sp-groups').querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => { sp.group = c.dataset.v; sp.page = 0; renderSpGroups(); renderSpTable(); });
  });
}
function renderSpTable(){
  const needle = $('sp-search').value.trim().toLowerCase();
  const rows = spFiltered();
  const start = sp.page * SP_PAGE;
  const view = rows.slice(start, start + SP_PAGE);

  $('sp-meta').innerHTML =
    '<span><b>' + (sp.group || '전체') + '</b></span>' +
    '<span>' + rows.length.toLocaleString() + '건' +
      (rows.length > SP_PAGE ? ' 중 ' + (start + 1).toLocaleString() + '~' +
        Math.min(start + SP_PAGE, rows.length).toLocaleString() : '') + '</span>' +
    '<span class="meta-note">' +
      (SP_SYM_ORDER.includes(sp.group) ? '특정기호 목록 (2026.8.24. 기준)'
       : sp.group ? '산정특례 질환별 등록기준 (2026.1.1. 기준) · 적용일자는 특정기호 목록'
       : '산정특례 질환별 등록기준 (2026.1.1. 기준) · 특정기호 목록 (2026.8.24. 기준)') +
    '</span>';

  if (!view.length){ $('sp-table').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>'; return; }

  const mark = t => hilite(t, needle);
  /* 질환명 칸 — F 기호는 지정 문구를 <b class="sp-key"> 로 감싼다.
     검색 하이라이트와 태그가 엉키지 않게, 문구 앞·문구·뒤로 잘라 조각마다 hilite 를 걸고 합친다. */
  const spName = d => {
    const keys = SP_F_KEY[d.sym];
    let html = '';
    if (!keys) html = mark(d.name);
    else {
      const hits = [];
      for (const k of keys){ const i = d.name.indexOf(k); if (i >= 0) hits.push([i, i + k.length]); }
      hits.sort((a, b) => a[0] - b[0]);
      let at = 0;
      for (const [s, e] of hits){
        if (s < at) continue;                       // 문구가 겹치면 뒤엣것은 버린다
        html += mark(d.name.slice(at, s)) + '<b class="sp-key">' + mark(d.name.slice(s, e)) + '</b>';
        at = e;
      }
      html += mark(d.name.slice(at));
    }
    return SP_F_NOTE[d.sym]
      ? html + ' <span class="sp-keynote">' + esc(SP_F_NOTE[d.sym]) + '</span>' : html;
  };
  let html = '<table class="fields sp"><thead><tr>' +
    '<th>구분</th><th>특정기호</th><th>상병코드</th><th>상병일련번호</th>' +
    '<th>질환명 (국문)</th><th>적용일자</th><th>종료일자</th>' +
    '</tr></thead><tbody>' +
    view.map(d =>
      '<tr' + (spPast(d.sym) ? ' class="sp-past"' : '') + '>' +
      '<td class="sp-g">' + esc(d.g) + '</td>' +
      '<td class="sp-sym">' + mark(d.sym) + '</td>' +
      '<td class="sp-code">' + (d.code ? mark(d.code) : '<span class="saved-note">—</span>') + '</td>' +
      '<td class="sp-seq">' + (d.seq ? esc(d.seq) : '<span class="saved-note">—</span>') + '</td>' +
      '<td class="sp-name">' + spName(d) + '</td>' +
      '<td class="sp-date">' + mark(spFrom(d.sym)) + '</td>' +
      '<td class="sp-date">' + mark(spTo(d.sym)) + '</td></tr>'
    ).join('') + '</tbody></table>';

  const pages = Math.ceil(rows.length / SP_PAGE);
  if (pages > 1){
    html += '<div class="pager">' +
      '<button class="btn" data-p="prev"' + (sp.page === 0 ? ' disabled' : '') + '>이전</button>' +
      '<span>' + (sp.page + 1) + ' / ' + pages + '</span>' +
      '<button class="btn" data-p="next"' + (sp.page >= pages - 1 ? ' disabled' : '') + '>다음</button>' +
    '</div>';
  }
  $('sp-table').innerHTML = html;
  $('sp-table').querySelectorAll('.pager .btn').forEach(b => {
    b.addEventListener('click', () => {
      sp.page += (b.dataset.p === 'next' ? 1 : -1);
      renderSpTable();
      $('sp-table').scrollIntoView({block: 'start', behavior: 'smooth'});
    });
  });
}
$('sp-search').addEventListener('input', () => { sp.page = 0; renderSpTable(); });
renderSpGroups(); renderSpTable();
