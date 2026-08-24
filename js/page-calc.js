/* ---------- ② 본인부담금 계산기 — 수기 계산 ----------
   손으로 쓰는 계산지를 그대로 옮긴 원장 한 장이다.
     ① 총진료비                      ② 산정대상 금액 × 법정본인부담률
     ③ 본인부담률이 다른 항목 금액      ④ 그 금액 × 그 항목의 부담률
     ⑤ 산정대상 금액 = ① − Σ③         ⑥ 본인부담금 = ② + Σ④
   소수점은 그대로 둔다 — **절사는 하지 않는다**(사용자가 알아서 한다, 2026-08-21 요청).

   **부담률은 전부 사용자가 직접 적는다** (2026-08-21).
   자격 · 종별 · 환자유형 · 산정특례로 부담률을 자동으로 채워 주던 규칙표
   (HI_OUT · HI_IN · CS2_* · MG_* · SPECIALS · CALC_ITEMS)와 그걸 쓰던 코드
   (baseBurden · typeTable · seniorBand · autoBase · renderHint · 조건 칸 · 「부담률 규칙값으로」)는
   화면에서 조건 칸을 걷어내면서 **같이 지웠다** — 규칙값을 볼 곳이 없어 이름만 남아 있었다.
   그 값들은 ① 「본인부담금 규칙」 화면(data/burden-hira.js)에서 보고,
   지운 코드는 깃 이력(2026-08-21 이전 판 js/page-calc.js)에 남아 있다.

   검산 — 세부작성요령(2025.8.1.) 203~206쪽 예시:
     총진료비 28,800 · 진찰료 21,030(부담률 100%) · 법정본인부담률 60%
     → 산정대상 7,770 × 60% = 4,662 + 21,030 = **25,692**
       (요령의 25,600원은 여기서 100원 미만을 버린 값 — 절사는 화면에서 하지 않는다)
   계산 방식은 두 가지 — 「수기 계산」과 「SAM 파일 불러오기」. SAM 쪽은 아직 비어 있다
   (어느 레코드의 어느 금액을 읽을지 정해지면 붙인다).
------------------------------------------------------------------ */

const WAYS = ['수기 계산', 'SAM 파일 불러오기'];

/* 계산 한 벌 = 탭 하나. 명세서 여러 건을 동시에 두고 오갈 수 있게 배열로 들고 있고,
   `calc` 는 늘 **지금 보고 있는 한 벌**을 가리킨다 — 아래 코드는 전부 `calc` 만 본다. */
function newSheet(){
  return { total:0, items:[],
           baseUnit:'pct',      // 'pct' 부담률 · 'won' 정액
           baseVal:null,        // 법정본인부담률(또는 정액) — 안 적으면 null
           baseFix:null,        // 법정본인부담을 손으로 적었을 때
           cmp:{ mg:0, hos:0 } };   // MG · 병원 청구액
}
let sheets = [newSheet()];
let cur = 0;
let calc = sheets[0];
let calcWay = WAYS[0];                   // 계산 방식은 탭과 상관없이 하나다

function rateStr(r){ return Math.round((r || 0) * 1000) / 10; }
function hasVal(v){ return v !== null && v !== undefined; }

/* ---------- 계산 방식 (대분류 한 줄) ---------- */
function applyWayPanes(){
  const manual = calcWay === WAYS[0];
  $('c-pane-manual').style.display = manual ? '' : 'none';
  $('c-pane-sam').style.display    = manual ? 'none' : '';
  if ($('c-tabs-row')) $('c-tabs-row').style.display = manual ? 'flex' : 'none';
}
function renderWays(){
  $('c-way').innerHTML = WAYS.map(v =>
    '<button class="chip' + (calcWay === v ? ' on' : '') + '" data-w="' + esc(v) + '">' +
    esc(v) + '</button>').join('');
  $('c-way').querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    calcWay = c.dataset.w;
    applyWayPanes();
    renderWays();
    saveCalc();
  }));
  applyWayPanes();
}

/* ---------- 계산 탭 ----------
   ✕ 는 두 벌 이상일 때만 나온다. 이름 대신 그 계산의 총진료비를 같이 적어 구분한다. */
function renderTabs(){
  if (!$('c-tabs')) return;
  $('c-tabs').innerHTML = sheets.map((s, i) =>
    '<button class="chip' + (i === cur ? ' on' : '') + '" data-t="' + i + '">계산 ' + (i + 1) +
    '<small data-tab-total="' + i + '">' + (s.total ? won(s.total) : '비어 있음') + '</small>' +
    (sheets.length > 1 ? '<span class="tabx" data-tx="' + i + '" title="이 계산 닫기">✕</span>' : '') +
    '</button>').join('');
}
function switchSheet(i){
  if (i < 0 || i >= sheets.length || i === cur) return;
  cur = i; calc = sheets[cur];
  renderTabs(); refreshCalc();
}
function addSheet(){
  sheets.push(newSheet());
  cur = sheets.length - 1; calc = sheets[cur];
  renderTabs(); refreshCalc();
}
function closeSheet(i){
  if (sheets.length <= 1) return;
  sheets.splice(i, 1);
  if (cur >= sheets.length) cur = sheets.length - 1;
  else if (i < cur) cur--;
  calc = sheets[cur];
  renderTabs(); refreshCalc();
}

/* ---------- 제외 항목 (본인부담률이 다른 항목) ----------
   빈 줄은 늘 맨 아래에 한 개 둔다. 부담률은 채워 넣지 않는다 — 사용자가 직접 적는다. */
function blankItem(){ return { name:'', amount:0, rate:null }; }
function isBlankItem(it){
  return !(it.name || '').trim() && !it.amount && !hasVal(it.rate) && !hasVal(it.burdenFix);
}
function ensureBlankRow(){
  const last = calc.items[calc.items.length - 1];
  if (last && isBlankItem(last)) return false;
  calc.items.push(blankItem());
  return true;
}

/* ---------- 원장 한 장 ----------
   금액·부담률 입력칸이 이 표 안에 있으므로 글자를 칠 때마다 표를 다시 그리지 않는다
   (다시 그리면 커서가 빠진다). 계산 결과는 paint() 가 [data-out] 칸만 갈아 넣는다. */
function baseRateCell(){
  const v = hasVal(calc.baseVal)
    ? (calc.baseUnit === 'won' ? calc.baseVal.toLocaleString() : rateStr(calc.baseVal)) : '';
  return '<span class="rate-cell">' +
    '<input class="field-input mini" id="c-brate" inputmode="decimal" value="' + v + '">' +
    '<button class="btn xs" id="c-bunit" title="부담률(%) ⇄ 정액(원)">' +
      (calc.baseUnit === 'won' ? '원' : '%') + '</button></span>';
}
function moneyCell(attrs, val){
  return '<input class="field-input money mini" ' + attrs +
         ' type="text" inputmode="numeric" placeholder="0"' +
         ' title="+ − × ÷ 로 셈도 됩니다 (예: 190040+342080)" value="' +
         (val ? val.toLocaleString() : '') + '">';
}
/* 제외 항목 한 줄. 맨 아래 빈 줄에는 지우는 단추를 두지 않는다(늘 있는 줄이라). */
function itemRowHTML(it, i){
  const tail = isBlankItem(it) && i === calc.items.length - 1;
  return '<tr>' +
    '<td><input class="field-input mini" data-i="' + i + '" data-f="name" ' +
      'placeholder="항목명 (선택)" value="' + esc(it.name || '') + '"></td>' +
    '<td>' + moneyCell('data-i="' + i + '" data-f="amount"', it.amount) + '</td>' +
    '<td><input class="field-input mini pctin" data-i="' + i + '" data-f="rate" ' +
      'inputmode="decimal" value="' + (hasVal(it.rate) ? rateStr(it.rate) : '') +
      '"><span class="pctsign">%</span></td>' +
    '<td class="num fixable" data-out="item-' + i + '" data-fixkey="item-' + i + '" ' +
      'title="두 번 누르면 이 줄 본인부담을 직접 적을 수 있습니다">0</td>' +
    '<td>' + (tail ? '' : '<button class="btn xs" data-del="' + i + '" title="이 줄 지우기">✕</button>') +
    '</td></tr>';
}

function renderLed(){
  const rows = [];

  // ① 총진료비 ↔ ② 법정본인부담
  rows.push('<tr>' +
    '<td><span class="c-name">총진료비</span>' +
      '<div class="saved-note">요양급여비용총액 1</div></td>' +
    '<td>' + moneyCell('id="c-total"', calc.total) + '</td>' +
    '<td>' + baseRateCell() + '</td>' +
    '<td class="num fixable" data-fixkey="base" ' +
      'title="두 번 누르면 법정본인부담을 직접 적을 수 있습니다">' +
      '<span data-out="base-burden">0</span>' +
      '<div class="saved-note" data-out="base-note"></div></td>' +
    '<td></td></tr>');

  // ③ 본인부담률이 다른 항목 ↔ ④ 그 항목의 본인부담
  ensureBlankRow();
  calc.items.forEach((it, i) => rows.push(itemRowHTML(it, i)));

  $('c-led').innerHTML =
    '<table class="fields items led fixed"><thead><tr>' +
      '<th>구분</th><th style="width:150px;">금액</th><th style="width:118px;">부담률</th>' +
      '<th style="width:150px;">본인부담</th><th style="width:40px;"></th>' +
    '</tr></thead><tbody>' + rows.join('') + '</tbody><tfoot>' +
      '<tr><td><span class="c-name">합계</span></td>' +
        '<td class="num b" data-out="base-amt">0</td><td></td>' +
        '<td class="num strong" data-out="burden">0</td><td></td></tr>' +
      '<tr><td>청구액</td><td></td><td></td>' +
        '<td class="num" data-out="claim">0</td><td></td></tr>' +
    '</tfoot></table>';
}

/* ---------- 계산 ----------
   본인부담 칸을 두 번 눌러 손으로 적어 넣은 값(fix)이 있으면 곱셈 결과 대신 그 값을 쓴다. */
function compute(){
  const T = calc.total;
  const exSum   = calc.items.reduce((a, i) => a + i.amount, 0);
  const baseAmt = T - exSum;
  const baseAuto = calc.baseUnit === 'won' ? (calc.baseVal || 0) : baseAmt * (calc.baseVal || 0);
  const baseBurdenAmt = hasVal(calc.baseFix) ? calc.baseFix : baseAuto;
  const itemB   = calc.items.map(i => hasVal(i.burdenFix) ? i.burdenFix
                                                          : i.amount * (i.rate || 0));
  const exBurden = itemB.reduce((a, b) => a + b, 0);
  // 절사는 하지 않는다 — 사용자가 알아서 한다(2026-08-21 요청). 합계가 그대로 본인부담금이다.
  const burden = baseBurdenAmt + exBurden;
  return { T, exSum, baseAmt, baseBurdenAmt, itemB, exBurden, burden, claim: T - burden };
}

function paint(){
  const r = compute();
  // 지금 손으로 적어 넣는 중인 칸(입력칸이 들어 있는 칸)은 건드리지 않는다
  const set = (k, v) => document.querySelectorAll('#page-calc [data-out="' + k + '"]')
                                .forEach(el => { if (!el.querySelector('[data-fix]')) el.innerHTML = v; });
  set('base-burden', won2(r.baseBurdenAmt));
  set('base-note', hasVal(calc.baseFix) ? '수기로 적은 값'
        : (calc.baseUnit === 'won' ? (hasVal(calc.baseVal) ? '정액' : '')
                                   : (hasVal(calc.baseVal)
                                        ? esc(won(r.baseAmt) + ' × ' + pct(calc.baseVal)) : '')));
  r.itemB.forEach((b, i) => set('item-' + i,
    won2(b) + (hasVal(calc.items[i] && calc.items[i].burdenFix) ? '<div class="saved-note">수기</div>' : '')));
  set('exburden', won2(r.exBurden));
  set('base-amt', won(r.baseAmt));
  set('burden', won2(r.burden));
  set('claim', won2(r.claim));
  set('total', won(r.T));
  renderWarn(r);
  paintCmp();
  const lab = document.querySelector('[data-tab-total="' + cur + '"]');
  if (lab) lab.textContent = calc.total ? won(calc.total) : '비어 있음';
  saveCalc();                    // 적어 둔 것은 이 브라우저에 남긴다
}

function renderWarn(r){
  const w = [];
  if (r.baseAmt < 0) w.push('제외 항목 금액의 합이 총진료비보다 큽니다. 금액을 확인해 주세요.');
  $('c-warn').innerHTML = w.length
    ? '<div class="res-warn">' + w.map(x => '<div>· ' + x + '</div>').join('') + '</div>' : '';
}

/* ---------- MG · 병원 두 벌 비교 (오른쪽 칸) ----------
   총진료비는 왼쪽 원장의 값을 그대로 따라오고, 청구액만 적으면
   본인부담금 = 총진료비 − 청구액. 두 벌의 본인부담금 차액도 같이 보여 준다. */
const CMP_COLS = [{ key:'mg', label:'MG' }, { key:'hos', label:'병원' }];
function cmpBurden(k){ return calc.total - (calc.cmp[k] || 0); }
function renderCmp(){
  if (!$('c-cmp')) return;
  $('c-cmp').innerHTML =
    '<table class="fields items cmp fixed"><thead><tr><th>구분</th>' +
      CMP_COLS.map(c => '<th style="width:104px;">' + esc(c.label) + '</th>').join('') +
    '</tr></thead><tbody>' +
      '<tr><td>총진료비</td>' +
        CMP_COLS.map(() => '<td class="num" data-out="cmp-total">0</td>').join('') + '</tr>' +
      '<tr><td>청구액</td>' +
        CMP_COLS.map(c => '<td>' + moneyCell('data-cmp="' + c.key + '"', calc.cmp[c.key]) + '</td>').join('') +
      '</tr>' +
      '<tr><td><span class="c-name">본인부담금</span></td>' +
        CMP_COLS.map(c => '<td class="num b" data-out="cmp-burden-' + c.key + '">0</td>').join('') +
      '</tr>' +
    '</tbody><tfoot><tr><td>차액 (MG − 병원)</td>' +
      '<td class="num b" colspan="2" data-out="cmp-diff">0</td></tr></tfoot></table>';
}
function paintCmp(){
  if (!$('c-cmp')) return;
  const set = (k, v) => document.querySelectorAll('#c-cmp [data-out="' + k + '"]')
                                .forEach(el => el.innerHTML = v);
  const mg = cmpBurden('mg'), hos = cmpBurden('hos');
  set('cmp-total', won(calc.total));
  set('cmp-burden-mg', won(mg));
  set('cmp-burden-hos', won(hos));
  set('cmp-diff', won(mg - hos) + '원');
  // 병원 본인부담금이 MG 보다 적으면 빨강 · 크면 파랑 (차액도 같은 색)
  const dir = hos === mg ? '' : (hos < mg ? 'cmp-less' : 'cmp-more');
  ['cmp-burden-hos', 'cmp-diff'].forEach(k => {
    const el = $('c-cmp').querySelector('[data-out="' + k + '"]');
    if (!el) return;
    el.classList.remove('cmp-less', 'cmp-more');
    if (dir) el.classList.add(dir);
  });
}

/* 표를 다시 그리지 않고 법정본인부담 칸만 맞춘다 */
function syncBaseInput(){
  const inp = $('c-brate'), btn = $('c-bunit');
  if (!inp) return;
  if (document.activeElement !== inp)
    inp.value = hasVal(calc.baseVal)
      ? (calc.baseUnit === 'won' ? calc.baseVal.toLocaleString() : rateStr(calc.baseVal)) : '';
  if (btn) btn.textContent = calc.baseUnit === 'won' ? '원' : '%';
}
/* calcExpr · HAS_OP · readAmount · reformatMoney 는 질병군 계산기도 같이 쓰게 되어
   js/common.js 로 옮겼다 (2026-08-21). */

// 칸을 떠나거나 Enter 를 누르면 식을 계산 결과로 바꿔 적는다
function commitMoney(inp){
  if (!inp || !inp.classList || !inp.classList.contains('money')) return;
  if (inp.value.trim() === '') return;
  let val;
  if (inp.id === 'c-total') val = calc.total;
  else if (inp.dataset.cmp) val = calc.cmp[inp.dataset.cmp] || 0;
  else val = (calc.items[Number(inp.dataset.i)] || {}).amount || 0;
  inp.value = val ? val.toLocaleString() : '';
}

/* ---------- 적어 둔 것 남기기 (이 브라우저에만) ----------
   메모장과 같은 방식이다 — 화면을 옮기거나 새로고침해도 그대로 있게 localStorage 에 담는다.
   {v:2, way, cur, sheets:[…]} — 탭이 없던 예전 판(낱개 객체)은 첫 탭으로 옮겨 담는다. */
const CALC_KEY = 'samguide_calc';
function sheetToSave(s){
  return {
    total:s.total, baseUnit:s.baseUnit, baseVal:s.baseVal, baseFix:s.baseFix,
    cmp:{ mg:s.cmp.mg, hos:s.cmp.hos },
    items:s.items.map(i => ({ name:i.name || '', amount:i.amount, rate:i.rate,
                              burdenFix:(i.burdenFix === undefined ? null : i.burdenFix) }))
  };
}
function saveCalc(){
  try {
    localStorage.setItem(CALC_KEY, JSON.stringify({
      v:2, way:calcWay, cur:cur, dates:dateCalc, sheets:sheets.map(sheetToSave)
    }));
  } catch (e) {}
}
function sheetFromSave(s){
  const o = newSheet();
  if (!s || typeof s !== 'object') return o;
  o.total = Number(s.total) || 0;
  if (s.baseUnit === 'won' || s.baseUnit === 'pct') o.baseUnit = s.baseUnit;
  o.baseVal = typeof s.baseVal === 'number' ? s.baseVal : null;
  o.baseFix = typeof s.baseFix === 'number' ? s.baseFix : null;
  if (s.cmp && typeof s.cmp === 'object')
    o.cmp = { mg:Number(s.cmp.mg) || 0, hos:Number(s.cmp.hos) || 0 };
  if (Array.isArray(s.items))
    o.items = s.items.filter(i => i && typeof i === 'object')
      .map(i => ({ name:String(i.name || ''), amount:Number(i.amount) || 0,
                   rate:typeof i.rate === 'number' ? i.rate : null,
                   burdenFix:typeof i.burdenFix === 'number' ? i.burdenFix : null }));
  return o;
}
function loadCalc(){
  let s = null;
  try { s = JSON.parse(localStorage.getItem(CALC_KEY) || 'null'); } catch (e) {}
  if (!s || typeof s !== 'object') return;
  if (WAYS.includes(s.way)) calcWay = s.way;
  const list = Array.isArray(s.sheets) ? s.sheets : [s];
  sheets = list.length ? list.map(sheetFromSave) : [newSheet()];
  cur = Number.isInteger(s.cur) && s.cur >= 0 && s.cur < sheets.length ? s.cur : 0;
  calc = sheets[cur];
  if (s.dates && typeof s.dates === 'object')
    dateCalc = { start:String(s.dates.start || ''),
                 days:Math.max(0, Math.round(Number(s.dates.days) || 0)) };
}

function refreshCalc(){
  renderLed();
  renderCmp();
  paint();
}

/* ---------- 날짜 계산기 (오른쪽 칸) ----------
   진료개시일에 입(내)원일수를 더해 진료기간을 알려 준다.
     진료종료일 = 진료개시일 + (입(내)원일수 − 1)      ← 개시일도 하루로 센다
   (청구방법 237쪽 예시 "1월 1일~1월 5일 입원, 입원일수 5일"과 같은 셈이다.)
   SAM 파일에 적는 CCYYMMDD 8자리도 같이 보여 준다.
   탭(계산 한 벌)과 상관없는 딸림 도구라 값은 따로 저장한다. */
let dateCalc = { start:'', days:0 };
const DOW = ['일', '월', '화', '수', '목', '금', '토'];
function dcParse(s){
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d) ? null : d;
}
function dcFmt(d){
  const p = n => String(n).padStart(2, '0');
  return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate()) +
         ' <span class="saved-note">(' + DOW[d.getDay()] + ')</span>';
}
function dcSam(d){
  const p = n => String(n).padStart(2, '0');
  return '' + d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate());
}
function renderDate(){
  if (!$('d-out')) return;
  // 치는 중이 아니면 칸도 상태에 맞춘다(새로고침 뒤 되살리기)
  if (document.activeElement !== $('d-start')) $('d-start').value = dateCalc.start || '';
  if (document.activeElement !== $('d-days')) $('d-days').value = dateCalc.days ? dateCalc.days : '';
  const start = dcParse(dateCalc.start), days = dateCalc.days;
  if (!start || days < 1){
    $('d-out').innerHTML = '<div class="saved-note">진료개시일과 입(내)원일수를 적으면 진료기간이 나옵니다.</div>';
    return;
  }
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + days - 1);
  $('d-out').innerHTML =
    '<div class="dg-sum-line"><span>진료기간</span>' +
      '<b style="font-size:13.5px;">' + dcFmt(start) + ' ~ ' + dcFmt(end) + '</b><i></i></div>' +
    '<div class="dg-sum-line"><span>입(내)원일수</span><b>' + days + '</b><i>일</i></div>' +
    '<div class="dg-sum-line"><span>SAM (CCYYMMDD)</span>' +
      '<b>' + dcSam(start) + ' ~ ' + dcSam(end) + '</b><i></i></div>';
}
if ($('d-start')) $('d-start').addEventListener('input', () => {
  dateCalc.start = $('d-start').value;
  renderDate(); saveCalc();
});
if ($('d-days')) $('d-days').addEventListener('input', () => {
  dateCalc.days = Math.max(0, Math.round(Number(String($('d-days').value).replace(/[^0-9]/g, '')) || 0));
  $('d-days').value = dateCalc.days ? dateCalc.days : '';
  renderDate(); saveCalc();
});

/* ---------- 손 ---------- */
$('c-led').addEventListener('input', e => {
  const t = e.target;
  if (t.id === 'c-total'){
    const a = readAmount(t);
    if (a.ok) calc.total = a.val;
    if (!a.formula) reformatMoney(t, calc.total);
    paint();
    return;
  }
  if (t.id === 'c-brate'){
    const s = t.value.trim();
    calc.baseVal = s === ''
      ? null
      : (calc.baseUnit === 'won' ? parseMoney(s) : (parseFloat(s) || 0) / 100);
    paint();
    return;
  }
  const i = Number(t.dataset.i);
  const it = calc.items[i];
  if (!it) return;
  if (t.dataset.f === 'amount'){
    const a = readAmount(t);
    if (a.ok) it.amount = a.val;
    if (!a.formula) reformatMoney(t, it.amount);
  }
  else if (t.dataset.f === 'rate'){
    const s = t.value.trim();
    it.rate = s === '' ? null : (parseFloat(s) || 0) / 100;   // 비워 두면 안 적은 것으로 본다
  }
  else if (t.dataset.f === 'name'){ it.name = t.value; }
  // 맨 아래 줄에 뭔가 적으면 그 밑에 빈 줄을 하나 더 만든다.
  // 표를 다시 그리지 않고 줄만 붙인다 — 치던 커서가 빠지지 않게.
  if (i === calc.items.length - 1 && !isBlankItem(it)){
    const tb = $('c-led').querySelector('tbody');
    const tr = tb && tb.querySelectorAll('tr')[i + 1];          // tbody 첫 줄은 총진료비
    if (tr && !tr.querySelector('[data-del]'))                  // 채워졌으니 지우는 단추를 준다
      tr.lastElementChild.innerHTML =
        '<button class="btn xs" data-del="' + i + '" title="이 줄 지우기">✕</button>';
    calc.items.push(blankItem());
    if (tb) tb.insertAdjacentHTML('beforeend',
      itemRowHTML(calc.items[calc.items.length - 1], calc.items.length - 1));
  }
  paint();
});

/* 옮겨 가는 순서 — 금액 → **같은 줄 부담률** → **다음 줄 금액**. Tab 과 Enter 가 같게 움직인다.
   부담률 뒤의 ✕(과 총진료비 줄의 원/% 단추)은 건너뛴다. */
function nextCell(t){
  const led = $('c-led');
  const moneys = [...led.querySelectorAll('input.money')];          // [총진료비, 각 줄 금액…]
  const rates  = [...led.querySelectorAll('input[data-f="rate"]')]; // 줄별 부담률 (c-brate 는 빠짐)
  if (t.classList.contains('money')){
    const i = moneys.indexOf(t);
    return i <= 0 ? $('c-brate') : rates[i - 1];
  }
  const row = t.id === 'c-brate' ? 0 : rates.indexOf(t) + 1;
  return moneys[row + 1] || null;
}
function goCell(el){
  if (!el) return false;
  el.focus();
  try { el.select(); } catch (e) {}
  return true;
}
$('c-led').addEventListener('keydown', e => {
  const t = e.target;
  if (t.dataset && t.dataset.fix !== undefined){          // 본인부담을 손으로 적는 칸
    if (e.key === 'Enter'){ e.preventDefault(); commitFix(t, true); }
    else if (e.key === 'Escape'){ e.preventDefault(); commitFix(t, false); }
    return;
  }
  const isMoney = t.classList && t.classList.contains('money');
  const isRate  = t.id === 'c-brate' || (t.dataset && t.dataset.f === 'rate');
  if (!isMoney && !isRate) return;
  if (e.key === 'Enter'){
    e.preventDefault();
    if (isMoney) commitMoney(t);
    goCell(nextCell(t));
    return;
  }
  if (e.key !== 'Tab' || e.shiftKey || e.altKey || e.ctrlKey) return;
  if (isMoney) return;                                    // 금액 → 부담률은 브라우저 기본 순서
  if (goCell(nextCell(t))) e.preventDefault();            // 다음 줄이 없으면 그대로 둔다
});
// 금액 칸을 떠나면 적어 둔 식을 계산 결과로 바꿔 적는다
$('c-led').addEventListener('focusout', e => {
  if (e.target.dataset && e.target.dataset.fix !== undefined) commitFix(e.target, true);
  else commitMoney(e.target);
});

/* ---------- 본인부담 칸을 두 번 눌러 손으로 적기 ----------
   곱셈 결과를 그대로 못 쓰는 줄(원단위 절사·가산이 섞인 줄 등)이 있어서 열어 둔다.
   비우고 나가면 다시 자동 계산으로 돌아간다. */
function fixOf(key){
  if (key === 'base') return calc.baseFix;
  const it = calc.items[Number(key.slice(5))];
  return it ? it.burdenFix : null;
}
function setFix(key, v){
  if (key === 'base'){ calc.baseFix = v; return; }
  const it = calc.items[Number(key.slice(5))];
  if (it) it.burdenFix = v;
}
function fixCellHTML(key){
  return key === 'base'
    ? '<span data-out="base-burden">0</span><div class="saved-note" data-out="base-note"></div>'
    : '0';
}
function commitFix(inp, keep){
  const cell = inp.closest('[data-fixkey]');
  if (!cell) return;
  const key = cell.dataset.fixkey;
  if (keep){
    const s = inp.value.trim();
    const v = s === '' ? null : (HAS_OP.test(s) ? calcExpr(s) : parseMoney(s));
    setFix(key, hasVal(v) ? Math.max(0, Math.round(v)) : null);
  }
  cell.innerHTML = fixCellHTML(key);
  paint();
}
$('c-led').addEventListener('dblclick', e => {
  // 열 너비 손잡이를 두 번 누르면 common.js 가 저장값만 지운다(칸 너비는 빈 값이 된다)
  // — 표를 다시 그려 소스 기본 너비(150·118·150·40)로 돌려놓는다.
  if (e.target.classList && e.target.classList.contains('rz')){
    setTimeout(() => { renderLed(); paint(); }, 0);
    return;
  }
  const cell = e.target.closest('[data-fixkey]');
  if (!cell || cell.querySelector('[data-fix]')) return;
  const key = cell.dataset.fixkey;
  const cur0 = fixOf(key);
  cell.innerHTML = '<input class="field-input money mini" data-fix="' + esc(key) + '" ' +
    'inputmode="numeric" placeholder="자동" title="비우고 나가면 다시 자동 계산" value="' +
    (hasVal(cur0) ? cur0.toLocaleString() : '') + '">';
  const inp = cell.querySelector('[data-fix]');
  inp.focus();
  try { inp.select(); } catch (err) {}
});

$('c-led').addEventListener('click', e => {
  const del = e.target.closest('[data-del]');
  if (del){
    calc.items.splice(Number(del.dataset.del), 1);
    renderLed(); paint();
    return;
  }
  if (e.target.id === 'c-bunit'){        // 부담률(%) ⇄ 정액(원)
    calc.baseUnit = calc.baseUnit === 'won' ? 'pct' : 'won';
    calc.baseVal = null;
    renderLed(); paint();
    const inp = $('c-brate'); if (inp) inp.focus();
  }
});

/* MG · 병원 청구액 칸 — 원장과 같게 셈(+ − × ÷)도 되고 Enter 로 옆 칸으로 넘어간다 */
if ($('c-cmp')){
  $('c-cmp').addEventListener('input', e => {
    const k = e.target.dataset && e.target.dataset.cmp;
    if (!k) return;
    const a = readAmount(e.target);
    if (a.ok) calc.cmp[k] = a.val;
    if (!a.formula) reformatMoney(e.target, calc.cmp[k]);
    paintCmp(); saveCalc();
  });
  $('c-cmp').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.dataset || !e.target.dataset.cmp) return;
    e.preventDefault();
    commitMoney(e.target);
    const ins = [...$('c-cmp').querySelectorAll('input.money')];
    goCell(ins[ins.indexOf(e.target) + 1]);
  });
  $('c-cmp').addEventListener('focusout', e => commitMoney(e.target));
}

$('c-clear').addEventListener('click', () => {
  sheets[cur] = newSheet();
  calc = sheets[cur];
  renderTabs(); refreshCalc();
});

/* 계산 탭 — 명세서 여러 건을 동시에 */
if ($('c-tabs'))
  $('c-tabs').addEventListener('click', e => {
    const x = e.target.closest('[data-tx]');
    if (x){ closeSheet(Number(x.dataset.tx)); return; }
    const t = e.target.closest('[data-t]');
    if (t) switchSheet(Number(t.dataset.t));
  });
if ($('c-newtab')) $('c-newtab').addEventListener('click', addSheet);

loadCalc();          // 지난번에 적어 둔 것부터 되살린다
renderWays();
renderTabs();
refreshCalc();
renderDate();
