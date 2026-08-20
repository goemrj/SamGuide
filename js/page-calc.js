/* ---------- ② 본인부담금 계산기 ----------
   규칙 출처는 ①(js/page-burden.js)과 같은 엑셀 시트지만, 계산에 쓰는 숫자는
   ①의 data/burden-rules.js 가 아니라 아래 표(HI_OUT·HI_IN·CS2_*·MG_* …)에 따로 들어 있다.
   ①은 "보는 용도", ②는 "계산 용도"라 규칙이 바뀌면 두 곳을 다 고쳐야 한다.

   계산 방식은 시트의 [계산식] 탭과 같다 —
     나머지 = 총진료비 − 별도항목 금액 합
     본인부담금 = 나머지 × 기본률 + Σ(별도항목 금액 × 항목별 부담률)
     소수점은 그대로 두고 계산한 뒤 마지막에 한 번만 절사(외래 100원 · 입원 10원)

   세부작성요령(2025.8.1.) 203~206쪽의 예시 8건으로 검산했다.
------------------------------------------------------------------ */

const QUALS = ['건강보험', '차상위 C (1종)', '차상위 E (2종)', '차상위 F (2종 장애인)', '의료급여 1종', '의료급여 2종'];
const MODES = ['외래', '입원'];
const INSTS = ['상급종합병원', '종합병원', '종합병원 (읍·면)', '병원', '병원 (읍·면)', '의원'];

// 의료급여는 종별을 1·2·3차로 부른다
const MG_TIER = {'상급종합병원':'3차', '종합병원':'2차', '종합병원 (읍·면)':'2차',
                 '병원':'2차', '병원 (읍·면)':'2차', '의원':'1차'};

/* ---------- 건강보험 외래 — 「건보 외래 본부」 시트
   consult:true 는 "진찰료 총액(전액) + 나머지 ○○%" 형태. 진찰료는 별도항목 100%로 넣는다.
   '1세이상 6세미만'은 시트에 "일반환자본인부담률의 70%"로만 적혀 있어 일반율×0.7 로 계산해 둔 값이다. */
const HI_OUT = {
  '상급종합병원': { '일반':{consult:1, rate:.60}, '임신부 (F015)':{rate:.40}, '1세미만 (F024)':{rate:.20},
                    '1세이상 6세미만':{consult:1, rate:.42}, '조산아·저체중아 (F016)':{rate:.05},
                    '난임진료 (F021)':{consult:1, rate:.30}, '경증질환 외래 (F025)':{rate:1.00} },
  '종합병원':     { '일반':{rate:.50}, '임신부 (F015)':{rate:.30}, '1세미만 (F024)':{rate:.15},
                    '1세이상 6세미만':{rate:.35}, '조산아·저체중아 (F016)':{rate:.05}, '난임진료 (F021)':{rate:.30} },
  // 읍·면지역 종합병원 45%는 엑셀 시트에는 없고 세부작성요령(2025.8.1.) 205쪽에만 있다 —
  // 같은 쪽 예시(16,000원 → 7,200원)로 확인함
  '종합병원 (읍·면)': { '일반':{rate:.45}, '임신부 (F015)':{rate:.30}, '1세미만 (F024)':{rate:.15},
                    '1세이상 6세미만':{rate:.315}, '조산아·저체중아 (F016)':{rate:.05}, '난임진료 (F021)':{rate:.30} },
  '병원':         { '일반':{rate:.40}, '임신부 (F015)':{rate:.20}, '1세미만 (F024)':{rate:.10},
                    '1세이상 6세미만':{rate:.28}, '조산아·저체중아 (F016)':{rate:.05}, '난임진료 (F021)':{rate:.30} },
  '병원 (읍·면)': { '일반':{rate:.35}, '임신부 (F015)':{rate:.20}, '1세미만 (F024)':{rate:.10},
                    '1세이상 6세미만':{rate:.245}, '조산아·저체중아 (F016)':{rate:.05}, '난임진료 (F021)':{rate:.30} },
  '의원':         { '일반':{rate:.30}, '임신부 (F015)':{rate:.10}, '1세미만 (F024)':{rate:.05},
                    '1세이상 6세미만':{rate:.21}, '조산아·저체중아 (F016)':{rate:.05}, '난임진료 (F021)':{rate:.30},
                    '65세이상':{tier:'senior'} },
};

/* ---------- 건강보험 입원 — 「건보 입원 본부」 시트 (식대는 별도항목) ---------- */
const HI_IN = {
  '일반':{rate:.20},
  '15세 이하 (F018)':{rate:.05},
  '신생아 28일 이내 (F005)':{rate:0},
  '2세 미만 (F027)':{rate:0},
  '자연분만':{rate:0},
  '고위험 임신부':{rate:.10},
  '제왕절개 (25년~)':{rate:0},
  '장기적출':{rate:0},
  '선택입원군 (요양병원)':{rate:.40},
};

/* ---------- 차상위 2종(E·F) ---------- */
const CS2_OUT = {
  '일반':{rate:.14},
  '희귀·중증난치질환자':{rate:.10},
  '임신부·조산아·저체중아·치매·중증질환자·1세미만':{rate:.05},
  '암 (V193)':{rate:.05},
  'V191 · V192 · 결핵 (V000)':{rate:0},
};
const CS2_IN = {
  '일반':{rate:.14},
  '등록 희귀·중증난치질환자 · 정신과 입원진료':{rate:.10},
  '중증질환자 · 고위험임신부 (F011) · 치매':{rate:.05},
  '6~15세 (F020)':{rate:.03},
  '6세 미만 (F019)':{rate:0},
  '자연분만 · 제왕절개 · 장기적출 · V191 · V192 · V268 · V273 · V275 · 결핵':{rate:0},
};
const CS1_IN = { '일반':{rate:0}, '연장승인 불승인자 (F023)':{rate:.30} };

/* ---------- 의료급여 — 「의료급여」 시트. 1종 외래와 2종 1차 외래는 정액이다. ---------- */
const MG1_OUT = {                     // [정액원(직접조제 이외), 정액원(원내 직접조제)]
  '1차':{fixed:[1000, 1500]}, '2차':{fixed:[1500, 2000]}, '3차':{fixed:[2000, 2500]},
};
const MG2_OUT = {
  '1차':{fixed:[1000, 1500], fixedDisabled:[250, 750]},
  '2차':{rate:.15}, '3차':{rate:.15},
};
const MG_OUT_EXTRA = {
  '일반':null,
  '치매·임산부·조산아·저체중아 (2종 특별본부)':{rate:.05},
  '1세미만 (2종 특별본부)':{rate:0},
  '18세이하 치아홈메우기 (2종)':{rate:.05},
  '연장승인 불승인자 (F023)':{rate:.30},
  'AIDS (V103) · 원격협의진찰 · 회송료':{rate:0},
};
const MG_IN = {
  '1종': { '일반':{rate:0}, '연장승인 불승인자 (F023)':{rate:.30} },
  '2종': { '일반':{rate:.10}, '자연분만 (F001)':{rate:0}, '제왕절개 (F013)':{rate:0},
           '6세미만 (F004/F019)':{rate:0}, 'AIDS (V103)':{rate:0}, '뇌사자 등 장기기증 (F017)':{rate:0},
           '고위험 임산부 (F011)':{rate:.05}, '중증치매 (V800·V810)':{rate:.05},
           '6~15세 (F020)':{rate:.03}, '중증질환자 (V191·V192·V193 등)':{rate:0},
           '행려환자 (M011)':{rate:0}, '연장승인 불승인자 (F023)':{rate:.30} },
};

/* ---------- 산정특례 — 선택하면 기본 부담률을 이 값으로 덮어쓴다 ---------- */
const SPECIALS = {
  '없음': null,
  '암 · 중증화상 · 뇌혈관 · 심혈관 · 중증외상 (V193 등)': .05,
  '희귀 · 중증난치 (MT014 21~ · 23~)': .10,
  '중증치매 (V800 · V810)': .10,
  '결핵 (V000)': 0,
  '미등록 암환자 · 가정간호 (V027 · V008)': .20,
};

/* ---------- 별도 본인부담 항목 ----------
   rate(state) 는 그 항목의 기본 부담률을 자격·종별에 맞춰 돌려준다.
   화면에서 사용자가 직접 고칠 수 있으므로 여기 값은 "기본값"이다. */
const CALC_ITEMS = [
  { key:'consult',  label:'진찰료 총액 (전액 본인부담)', mode:'외래',
    rate: () => 1.00, hint:'상급종합 일반·1~6세미만·난임진료에서 쓴다' },
  { key:'drug',     label:'약가총액 (의약분업 F003)', mode:'외래',
    rate: s => s.type.startsWith('1세미만') ? .21 : .30 },
  { key:'meal',     label:'식대', mode:'입원',
    rate: s => isHI(s) ? .50 : .20, hint:'건강보험 50% · 차상위/의료급여 기본식대 20%' },
  { key:'special',  label:'특수장비 S항 (CT · MRI · PET)', mode:'',
    rate: s => {
      if (s.qual === '의료급여 1종') return .05;
      if (s.qual === '의료급여 2종') return MG_TIER[s.inst] === '1차' ? .15 : .15;
      if (isCS2(s)) return .14;
      if (s.qual === '차상위 C (1종)') return 0;
      return outRateOf(s);                       // 건강보험은 그 기관의 외래 본인부담률
    }, hint:'입원에서도 외래 본인부담률을 적용한다' },
  { key:'isolate',  label:'격리입원료 · 응급실 격리병상', mode:'',
    rate: s => isHI(s) ? .10 : .05, hint:'건강보험 10% · 차상위 5% (의료급여는 법정 본부를 따름)' },
  { key:'long16',   label:'장기입원 16일 이상', mode:'입원', rate: () => .25 },
  { key:'long31',   label:'장기입원 31일 이상', mode:'입원', rate: () => .30 },
  { key:'room2',    label:'상급병실 2인실', mode:'입원',
    rate: s => s.inst === '상급종합병원' ? .50 : .40 },
  { key:'room3',    label:'상급병실 3인실', mode:'입원',
    rate: s => s.inst === '상급종합병원' ? .40 : .30 },
  { key:'room4',    label:'상급병실 4인실 (상급종합)', mode:'입원', rate: () => .30 },
  { key:'selA',     label:'선별급여 A (100분의 50)', mode:'', rate: () => .50 },
  { key:'selB',     label:'선별급여 B (100분의 80)', mode:'', rate: () => .80 },
  { key:'selD',     label:'선별급여 D (100분의 30)', mode:'', rate: () => .30 },
  { key:'selE',     label:'선별급여 E (100분의 90)', mode:'', rate: () => .90 },
  { key:'material', label:'특수재료 T항 및 관련 행위료', mode:'외래',
    rate: s => s.type.includes('6세미만') || s.type.startsWith('1세미만') ? .14 : .20 },
  { key:'psych',    label:'개인 · 집단정신치료', mode:'외래',
    rate: s => {
      const base = {'상급종합병원':.40, '종합병원':.30, '병원':.20, '병원 (읍·면)':.20, '의원':.10}[s.inst];
      return (s.type.includes('6세미만') || s.type.startsWith('1세미만')) ? base * .7 : base;
    }, hint:'6세미만은 70% (1세미만도 6세미만과 같게 적용)' },
  { key:'chuna',    label:'한방 추나요법', mode:'',
    rate: s => s.qual === '차상위 C (1종)' ? .30 : isCS2(s) ? .40 : .50,
    hint:'단순·복잡에 따라 50% 또는 80% (차상위 C 30% · E·F 40%)' },
  { key:'sealant',  label:'18세 이하 치아홈메우기', mode:'',
    rate: s => isHI(s) ? .10 : .05, hint:'건강보험 10% (15세 이하 5%) · 차상위·의급 5%' },
  { key:'denture',  label:'65세 이상 등록 틀니', mode:'',
    rate: s => isHI(s) ? .30 : .15 },
  { key:'implant',  label:'65세 이상 치과 임플란트', mode:'',
    rate: s => isHI(s) ? .30 : .20 },
  { key:'refer',    label:'회송료 · 원격협의진찰료 자문료', mode:'', rate: () => 0 },
  { key:'rrs',      label:'신속대응시스템 (본인부담 없음)', mode:'입원', rate: () => 0 },
  { key:'retain',   label:'퇴장방지의약품 사용장려금', mode:'', rate: () => 0 },
];

function isHI(s){ return s.qual === '건강보험'; }
function isCS2(s){ return s.qual.startsWith('차상위 E') || s.qual.startsWith('차상위 F'); }
function isMG(s){ return s.qual.startsWith('의료급여'); }

// 건강보험 그 기관의 외래 일반 부담률 — 특수장비 항목이 참조한다
function outRateOf(s){
  const t = HI_OUT[s.inst];
  return (t && t['일반'] && t['일반'].rate) || .30;
}

/* ---------- 환자유형 목록 · 기본 부담률 결정 ---------- */
function typeTable(s){
  if (isMG(s)){
    if (s.mode === '입원') return MG_IN[s.qual === '의료급여 1종' ? '1종' : '2종'];
    return MG_OUT_EXTRA;
  }
  if (s.qual === '차상위 C (1종)') return s.mode === '입원' ? CS1_IN : {'일반':{rate:0}};
  if (isCS2(s)) return s.mode === '입원' ? CS2_IN : CS2_OUT;
  return s.mode === '입원' ? HI_IN : (HI_OUT[s.inst] || HI_OUT['의원']);
}

// 기본 부담: {kind:'rate'|'fixed'|'tier', rate, fixed, label, source}
function baseBurden(s){
  const sp = SPECIALS[s.spec];
  if (sp !== null && sp !== undefined)
    return { kind:'rate', rate: sp, label:'산정특례 ' + s.spec, source:'산정특례' };

  const tier = MG_TIER[s.inst];

  if (isMG(s) && s.mode === '외래'){
    const extra = MG_OUT_EXTRA[s.type];
    if (extra) return { kind:'rate', rate: extra.rate, label:'의료급여 ' + s.type, source:'의료급여 외래' };
    const t = (s.qual === '의료급여 1종' ? MG1_OUT : MG2_OUT)[tier];
    if (t.rate !== undefined)
      return { kind:'rate', rate:t.rate, label:'의료급여 2종 ' + tier + ' 외래', source:'의료급여 외래' };
    const pair = (s.qual === '의료급여 2종' && s.qual2Disabled && t.fixedDisabled) ? t.fixedDisabled : t.fixed;
    return { kind:'fixed', fixed: pair[s.dispense ? 1 : 0],
             label:'의료급여 ' + (s.qual === '의료급여 1종' ? '1종 ' : '2종 ') + tier + ' 정액' +
                   (s.dispense ? ' (원내 직접조제)' : ''), source:'의료급여 외래' };
  }

  if (isCS2(s) && s.mode === '외래' && s.inst === '의원' && s.type === '일반'){
    const pair = s.qual.startsWith('차상위 F') ? [250, 750] : [1000, 1500];
    return { kind:'fixed', fixed: pair[s.dispense ? 1 : 0],
             label:'차상위 ' + (s.qual.startsWith('차상위 F') ? 'F' : 'E') + ' 의원 정액' +
                   (s.dispense ? ' (원내 직접조제)' : ''), source:'차상위 외래' };
  }

  const t = typeTable(s)[s.type];
  if (!t) return { kind:'rate', rate:0, label:'해당 규칙 없음', source:'', missing:true };
  if (t.tier === 'senior') return { kind:'tier', label:'의원 65세 이상 (구간별)', source:'건강보험 외래' };
  if (t.consult) return { kind:'rate', rate:t.rate, consult:true,
                          label:'진찰료 총액 + 나머지 ' + pct(t.rate), source:'건강보험 외래' };
  return { kind:'rate', rate:t.rate,
           label: (isHI(s) ? '' : s.qual + ' ') + s.type,
           source: isHI(s) ? '건강보험 ' + s.mode : s.qual + ' ' + s.mode };
}

// 의원 65세 이상 외래 — 「건보 외래 본부」 시트. 구간은 요양급여비용총액 1로 정한다.
function seniorBand(total){
  if (total <= 15000) return { fixed: 1500, desc: '15,000원 이하 → 정액 1,500원' };
  if (total <= 20000) return { rate: .10, desc: '15,000~20,000원 → 10%' };
  if (total <= 25000) return { rate: .20, desc: '20,000~25,000원 → 20%' };
  return { rate: .30, desc: '25,000원 초과 → 30%' };
}

/* ---------- 화면 상태 ---------- */
const calc = { qual:'건강보험', mode:'외래', inst:'의원', type:'일반', spec:'없음',
               dispense:0, total:0, items:[] };

function fillSelect(el, list, cur){
  el.innerHTML = list.map(v => '<option' + (v === cur ? ' selected' : '') + '>' + esc(v) + '</option>').join('');
}
function typeList(){ return Object.keys(typeTable(calc)); }

function syncCalcInputs(){
  fillSelect($('c-qual'), QUALS, calc.qual);
  fillSelect($('c-mode'), MODES, calc.mode);
  fillSelect($('c-inst'), INSTS, calc.inst);
  const types = typeList();
  if (!types.includes(calc.type)) calc.type = types[0];
  fillSelect($('c-type'), types, calc.type);
  fillSelect($('c-spec'), Object.keys(SPECIALS), calc.spec);
  $('c-dispense').value = String(calc.dispense);

  // 원내 직접조제는 정액이 걸린 경우에만 의미가 있다
  const b = baseBurden(calc);
  $('c-dispense-wrap').style.display = (b.kind === 'fixed') ? '' : 'none';
}

function itemDefsFor(){
  return CALC_ITEMS.filter(it => !it.mode || it.mode === calc.mode);
}
function renderAddSelect(){
  const used = new Set(calc.items.map(i => i.key));
  const opts = itemDefsFor().filter(d => !used.has(d.key));
  $('c-add').innerHTML = '<option value="">+ 별도 본인부담 항목 추가</option>' +
    opts.map(d => '<option value="' + d.key + '">' + esc(d.label) + '</option>').join('');
}
function renderItems(){
  if (!calc.items.length){
    $('c-items').innerHTML = '<div class="saved-note" style="padding:10px 2px;">추가한 항목이 없습니다. 총진료비 전체에 기본 부담률을 적용합니다.</div>';
    return;
  }
  $('c-items').innerHTML = '<table class="fields items"><thead><tr>' +
    '<th>항목</th><th style="width:140px;">금액</th><th style="width:96px;">부담률</th><th style="width:34px;"></th>' +
    '</tr></thead><tbody>' +
    calc.items.map((it, idx) => {
      const d = CALC_ITEMS.find(x => x.key === it.key);
      return '<tr><td class="c-name">' + esc(d.label) +
        (d.hint ? '<div class="saved-note">' + esc(d.hint) + '</div>' : '') + '</td>' +
        '<td><input class="field-input money mini" data-i="' + idx + '" data-f="amount" value="' +
          (it.amount ? it.amount.toLocaleString() : '') + '" inputmode="numeric" placeholder="0"></td>' +
        '<td><input class="field-input mini pctin" data-i="' + idx + '" data-f="rate" value="' +
          (Math.round(it.rate * 1000) / 10) + '" inputmode="decimal"><span class="pctsign">%</span></td>' +
        '<td><button class="btn xs" data-del="' + idx + '">✕</button></td></tr>';
    }).join('') + '</tbody></table>';

  $('c-items').querySelectorAll('input').forEach(inp => {
    inp.addEventListener('input', () => {
      const it = calc.items[Number(inp.dataset.i)];
      if (inp.dataset.f === 'amount'){
        it.amount = parseMoney(inp.value);
        const p = inp.selectionStart, before = inp.value.length;
        inp.value = it.amount ? it.amount.toLocaleString() : '';
        const d = inp.value.length - before;
        inp.setSelectionRange(Math.max(0, p + d), Math.max(0, p + d));
      } else {
        it.rate = (parseFloat(inp.value) || 0) / 100;
      }
      renderResult();
    });
  });
  $('c-items').querySelectorAll('[data-del]').forEach(b => {
    b.addEventListener('click', () => {
      calc.items.splice(Number(b.dataset.del), 1);
      renderItems(); renderAddSelect(); renderResult();
    });
  });
}

/* ---------- 계산 ---------- */
function compute(){
  const b = baseBurden(calc);
  const T = calc.total;
  const itemsSum = calc.items.reduce((a, i) => a + i.amount, 0);
  const rest = T - itemsSum;
  const lines = [];

  let restBurden = 0;
  if (b.kind === 'fixed'){
    restBurden = b.fixed;
    lines.push({ name:'기본 (' + b.label + ')', amount: rest, rate: null, burden: b.fixed, fixed:true });
  } else if (b.kind === 'tier'){
    const t = seniorBand(T);
    if (t.fixed !== undefined){
      restBurden = t.fixed;
      lines.push({ name:'기본 (' + b.label + ' · ' + t.desc + ')', amount: rest, rate: null, burden: t.fixed, fixed:true });
    } else {
      restBurden = rest * t.rate;
      lines.push({ name:'나머지 요양급여비용 (' + t.desc + ')', amount: rest, rate: t.rate, burden: restBurden });
    }
  } else {
    restBurden = rest * b.rate;
    lines.push({ name:'나머지 요양급여비용', amount: rest, rate: b.rate, burden: restBurden });
  }

  for (const it of calc.items){
    const d = CALC_ITEMS.find(x => x.key === it.key);
    lines.push({ name: d.label, amount: it.amount, rate: it.rate, burden: it.amount * it.rate });
  }

  const raw = lines.reduce((a, l) => a + l.burden, 0);
  const unit = calc.mode === '입원' ? 10 : 100;
  const burden = Math.floor(raw / unit) * unit;
  return { b, T, rest, itemsSum, lines, raw, unit, burden, claim: T - burden };
}

function renderResult(){
  const r = compute();
  const warn = [];
  if (r.b.missing) warn.push('선택한 조합에 해당하는 규칙이 시트에 없습니다. 부담률 0%로 계산했습니다.');
  if (r.rest < 0) warn.push('별도 항목 금액의 합이 총진료비보다 큽니다. 금액을 확인해 주세요.');
  if (r.b.consult && !calc.items.some(i => i.key === 'consult'))
    warn.push('이 유형은 “진찰료 총액 + 나머지 ' + pct(r.b.rate) + '”입니다. 별도 항목에서 <b>진찰료 총액</b>을 추가해 주세요.');
  if (r.b.kind === 'fixed' && r.T === 0) warn.push('정액 대상입니다. 총진료비와 무관하게 정액이 본인부담금이 됩니다.');

  $('c-result').innerHTML =
    '<div class="res-head">' +
      '<div class="res-big"><span>본인부담금</span><b>' + won(r.burden) + '</b><i>원</i></div>' +
      '<div class="res-sub">청구액 <b>' + won(r.claim) + '</b>원 · 총진료비 ' + won(r.T) + '원</div>' +
    '</div>' +
    (warn.length ? '<div class="res-warn">' + warn.map(w => '<div>· ' + w + '</div>').join('') + '</div>' : '') +
    '<table class="fields res"><thead><tr><th>항목</th><th>금액</th><th>부담률</th><th>본인부담</th></tr></thead><tbody>' +
      r.lines.map(l =>
        '<tr><td class="c-name">' + esc(l.name) + '</td>' +
        '<td class="num">' + won(l.amount) + '</td>' +
        '<td class="num">' + (l.fixed ? '정액' : pct(l.rate)) + '</td>' +
        '<td class="num strong">' + won2(l.burden) + '</td></tr>'
      ).join('') +
    '</tbody><tfoot>' +
      '<tr><td colspan="3">절사 전 합계</td><td class="num strong">' + won2(r.raw) + '</td></tr>' +
      '<tr><td colspan="3">' + r.unit + '원 미만 절사 (' + calc.mode + ')</td>' +
        '<td class="num strong">' + won(r.burden) + '</td></tr>' +
    '</tfoot></table>' +
    '<div class="dt-src">기본 부담: ' + esc(r.b.label) + (r.b.source ? ' · ' + esc(r.b.source) : '') + '</div>';
}

function renderHint(){
  const b = baseBurden(calc);
  const tier = isMG(calc) ? ' · ' + MG_TIER[calc.inst] + ' 의료급여기관' : '';
  $('c-hint').innerHTML =
    '<b>기본 부담</b> ' + esc(b.label) +
    (b.kind === 'rate' ? ' <span class="hint-rate">' + pct(b.rate) + '</span>' : '') +
    (b.kind === 'fixed' ? ' <span class="hint-rate">' + won(b.fixed) + '원</span>' : '') +
    esc(tier);
}

function refreshCalc(){
  syncCalcInputs();
  renderAddSelect();
  renderItems();
  renderHint();
  renderResult();
}

['c-qual', 'c-mode', 'c-inst', 'c-type', 'c-spec', 'c-dispense'].forEach(id => {
  $(id).addEventListener('change', () => {
    calc.qual = $('c-qual').value;
    calc.mode = $('c-mode').value;
    calc.inst = $('c-inst').value;
    calc.spec = $('c-spec').value;
    calc.dispense = Number($('c-dispense').value);
    if (id === 'c-type') calc.type = $('c-type').value;
    // 진료형태가 바뀌면 그 형태에 없는 별도항목은 정리한다
    const ok = new Set(itemDefsFor().map(d => d.key));
    calc.items = calc.items.filter(i => ok.has(i.key));
    // 자격·종별이 바뀌면 사용자가 직접 고치지 않은 부담률은 다시 채운다
    for (const it of calc.items){
      if (it.touched) continue;
      it.rate = CALC_ITEMS.find(d => d.key === it.key).rate(calc);
    }
    refreshCalc();
  });
});
$('c-total').addEventListener('input', () => {
  calc.total = parseMoney($('c-total').value);
  $('c-total').value = calc.total ? calc.total.toLocaleString() : '';
  renderResult();
});
$('c-add').addEventListener('change', () => {
  const key = $('c-add').value;
  if (!key) return;
  const d = CALC_ITEMS.find(x => x.key === key);
  calc.items.push({ key, amount: 0, rate: d.rate(calc) });
  $('c-add').value = '';
  renderAddSelect(); renderItems(); renderResult();
});
// 부담률을 손으로 고치면 그 뒤로는 자동으로 덮어쓰지 않는다
$('c-items').addEventListener('input', e => {
  if (e.target.dataset && e.target.dataset.f === 'rate') calc.items[Number(e.target.dataset.i)].touched = true;
});

refreshCalc();
