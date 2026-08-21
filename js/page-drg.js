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

/* ---------- 기본점수입원료 (가산·감산 적용 안 한 금액) ----------
   출처: 사내 수가 마스터의 입원료 수가코드 (2026-01-01 적용, 급여) — 사용자가 준 화면 그대로.
     상급종합병원 가2가(1)~(5)  AB1A0 6인실이상 47,050 · AB1E0 5인실 61,160 · AB1J0 4인실 75,280
                              AB1N0 3인실 90,330 · AB1S0 2인실 120,440
     종합병원     가2나(1)~(5)  AB2A0 41,530 · AB2E0 53,980 · AB2J0 66,440 · AB2N0 79,730 · AB2S0 99,660
     병원·정신병원·치과병원·한방병원 내 의·치과 가2다(1)~(5)
                              AB3A0 36,170 · AB3E0 47,020 · AB3J0 57,870 · AB3N0 69,440 · AB3S0 81,020
   위 값 중 상급종합 2·4·5인실·6인실이상, 종합·병원 2·4인실·6인실이상은
   청구방법(2026.3.) 235~240쪽 예시의 주석·차액단가와도 같다(교차 확인).
   **의원은 아직 못 받았다** — 별표2의3 의원 칸은 「입원료」(기본점수입원료가 아님)를 쓰고
   2·3인실 표에는 의원이 없다. 추측해서 채우지 않고 null 로 둔다(화면에서 직접 적으면 그 값을 쓴다).
   요양·정신병원은 위 가2다 줄에 정신병원이 함께 적혀 있어 병원과 같은 값을 쓴다. */
const DG_ROOM_FEE = {
  '상급종합병원': { r2:120440, r3:90330, r4:75280, r5:61160, base6:47050 },
  '종합병원':     { r2:99660,  r3:79730, r4:66440, r5:53980, base6:41530 },
  '병원':         { r2:81020,  r3:69440, r4:57870, r5:47020, base6:36170 },
  '의원':         { r2:null,   r3:null,  r4:null,  r5:null,  base6:null },
  '요양·정신병원': { r2:81020,  r3:69440, r4:57870, r5:47020, base6:36170 },
};
function dgFee(k){                       // 적어 넣은 값이 있으면 그것, 없으면 표의 값
  const t = DG_ROOM_FEE[dg.inst] || {};
  return t[k] === null || t[k] === undefined ? 0 : t[k];
}
function dgRoomP(k){ const p = dg.rooms[k].p; return p ? p : dgFee(k); }
function dgBase6(){ return dg.base6 ? dg.base6 : dgFee('base6'); }

/* ---------- 인공수정체 제외금액 — (별표 9) 질병군별 인공수정체 제외금액표 및 제외유형 ----------
   질병군 분류번호 앞 4자리로 고른다. 7개 질병군 중 수정체 수술(C05)만 대상이고
   C051~C054 네 줄이 C05 12개 코드를 모두 덮는다(단안/양안 × 소절개/대절개).
     C051 수정체 소절개·단안 : 연성 단안제외 129,300 (유형 1)
     C052 수정체 소절개·양안 : 연성 단안제외 129,300 (유형 1) · 연성 양안제외 258,600 (유형 2)
     C053 수정체 대절개·단안 : 경성 단안제외  47,600 (유형 3)
     C054 수정체 대절개·양안 : 경성 단안제외  47,600 (유형 3) · 경성 양안제외  95,200 (유형 4) */
const DG_LENS = {
  'C051': [{ t:1, label:'연성 인공수정체, 단안제외', v:129300 }],
  'C052': [{ t:1, label:'연성 인공수정체, 단안제외', v:129300 },
           { t:2, label:'연성 인공수정체, 양안제외', v:258600 }],
  'C053': [{ t:3, label:'경성 인공수정체, 단안제외', v:47600 }],
  'C054': [{ t:3, label:'경성 인공수정체, 단안제외', v:47600 },
           { t:4, label:'경성 인공수정체, 양안제외', v:95200 }],
};
function dgLensOpts(){ return DG_LENS[(dg.code || '').slice(0, 4)] || []; }
function dgLensAmt(){
  const o = dgLensOpts().find(x => x.t === dg.lens);
  return o ? o.v : 0;
}

/* ---------- 숫자 다루기 ---------- */
const r3 = n => Math.round(n * 1000) / 1000;      // 계산 과정마다 소수 셋째 자리 4사5입
const r2 = n => Math.round(n * 100) / 100;        // 점수 총합은 소수 둘째 자리까지
const up10 = n => Math.round(n / 10) * 10;        // 10원 미만 4사5입
const cut10 = n => Math.floor(n / 10) * 10;       // 10원 미만 절사
const dgHas = v => v !== null && v !== undefined;

/* ---------- 화면 상태 ---------- */
function dgNewItem(){ return { name:'', amount:0, rate:null, burdenFix:null }; }
function dgNewState(){
  return { code:'', q:'', inst:'상급종합병원', los:1, rate:.20,
           night:false, mid:false, rural:false, gyn:false,   // 야간·공휴 / 심야 / 분만취약지 / 부인과
           items:[],
           solo:0,                              // 1인실 이용일수 → 6인실이상 기본점수입원료 × 일수를 뺀다
           lens:0,                              // 인공수정체 제외유형 (별표 9) — 0 이면 없음
           fee:0,                               // 행위별 진료비총액 (열외군 판정)
           base6:0,                             // 6인실이상 기본점수입원료
           width:980, tableW:980,               // 칸(카드) 폭 · 표 폭 — 화면에서 조절한다
           memo:'',                             // 요약 아래 메모
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
  // 적어 둔 글자가 곧 질병군번호다. 예전 자료(고르는 칸이던 판)는 코드를 그대로 옮긴다.
  o.q = typeof s.q === 'string' && s.q.trim() ? s.q : o.code;
  if (DG_INSTS.some(i => i.name === s.inst)) o.inst = s.inst;
  o.los = Math.max(1, Number(s.los) || 1);
  if (DG_RATES.some(r => r.v === s.rate)) o.rate = s.rate;
  o.night = !!s.night; o.mid = !!s.mid; o.rural = !!s.rural; o.gyn = !!s.gyn;
  o.solo = Math.max(0, Number(s.solo) || 0);
  o.lens = Number(s.lens) || 0;
  o.fee = Number(s.fee) || 0;
  o.base6 = Number(s.base6) || 0;
  const w = Number(s.width);
  if (isFinite(w) && w >= 560 && w <= 1600) o.width = Math.round(w / 20) * 20;
  const tw = Number(s.tableW);
  if (isFinite(tw) && tw >= 440 && tw <= 1600) o.tableW = Math.round(tw / 20) * 20;
  if (typeof s.memo === 'string') o.memo = s.memo;
  if (Array.isArray(s.items))
    o.items = s.items.filter(i => i && typeof i === 'object').map(i => ({
      name:String(i.name || ''),
      // 예전 판(단가 × 1회량 × 일투 × 총투 × 보상률)으로 적어 둔 자료는 금액으로 접어 넣는다
      amount: dgHas(i.amount) ? Number(i.amount) || 0
        : Math.round((Number(i.price) || 0) * (Number(i.once) || 0) *
                     (Number(i.day) || 0) * (Number(i.tot) || 0) *
                     (dgHas(i.comp) ? Number(i.comp) : 1)),
      rate:typeof i.rate === 'number' ? i.rate : null,
      burdenFix:typeof i.burdenFix === 'number' ? i.burdenFix : null }));
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

/* ---------- 야간·공휴 / 심야 / 분만취약지 가산 ----------
   붙임13(야간공휴) · 붙임24(심야) · 붙임25(취약지) · 붙임26·27(취약지+야간/심야) 의 금액을 보면
   전부 **야간공휴점수의 배수**로 붙는다 — 심야 ×1(야간공휴와 같은 금액) · 취약지 ×2 ·
   취약지와 야간/심야가 겹치면 ×3. O01 제왕절개분만 7코드 × 종별 4 × 입원일수 4 = 560칸을
   붙임7(기본)과 견줘 확인했다(2026-08-21). 심야·취약지는 제왕절개분만에만 있다. */
function dgNightMult(){
  const S = dgPick();
  const cesar = !!S && S.c.startsWith('O01');
  let m = (dg.night || (cesar && dg.mid)) ? 1 : 0;
  if (cesar && dg.rural) m += 2;
  return m;
}

/* ---------- 포괄수가 한 건 (입원일수 하나) ----------
   일자별 표도 이 함수를 그대로 쓴다 — 같은 계산을 두 벌 두지 않는다. */
function dgPackAt(los){
  const S = dgPick(), inst = dgInst(), unit = dgUnit();
  if (!S) return null;
  const i = inst.si;
  const base = (dg.gyn && S.gyn) ? S.gyn[i] : S.base[i];   // 부인과 가산이면 가산점수
  const day  = S.day[i];
  const night = S.night[i] * dgNightMult();
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

  // ② 별도산정 — 금액과 부담률을 손으로 적는다(② 본인부담금 계산기와 같은 모양)
  o.items = dg.items.map(it => {
    const amt = it.amount || 0;
    const rate = dgHas(it.rate) ? it.rate : dg.rate;
    return { amt, rate, own: dgHas(it.burdenFix) ? it.burdenFix : amt * rate };
  });
  o.extra    = o.items.reduce((a, x) => a + x.amt, 0);
  o.extraOwn = o.items.reduce((a, x) => a + x.own, 0);
  // 제외금액 — 1인실(6인실이상 기본점수입원료 × 이용일수)과 인공수정체(별표 9)를 따로 센다
  o.exclSolo = dgBase6() * (dg.solo || 0);
  o.exclLens = dgLensAmt();
  o.excl     = o.exclSolo + o.exclLens;
  o.exclOwn  = o.excl * dg.rate;

  // ③ 2인실~5인실 (별표 2의3)
  const base6 = dgBase6();
  let addRoom = 0, ownRoom = 0, days6 = 0;
  o.rooms = DG_ROOMS.map(({ k, label }) => {
    const r = dg.rooms[k], d = r.d || 0, p = dgRoomP(k), rate = dgRoomRateOf(k);
    const add = Math.max(0, p - base6) * d;         // 추가비용 = (그 인실 − 6인실이상) × 일수
    const own = p * d * rate;                       // 본인부담 = 인실 단가 × 일수 × 인실 부담률
    addRoom += add; ownRoom += own; days6 += d;
    return { k, label, d, p, rate, add, own };
  });
  o.base6 = base6;
  o.days6 = days6;
  o.room6Own = base6 * days6 * dg.rate;             // 6인실이상 × 이용일수 × 자격 부담률 (차감)
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
/* 질병군번호는 손으로 적는다. 딱 맞는 번호가 없으면 오류를 띄우고, 비슷한 것을 후보로 보여 준다
   (번호를 다 외우지 않아도 되게 — 명칭으로 적어도 후보에 걸린다). */
function dgMatch(){
  const t = (dg.q || '').trim().toUpperCase();
  if (!t) return { state:'empty', list:[] };
  const exact = DRG_SCORES.find(d => d.c === t);
  if (exact) return { state:'ok', hit:exact, list:[] };
  const list = DRG_SCORES.filter(d => sgHit(d.c + ' ' + d.n, dg.q.trim())).slice(0, 12);
  return { state:list.length ? 'cand' : 'bad', list };
}
function dgRenderPickers(){
  const m = dgMatch();
  dg.code = m.state === 'ok' ? m.hit.c : '';
  if ($('dg-code-in').value !== (dg.q || '')) $('dg-code-in').value = dg.q || '';
  $('dg-name').innerHTML =
    m.state === 'ok'   ? '<b>' + esc(m.hit.c) + '</b> <span class="saved-note">' + esc(m.hit.n) + '</span>' :
    m.state === 'empty' ? '<span class="saved-note">질병군번호를 적으세요 — 7개 질병군 ' + DRG_SCORES.length + '건 (예: C05100 · G08300 · N04700 · O01600)</span>' :
    // 치는 중일 수 있으니 후보가 있으면 안내만, 아예 없으면 빨간 오류
    m.state === 'cand'  ? '<span class="saved-note">아래 후보에서 고르세요 (' + m.list.length + '건).</span>' :
                          '<span class="dg-err">일치하는 질병군번호가 없습니다. 7개 질병군(C05 · D11 · G08 · G09 · G10 · N04 · O01) 안에서 확인해 주세요.</span>';
  $('dg-code-in').classList.toggle('dg-bad', m.state === 'bad');
  const row = $('dg-cand-row');
  if (m.list.length){
    row.style.display = '';
    $('dg-cand').innerHTML = m.list.map(d =>
      '<button class="chip" data-dcand="' + d.c + '">' + esc(d.c) +
      '<small>' + esc(d.n.length > 28 ? d.n.slice(0, 28) + '…' : d.n) + '</small></button>').join('');
  } else {
    row.style.display = 'none';
    $('dg-cand').innerHTML = '';
  }
  dgFill($('dg-inst'), DG_INSTS, dg.inst, i => i.name, i => i.name);
  dgFill($('dg-rate'), DG_RATES, String(dg.rate), r => String(r.v), r => r.label);
  $('dg-los').value = dg.los;
  $('dg-night').checked = dg.night;
  $('dg-mid').checked = dg.mid;
  $('dg-rural').checked = dg.rural;
  $('dg-gyn').checked = dg.gyn;
  const S = dgPick();
  $('dg-gyn-wrap').style.display = (S && S.gyn) ? '' : 'none';   // 부인과 가산이 있는 질병군만
  // 심야 · 분만취약지는 제왕절개분만(O01)에만 붙는다
  const cesar = !!S && S.c.startsWith('O01');
  $('dg-mid-wrap').style.display = cesar ? '' : 'none';
  $('dg-rural-wrap').style.display = cesar ? '' : 'none';
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
    const m = dgMatch();
    $('dg-pack').innerHTML = '<div style="padding:10px 2px;" class="' + (m.state === 'bad' ? 'dg-err' : 'saved-note') + '">' +
      (m.state === 'bad'
        ? '「' + esc((dg.q || '').trim()) + '」와 일치하는 질병군번호가 없습니다 — 포괄수가를 계산할 수 없습니다.'
        : '질병군번호를 적으면 포괄수가를 계산합니다.') + '</div>';
    return;
  }
  // 점수·점수당 단가는 보여 주지 않는다(2026-08-21 요청) — 총액 · 본인부담금 · 청구액만.
  const add = [];
  if (o.night) add.push(dgNightMult() > 1 ? '가산 ×' + dgNightMult() : '야간·공휴');
  if (dg.gyn && S.gyn) add.push('부인과 가산');
  $('dg-pack').innerHTML =
    '<table class="fields items dgt fixed" data-k="drg-pack"><thead><tr>' +
      '<th>구분</th><th style="width:25%;">금액</th>' +
    '</tr></thead><tbody>' +
      '<tr><td><span class="c-name">총액</span>' +
        '<div class="saved-note">입원일수 ' + o.los + '일 · ' + esc(o.band) +
          ' (평균 ' + won2(S.avg) + '일 · 하한 ' + S.lo + '일 · 상한 ' + S.hi + '일)' +
          (add.length ? ' · ' + esc(add.join(' · ')) : '') + '</div></td>' +
        '<td class="num b">' + won(o.pack) + '</td></tr>' +
      '<tr><td><span class="c-name">본인부담금</span>' +
        '<div class="saved-note">본인부담률 ' + pct(dg.rate) + '</div></td>' +
        '<td class="num strong">' + won(o.packOwn) + '</td></tr>' +
    '</tbody><tfoot>' +
      '<tr><td>청구액 <span class="saved-note">총액 − 본인부담금</span></td>' +
        '<td class="num b">' + won(o.pack - o.packOwn) + '</td></tr>' +
    '</tfoot></table>';
}

/* ② 별도산정 — ② 본인부담금 계산기의 원장과 같은 모양(항목명 · 금액 · 부담률 · 본인부담).
   금액과 부담률을 손으로 적고, 본인부담 칸은 두 번 눌러 직접 고칠 수 있다. */
function dgItemRow(it, i){
  const tail = dgIsBlank(it) && i === dg.items.length - 1;
  return '<tr>' +
    '<td><input class="field-input mini" data-di="' + i + '" data-df="name" ' +
      'placeholder="항목명 (선택)" value="' + esc(it.name || '') + '"></td>' +
    '<td>' + dgMoney('data-di="' + i + '" data-df="amount"', it.amount) + '</td>' +
    '<td><input class="field-input mini pctin" data-di="' + i + '" data-df="rate" ' +
      'inputmode="decimal" value="' + (dgHas(it.rate) ? Math.round(it.rate * 1000) / 10 : '') +
      '" placeholder="' + Math.round(dg.rate * 1000) / 10 + '"><span class="pctsign">%</span></td>' +
    '<td class="num fixable" data-dout="item-own-' + i + '" data-dfix="' + i + '" ' +
      'title="두 번 누르면 이 줄 본인부담을 직접 적을 수 있습니다">0</td>' +
    '<td>' + (tail ? '' : '<button class="btn xs" data-ddel="' + i + '" title="이 줄 지우기">✕</button>') +
    '</td></tr>';
}
function dgIsBlank(it){
  return !(it.name || '').trim() && !it.amount && !dgHas(it.rate) && !dgHas(it.burdenFix);
}
function dgEnsureBlank(){
  const last = dg.items[dg.items.length - 1];
  if (last && dgIsBlank(last)) return;
  dg.items.push(dgNewItem());
}
/* 인공수정체 제외유형 고르는 칸 — 그 질병군에 있는 유형만 나온다 (별표 9) */
function dgLensSel(){
  const opts = dgLensOpts();
  if (!opts.length)
    return '<span class="saved-note">' +
      (dg.code ? '이 질병군은 인공수정체 제외 대상이 아닙니다 (수정체 수술 C051~C054만 해당)'
               : '질병군번호를 먼저 적으세요') + '</span>';
  return '<select class="field-input mini" id="dg-lens" style="width:auto;display:inline-block;">' +
    '<option value="0">없음</option>' +
    opts.map(o => '<option value="' + o.t + '"' + (dg.lens === o.t ? ' selected' : '') + '>' +
      esc(o.label) + ' · ' + won(o.v) + '원 (유형 ' + o.t + ')</option>').join('') +
    '</select>';
}

function dgRenderItems(){
  dgEnsureBlank();
  $('dg-extra').innerHTML =
    '<table class="fields items dgt fixed" data-k="drg-extra"><thead><tr>' +
      '<th>구분</th><th style="width:15.5%;">금액</th><th style="width:12%;">부담률</th>' +
      '<th style="width:15.5%;">본인부담</th><th style="width:4.5%;"></th>' +
    '</tr></thead><tbody>' +
      dg.items.map((it, i) => dgItemRow(it, i)).join('') +
    '</tbody><tfoot>' +
      // 제외금액 두 줄 — 1인실(일수 × 6인실이상 기본점수입원료)과 인공수정체(별표 9)
      '<tr><td>제외 · <b>1인실</b> ' +
        '<input class="field-input mini num-in" id="dg-solo" inputmode="numeric" ' +
          'style="width:52px;display:inline-block;" value="' + (dg.solo || '') + '" placeholder="0">일' +
        '<div class="saved-note">6인실 이상 기본점수입원료 ' + won(dgBase6()) + '원 × 이용일수</div></td>' +
        '<td class="num" data-dout="excl-solo">0</td>' +
        '<td class="num">' + pct(dg.rate) + '</td>' +
        '<td class="num" data-dout="excl-solo-own">0</td><td></td></tr>' +
      '<tr><td>제외 · <b>인공수정체</b> ' + dgLensSel() + '</td>' +
        '<td class="num" data-dout="excl-lens">0</td>' +
        '<td class="num">' + pct(dg.rate) + '</td>' +
        '<td class="num" data-dout="excl-lens-own">0</td><td></td></tr>' +
      '<tr><td><span class="c-name">별도산정 합계</span> ' +
        '<span class="saved-note">제외금액은 맨 위 합계 카드에서 뺍니다</span></td>' +
        '<td class="num b" data-dout="extra">0</td><td></td>' +
        '<td class="num b" data-dout="extra-own">0</td><td></td></tr>' +
    '</tfoot></table>';
}

/* ③ 2인실~5인실 */
function dgRenderRooms(){
  $('dg-room').innerHTML =
    '<table class="fields items dgt fixed" data-k="drg-room"><thead><tr>' +
      '<th>인실</th><th style="width:15.5%;">기본점수입원료</th><th style="width:9.5%;">이용일수</th>' +
      '<th style="width:9.5%;">부담률</th><th style="width:15.5%;">추가비용</th>' +
      '<th style="width:15.5%;">본인부담</th>' +
    '</tr></thead><tbody>' +
      DG_ROOMS.map(({ k, label }) => {
        const r = dg.rooms[k], def = dgFee(k);
        return '<tr><td><span class="c-name">' + label + '</span>' +
          (def ? '' : '<div class="saved-note">단가 미확인 — 직접 적으세요</div>') + '</td>' +
          '<td><input class="field-input money mini" data-dr="' + k + '" data-df="p" type="text" ' +
            'inputmode="numeric" title="+ − × ÷ 로 셈도 됩니다" placeholder="' +
            (def ? def.toLocaleString() : '0') + '" value="' + (r.p ? r.p.toLocaleString() : '') + '"></td>' +
          '<td>' + dgNum('data-dr="' + k + '" data-df="d"', r.d) + '</td>' +
          '<td><input class="field-input mini pctin" data-dr="' + k + '" data-df="rate" ' +
            'inputmode="decimal" value="' + (dgHas(r.rate) ? Math.round(r.rate * 1000) / 10 : '') +
            '" placeholder="' + Math.round(dgRoomRate(k) * 1000) / 10 + '"><span class="pctsign">%</span></td>' +
          '<td class="num" data-dout="room-add-' + k + '">0</td>' +
          '<td class="num" data-dout="room-own-' + k + '">0</td></tr>';
      }).join('') +
      '<tr><td><span class="c-name">6인실 이상</span>' +
        '<div class="saved-note">본인부담에서 빼는 몫 — 자격 부담률로 뺀다' +
          (dgFee('base6') ? '' : ' · 단가 미확인') + '</div></td>' +
        '<td><input class="field-input money mini" id="dg-base6" type="text" inputmode="numeric" ' +
          'title="+ − × ÷ 로 셈도 됩니다" placeholder="' +
          (dgFee('base6') ? dgFee('base6').toLocaleString() : '0') + '" value="' +
          (dg.base6 ? dg.base6.toLocaleString() : '') + '"></td>' +
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
    '<table class="fields items dgt fixed" data-k="drg-out"><thead><tr>' +
      '<th>구분</th><th style="width:19.5%;">금액</th><th style="width:19.5%;">본인부담</th>' +
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
  // 오른쪽 칸 — 큰 숫자 카드와 내역 표 카드를 따로 둔다(스크롤을 내려도 따라온다).
  // 세 줄 모두 숫자를 같은 오른쪽 선에 맞춘다(칸 셋으로 나눈 grid — '원' 칸 폭이 고정이다).
  $('dg-sum').innerHTML =
    '<div class="dg-sum-big"><span>본인일부부담금</span><b>' + won(o.own) + '</b><i>원</i></div>' +
    '<div class="dg-sum-line"><span>요양급여비용총액 1</span><b>' + won(o.total) + '</b><i>원</i></div>' +
    '<div class="dg-sum-line"><span>청구액</span><b>' + won(o.claim) + '</b><i>원</i></div>';
  /* ② 본인부담금 계산기의 원장과 같은 순서로 읽는다 (2026-08-21 요청) —
     맨 위에 요양급여비용총액 1, 그 아래에 **부담률이 다른 항목**을 빼 나가면
     남는 것이 포괄수가(산정대상)이고 거기에 자격 부담률을 곱한다.
       요양급여비용총액 1 − 별도산정 − 2~5인실 − 열외군 차액 + 제외금액 = 포괄수가
     숫자는 위 카드들과 같은 값이다 — 보는 순서만 계산기와 맞췄다. */
  $('dg-sum-tbl').innerHTML =
    '<table class="fields items dgt fixed" data-k="drg-sum"><thead><tr>' +
      '<th>구분</th><th style="width:31%;">금액</th><th style="width:31%;">본인부담</th>' +
    '</tr></thead><tbody>' +
      line('<span class="c-name">요양급여비용총액 1</span>' +
        (o.S ? '<div class="saved-note">산정대상 ' + won(o.pack) + ' × ' + pct(dg.rate) +
               ' · ' + esc(o.band) + '</div>' : ''),
        o.total, o.packOwn) +
      line('② 별도산정<div class="saved-note">' + pct(dg.rate) + ' 또는 줄마다 적은 부담률</div>', o.extra, o.extraOwn) +
      line('③ 2인실~5인실<div class="saved-note">(별표 2의3)</div>', o.roomAdd, o.roomOwn) +
      line('④ 열외군 차액<div class="saved-note">' + pct(dg.rate) + '</div>', o.outAdd, o.outOwn) +
      line('제외금액<div class="saved-note">1인실 · 인공수정체 — 빼는 금액</div>', -o.excl, -o.exclOwn) +
    '</tbody><tfoot>' +
      '<tr><td><span class="c-name">산정대상 금액 · 본인부담금</span>' +
        '<div class="saved-note">왼쪽 = 총액 − 위 항목 (=① 포괄수가) · 오른쪽 = 위 본인부담을 다 더한 값 (10원 미만 절사)</div></td>' +
      '<td class="num b">' + won(o.pack) + '</td>' +
      '<td class="num strong">' + won(o.own) + '</td></tr>' +
      '<tr><td>청구액</td><td class="num"></td><td class="num">' + won(o.claim) + '</td></tr>' +
    '</tfoot></table>';
}

function dgPaint(){
  const o = dgCompute();
  // 지금 손으로 적어 넣는 중인 칸(입력칸이 들어 있는 칸)은 건드리지 않는다
  const set = (k, v) => document.querySelectorAll('#page-drg [data-dout="' + k + '"]')
                                .forEach(el => { if (!el.querySelector('[data-dfixin]')) el.innerHTML = v; });
  o.items.forEach((x, i) => set('item-own-' + i, won2(x.own) +
    (dgHas(dg.items[i] && dg.items[i].burdenFix) ? '<div class="saved-note">수기</div>' : '')));
  set('extra', won(o.extra));
  set('extra-own', won2(o.extraOwn));
  set('excl-solo', o.exclSolo ? '−' + won(o.exclSolo) : '0');
  set('excl-solo-own', o.exclSolo ? '−' + won2(o.exclSolo * dg.rate) : '0');
  set('excl-lens', o.exclLens ? '−' + won(o.exclLens) : '0');
  set('excl-lens-own', o.exclLens ? '−' + won2(o.exclLens * dg.rate) : '0');
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
/* 칸(카드) 폭과 표 폭을 손으로 맞춘다 (2026-08-21 요청 — 계산식이 좌우로 길어 읽기 힘들다).
   표 폭은 CSS 변수 --dgtw 로 넘겨 `#dg-main table.dgt{max-width:var(--dgtw)}` 가 쓴다.
   칸 폭보다 크게 놓으면 칸 폭까지만 찬다. 둘 다 이 브라우저에 저장된다. */
function dgApplyWidth(){
  const m = $('dg-main');
  if (m){
    m.style.maxWidth = dg.width + 'px';
    m.style.setProperty('--dgtw', dg.tableW + 'px');
  }
  // 좌우 두 칸을 한 덩어리로 가운데 놓는다 — 칸을 좁혔을 때 왼쪽으로 쏠려 보이지 않게
  const wrap = document.querySelector('#page-drg .dg-wrap');
  if (wrap) wrap.style.setProperty('--dgw', dg.width + 'px');
  if ($('dg-w')) $('dg-w').value = dg.width;
  if ($('dg-w-val')) $('dg-w-val').textContent = dg.width + 'px';
  if ($('dg-tw')) $('dg-tw').value = dg.tableW;
  if ($('dg-tw-val')) $('dg-tw-val').textContent = dg.tableW + 'px';
}
// 메모 — 치는 중에는 건드리지 않는다
function dgApplyMemo(){
  const el = $('dg-memo');
  if (el && document.activeElement !== el) el.value = dg.memo || '';
}

function dgRefresh(){
  dgApplyWidth();
  dgApplyMemo();
  dgRenderPickers();
  dgRenderItems();
  dgRenderRooms();
  dgRenderOut();
  dgPaint();
}

/* ---------- 손 ---------- */
$('dg-code-in').addEventListener('input', () => {
  dg.q = $('dg-code-in').value.toUpperCase();
  dgRefresh();
});
$('dg-cand').addEventListener('click', e => {
  const b = e.target.closest('[data-dcand]');
  if (!b) return;
  dg.q = b.dataset.dcand;
  dgRefresh();
});
$('dg-inst').addEventListener('change', () => { dg.inst = $('dg-inst').value; dgRefresh(); });
$('dg-rate').addEventListener('change', () => { dg.rate = Number($('dg-rate').value); dgRefresh(); });
$('dg-los').addEventListener('input', () => {
  dg.los = Math.max(1, Math.round(Number(String($('dg-los').value).replace(/[^0-9]/g, '')) || 1));
  dgPaint();
});
$('dg-night').addEventListener('change', () => { dg.night = $('dg-night').checked; dgPaint(); });
$('dg-mid').addEventListener('change', () => { dg.mid = $('dg-mid').checked; dgPaint(); });
$('dg-rural').addEventListener('change', () => { dg.rural = $('dg-rural').checked; dgPaint(); });
$('dg-gyn').addEventListener('change', () => { dg.gyn = $('dg-gyn').checked; dgPaint(); });
['dg-w', 'dg-tw'].forEach(id => $(id).addEventListener('input', () => {
  dg.width  = Number($('dg-w').value)  || 980;
  dg.tableW = Number($('dg-tw').value) || 980;
  dgApplyWidth();
  setStickTop();          // 폭이 바뀌면 상단 띠 높이(글 줄바꿈)도 달라진다
  dgSave();
}));
$('dg-memo').addEventListener('input', () => { dg.memo = $('dg-memo').value; dgSave(); });
$('dg-clear').addEventListener('click', () => {
  // 「비우기」는 계산만 지운다 — 폭 설정과 메모는 그대로 둔다(적어 둔 글을 잃으면 안 된다)
  const keep = { inst:dg.inst, rate:dg.rate, q:dg.q,
                 width:dg.width, tableW:dg.tableW, memo:dg.memo };
  dg = Object.assign(dgNewState(), keep);
  dgRefresh();
});

/* 표 안의 입력칸 — 표를 다시 그리지 않고 [data-dout] 칸만 갈아 넣는다 */
function dgOnInput(e){
  const t = e.target;
  if (!t.dataset) return;
  if (t.id === 'dg-solo'){                    // 1인실 이용일수
    dg.solo = Math.max(0, Math.round(Number(String(t.value).replace(/[^0-9]/g, '')) || 0));
    dgPaint();
    return;
  }
  if (t.id === 'dg-fee' || t.id === 'dg-base6'){
    const a = readAmount(t);
    const key = t.id === 'dg-fee' ? 'fee' : 'base6';
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
  if (f === 'amount'){ const a = readAmount(t); if (a.ok) it.amount = a.val; if (!a.formula) reformatMoney(t, it.amount); }
  else if (f === 'name') it.name = t.value;
  else if (f === 'rate'){ const s = t.value.trim(); it.rate = s === '' ? null : (parseFloat(s) || 0) / 100; }
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
function dgMoneyValue(t){                 // 그 칸이 지금 들고 있는 값
  if (t.id === 'dg-fee') return dg.fee;
  if (t.id === 'dg-base6') return dg.base6;
  if (t.dataset.dr) return (dg.rooms[t.dataset.dr] || {}).p || 0;
  return (dg.items[Number(t.dataset.di)] || {}).amount || 0;
}
// 인공수정체 제외유형
$('dg-extra').addEventListener('change', e => {
  if (e.target.id !== 'dg-lens') return;
  dg.lens = Number(e.target.value) || 0;
  dgPaint();
});
['dg-extra', 'dg-room', 'dg-out'].forEach(id => {
  $(id).addEventListener('input', dgOnInput);
  $(id).addEventListener('focusout', e => {
    const t = e.target;
    if (t.dataset && t.dataset.dfixin !== undefined){ dgCommitFix(t, true); return; }
    if (!t.classList || !t.classList.contains('money')) return;
    if (t.value.trim() === '') return;
    const v = dgMoneyValue(t);
    t.value = v ? v.toLocaleString() : '';
  });
});
$('dg-extra').addEventListener('click', e => {
  const del = e.target.closest('[data-ddel]');
  if (!del) return;
  dg.items.splice(Number(del.dataset.ddel), 1);
  dgRenderItems(); dgPaint();
});

/* 옮겨 가는 순서 — 금액 → 같은 줄 부담률 → 다음 줄 금액 (② 계산기와 같다).
   Tab 과 Enter 가 같게 움직이고, ✕ 단추는 건너뛴다. */
function dgNextCell(t){
  const box = $('dg-extra');
  const moneys = [...box.querySelectorAll('input.money[data-df="amount"]')];
  const rates  = [...box.querySelectorAll('input[data-df="rate"]')];
  if (t.dataset.df === 'amount') return rates[moneys.indexOf(t)] || null;
  if (t.dataset.df === 'rate')   return moneys[rates.indexOf(t) + 1] || null;
  return null;
}
$('dg-extra').addEventListener('keydown', e => {
  const t = e.target;
  if (t.dataset && t.dataset.dfixin !== undefined){        // 본인부담을 손으로 적는 칸
    if (e.key === 'Enter'){ e.preventDefault(); dgCommitFix(t, true); }
    else if (e.key === 'Escape'){ e.preventDefault(); dgCommitFix(t, false); }
    return;
  }
  const f = t.dataset && t.dataset.df;
  if (f !== 'amount' && f !== 'rate') return;
  if (e.key === 'Enter'){
    e.preventDefault();
    if (f === 'amount' && t.value.trim() !== ''){ const v = dgMoneyValue(t); t.value = v ? v.toLocaleString() : ''; }
    const n = dgNextCell(t);
    if (n){ n.focus(); try { n.select(); } catch (err) {} }
    return;
  }
  if (e.key !== 'Tab' || e.shiftKey || e.altKey || e.ctrlKey) return;
  if (f === 'amount') return;                              // 금액 → 부담률은 브라우저 기본 순서
  const n = dgNextCell(t);
  if (n){ e.preventDefault(); n.focus(); try { n.select(); } catch (err) {} }
});

/* 본인부담 칸을 두 번 눌러 손으로 적기 (② 계산기와 같다) — 비우고 나가면 다시 자동 계산 */
function dgCommitFix(inp, keep){
  const cell = inp.closest('[data-dfix]');
  if (!cell) return;
  const it = dg.items[Number(cell.dataset.dfix)];
  if (keep && it){
    const s = inp.value.trim();
    const v = s === '' ? null : (HAS_OP.test(s) ? calcExpr(s) : parseMoney(s));
    it.burdenFix = dgHas(v) ? Math.max(0, Math.round(v)) : null;
  }
  cell.innerHTML = '0';
  dgPaint();
}
$('dg-extra').addEventListener('dblclick', e => {
  const cell = e.target.closest('[data-dfix]');
  if (!cell || cell.querySelector('[data-dfixin]')) return;
  const it = dg.items[Number(cell.dataset.dfix)];
  if (!it) return;
  cell.innerHTML = '<input class="field-input money mini" data-dfixin="1" inputmode="numeric" ' +
    'placeholder="자동" title="비우고 나가면 다시 자동 계산" value="' +
    (dgHas(it.burdenFix) ? it.burdenFix.toLocaleString() : '') + '">';
  const inp = cell.querySelector('[data-dfixin]');
  inp.focus();
  try { inp.select(); } catch (err) {}
});

dgLoad();
dgRefresh();
