/* ---------- 신포괄 본인부담금 계산기 ----------
   출처: 「신포괄지불제도 시범사업 지침」(개정 전문)
         제2장 제2절 다. 신포괄 요양급여(의료급여)비용 산정방법        34~35쪽
                    라. 신포괄 요양급여(의료급여)비용 본인부담금 산정방법 36~37쪽
                    〔그림 3〕 정상군 입원일수까지의 본인부담금 계산 방법  38쪽
                    〈표 2〉 포괄수가의 본인부담금 계산 예시(건강보험)      39쪽
                    (5) 요양급여(의료급여)비용 열외군 환자의 진료비 산정방법 36쪽
         별표3. 정책가산평가 항목 및 가산율   213~214쪽
         별표4. 질병군별 평균입원일수, 정상군 하한·상한, 점수 등  215~272쪽 (607개 질병군)
         별표9. 질병군별 인공수정체 제외금액표 및 제외유형        281쪽
   화면 짜임새는 사용자가 엑셀로 손계산하던 표(총액 / 본인부담금 가·나·다 / 비포괄 본부 계산)
   를 그대로 옮긴 것이다.

   ── 계산 순서 ─────────────────────────────────────────────
   ① 총액   기준수가 = 10원미만 4사5입(기준점수 × 조정계수 × 점수당 단가)
            일당수가 = 10원미만 4사5입(일당점수 × 조정계수 × 점수당 단가)
            포괄수가 = 10원미만 4사5입(기준수가 + (환자 입원일수 − 평균 입원일수) × 일당수가
                                       − 인공수정체 제외금액)
            가산수가(인센티브포괄수가) = 10원미만 절사(포괄수가 × 정책가산율 총합)
            비포괄수가 = 손으로 적는다 (10원미만 절사 없음)
            신포괄총액 = 10원미만 절사(포괄수가 + 가산수가 + 비포괄수가)
   ② 본인부담금
            가) 환자 입원일수 ≤ 평균 입원일수, 또는 정신과 14개 질병군(U010~V610)
                (포괄수가 + 비포괄수가) × 20%
            나) 환자 입원일수 > 평균 입원일수
                ① 기준수가 × 20%
                ② (환자 입원일수 − 평균 입원일수) × 일당수가 × 23%
                + 비포괄수가 × 20%
                ※ 가산수가(인센티브)에는 본인부담이 붙지 않는다 — 지침의 두 식에
                  포괄수가 · 비포괄수가만 있고, 보험자부담금 = 총액 − 본인부담금 이다(39쪽 마).
            다) 열외군 : 위 본인부담 + (정상군 입원기간 행위별 총진료비 − 신포괄총액 − 200만원) × 20%
            마지막에 10원미만 절사 — 39쪽 예시가 344,115.212 → 344,110원 이다.
   ③ 열외군 총액  신포괄총액 + (행위별 총진료비 − 신포괄총액 − 200만원)  (차액이 200만원 초과일 때만)
   ─────────────────────────────────────────────────────────

   39쪽 〈표 2〉 예시로 검산 (질병군 B65000 · 기준점수 18,839.25 · 일당점수 1,350.32 ·
   조정계수 1 · 점수당 단가 83.8 · 평균입원일수 4.91일)
     기준수가 1,578,730 · 일당수가 113,160
     입원일수 4일 → 포괄수가 1,475,750 · 본인부담금 295,150원
     입원일수 6일 → 포괄수가 1,702,070 · 본인부담금 344,110원
                    (① 1,578,730 × 0.2 = 315,746
                     ② (6−4.91) × 113,160 × 0.23 = 28,369.212)
------------------------------------------------------------------ */

/* ---------- 인공수정체 제외금액 — 별표9 (281쪽) ----------
   질병군 분류번호 앞 4자리로 고른다. 수정체 수술 C051~C054 만 대상이다.
   금액·유형은 7개 질병군(포괄수가제)의 별표9 와 같은 값이다. */
const ND_LENS = {
  'C051': [{ t:1, label:'연성 인공수정체, 단안제외', v:129300 }],
  'C052': [{ t:1, label:'연성 인공수정체, 단안제외', v:129300 },
           { t:2, label:'연성 인공수정체, 양안제외', v:258600 }],
  'C053': [{ t:3, label:'경성 인공수정체, 단안제외', v:47600 }],
  'C054': [{ t:3, label:'경성 인공수정체, 단안제외', v:47600 },
           { t:4, label:'경성 인공수정체, 양안제외', v:95200 }],
};

/* ---------- 숫자 다루기 ---------- */
const ndUp10  = n => Math.round(n / 10) * 10;      // 10원 미만 4사5입
const ndCut10 = n => Math.floor(n / 10) * 10;      // 10원 미만 절사
const ndHas = v => v !== null && v !== undefined;

/* ---------- 화면 상태 ---------- */
function ndDefW(key, fb){
  const D = (typeof COLW_DEFAULTS === 'undefined') ? {} : COLW_DEFAULTS;
  const v = Number(D[key]);
  return (isFinite(v) && v >= 440 && v <= 1600) ? Math.round(v / 20) * 20 : fb;
}
function ndNewItem(){ return { name:'', amount:0, rate:null, burdenFix:null }; }
function ndNewState(){
  return { q:'', code:'',              // 질병군번호(RDRG) — 별표4 자료가 있으면 조회한다
           unit:NDRG_UNIT, coef:1,     // 점수당 단가 · 기관별 조정계수
           base:0, day:0, avg:0,       // 기준수가 · 일당수가 · 평균 입원일수 (직접 적으면 이 값)
           los:0,                      // 환자 입원일수 (0 = 공란)
           psy:false,                  // 정신과 14개 질병군(U010~V610) — 입원일수와 무관하게 20%
           lens:0,                     // 인공수정체 제외유형 (별표9) — 0 이면 없음
           inc:0,                      // 정책가산율 총합 (%) — 별표3
           rateIn:.20, rateOver:.23,   // 평균 입원일수까지 · 초과분 본인부담률
           npTotal:0, npRate:null, npFix:null, items:[],   // 비포괄수가 원장
           fee:0,                      // 정상군 입원기간 행위별 총진료비 (열외군 판정)
           width:ndDefW('ndrg|paneW', 980), tableW:ndDefW('ndrg|tableW', 980), wSet:false,
           memo:'',
           cmp:{ mg:0, hos:0 } };
}
let nd = ndNewState();

const ND_KEY = 'samguide_ndrg';
function ndSave(){
  try { localStorage.setItem(ND_KEY, JSON.stringify(nd)); } catch (e) {}
}
function ndLoad(){
  let s = null;
  try { s = JSON.parse(localStorage.getItem(ND_KEY) || 'null'); } catch (e) {}
  if (!s || typeof s !== 'object') return;
  const o = ndNewState();
  if (typeof s.q === 'string') o.q = s.q;
  const num = (v, fb) => { const n = Number(v); return isFinite(n) && n >= 0 ? n : fb; };
  o.unit = num(s.unit, o.unit) || o.unit;
  o.coef = num(s.coef, o.coef) || o.coef;
  o.base = num(s.base, 0); o.day = num(s.day, 0); o.avg = num(s.avg, 0);
  o.los  = Math.max(0, Math.round(num(s.los, 0)));
  o.psy  = !!s.psy;
  o.lens = Number(s.lens) || 0;
  o.inc  = num(s.inc, 0);
  o.rateIn   = typeof s.rateIn   === 'number' ? s.rateIn   : o.rateIn;
  o.rateOver = typeof s.rateOver === 'number' ? s.rateOver : o.rateOver;
  o.npTotal = num(s.npTotal, 0);
  o.npRate = typeof s.npRate === 'number' ? s.npRate : null;
  o.npFix  = typeof s.npFix  === 'number' ? s.npFix  : null;
  o.fee = num(s.fee, 0);
  if (s.wSet === true){
    o.wSet = true;
    const w = Number(s.width);
    if (isFinite(w) && w >= 560 && w <= 1600) o.width = Math.round(w / 20) * 20;
    const tw = Number(s.tableW);
    if (isFinite(tw) && tw >= 440 && tw <= 1600) o.tableW = Math.round(tw / 20) * 20;
  }
  if (typeof s.memo === 'string') o.memo = s.memo;
  if (s.cmp && typeof s.cmp === 'object')
    o.cmp = { mg:Number(s.cmp.mg) || 0, hos:Number(s.cmp.hos) || 0 };
  if (Array.isArray(s.items))
    o.items = s.items.filter(i => i && typeof i === 'object').map(i => ({
      name:String(i.name || ''),
      amount:Number(i.amount) || 0,
      rate:typeof i.rate === 'number' ? i.rate : null,
      burdenFix:typeof i.burdenFix === 'number' ? i.burdenFix : null }));
  nd = o;
}

/* ---------- 별표4 조회 ---------- */
function ndHasTable(){ return typeof NDRG_SCORES !== 'undefined' && NDRG_SCORES.length > 0; }
function ndPick(){
  if (!ndHasTable()) return null;
  return NDRG_SCORES.find(d => d.c === nd.code) || null;
}
/* 별표4 자료가 있으면 점수 × 조정계수 × 점수당 단가로 수가를 낸다(10원 미만 4사5입).
   조정계수 1 이면 별표4 에 적힌 기준수가 · 일당수가와 같은 값이 된다. */
function ndBase(){
  if (nd.base) return nd.base;
  const S = ndPick();
  return S ? ndUp10(S.bs * nd.coef * nd.unit) : 0;
}
function ndDay(){
  if (nd.day) return nd.day;
  const S = ndPick();
  return S ? ndUp10(S.ds * nd.coef * nd.unit) : 0;
}
function ndAvg(){
  if (nd.avg) return nd.avg;
  const S = ndPick();
  return S ? S.avg : 0;
}
function ndLensOpts(){ return ND_LENS[(nd.code || (nd.q || '').trim().toUpperCase()).slice(0, 4)] || []; }
function ndLensAmt(){
  const o = ndLensOpts().find(x => x.t === nd.lens);
  return o ? o.v : 0;
}

/* ---------- 계산 ---------- */
function ndCompute(){
  const base = ndBase(), day = ndDay(), avg = ndAvg();
  const los  = Math.max(0, Math.round(Number(nd.los) || 0));
  const excl = ndLensAmt();
  const o = { S:ndPick(), base, day, avg, los, excl };

  /* ① 포괄수가 — 기준수가 + (환자 입원일수 − 평균 입원일수) × 일당수가 − 제외금액 */
  o.diff    = los ? los - avg : 0;                  // 입원일수를 안 적었으면 계산하지 않는다
  o.over    = Math.max(0, o.diff);                  // 평균 입원일수 초과 일수
  o.packRaw = los ? base + o.diff * day - excl : 0;
  o.pack    = ndUp10(o.packRaw);
  o.incRate = (Number(nd.inc) || 0) / 100;
  o.inc     = ndCut10(o.pack * o.incRate);          // 가산수가 = 포괄수가 × 정책가산율 총합

  /* 비포괄수가 원장 — ② 본인부담금 계산기 · 질병군 계산기의 원장과 같은 방식.
     맨 위 비포괄수가 총액이 총진료비 자리이고, 그 아래 줄은 그 안에서 부담률이 다른 항목
     (전액비포괄 행위 · 식대 · 정책수가 …)이다.
       산정대상 = 비포괄수가 총액 − Σ(항목 금액)
       본인부담 = 산정대상 × 부담률 + Σ(항목 금액 × 그 항목 부담률) */
  o.items = nd.items.map(it => {
    const amt  = it.amount || 0;
    const rate = ndHas(it.rate) ? it.rate : nd.rateIn;
    return { amt, rate, own: ndHas(it.burdenFix) ? it.burdenFix : amt * rate };
  });
  o.npItems = o.items.reduce((a, x) => a + x.amt, 0);
  o.npBase  = (nd.npTotal || 0) - o.npItems;                 // 산정대상
  o.npRate  = ndHas(nd.npRate) ? nd.npRate : nd.rateIn;
  o.npBaseOwn = ndHas(nd.npFix) ? nd.npFix : o.npBase * o.npRate;
  o.np      = nd.npTotal || 0;
  o.npOwn   = o.npBaseOwn + o.items.reduce((a, x) => a + x.own, 0);

  /* 신포괄총액 — 더한 뒤 10원 미만 절사 */
  o.totalRaw = o.pack + o.inc + o.np;
  o.total    = ndCut10(o.totalRaw);

  /* ② 본인부담금 — 가) / 나) 중 하나 */
  o.longStay = !nd.psy && los > 0 && avg > 0 && los > avg;
  if (o.longStay){
    o.branch  = '나';
    o.ownIn   = (base - excl) * nd.rateIn;           // ① 평균 입원일수까지 : 기준수가 × 20%
    o.ownOver = o.over * day * nd.rateOver;          // ② 초과분 : (일수 − 평균) × 일당수가 × 23%
  } else {
    o.branch  = '가';
    o.ownIn   = o.pack * nd.rateIn;                  // (포괄수가) × 20%
    o.ownOver = 0;
  }
  o.packOwn = o.ownIn + o.ownOver;
  o.ownS    = o.packOwn + o.npOwn;                   // 지침의 본인부담금(S)

  /* ③ 열외군 — 신포괄총액이 행위별 총진료비보다 적고 그 차액이 200만원을 초과할 때 */
  o.gap    = nd.fee > 0 ? nd.fee - o.total - 2000000 : 0;
  o.isOut  = o.gap > 0;
  o.outAdd = o.isOut ? o.gap : 0;
  o.outOwn = o.isOut ? o.gap * nd.rateIn : 0;

  /* ④ 합계 — 마지막에 10원 미만 절사 */
  o.grandRaw = o.totalRaw + o.outAdd;
  o.grand    = ndCut10(o.grandRaw);
  o.own      = ndCut10(o.ownS + o.outOwn);
  o.claim    = o.grand - o.own;
  return o;
}

/* ---------- 화면 ---------- */
function ndMoney(attrs, val){
  return '<input class="field-input money mini" ' + attrs + ' type="text" inputmode="numeric"' +
    ' title="+ − × ÷ 로 셈도 됩니다" placeholder="0" value="' +
    (val ? val.toLocaleString() : '') + '">';
}
function ndDec(attrs, val, ph){
  return '<input class="field-input mini num-in" ' + attrs + ' inputmode="decimal" placeholder="' +
    (ph || '0') + '" value="' + (val ? val : '') + '">';
}
function ndPctIn(attrs, val, ph){
  return '<input class="field-input mini pctin" ' + attrs + ' inputmode="decimal" value="' +
    (ndHas(val) && val !== 0 ? Math.round(val * 10000) / 100 : '') + '" placeholder="' + ph +
    '"><span class="pctsign">%</span>';
}

/* 질병군번호 — 별표4 자료가 채워지면 조회하고, 없으면 인공수정체 제외유형만 가려낸다 */
function ndMatch(){
  const t = (nd.q || '').trim().toUpperCase();
  if (!t) return { state:'empty', list:[] };
  if (!ndHasTable()) return { state:'notable', list:[] };
  const exact = NDRG_SCORES.find(d => d.c === t);
  if (exact) return { state:'ok', hit:exact, list:[] };
  // 번호(RDRG · AADRG) · 명칭 · 중증도코드명 · 구분 어느 것으로 적어도 후보에 걸린다
  const list = NDRG_SCORES
    .filter(d => sgHit(d.c + ' ' + d.a + ' ' + d.n + ' ' + d.s + ' ' + d.g, nd.q.trim()))
    .slice(0, 12);
  return { state:list.length ? 'cand' : 'bad', list };
}
/* 후보 칩에서 지금 골라 둔 자리. −1 은 「아직 아무것도 안 골랐다」 (질병군 계산기와 같다) */
let ndCandSel = -1;
function ndCandChips(list){
  return list.map((d, i) =>
    '<button class="chip' + (i === ndCandSel ? ' on' : '') + '" data-ncand="' + esc(d.c) + '">' + esc(d.c) +
    '<small>' + esc(d.n.length > 28 ? d.n.slice(0, 28) + '…' : d.n) + '</small></button>').join('');
}
/* 별표4 에서 **다른 질병군**으로 옮겨 갔으면 직접 적어 둔 기준수가 · 일당수가 · 평균 입원일수를
   놓고, 정신과 여부를 그 질병군의 구분으로 다시 맞춘다 — 그러지 않으면 새 질병군을 골라도
   앞 질병군의 수가가 계속 이긴다(직접 적은 값이 앞서니까).
   적어 둔 값을 잃지 않게 **자료에 딱 맞는 번호가 되었을 때만** 놓는다.
   처음 열 때는 놓지 않는다(ndLastCode 를 저장분으로 채워 두고 시작한다). */
let ndLastCode = '';
function ndRenderPickers(){
  const m = ndMatch();
  nd.code = m.state === 'ok' ? m.hit.c : (nd.q || '').trim().toUpperCase();
  if (m.state === 'ok'){
    if (ndLastCode !== m.hit.c){
      nd.base = 0; nd.day = 0; nd.avg = 0;
      nd.psy = m.hit.g === '정신과계';     // 별표4 구분 — 지침 36쪽의 정신과 14개 질병군과 같다
    }
    ndLastCode = m.hit.c;
  } else ndLastCode = '';
  if ($('nd-code-in').value !== (nd.q || '')) $('nd-code-in').value = nd.q || '';
  $('nd-name').innerHTML =
    m.state === 'ok' ? '<b>' + esc(m.hit.c) + '</b> <span class="saved-note">' +
        esc(m.hit.g) + ' · ' + esc(m.hit.n) + (m.hit.s ? ' · ' + esc(m.hit.s) : '') +
        '<br>평균 ' + won2(m.hit.avg) + '일 · 정상군 ' + m.hit.lo + '~' + m.hit.hi + '일' +
        ' · 기준점수 ' + won2(m.hit.bs) + ' · 일당점수 ' + won2(m.hit.ds) + '</span>' :
    m.state === 'notable' ? '<span class="saved-note">별표4(질병군별 점수) 자료가 아직 없습니다 — ' +
        '<b>기준수가 · 일당수가 · 평균 입원일수</b>를 아래 표에 직접 적으세요' +
        (ndLensOpts().length ? ' (인공수정체 제외 대상 질병군입니다)' : '') + '</span>' :
    m.state === 'empty' ? '<span class="saved-note">질병군번호(RDRG)를 적으면 별표4 에서 점수를 찾습니다 — ' +
        (ndHasTable() ? won(NDRG_SCORES.length) + '건 (예: B65000 · C05200 · V61000) · ' : '') +
        '명칭으로 적어도 후보에 걸립니다</span>' :
    m.state === 'cand' ? '<span class="saved-note">아래 후보에서 고르세요 (' + m.list.length + '건) — ' +
        '<b>↑ ↓</b> 로 옮기고 <b>Enter</b> 로 넣습니다.</span>' :
        '<span class="dg-err">일치하는 질병군번호가 없습니다 — 별표4(RDRG ' +
        (ndHasTable() ? won(NDRG_SCORES.length) + '건' : '') + ') 안에서 확인해 주세요.</span>';
  $('nd-code-in').classList.toggle('dg-bad', m.state === 'bad');
  const row = $('nd-cand-row');
  if (m.list.length){
    if (ndCandSel >= m.list.length) ndCandSel = m.list.length - 1;   // 후보가 줄었을 때
    row.style.display = '';
    $('nd-cand').innerHTML = ndCandChips(m.list);
  } else {
    ndCandSel = -1;
    row.style.display = 'none';
    $('nd-cand').innerHTML = '';
  }
  $('nd-psy').checked = nd.psy;
  [['nd-unit', nd.unit], ['nd-coef', nd.coef],
   ['nd-rate-in', Math.round(nd.rateIn * 10000) / 100],
   ['nd-rate-over', Math.round(nd.rateOver * 10000) / 100]].forEach(([id, v]) => {
    if (document.activeElement !== $(id)) $(id).value = v;
  });
}

/* 인공수정체 제외유형 고르는 칸 (별표9) — 대상 질병군(C051~C054)이 아니면 아무것도 내놓지 않는다.
   부연설명은 요청으로 걷어냈다(2026-08-24) — 카드 아래 설명에 남아 있다. */
function ndLensSel(){
  const opts = ndLensOpts();
  if (!opts.length) return '';
  return '<select class="field-input mini" id="nd-lens" style="width:auto;display:inline-block;">' +
    '<option value="0">없음</option>' +
    opts.map(o => '<option value="' + o.t + '"' + (nd.lens === o.t ? ' selected' : '') + '>' +
      esc(o.label) + ' · ' + won(o.v) + '원 (유형 ' + o.t + ')</option>').join('') +
    '</select>';
}

/* ① 총액 — 사용자 엑셀의 [총액] 표를 그대로 옮긴 것 (구분 · 금액 두 칸) */
function ndRenderTotal(){
  const S = ndPick();
  /* 기준수가 · 일당수가 · 수정체 제외금액 · 인센티브 줄의 부연설명은 요청으로 걷어냈다(2026-08-24).
     기준수가·일당수가는 별표4 자료가 있을 때 **어느 점수에서 나온 값인지**만 남긴다. */
  const from = (score, val) => S
    ? '<div class="saved-note">별표4 ' + won2(score) + '점 × 조정계수 ' + nd.coef +
      ' × 단가 ' + nd.unit + ' = <b>' + won(val) + '</b>원</div>'
    : '';
  $('nd-total').innerHTML =
    '<table class="fields items dgt fixed" data-k="ndrg-total"><thead><tr>' +
      '<th>구분</th><th style="width:30%;">금액</th>' +
    '</tr></thead><tbody>' +
      '<tr><td><span class="c-name">기준수가</span>' +
        (S ? from(S.bs, ndUp10(S.bs * nd.coef * nd.unit)) : '') + '</td>' +
        '<td>' + ndMoney('id="nd-base" placeholder="' +
          (S ? ndUp10(S.bs * nd.coef * nd.unit).toLocaleString() : '0') + '"', nd.base) + '</td></tr>' +
      '<tr><td><span class="c-name">일당수가</span>' +
        (S ? from(S.ds, ndUp10(S.ds * nd.coef * nd.unit)) : '') + '</td>' +
        '<td>' + ndMoney('id="nd-day" placeholder="' +
          (S ? ndUp10(S.ds * nd.coef * nd.unit).toLocaleString() : '0') + '"', nd.day) + '</td></tr>' +
      // 평균 → 환자 순서다 (2026-08-24 요청으로 두 줄을 맞바꿨다)
      '<tr><td>평균 입원일수 <span class="saved-note">일' +
        (S ? ' · 별표4 ' + won2(S.avg) + '일 (정상군 ' + S.lo + '~' + S.hi + '일)' : '') + '</span></td>' +
        '<td>' + ndDec('id="nd-avg"', nd.avg, S ? String(S.avg) : '0') + '</td></tr>' +
      '<tr><td>환자 입원일수 <span class="saved-note">일</span></td>' +
        '<td>' + ndDec('id="nd-los"', nd.los, '일수') + '</td></tr>' +
      '<tr><td>수정체 제외금액 ' + ndLensSel() + '</td>' +
        '<td class="num" data-nout="excl">0</td></tr>' +
      '<tr><td><span class="c-name">포괄수가</span>' +
        '<div class="saved-note">기준수가 + (환자 입원일수 − 평균 입원일수) × 일당수가 − 제외금액 · 10원 미만 4사5입' +
        '<span data-nout="pack-raw"></span></div></td>' +
        '<td class="num b" data-nout="pack">0</td></tr>' +
      '<tr><td>인센티브 <span class="saved-note">%</span></td>' +
        '<td>' + ndDec('id="nd-inc"', nd.inc, '0') + '</td></tr>' +
      '<tr><td>인센티브포괄수가 <span class="saved-note">가산수가 = 포괄수가 × 정책가산율 · 10원 미만 절사</span></td>' +
        '<td class="num b" data-nout="inc">0</td></tr>' +
      '<tr><td>비포괄수가 <span class="saved-note">아래 「비포괄수가」 카드의 총액 · 10원 미만 절사 없음</span></td>' +
        '<td class="num" data-nout="np">0</td></tr>' +
    '</tbody><tfoot><tr>' +
      '<td><span class="c-name">신포괄총액</span>' +
        '<div class="saved-note">포괄수가 + 인센티브포괄수가 + 비포괄수가 · 더한 후 10원 미만 절사' +
        '<span data-nout="total-raw"></span></div></td>' +
      '<td class="num b" data-nout="total">0</td>' +
    '</tr></tfoot></table>';
}

/* ② 비포괄수가 원장 */
function ndItemRow(it, i){
  const tail = ndIsBlank(it) && i === nd.items.length - 1;
  return '<tr>' +
    '<td><input class="field-input mini" data-ni="' + i + '" data-nf="name" ' +
      'placeholder="항목명 (선택)" value="' + esc(it.name || '') + '"></td>' +
    '<td>' + ndMoney('data-ni="' + i + '" data-nf="amount"', it.amount) + '</td>' +
    '<td>' + ndPctIn('data-ni="' + i + '" data-nf="rate"', it.rate,
              String(Math.round(nd.rateIn * 1000) / 10)) + '</td>' +
    '<td class="num fixable" data-nout="item-own-' + i + '" data-nfix="' + i + '" ' +
      'title="두 번 누르면 이 줄 본인부담을 직접 적을 수 있습니다">0</td>' +
    '<td>' + (tail ? '' : '<button class="btn xs" data-ndel="' + i + '" title="이 줄 지우기">✕</button>') +
    '</td></tr>';
}
function ndIsBlank(it){
  return !(it.name || '').trim() && !it.amount && !ndHas(it.rate) && !ndHas(it.burdenFix);
}
function ndEnsureBlank(){
  const last = nd.items[nd.items.length - 1];
  if (last && ndIsBlank(last)) return;
  nd.items.push(ndNewItem());
}
function ndRenderNp(){
  ndEnsureBlank();
  $('nd-np').innerHTML =
    '<table class="fields items dgt fixed" data-k="ndrg-np"><thead><tr>' +
      '<th>구분</th><th style="width:15.5%;">금액</th><th style="width:12%;">부담률</th>' +
      '<th style="width:15.5%;">본인부담</th><th style="width:4.5%;"></th>' +
    '</tr></thead><tbody>' +
      '<tr><td><span class="c-name">비포괄수가 총액</span>' +
        '<div class="saved-note">비포괄 항목 = 행위별수가의 80% · 전액비포괄 항목 = 100% (35쪽)</div></td>' +
        '<td><input class="field-input money mini dg-key-in" data-nx="total" type="text" ' +
          'inputmode="numeric" title="+ − × ÷ 로 셈도 됩니다" placeholder="0" value="' +
          (nd.npTotal ? nd.npTotal.toLocaleString() : '') + '"></td>' +
        '<td>' + ndPctIn('data-nx="rate"', nd.npRate, String(Math.round(nd.rateIn * 1000) / 10)) + '</td>' +
        '<td class="num fixable" data-nfix="base" ' +
          'title="두 번 누르면 이 줄 본인부담을 직접 적을 수 있습니다">' +
          '<span data-nout="np-base-own">0</span>' +
          '<div class="saved-note" data-nout="np-base-note"></div></td>' +
        '<td></td></tr>' +
      nd.items.map((it, i) => ndItemRow(it, i)).join('') +
    '</tbody><tfoot>' +
      '<tr><td><span class="c-name">산정대상 금액 · 비포괄 본인부담</span>' +
        '<span class="dg-err" data-nout="np-warn"></span></td>' +
        '<td class="num b" data-nout="np-base">0</td><td></td>' +
        '<td class="num b" data-nout="np-own">0</td><td></td></tr>' +
    '</tfoot></table>';
}

/* 왼쪽의 「본인부담금」 카드(가)/나) 나눔 표)는 요청으로 걷어냈다 (2026-08-24) —
   오른쪽 요약 카드와 같은 값을 두 번 보여 주고 있었다. 계산(ndCompute 의 branch · ownIn · ownOver)은
   그대로 두었으니, 나눔 표가 다시 필요하면 그 값으로 그리면 된다. */

/* ③ 열외군 */
function ndRenderOut(){
  $('nd-out').innerHTML =
    '<table class="fields items dgt fixed" data-k="ndrg-out"><thead><tr>' +
      '<th>구분</th><th style="width:19.5%;">금액</th><th style="width:19.5%;">본인부담</th>' +
    '</tr></thead><tbody>' +
      '<tr><td><span class="c-name">정상군 입원기간 행위별 총진료비</span>' +
        '<div class="saved-note">행위별로 산정한 총액 (36쪽) — 적지 않으면 열외군으로 보지 않는다</div></td>' +
        '<td>' + ndMoney('id="nd-fee"', nd.fee) + '</td><td class="num"></td></tr>' +
      '<tr><td>신포괄 요양급여(의료급여)비용 <span class="saved-note">신포괄총액 (10원 미만 절사)</span></td>' +
        '<td class="num" data-nout="out-total">0</td><td class="num"></td></tr>' +
      '<tr><td>200만원</td><td class="num">−2,000,000</td><td class="num"></td></tr>' +
    '</tbody><tfoot><tr><td data-nout="out-label">열외군 차액</td>' +
      '<td class="num b" data-nout="out-add">0</td>' +
      '<td class="num b" data-nout="out-own">0</td></tr></tfoot></table>';
}

/* ④ 합계 — 오른쪽 요약 카드 */
function ndRenderSum(o){
  $('nd-sum').innerHTML =
    '<div class="dg-sum-big"><span>본인일부부담금</span><b>' + won(o.own) + '</b><i>원</i></div>' +
    '<div class="dg-sum-line"><span>' + (o.isOut ? '열외군 진료비' : '신포괄총액') + '</span><b>' +
      won(o.grand) + '</b><i>원</i></div>' +
    '<div class="dg-sum-line"><span>청구액</span><b>' + won(o.claim) + '</b><i>원</i></div>';
  const line = (name, a, b) =>
    '<tr><td>' + name + '</td><td class="num">' + won2(a) + '</td><td class="num">' + won2(b) + '</td></tr>';
  $('nd-sum-tbl').innerHTML =
    '<table class="fields items dgt fixed" data-k="ndrg-sum"><thead><tr>' +
      '<th>구분</th><th style="width:31%;">금액</th><th style="width:31%;">본인부담</th>' +
    '</tr></thead><tbody>' +
      line('포괄수가', o.pack, o.packOwn) +
      line('인센티브포괄수가', o.inc, 0) +   // 부연설명은 요청으로 걷어냈다(2026-08-24)
      line('비포괄수가', o.np, o.npOwn) +
      line('열외군 차액<div class="saved-note">' + pct(nd.rateIn) + '</div>', o.outAdd, o.outOwn) +
    '</tbody><tfoot>' +
      '<tr><td><span class="c-name">' + (o.isOut ? '열외군 진료비' : '신포괄총액') + ' · 본인부담금</span>' +
        '<div class="saved-note">10원 미만 절사' +
        (o.grandRaw !== o.grand ? ' (절사 전 ' + won2(o.grandRaw) + ')' : '') + '</div></td>' +
        '<td class="num b">' + won(o.grand) + '</td>' +
        '<td class="num strong">' + won(o.own) + '</td></tr>' +
      '<tr><td>청구액 <span class="saved-note">총액 − 본인부담금</span></td>' +
        '<td class="num"></td><td class="num b">' + won(o.claim) + '</td></tr>' +
    '</tfoot></table>';
}

/* ---------- MG · 병원 청구액으로 거꾸로 계산 ---------- */
const ND_CMP_COLS = [{ key:'mg', label:'MG' }, { key:'hos', label:'병원' }];
function ndRenderCmp(){
  if (!$('nd-cmp')) return;
  $('nd-cmp').innerHTML =
    '<table class="fields items cmp fixed" data-k="ndrg-cmp"><thead><tr><th>구분</th>' +
      ND_CMP_COLS.map(c => '<th style="width:31%;">' + esc(c.label) + '</th>').join('') +
    '</tr></thead><tbody>' +
      '<tr><td>총진료비</td>' +
        ND_CMP_COLS.map(() => '<td class="num" data-nout="cmp-total">0</td>').join('') + '</tr>' +
      '<tr><td>청구액</td>' +
        ND_CMP_COLS.map(c => '<td><input class="field-input money mini" data-ncmp="' + c.key + '" ' +
          'type="text" inputmode="numeric" title="+ − × ÷ 로 셈도 됩니다" placeholder="0" value="' +
          (nd.cmp[c.key] ? nd.cmp[c.key].toLocaleString() : '') + '"></td>').join('') + '</tr>' +
      '<tr><td><span class="c-name">본인부담금</span></td>' +
        ND_CMP_COLS.map(c => '<td class="num b" data-nout="cmp-own-' + c.key + '">0</td>').join('') + '</tr>' +
    '</tbody><tfoot><tr><td>차액 (MG − 병원)</td>' +
      '<td class="num b" colspan="2" data-nout="cmp-diff">0</td></tr></tfoot></table>';
}
function ndPaintCmp(total){
  if (!$('nd-cmp')) return;
  const set = (k, v) => document.querySelectorAll('#nd-cmp [data-nout="' + k + '"]')
                                .forEach(el => el.innerHTML = v);
  const mg = total - (nd.cmp.mg || 0), hos = total - (nd.cmp.hos || 0);
  set('cmp-total', won(total));
  set('cmp-own-mg', won(mg));
  set('cmp-own-hos', won(hos));
  set('cmp-diff', won(mg - hos) + '원');
  const dir = hos === mg ? '' : (hos < mg ? 'cmp-less' : 'cmp-more');
  ['cmp-own-hos', 'cmp-diff'].forEach(k => {
    const el = $('nd-cmp').querySelector('[data-nout="' + k + '"]');
    if (!el) return;
    el.classList.remove('cmp-less', 'cmp-more');
    if (dir) el.classList.add(dir);
  });
}

function ndPaint(){
  const o = ndCompute();
  const set = (k, v) => document.querySelectorAll('#page-ndrg [data-nout="' + k + '"]')
                                .forEach(el => { if (!el.querySelector('[data-nfixin]')) el.innerHTML = v; });
  set('excl', o.excl ? '−' + won(o.excl) : '0');
  set('pack-raw', o.los && o.packRaw !== o.pack ? ' · 4사5입 전 ' + won2(o.packRaw) : '');
  set('pack', won(o.pack));
  set('inc', won(o.inc));
  set('np', won(o.np));
  set('total-raw', o.totalRaw !== o.total ? ' · 절사 전 ' + won2(o.totalRaw) : '');
  set('total', won(o.total));
  o.items.forEach((x, i) => set('item-own-' + i, won2(x.own) +
    (ndHas(nd.items[i] && nd.items[i].burdenFix) ? '<div class="saved-note">수기</div>' : '')));
  set('np-base-own', won2(o.npBaseOwn));
  set('np-base-note', ndHas(nd.npFix) ? '수기로 적은 값'
        : (nd.npTotal ? esc(won(o.npBase) + ' × ' + pct(o.npRate)) : ''));
  set('np-base', won(o.npBase));
  set('np-warn', o.npBase < 0 ? ' · 항목 금액의 합이 비포괄수가 총액보다 큽니다' : '');
  set('np-own', won2(o.npOwn));
  set('out-total', won(o.total));
  set('out-label', o.isOut
    ? '열외군 차액 <span class="saved-note">행위별 총진료비 − 신포괄총액 − 200만원</span>'
    : '열외군 아님 <span class="saved-note">차액이 200만원을 넘지 않으면 0</span>');
  set('out-add', won(o.outAdd));
  set('out-own', won2(o.outOwn));
  ndRenderSum(o);
  ndPaintCmp(o.grand);
  ndSave();
}

function ndApplyWidth(){
  const m = $('nd-main');
  if (m){
    m.style.maxWidth = nd.width + 'px';
    m.style.setProperty('--dgtw', nd.tableW + 'px');
  }
  const wrap = document.querySelector('#page-ndrg .dg-wrap');
  if (wrap) wrap.style.setProperty('--dgw', nd.width + 'px');
  if ($('nd-w')) $('nd-w').value = nd.width;
  if ($('nd-w-val')) $('nd-w-val').textContent = nd.width + 'px';
  if ($('nd-tw')) $('nd-tw').value = nd.tableW;
  if ($('nd-tw-val')) $('nd-tw-val').textContent = nd.tableW + 'px';
}
function ndApplyMemo(){
  const el = $('nd-memo');
  if (el && document.activeElement !== el) el.value = nd.memo || '';
}
function ndRefresh(){
  ndApplyWidth();
  ndApplyMemo();
  ndRenderPickers();
  ndRenderTotal();
  ndRenderNp();
  ndRenderOut();
  ndRenderCmp();
  ndPaint();
}

/* ---------- 손 ---------- */
$('nd-code-in').addEventListener('input', () => {
  nd.q = $('nd-code-in').value.toUpperCase();
  nd.lens = 0;                                  // 질병군이 바뀌면 제외유형을 다시 고른다
  ndCandSel = -1;                               // 글자가 바뀌면 골라 둔 자리를 놓는다
  ndRefresh();
});
/* 후보를 방향키로 고르고 Enter 로 넣는다 — 질병군 계산기와 같은 규칙.
   ↑ ↓ 는 언제나, ← → 는 후보에 들어간 뒤에만 움직인다(적던 번호의 글자 사이를 오갈 수 있게).
   Esc 로 빠져나온다. 칩만 다시 그린다. */
function ndCandMove(step){
  const list = ndMatch().list;
  if (!list.length) return;
  ndCandSel = ndCandSel < 0 ? (step > 0 ? 0 : list.length - 1)
                            : (ndCandSel + step + list.length) % list.length;
  $('nd-cand').innerHTML = ndCandChips(list);
}
function ndCandTake(){                // 골라 둔 것(없으면 첫 후보)을 번호 칸에 넣는다
  const list = ndMatch().list;
  if (!list.length) return false;
  nd.q = (list[ndCandSel] || list[0]).c;
  nd.lens = 0;
  ndCandSel = -1;
  ndRefresh();
  return true;
}
$('nd-code-in').addEventListener('keydown', e => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  const k = e.key;
  if (k === 'ArrowDown' || (k === 'ArrowRight' && ndCandSel >= 0)){ e.preventDefault(); ndCandMove(1); }
  else if (k === 'ArrowUp' || (k === 'ArrowLeft' && ndCandSel >= 0)){ e.preventDefault(); ndCandMove(-1); }
  else if (k === 'Enter'){ if (ndCandTake()) e.preventDefault(); }
  else if (k === 'Escape' && ndCandSel >= 0){
    e.preventDefault();
    ndCandSel = -1;
    $('nd-cand').innerHTML = ndCandChips(ndMatch().list);
  }
});
$('nd-cand').addEventListener('click', e => {
  const b = e.target.closest('[data-ncand]');
  if (!b) return;
  nd.q = b.dataset.ncand;
  nd.lens = 0;
  ndCandSel = -1;
  ndRefresh();
  const inp = $('nd-code-in');        // 눌러서 넣었어도 다시 번호 칸에서 이어 적게
  inp.focus();
  try { inp.setSelectionRange(inp.value.length, inp.value.length); } catch (err) {}
});
$('nd-psy').addEventListener('change', () => { nd.psy = $('nd-psy').checked; ndPaint(); });
['nd-unit', 'nd-coef'].forEach(id => $(id).addEventListener('input', () => {
  const v = parseFloat($(id).value);
  if (id === 'nd-unit') nd.unit = isFinite(v) && v > 0 ? v : NDRG_UNIT;
  else                  nd.coef = isFinite(v) && v > 0 ? v : 1;
  ndRenderTotal();
  ndPaint();
}));
/* 본인부담률 — 평균 입원일수까지 20% · 초과분 23% 가 기본이고, 의료급여처럼 행위별수가제의
   본인부담률을 그대로 쓰는 경우에 맞게 직접 고칠 수 있다(36~37쪽 ※). */
['nd-rate-in', 'nd-rate-over'].forEach(id => $(id).addEventListener('input', () => {
  const s = $(id).value.trim();
  const v = s === '' ? null : (parseFloat(s) || 0) / 100;
  if (id === 'nd-rate-in') nd.rateIn = v === null ? .20 : v;
  else                     nd.rateOver = v === null ? .23 : v;
  ndRenderNp();      // 원장의 부담률 placeholder 가 이 값을 쓴다
  ndPaint();
}));
['nd-w', 'nd-tw'].forEach(id => $(id).addEventListener('input', () => {
  nd.width  = Number($('nd-w').value)  || 980;
  nd.tableW = Number($('nd-tw').value) || 980;
  nd.wSet = true;
  ndApplyWidth();
  setStickTop();
  ndSave();
}));
$('nd-memo').addEventListener('input', () => { nd.memo = $('nd-memo').value; ndSave(); });
$('nd-clear').addEventListener('click', () => {
  const keep = { width:nd.width, tableW:nd.tableW, wSet:nd.wSet, memo:nd.memo };
  nd = Object.assign(ndNewState(), keep);
  ndRefresh();
});

/* 표 안의 입력칸 — 표를 다시 그리지 않고 [data-nout] 칸만 갈아 넣는다 */
function ndDecVal(t, key, round){
  const v = parseFloat(String(t.value).replace(/[^0-9.]/g, ''));
  nd[key] = isFinite(v) && v > 0 ? (round ? Math.round(v) : v) : 0;
  if (String(t.value).replace(/[^0-9.]/g, '') !== t.value) t.value = nd[key] ? nd[key] : '';
}
function ndOnInput(e){
  const t = e.target;
  if (!t.dataset) return;
  if (t.id === 'nd-base' || t.id === 'nd-day' || t.id === 'nd-fee'){
    const a = readAmount(t);
    const key = t.id === 'nd-base' ? 'base' : (t.id === 'nd-day' ? 'day' : 'fee');
    if (a.ok) nd[key] = a.val;
    if (!a.formula) reformatMoney(t, nd[key]);
    ndPaint();
    return;
  }
  if (t.id === 'nd-los'){ ndDecVal(t, 'los', true);  ndPaint(); return; }
  if (t.id === 'nd-avg'){ ndDecVal(t, 'avg', false); ndPaint(); return; }
  if (t.id === 'nd-inc'){ ndDecVal(t, 'inc', false); ndPaint(); return; }
  if (t.dataset.nx === 'total'){
    const a = readAmount(t);
    if (a.ok) nd.npTotal = a.val;
    if (!a.formula) reformatMoney(t, nd.npTotal);
    ndPaint();
    return;
  }
  if (t.dataset.nx === 'rate'){
    const s = t.value.trim();
    nd.npRate = s === '' ? null : (parseFloat(s) || 0) / 100;
    ndPaint();
    return;
  }
  const i = Number(t.dataset.ni);
  const it = nd.items[i];
  if (!it) return;
  const f = t.dataset.nf;
  if (f === 'amount'){ const a = readAmount(t); if (a.ok) it.amount = a.val; if (!a.formula) reformatMoney(t, it.amount); }
  else if (f === 'name') it.name = t.value;
  else if (f === 'rate'){ const s = t.value.trim(); it.rate = s === '' ? null : (parseFloat(s) || 0) / 100; }
  if (i === nd.items.length - 1 && !ndIsBlank(it)){
    const tb = $('nd-np').querySelector('tbody');
    const tr = tb && tb.querySelectorAll('tr')[i + 1];   // tbody 첫 줄은 비포괄수가 총액
    if (tr && !tr.querySelector('[data-ndel]'))
      tr.lastElementChild.innerHTML =
        '<button class="btn xs" data-ndel="' + i + '" title="이 줄 지우기">✕</button>';
    nd.items.push(ndNewItem());
    if (tb) tb.insertAdjacentHTML('beforeend', ndItemRow(nd.items[nd.items.length - 1], nd.items.length - 1));
  }
  ndPaint();
}
function ndMoneyValue(t){
  if (t.id === 'nd-base') return nd.base;
  if (t.id === 'nd-day')  return nd.day;
  if (t.id === 'nd-fee')  return nd.fee;
  if (t.dataset.nx === 'total') return nd.npTotal;
  return (nd.items[Number(t.dataset.ni)] || {}).amount || 0;
}
$('nd-total').addEventListener('change', e => {
  if (e.target.id !== 'nd-lens') return;
  nd.lens = Number(e.target.value) || 0;
  ndPaint();
});
['nd-total', 'nd-np', 'nd-out'].forEach(id => {
  $(id).addEventListener('input', ndOnInput);
  $(id).addEventListener('focusout', e => {
    const t = e.target;
    if (t.dataset && t.dataset.nfixin !== undefined){ ndCommitFix(t, true); return; }
    if (!t.classList || !t.classList.contains('money')) return;
    if (t.value.trim() === '') return;
    const v = ndMoneyValue(t);
    t.value = v ? v.toLocaleString() : '';
  });
});
$('nd-np').addEventListener('click', e => {
  const del = e.target.closest('[data-ndel]');
  if (!del) return;
  nd.items.splice(Number(del.dataset.ndel), 1);
  ndRenderNp(); ndPaint();
});

/* 옮겨 가는 순서 — 금액 → 같은 줄 부담률 → 다음 줄 금액 (질병군 계산기와 같다) */
function ndNextCell(t){
  const box = $('nd-np');
  const moneys = [...box.querySelectorAll('input.money')];
  const rates  = [...box.querySelectorAll('input.pctin')];
  if (t.classList.contains('money')) return rates[moneys.indexOf(t)] || null;
  if (t.classList.contains('pctin')) return moneys[rates.indexOf(t) + 1] || null;
  return null;
}
$('nd-np').addEventListener('keydown', e => {
  const t = e.target;
  if (t.dataset && t.dataset.nfixin !== undefined){
    if (e.key === 'Enter'){ e.preventDefault(); ndCommitFix(t, true); }
    else if (e.key === 'Escape'){ e.preventDefault(); ndCommitFix(t, false); }
    return;
  }
  const money = t.classList && t.classList.contains('money');
  const rate  = t.classList && t.classList.contains('pctin');
  if (!money && !rate) return;
  if (e.key === 'Enter'){
    e.preventDefault();
    if (money && t.value.trim() !== ''){ const v = ndMoneyValue(t); t.value = v ? v.toLocaleString() : ''; }
    const n = ndNextCell(t);
    if (n){ n.focus(); try { n.select(); } catch (err) {} }
    return;
  }
  if (e.key !== 'Tab' || e.shiftKey || e.altKey || e.ctrlKey) return;
  if (money) return;
  const n = ndNextCell(t);
  if (n){ e.preventDefault(); n.focus(); try { n.select(); } catch (err) {} }
});

/* 본인부담 칸을 두 번 눌러 손으로 적기 — 비우고 나가면 다시 자동 계산 */
function ndCommitFix(inp, keep){
  const cell = inp.closest('[data-nfix]');
  if (!cell) return;
  const key = cell.dataset.nfix;
  const it = key === 'base' ? null : nd.items[Number(key)];
  if (keep && (it || key === 'base')){
    const s = inp.value.trim();
    const v = s === '' ? null : (HAS_OP.test(s) ? calcExpr(s) : parseMoney(s));
    const val = ndHas(v) ? Math.max(0, Math.round(v)) : null;
    if (key === 'base') nd.npFix = val; else it.burdenFix = val;
  }
  cell.innerHTML = key === 'base'
    ? '<span data-nout="np-base-own">0</span><div class="saved-note" data-nout="np-base-note"></div>'
    : '0';
  ndPaint();
}
$('nd-np').addEventListener('dblclick', e => {
  const cell = e.target.closest('[data-nfix]');
  if (!cell || cell.querySelector('[data-nfixin]')) return;
  const key = cell.dataset.nfix;
  const it = key === 'base' ? { burdenFix: nd.npFix } : nd.items[Number(key)];
  if (!it) return;
  cell.innerHTML = '<input class="field-input money mini" data-nfixin="1" inputmode="numeric" ' +
    'placeholder="자동" title="비우고 나가면 다시 자동 계산" value="' +
    (ndHas(it.burdenFix) ? it.burdenFix.toLocaleString() : '') + '">';
  const inp = cell.querySelector('[data-nfixin]');
  inp.focus();
  try { inp.select(); } catch (err) {}
});

/* MG · 병원 청구액 칸 */
if ($('nd-cmp')){
  $('nd-cmp').addEventListener('input', e => {
    const k = e.target.dataset && e.target.dataset.ncmp;
    if (!k) return;
    const a = readAmount(e.target);
    if (a.ok) nd.cmp[k] = a.val;
    if (!a.formula) reformatMoney(e.target, nd.cmp[k]);
    ndPaintCmp(ndCompute().grand);
    ndSave();
  });
  $('nd-cmp').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.dataset || !e.target.dataset.ncmp) return;
    e.preventDefault();
    const v = nd.cmp[e.target.dataset.ncmp] || 0;
    e.target.value = v ? v.toLocaleString() : '';
    const ins = [...$('nd-cmp').querySelectorAll('input.money')];
    const n = ins[ins.indexOf(e.target) + 1];
    if (n){ n.focus(); try { n.select(); } catch (err) {} }
  });
  $('nd-cmp').addEventListener('focusout', e => {
    const k = e.target.dataset && e.target.dataset.ncmp;
    if (!k || e.target.value.trim() === '') return;
    const v = nd.cmp[k] || 0;
    e.target.value = v ? v.toLocaleString() : '';
  });
}

/* 사이드바의 「열 너비 기본값으로 굳히기」가 칸 폭 · 표 폭도 같이 담게 등록한다 */
if (typeof COLW_EXTRA !== 'undefined'){
  COLW_EXTRA['ndrg|paneW']  = () => nd.width;
  COLW_EXTRA['ndrg|tableW'] = () => nd.tableW;
  COLW_EXTRA_DONE.push(() => { nd.wSet = false; ndSave(); });
}

ndLoad();
ndLastCode = (nd.q || '').trim().toUpperCase();   // 저장분의 직접 적은 수가를 첫 그림에서 잃지 않게
ndRefresh();
