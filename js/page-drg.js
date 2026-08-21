/* ---------- 질병군(DRG) 본인부담금 계산기 ----------
   출처: 「포괄수가제 요양급여비용 및 청구방법(2026.3.)」
         Ⅱ. 질병군 요양급여비용 청구방법 / 제2장 명세서 세부작성요령 214~216쪽,
         Ⅰ. (별표 2의3) 2인실 내지 5인실 이용 시 추가비용 및 본인부담액 계산식 36~37쪽,
         234~238쪽 별도산정·차액단가 작성요령(2인실 예시는 237쪽).
   점수 자료: data/drg-scores.js (붙임1_DRG별 점수.xlsx, 2026.01.01. 기준 93개 질병군).

   ── 계산 순서 ─────────────────────────────────────────────
   ① 포괄수가   점수 총합 × 점수당 단가 → 10원 미만 4사5입
                본인부담 = 【기준점수 + (입원일수 − 평균입원일수) × 일당점수】(+야간공휴점수)
                           × 점수당 단가 × 본인부담률 → 10원 미만 4사5입
   ② 별도산정   줄마다 단가 × 1회투약량 × 일투 × 총투 × 보상률 → 원 미만 4사5입
                (식대 · 외과전문의 가산 · PCA 등) · 제외금액(1인실 · 인공수정체)은 뺀다
   ③ 상급병실   (별표 2의3) 2인실~5인실 추가비용과 본인부담액
   ④ 열외군     행위별 진료비총액 − 질병군 요양급여비용총액 − 100만원 (양수일 때만)
   ⑤ 합계       ①+②+③+④ → 10원 미만 **절사**
   ─────────────────────────────────────────────────────────

   점수 계산 규칙 (214~215쪽)
     · 곱셈·나눗셈은 계산 과정마다 소수점 이하 셋째 자리에서 4사5입
     · 점수 총합은 소수점 이하 둘째 자리까지
     · 정상군   : 【기준 + (일수−평균)×일당】×20% + 【기준】×80%
     · 하단열외군: 위 20% 항 + 【기준 − (하한−일수)×일당】×80%
     · 상단열외군: 위 20% 항 + 【기준 + (일수−상한)×일당】×80%
     · 야간·공휴 수술이면 각 【 】 안에 야간공휴점수를 더한다
     · 부인과 가산이면 기준점수 자리에 가산점수를 쓴다(일당점수는 그대로)
   위 네 가지(정상군·하단·상단·야간공휴·부인과가산·요양정신)를 심평원
   「일자별수가(2026.01.01.기준)」 붙임2·8·14·19 값과 맞춰 검산했다.
------------------------------------------------------------------ */

/* 종별 — 점수 열은 [상급종합, 종합병원, 병원, 의원] 이고
   요양·정신병원은 병원 점수에 점수당단가 84.2 를 쓴다. */
const DG_INSTS = [
  { name:'상급종합병원', si:0, unit:'hosp' },
  { name:'종합병원',     si:1, unit:'hosp' },
  { name:'병원',         si:2, unit:'hosp' },
  { name:'의원',         si:3, unit:'clinic' },
  { name:'요양·정신병원', si:2, unit:'ltc' },
];
/* 본인부담률 — 「일자별수가」 붙임 파일 구분과 같다 */
const DG_RATES = [
  { v:.20, label:'20% 일반' },
  { v:.14, label:'14% 차상위 만성질환·18세 미만' },
  { v:.10, label:'10% 희귀질환·중증난치질환' },
  { v:.05, label:'5% 15세 이하·중증질환자' },
  { v:.03, label:'3% 차상위 15세 이하' },
  { v:0,   label:'0% 제왕절개·차상위 경감·6세 미만 등' },
];
const DG_ROOMS = [{ k:'r2', label:'2인실' }, { k:'r3', label:'3인실' },
                  { k:'r4', label:'4인실' }, { k:'r5', label:'5인실' }];

/* ---------- 숫자 다루기 ---------- */
const r3 = n => Math.round(n * 1000) / 1000;      // 계산 과정마다 소수 셋째 자리 4사5입
const r2 = n => Math.round(n * 100) / 100;        // 점수 총합은 소수 둘째 자리까지
const up10 = n => Math.round(n / 10) * 10;        // 10원 미만 4사5입
const cut10 = n => Math.floor(n / 10) * 10;       // 10원 미만 절사
const dgHas = v => v !== null && v !== undefined;

/* ---------- 화면 상태 ---------- */
function dgNewItem(){ return { name:'', price:0, once:1, day:1, tot:1, comp:1, rate:null }; }
function dgNewState(){
  return { code:'', q:'', inst:'상급종합병원', los:1, rate:.20, night:false, gyn:false,
           items:[], excl:0,                    // 제외금액 (1인실 · 인공수정체)
           fee:0,                               // 행위별 진료비총액 (열외군 판정)
           base6:0,                             // 6인실이상 기본점수입원료
           rooms:{ r2:{ d:0, p:0, rate:null }, r3:{ d:0, p:0, rate:null },
                   r4:{ d:0, p:0, rate:null }, r5:{ d:0, p:0, rate:null } } };
}
let dg = dgNewState();

const DG_KEY = 'samguide_drg';
function dgSave(){
  try { localStorage.setItem(DG_KEY, JSON.stringify(dg)); } catch (e) {}
}
function dgLoad(){
  let s = null;
  try { s = JSON.parse(localStorage.getItem(DG_KEY) || 'null'); } catch (e) {}
  if (!s || typeof s !== 'object') return;
  const o = dgNewState();
  if (typeof s.code === 'string' && DRG_SCORES.some(d => d.c === s.code)) o.code = s.code;
  if (typeof s.q === 'string') o.q = s.q;
  if (DG_INSTS.some(i => i.name === s.inst)) o.inst = s.inst;
  o.los = Math.max(1, Number(s.los) || 1);
  if (DG_RATES.some(r => r.v === s.rate)) o.rate = s.rate;
  o.night = !!s.night; o.gyn = !!s.gyn;
  o.excl = Number(s.excl) || 0;
  o.fee = Number(s.fee) || 0;
  o.base6 = Number(s.base6) || 0;
  if (Array.isArray(s.items))
    o.items = s.items.filter(i => i && typeof i === 'object').map(i => ({
      name:String(i.name || ''), price:Number(i.price) || 0,
      once:Number(i.once) || 0, day:Number(i.day) || 0, tot:Number(i.tot) || 0,
      comp:dgHas(i.comp) ? Number(i.comp) : 1,
      rate:typeof i.rate === 'number' ? i.rate : null }));
  if (s.rooms && typeof s.rooms === 'object')
    DG_ROOMS.forEach(({ k }) => {
      const v = s.rooms[k];
      if (v && typeof v === 'object')
        o.rooms[k] = { d:Number(v.d) || 0, p:Number(v.p) || 0,
                       rate:typeof v.rate === 'number' ? v.rate : null };
    });
  dg = o;
}

/* ---------- 골라 놓은 질병군 · 종별 ---------- */
function dgPick(){ return DRG_SCORES.find(d => d.c === dg.code) || null; }
function dgInst(){ return DG_INSTS.find(i => i.name === dg.inst) || DG_INSTS[0]; }
function dgUnit(){ return DRG_UNIT[dgInst().unit]; }

/* 2인실~5인실 본인부담률 자동값 — (별표 2의3)
     2·3인실: 상급종합 50·40% / 그 밖 40·30% (자격과 무관, 6인실 차감분만 자격 부담률)
     4·5인실: 상급종합 30·20% / 그 밖 20·20%,
              단 영 별표2 제3호 대상자(부담률이 20%가 아닌 경우)는 그 부담률을 그대로 쓴다 */
function dgRoomRate(k){
  const top = dg.inst === '상급종합병원';
  if (k === 'r2') return top ? .50 : .40;
  if (k === 'r3') return top ? .40 : .30;
  if (dg.rate !== .20) return dg.rate;            // 4·5인실 + 제3호 대상자
  if (k === 'r4') return top ? .30 : .20;
  return .20;                                     // 5인실
}
function dgRoomRateOf(k){
  const v = dg.rooms[k].rate;
  return dgHas(v) ? v : dgRoomRate(k);
}

/* ---------- 포괄수가 한 건 (입원일수 하나) ----------
   일자별 표도 이 함수를 그대로 쓴다 — 같은 계산을 두 벌 두지 않는다. */
function dgPackAt(los){
  const S = dgPick(), inst = dgInst(), unit = dgUnit();
  if (!S) return null;
  const i = inst.si;
  const base = (dg.gyn && S.gyn) ? S.gyn[i] : S.base[i];   // 부인과 가산이면 가산점수
  const day  = S.day[i];
  const night = dg.night ? S.night[i] : 0;
  // 20% 항 — 평균 입원일수 기준. 본인부담금도 이 점수를 쓴다(215~216쪽)
  const adj = r3(base + r3((los - S.avg) * day));
  const partA = r3((adj + night) * .2);
  let band, partB;
  if (los < S.lo){
    band = '하단열외군';
    partB = r3((r3(base - r3((S.lo - los) * day)) + night) * .8);
  } else if (los > S.hi){
    band = '상단열외군';
    partB = r3((r3(base + r3((los - S.hi) * day)) + night) * .8);
  } else {
    band = '정상군';
    partB = r3((base + night) * .8);
  }
  const score = r2(partA + partB);
  const hitScore = r2(adj + night);
  return { S, unit, los, band, base, day, night, adj, partA, partB, score, hitScore,
           pack: up10(score * unit),                    // 포괄수가 (10원 미만 4사5입)
           packOwn: up10(hitScore * unit * dg.rate) };   // 포괄수가 본인부담 (10원 미만 4사5입)
}

/* ---------- 계산 ---------- */
function dgCompute(){
  const S = dgPick(), unit = dgUnit();
  const los = Math.max(1, Number(dg.los) || 1);
  const o = Object.assign({ S, unit, los, band:'', score:0, hitScore:0, pack:0, packOwn:0 },
                          dgPackAt(los) || {});

  // ② 별도산정 — 줄마다 원 미만 4사5입
  o.items = dg.items.map(it => {
    const amt = Math.round(it.price * (it.once || 0) * (it.day || 0) * (it.tot || 0) * (dgHas(it.comp) ? it.comp : 1));
    const rate = dgHas(it.rate) ? it.rate : dg.rate;
    return { amt, rate, own: amt * rate };
  });
  o.extra    = o.items.reduce((a, x) => a + x.amt, 0);
  o.extraOwn = o.items.reduce((a, x) => a + x.own, 0);
  o.excl     = dg.excl;
  o.exclOwn  = dg.excl * dg.rate;

  // ③ 2인실~5인실 (별표 2의3)
  let addRoom = 0, ownRoom = 0, days6 = 0;
  o.rooms = DG_ROOMS.map(({ k, label }) => {
    const r = dg.rooms[k], d = r.d || 0, p = r.p || 0, rate = dgRoomRateOf(k);
    const add = Math.max(0, p - dg.base6) * d;      // 추가비용 = (그 인실 − 6인실이상) × 일수
    const own = p * d * rate;                       // 본인부담 = 인실 단가 × 일수 × 인실 부담률
    addRoom += add; ownRoom += own; days6 += d;
    return { k, label, d, p, rate, add, own };
  });
  o.days6 = days6;
  o.room6Own = dg.base6 * days6 * dg.rate;          // 6인실이상 × 이용일수 × 자격 부담률 (차감)
  o.roomAdd = addRoom;
  o.roomOwn = ownRoom - o.room6Own;

  // ④ 열외군 — 질병군 요양급여비용총액(10원 미만 절사)과 견준다
  o.drgTotal = cut10(o.pack + o.extra + o.roomAdd - o.excl);
  o.gap = dg.fee > 0 ? dg.fee - o.drgTotal - 1000000 : 0;
  o.isOut = o.gap > 0;
  o.outAdd = o.isOut ? o.gap : 0;
  o.outOwn = o.isOut ? o.gap * dg.rate : 0;

  // ⑤ 합계 — 마지막에 10원 미만 절사
  o.total = cut10(o.pack + o.extra + o.roomAdd - o.excl + o.outAdd);
  o.own   = cut10(o.packOwn + o.extraOwn + o.roomOwn - o.exclOwn + o.outOwn);
  o.claim = o.total - o.own;
  return o;
}

/* ---------- 화면 ---------- */
function dgFill(el, list, cur, val, label){
  el.innerHTML = list.map(v =>
    '<option value="' + esc(val(v)) + '"' + (val(v) === cur ? ' selected' : '') + '>' +
    esc(label(v)) + '</option>').join('');
}
function dgRenderPickers(){
  const q = dg.q.trim().toLowerCase();
  const list = DRG_SCORES.filter(d => !q || sgHit(d.c + ' ' + d.n, q));
  const sel = $('dg-code');
  sel.innerHTML = '<option value="">— 질병군을 고르세요 (' + list.length + '건) —</option>' +
    list.map(d => '<option value="' + d.c + '"' + (d.c === dg.code ? ' selected' : '') + '>' +
      esc(d.c + '  ' + d.n) + '</option>').join('');
  if (dg.code && !list.some(d => d.c === dg.code))     // 검색에서 빠진 것도 고른 채로 둔다
    sel.insertAdjacentHTML('afterbegin',
      '<option value="' + dg.code + '" selected>' + esc(dg.code + '  ' + (dgPick() || {}).n) + '</option>');
  dgFill($('dg-inst'), DG_INSTS, dg.inst, i => i.name, i => i.name);
  dgFill($('dg-rate'), DG_RATES, String(dg.rate), r => String(r.v), r => r.label);
  $('dg-los').value = dg.los;
  $('dg-night').checked = dg.night;
  $('dg-gyn').checked = dg.gyn;
  const S = dgPick();
  $('dg-gyn-wrap').style.display = (S && S.gyn) ? '' : 'none';   // 부인과 가산이 있는 질병군만
}

function dgMoney(attrs, val){
  return '<input class="field-input money mini" ' + attrs + ' type="text" inputmode="numeric"' +
    ' title="+ − × ÷ 로 셈도 됩니다" placeholder="0" value="' +
    (val ? val.toLocaleString() : '') + '">';
}
function dgNum(attrs, val){
  return '<input class="field-input mini num-in" ' + attrs + ' inputmode="decimal" value="' +
    (dgHas(val) ? val : '') + '">';
}

/* ① 포괄수가 */
function dgRenderPack(o){
  const S = o.S;
  if (!S){
    $('dg-pack').innerHTML = '<div class="saved-note" style="padding:10px 2px;">질병군을 고르면 포괄수가를 계산합니다.</div>';
    return;
  }
  const u = o.unit;
  $('dg-pack').innerHTML =
    '<table class="fields items dgt fixed"><thead><tr>' +
      '<th>구분</th><th style="width:150px;">점수</th><th style="width:190px;">금액</th>' +
    '</tr></thead><tbody>' +
      '<tr><td><span class="c-name">' + esc(S.c) + '</span>' +
        '<div class="saved-note">' + esc(S.n) + '</div></td>' +
        '<td class="num">기준 ' + won2(o.base) + '<div class="saved-note">일당 ' + won2(o.day) +
          (o.night ? ' · 야간공휴 ' + won2(o.night) : '') +
          (dg.gyn && S.gyn ? ' · 부인과 가산점수 적용' : '') + '</div></td>' +
        '<td class="num">점수당 단가 ' + won2(u) + '원</td></tr>' +
      '<tr><td>입원일수 <b>' + o.los + '일</b> · ' + esc(o.band) +
        '<div class="saved-note">평균 ' + won2(S.avg) + '일 · 하한 ' + S.lo + '일 · 상한 ' + S.hi + '일</div></td>' +
        '<td class="num">20% 항 ' + won2(o.partA) + '<div class="saved-note">80% 항 ' + won2(o.partB) + '</div></td>' +
        '<td class="num"></td></tr>' +
    '</tbody><tfoot>' +
      '<tr><td>포괄수가 (점수 총합 × 점수당 단가 · 10원 미만 4사5입)</td>' +
        '<td class="num b">' + won2(o.score) + '</td>' +
        '<td class="num b">' + won(o.pack) + '</td></tr>' +
      '<tr><td>포괄수가 본인부담금 (본인부담 기준점수 × 단가 × ' + pct(dg.rate) + ' · 10원 미만 4사5입)</td>' +
        '<td class="num b">' + won2(o.hitScore) + '</td>' +
        '<td class="num strong">' + won(o.packOwn) + '</td></tr>' +
    '</tfoot></table>' + dgDayTable(o);
}

/* 일자별 포괄수가 — 입원일수 1일부터 상한 + 3일까지 (지금 고른 일수는 파랗게).
   줄을 누르면 그 입원일수로 바뀐다. 청구액 = 전체 − 본인부담 (붙임 파일의 「보험자」와 같다). */
function dgDayTable(o){
  const S = o.S;
  if (!S) return '';
  const maxD = Math.max(S.hi + 3, o.los);
  const rows = [];
  for (let d = 1; d <= maxD; d++){
    const a = dgPackAt(d);
    rows.push('<tr class="dg-day' + (d === o.los ? ' hit' : '') + '" data-dday="' + d + '">' +
      '<td>' + d + '일 <span class="saved-note">' + esc(a.band) + '</span></td>' +
      '<td class="num">' + won2(a.score) + '</td>' +
      '<td class="num">' + won(a.pack) + '</td>' +
      '<td class="num">' + won(a.packOwn) + '</td>' +
      '<td class="num">' + won(a.pack - a.packOwn) + '</td></tr>');
  }
  return '<div class="saved-note" style="margin:14px 0 6px;">일자별 포괄수가 — 줄을 누르면 그 입원일수로 계산합니다.</div>' +
    '<table class="fields items dgt fixed"><thead><tr>' +
      '<th>입원일수</th><th style="width:130px;">점수</th><th style="width:150px;">전체</th>' +
      '<th style="width:150px;">본인부담</th><th style="width:150px;">보험자</th>' +
    '</tr></thead><tbody>' + rows.join('') + '</tbody></table>';
}

/* ② 별도산정 (행위별) */
function dgItemRow(it, i, calc){
  const tail = dgIsBlank(it) && i === dg.items.length - 1;
  return '<tr>' +
    '<td><input class="field-input mini" data-di="' + i + '" data-df="name" ' +
      'placeholder="항목명 (선택)" value="' + esc(it.name || '') + '"></td>' +
    '<td>' + dgMoney('data-di="' + i + '" data-df="price"', it.price) + '</td>' +
    '<td>' + dgNum('data-di="' + i + '" data-df="once"', it.once) + '</td>' +
    '<td>' + dgNum('data-di="' + i + '" data-df="day"', it.day) + '</td>' +
    '<td>' + dgNum('data-di="' + i + '" data-df="tot"', it.tot) + '</td>' +
    '<td>' + dgNum('data-di="' + i + '" data-df="comp"', it.comp) + '</td>' +
    '<td class="num" data-dout="item-amt-' + i + '">0</td>' +
    '<td><input class="field-input mini pctin" data-di="' + i + '" data-df="rate" ' +
      'inputmode="decimal" value="' + (dgHas(it.rate) ? Math.round(it.rate * 1000) / 10 : '') +
      '" placeholder="' + Math.round(dg.rate * 1000) / 10 + '"><span class="pctsign">%</span></td>' +
    '<td class="num" data-dout="item-own-' + i + '">0</td>' +
    '<td>' + (tail ? '' : '<button class="btn xs" data-ddel="' + i + '" title="이 줄 지우기">✕</button>') +
    '</td></tr>';
}
function dgIsBlank(it){
  return !(it.name || '').trim() && !it.price && !dgHas(it.rate);
}
function dgEnsureBlank(){
  const last = dg.items[dg.items.length - 1];
  if (last && dgIsBlank(last)) return;
  dg.items.push(dgNewItem());
}
function dgRenderItems(){
  dgEnsureBlank();
  $('dg-extra').innerHTML =
    '<table class="fields items dgt fixed"><thead><tr>' +
      '<th>항목</th><th style="width:112px;">단가</th><th style="width:66px;">1회량</th>' +
      '<th style="width:60px;">일투</th><th style="width:60px;">총투</th><th style="width:66px;">보상률</th>' +
      '<th style="width:118px;">금액</th><th style="width:78px;">부담률</th>' +
      '<th style="width:118px;">본인부담</th><th style="width:38px;"></th>' +
    '</tr></thead><tbody>' +
      dg.items.map((it, i) => dgItemRow(it, i)).join('') +
    '</tbody><tfoot>' +
      '<tr><td>별도산정 합계 <span class="saved-note">줄마다 원 미만 4사5입</span></td>' +
        '<td colspan="5"></td>' +
        '<td class="num b" data-dout="extra">0</td><td></td>' +
        '<td class="num b" data-dout="extra-own">0</td><td></td></tr>' +
      '<tr><td>제외금액 <span class="saved-note">1인실 이용 · 인공수정체 제외금액</span></td>' +
        '<td colspan="5">' + dgMoney('id="dg-excl"', dg.excl) + '</td>' +
        '<td class="num" data-dout="excl">0</td><td class="num">' + pct(dg.rate) + '</td>' +
        '<td class="num" data-dout="excl-own">0</td><td></td></tr>' +
    '</tfoot></table>';
}

/* ③ 2인실~5인실 */
function dgRenderRooms(){
  $('dg-room').innerHTML =
    '<table class="fields items dgt fixed"><thead><tr>' +
      '<th>인실</th><th style="width:150px;">기본점수입원료</th><th style="width:90px;">이용일수</th>' +
      '<th style="width:90px;">부담률</th><th style="width:150px;">추가비용</th>' +
      '<th style="width:150px;">본인부담</th>' +
    '</tr></thead><tbody>' +
      DG_ROOMS.map(({ k, label }) => {
        const r = dg.rooms[k];
        return '<tr><td><span class="c-name">' + label + '</span></td>' +
          '<td>' + dgMoney('data-dr="' + k + '" data-df="p"', r.p) + '</td>' +
          '<td>' + dgNum('data-dr="' + k + '" data-df="d"', r.d) + '</td>' +
          '<td><input class="field-input mini pctin" data-dr="' + k + '" data-df="rate" ' +
            'inputmode="decimal" value="' + (dgHas(r.rate) ? Math.round(r.rate * 1000) / 10 : '') +
            '" placeholder="' + Math.round(dgRoomRate(k) * 1000) / 10 + '"><span class="pctsign">%</span></td>' +
          '<td class="num" data-dout="room-add-' + k + '">0</td>' +
          '<td class="num" data-dout="room-own-' + k + '">0</td></tr>';
      }).join('') +
      '<tr><td><span class="c-name">6인실 이상</span>' +
        '<div class="saved-note">본인부담에서 빼는 몫 — 2·3인실은 이 자격 부담률로 뺀다</div></td>' +
        '<td>' + dgMoney('id="dg-base6"', dg.base6) + '</td>' +
        '<td class="num" data-dout="room-days">0일</td>' +
        '<td class="num">' + pct(dg.rate) + '</td>' +
        '<td class="num"></td>' +
        '<td class="num" data-dout="room6-own">0</td></tr>' +
    '</tbody><tfoot><tr><td colspan="4">2인실~5인실 합계</td>' +
      '<td class="num b" data-dout="room-add">0</td>' +
      '<td class="num b" data-dout="room-own">0</td></tr></tfoot></table>';
}

/* ④ 열외군 */
function dgRenderOut(){
  $('dg-out').innerHTML =
    '<table class="fields items dgt fixed"><thead><tr>' +
      '<th>구분</th><th style="width:190px;">금액</th><th style="width:190px;">본인부담</th>' +
    '</tr></thead><tbody>' +
      '<tr><td><span class="c-name">행위별 진료비총액</span>' +
        '<div class="saved-note">행위별 산정 방식으로 계산한 총액 (219쪽) — 적지 않으면 열외군으로 보지 않는다</div></td>' +
        '<td>' + dgMoney('id="dg-fee"', dg.fee) + '</td><td class="num"></td></tr>' +
      '<tr><td>질병군 요양급여비용총액 <span class="saved-note">포괄수가 + 별도산정 + 상급병실 − 제외금액 (10원 미만 절사)</span></td>' +
        '<td class="num" data-dout="drg-total">0</td><td class="num"></td></tr>' +
    '</tbody><tfoot><tr><td data-dout="out-label">열외군 차액</td>' +
      '<td class="num b" data-dout="out-add">0</td>' +
      '<td class="num b" data-dout="out-own">0</td></tr></tfoot></table>';
}

/* ⑤ 합계 */
function dgRenderSum(o){
  const line = (name, a, b) =>
    '<tr><td>' + name + '</td><td class="num">' + won2(a) + '</td><td class="num">' + won2(b) + '</td></tr>';
  $('dg-sum').innerHTML =
    '<div class="res-head">' +
      '<div class="res-big"><span>본인일부부담금</span><b>' + won(o.own) + '</b><i>원</i></div>' +
      '<div class="res-sub">요양급여비용총액 1 <b>' + won(o.total) + '</b>원 · 청구액 <b>' + won(o.claim) + '</b>원</div>' +
    '</div>' +
    '<table class="fields items dgt fixed" style="margin-top:12px;"><thead><tr>' +
      '<th>구분</th><th style="width:190px;">금액</th><th style="width:190px;">본인부담</th>' +
    '</tr></thead><tbody>' +
      line('① 포괄수가' + (o.S ? ' <span class="saved-note">' + esc(o.band) + '</span>' : ''), o.pack, o.packOwn) +
      line('② 별도산정 (행위별)', o.extra, o.extraOwn) +
      line('③ 2인실~5인실 입원료', o.roomAdd, o.roomOwn) +
      line('④ 열외군 차액', o.outAdd, o.outOwn) +
      line('− 제외금액', -o.excl, -o.exclOwn) +
    '</tbody><tfoot><tr><td>합계 <span class="saved-note">10원 미만 절사</span></td>' +
      '<td class="num b">' + won(o.total) + '</td>' +
      '<td class="num strong">' + won(o.own) + '</td></tr>' +
      '<tr><td>청구액</td><td class="num"></td><td class="num">' + won(o.claim) + '</td></tr>' +
    '</tfoot></table>';
}

function dgPaint(){
  const o = dgCompute();
  const set = (k, v) => document.querySelectorAll('#page-drg [data-dout="' + k + '"]')
                                .forEach(el => el.innerHTML = v);
  o.items.forEach((x, i) => { set('item-amt-' + i, won(x.amt)); set('item-own-' + i, won2(x.own)); });
  set('extra', won(o.extra));
  set('extra-own', won2(o.extraOwn));
  set('excl', won(o.excl));
  set('excl-own', won2(o.exclOwn));
  o.rooms.forEach(r => { set('room-add-' + r.k, won(r.add)); set('room-own-' + r.k, won2(r.own)); });
  set('room-days', o.days6 + '일');
  set('room6-own', '−' + won2(o.room6Own));
  set('room-add', won(o.roomAdd));
  set('room-own', won2(o.roomOwn));
  set('drg-total', won(o.drgTotal));
  set('out-label', o.isOut
    ? '열외군 차액 <span class="saved-note">행위별 진료비총액 − 질병군 요양급여비용총액 − 100만원</span>'
    : '열외군 아님 <span class="saved-note">차액이 100만원을 넘지 않으면 0</span>');
  set('out-add', won(o.outAdd));
  set('out-own', won2(o.outOwn));
  dgRenderPack(o);
  dgRenderSum(o);
  dgSave();
}
function dgRefresh(){
  dgRenderPickers();
  dgRenderItems();
  dgRenderRooms();
  dgRenderOut();
  dgPaint();
}

/* ---------- 손 ---------- */
$('dg-q').addEventListener('input', () => { dg.q = $('dg-q').value; dgRenderPickers(); dgSave(); });
$('dg-code').addEventListener('change', () => { dg.code = $('dg-code').value; dgRefresh(); });
$('dg-inst').addEventListener('change', () => { dg.inst = $('dg-inst').value; dgRefresh(); });
$('dg-rate').addEventListener('change', () => { dg.rate = Number($('dg-rate').value); dgRefresh(); });
$('dg-los').addEventListener('input', () => {
  dg.los = Math.max(1, Math.round(Number(String($('dg-los').value).replace(/[^0-9]/g, '')) || 1));
  dgPaint();
});
$('dg-night').addEventListener('change', () => { dg.night = $('dg-night').checked; dgPaint(); });
$('dg-gyn').addEventListener('change', () => { dg.gyn = $('dg-gyn').checked; dgPaint(); });
$('dg-clear').addEventListener('click', () => {
  const keep = { inst:dg.inst, rate:dg.rate, q:dg.q };
  dg = Object.assign(dgNewState(), keep);
  dgRefresh();
});

/* 표 안의 입력칸 — 표를 다시 그리지 않고 [data-dout] 칸만 갈아 넣는다 */
function dgOnInput(e){
  const t = e.target;
  if (!t.dataset) return;
  if (t.id === 'dg-excl' || t.id === 'dg-fee' || t.id === 'dg-base6'){
    const a = readAmount(t);
    const key = t.id === 'dg-excl' ? 'excl' : (t.id === 'dg-fee' ? 'fee' : 'base6');
    if (a.ok) dg[key] = a.val;
    if (!a.formula) reformatMoney(t, dg[key]);
    dgPaint();
    return;
  }
  if (t.dataset.dr){                                  // 상급병실 칸
    const r = dg.rooms[t.dataset.dr];
    if (!r) return;
    const f = t.dataset.df;
    if (f === 'p'){ const a = readAmount(t); if (a.ok) r.p = a.val; if (!a.formula) reformatMoney(t, r.p); }
    else if (f === 'd') r.d = Math.max(0, Math.round(Number(t.value.replace(/[^0-9]/g, '')) || 0));
    else if (f === 'rate'){ const s = t.value.trim(); r.rate = s === '' ? null : (parseFloat(s) || 0) / 100; }
    dgPaint();
    return;
  }
  const i = Number(t.dataset.di);
  const it = dg.items[i];
  if (!it) return;
  const f = t.dataset.df;
  if (f === 'price'){ const a = readAmount(t); if (a.ok) it.price = a.val; if (!a.formula) reformatMoney(t, it.price); }
  else if (f === 'name') it.name = t.value;
  else if (f === 'rate'){ const s = t.value.trim(); it.rate = s === '' ? null : (parseFloat(s) || 0) / 100; }
  else if (f === 'once' || f === 'day' || f === 'tot' || f === 'comp'){
    const s = t.value.trim();
    it[f] = s === '' ? 0 : (parseFloat(s) || 0);
  }
  // 맨 아래 줄을 채우면 그 밑에 빈 줄을 하나 더 붙인다 (표는 다시 그리지 않는다)
  if (i === dg.items.length - 1 && !dgIsBlank(it)){
    const tb = $('dg-extra').querySelector('tbody');
    const tr = tb && tb.querySelectorAll('tr')[i];
    if (tr && !tr.querySelector('[data-ddel]'))
      tr.lastElementChild.innerHTML =
        '<button class="btn xs" data-ddel="' + i + '" title="이 줄 지우기">✕</button>';
    dg.items.push(dgNewItem());
    if (tb) tb.insertAdjacentHTML('beforeend', dgItemRow(dg.items[dg.items.length - 1], dg.items.length - 1));
  }
  dgPaint();
}
['dg-extra', 'dg-room', 'dg-out'].forEach(id => {
  $(id).addEventListener('input', dgOnInput);
  $(id).addEventListener('focusout', e => {
    const t = e.target;
    if (!t.classList || !t.classList.contains('money')) return;
    if (t.value.trim() === '') return;
    let v = 0;
    if (t.id === 'dg-excl') v = dg.excl;
    else if (t.id === 'dg-fee') v = dg.fee;
    else if (t.id === 'dg-base6') v = dg.base6;
    else if (t.dataset.dr) v = (dg.rooms[t.dataset.dr] || {}).p || 0;
    else v = (dg.items[Number(t.dataset.di)] || {}).price || 0;
    t.value = v ? v.toLocaleString() : '';
  });
});
$('dg-extra').addEventListener('click', e => {
  const del = e.target.closest('[data-ddel]');
  if (!del) return;
  dg.items.splice(Number(del.dataset.ddel), 1);
  dgRenderItems(); dgPaint();
});
// 일자별 표에서 줄을 누르면 그 입원일수로 바꾼다
$('dg-pack').addEventListener('click', e => {
  const tr = e.target.closest('[data-dday]');
  if (!tr) return;
  dg.los = Number(tr.dataset.dday);
  $('dg-los').value = dg.los;
  dgPaint();
});

dgLoad();
dgRefresh();
