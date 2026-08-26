/* ---------- 신포괄 분류번호 — L항 51~56목 수가로 KDRG 를 도출한다 ----------

   파일은 이 브라우저 안에서만 읽는다(File.arrayBuffer). 어디로도 보내지 않는다.

   근거
     「KDRG 분류집 (신포괄지불제도용 Version 1.6)」 — data/kdrg-*.js (tools/kdrg.awk 가 만든다)
     SAM 신포괄 명세서 규격 — js/layout-ndrg.js (여기에 자리를 다시 적지 않는다)

   분류집이 말하는 순서(책 xi~xv쪽)를 그대로 따라간다.
     ① 주진단 → MDC            KDRG_MDCDX
     ② 그 MDC 안에서 질병군 정의식을 하나씩 따져 참인 것을 모은다   KDRG_DEF · KDRG_TBL
     ③ 여럿이면 외과 우선순위표에서 앞선 것이 이긴다               KDRG_PRIO
     ④ 연령 조건이 붙은 질병군은 이름에 적힌 연령으로 가른다        (예: 연령 ≤18세)
     ⑤ 4자리면 뒤에 0 을 붙여 AADRG 5자리 → 중증도 한 자리를 더해 6자리    KDRG_SEV

   ⑤ 의 **중증도 한 자리는 여기서 정하지 않는다.** 기타진단의 중증도 점수(부표1)는 있지만,
   주진단과 관련이 높은 기타진단의 점수를 0 으로 내리는 **CC edit 규정이 분류집에 없다**
   (책 1173쪽 — 「매우 복잡하기 때문에 전산적인 처리가 필요하며 본 책자에는 포함시키지 않았다」).
   그래서 CC edit 을 적용하기 **전** PCCL 을 함께 보여 주되 — 실제보다 높게 나올 수 있어 —
   6자리는 부표2의 후보만 늘어놓고 명세서에 적힌 번호와 **앞 5자리로 대조**한다.

   정의식은 참·거짓·**모름** 세 값으로 따진다. 파일에서 읽을 수 있는 조건은 다 읽는다 —
   재원기간(입원일수) · 퇴원경로(진료결과) · 연령(주민등록번호) ·
   **신생아체중(특정내역 MS004)** · **인공호흡시간(특정내역 MT026)**.
   그래도 못 읽는 조건(신생아 「주요 문제」 목록 등)은 모름이고, 모름이 섞이면 「확인 필요」로 내놓는다.
   추측해서 하나로 찍지 않는다.
   ------------------------------------------------------------------------ */

/* 「기타진단으로 일치」도 결국 맞은 것이라 「다른 것만 보기」에서는 빼고 본다(2026-08-26 요청).
   요약 줄에는 그대로 몇 건인지 적어 둔다 — 왜 그렇게 봤는지는 알아야 하니까. */
function kgSettled(r){ return r.cmp.k === 'ok' || r.cmp.k === 'alt'; }

/* onlyBad — 처음부터 「다른 것만 보기」로 연다. 맞은 것을 훑으려고 이 화면을 열지는 않는다. */
const KG = { list: [], recs: [], sel: 0, q: '', seq: '', onlyBad: true, ROWS: 10 };

/* ---------- 분류집 색인 ---------- */
/* 표 이름을 맞출 때 쓰는 다듬기 — 책이 「시술명 table2」와 「시술명 table 2」를 섞어 쓴다 */
function kgNorm(s){
  return String(s).replace(/([가-힣])([Tt]able\d)/g, '$1 $2')
                  .replace(/table\s*(\d+)/gi, 'table$1')
                  // 책이 표를 가리킬 때 「주진단table1」처럼 「명」을 빠뜨린 데가 있다(F079 · 책 273·286쪽)
                  .replace(/주진단(?!명)(?=\s*[Tt]able)/g, '주진단명')
                  .replace(/\s+/g, ' ').trim();
}

const KG_TBL = {};                          // 표묶음번호 → { 표이름: 표 }
KDRG_TBL.forEach(t => { (KG_TBL[t.ts] = KG_TBL[t.ts] || {})[kgNorm(t.name)] = t; });

const KG_ADRG = {};                         // ADRG 4자리 → 목록 줄
KDRG_ADRG.forEach(a => { KG_ADRG[a.c] = a; });

const KG_DEF_MDC = {};                      // MDC → 질병군 정의들
KDRG_DEF.forEach(d => { (KG_DEF_MDC[d.mdc] = KG_DEF_MDC[d.mdc] || []).push(d); });

/* 그룹 머리에 걸린 공통 조건 — 신생아 그룹(P60 · P65 · P66 · P67)은 그룹 줄에 체중 조건이 있고
   그 아래 질병군(P651…)의 정의식에는 체중이 다시 적혀 있지 않다. 그룹 줄은 ADRG 목록에 없다.
   그래서 「ADRG 목록에 없는 그룹+0 정의」를 그 그룹 전체의 앞조건으로 삼는다. */
const KG_GRPPRE = {};
KDRG_DEF.forEach(d => { if (d.def && d.c === d.grp + '0' && !KG_ADRG[d.c]) KG_GRPPRE[d.grp] = d; });

const KG_PRIO = {};                         // MDC → { ADRG: 순위 }
KDRG_PRIO.forEach(p => { (KG_PRIO[p.mdc] = KG_PRIO[p.mdc] || {})[p.a] = p.r; });

const KG_DX2MDC = {};                       // KCD 주진단 → MDC (여럿이면 배열)
Object.keys(KDRG_MDCDX).forEach(m => {
  KDRG_MDCDX[m].forEach(c => { (KG_DX2MDC[c] = KG_DX2MDC[c] || []).push(m); });
});

const KG_CODE = {};                         // 시술코드 → [{ts, name, row}]
KDRG_TBL.forEach(t => {
  if (!t.rows) return;
  t.rows.forEach(r => { (KG_CODE[r[1]] = KG_CODE[r[1]] || []).push({ts: t.ts, name: t.name, row: r}); });
});

const KG_SEVMAP = {};                       // AADRG 5자리 → 부표2 줄
KDRG_SEV.forEach(s => { KG_SEVMAP[s.a] = s; });

/* OR procedure — 분류집이 「분류에 이용되지만 OR procedure 는 아닌 시술」의 보험코드 뒤에 ‡ 를 붙였다
   (책 xviii쪽). ‡ 없이 시술명 표에 든 코드가 OR procedure 다. */
const KG_OR = new Set();
KDRG_TBL.forEach(t => {
  if (!t.rows || !/시술명/.test(t.name)) return;
  t.rows.forEach(r => { if (!/‡/.test(r[0])) KG_OR.add(r[1]); });
});

/* MDC 08 의 부위별 진단 표 — 정의식이 「Diagnosis Table6(견부 질환)」처럼 이름으로 부른다.
   책이 대·소문자와 칸 띄우기를 섞어 써서(Diagnosis Table6 · Diagnosis table6) 번호로만 찾는다. */
const KG_DXTBL = {};                        // MDC|번호 → Set(KCD)
KDRG_DXTBL.forEach(t => {
  const m = /table\s*(\d+)/i.exec(t.name);
  if (m) KG_DXTBL[t.mdc + '|' + m[1]] = {set: new Set(t.kcd), name: t.name};
});

/* KDRG 에 규정된 Error DRGs (책 xiv쪽) — 분류집 본문 밖에 있어 여기 적어 둔다 */
const KG_ERR = {
  '960': '조기 사망, 수술 미시행(신생아 제외)',
  '961': '주진단으로 적절하지 않은 산과 주진단',
  '962': '시술과 일치하지 않는 산과 주진단',
  '963': '연령/체중과 일치하지 않는 신생아 진단',
  '990': '주진단과 일치하지 않는 수술',
  '999': '분류 불가',
};

const KG_MOK = {'51': '주사 및 혈액제제', '52': '마취 및 호흡치료', '53': '수술처치',
                '54': '검사', '55': '방사선', '56': '부가코드'};

/* ---------- 정의식 따지기 (참 · 거짓 · 모름) ----------
   모름은 null 이다. and 는 하나라도 거짓이면 거짓, 아니면 모름이 섞인 만큼 모름.
   or 는 하나라도 참이면 참, 아니면 모름이 섞인 만큼 모름. */
function kgAnd(a, b){ if (a === false || b === false) return false; if (a === null || b === null) return null; return true; }
function kgOr(a, b){ if (a === true || b === true) return true; if (a === null || b === null) return null; return false; }
function kgNot(a){ return a === null ? null : !a; }

/* 숫자 조건 하나 — 값이 없으면 모름(null). 책이 반각·전각 부등호를 섞어 쓴다. */
function kgCmp(v, op, n){
  if (v === null || v === undefined || isNaN(v)) return null;
  switch (op){
    case '<': return v < n;
    case '>': case '＞': return v > n;
    case '≤': return v <= n;
    case '≥': return v >= n;
    default:  return v === n;
  }
}

/* 낱말로 쪼갠다.
   · 표 이름에 붙은 괄호(Diagnosis Table6(견부 질환))는 묶음 괄호가 아니라 이름의 일부다 —
     번호로 찾으니 괄호 안을 떼어 낸다. 그러지 않으면 이름이 낱말 여러 개로 찢어진다.
   · 책이 묶음에 [ ] 도 섞어 쓴다 — ( ) 와 같이 본다. */
function kgLex(s){
  return String(s)
    .replace(/([Tt]able\s*\d+)\s*\([^)]*\)/g, '$1')
    .replace(/[[\]]/g, m => (m === '[' ? '(' : ')'))
    .replace(/[()]/g, m => ' ' + m + ' ')
    .split(/\s+/).filter(Boolean);
}
const KG_OPS = new Set(['and', 'or', 'not', 'without']);

/* 재귀 하강 — expr := term ((and|or|without) term)* , term := not term | ( expr ) | 낱말들 */
function kgParse(tokens, ctx){
  let i = 0;
  function term(){
    if (tokens[i] === 'not'){ i++; return kgNot(term()); }
    if (tokens[i] === '('){ i++; const v = expr(); if (tokens[i] === ')') i++; return v; }
    const words = [];
    while (i < tokens.length && tokens[i] !== ')' && !KG_OPS.has(tokens[i])) words.push(tokens[i++]);
    return kgTerm(words.join(' '), ctx);
  }
  function expr(){
    let v = term();
    while (i < tokens.length && KG_OPS.has(tokens[i])){
      const op = tokens[i++];
      if (op === 'not') { v = kgAnd(v, kgNot(term())); continue; }
      const r = term();
      v = op === 'or' ? kgOr(v, r) : op === 'without' ? kgAnd(v, kgNot(r)) : kgAnd(v, r);
    }
    return v;
  }
  return expr();
}

/* 본문 코드(3~5자리) → AADRG 5자리. 4자리면 뒤에 0 을 붙인다.
   **부표2(KDRG_SEV)에 있는 번호만 진짜 질병군이다.** 본문에는 갈림길의 머리줄도 코드로 적혀 있어서
   (E804 성인의 세균 폐렴 → 그 아래 E8041 18세<연령<65세 · E8042 연령 ≥65세),
   그대로 두면 있지도 않은 E8040 이 답으로 나온다. 그래서 후보를 모을 때 부표2로 걸러 낸다. */
function kgAadrg(c){ return c.length >= 5 ? c.slice(0, 5) : (c.length === 4 ? c + '0' : c + '00'); }

/* a 가 b 에 조건을 **더 붙인** 정의인가 — 같은 그룹 안에서 어느 쪽이 좁은지 가린다.
   책은 갈림길의 「아닌 쪽」을 조건 없이 적는다.
     H032 = 시술명 table1 **and 부가코드**   (복강경)
     H034 = 시술명 table1                    (기타 — 복강경이 아니라는 말은 안 적혀 있다)
   그래서 H032 가 H034 를 덮는다. 「(A) and B」처럼 앞을 묶어 적은 것도 같이 본다(P651). */
function kgExtends(a, b){
  const A = kgNorm(a || ''), B = kgNorm(b || '');
  if (!A || !B || A === B) return false;
  const q = B.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('^\\(?' + q + '\\)?\\s+(and|without)\\s').test(A);
}

/* 책에 적힌 차례 — 조건이 서로 겹치기만 하고 어느 쪽도 상대를 덮지 않으면(나란한 갈래) 앞에 적힌 것이 이긴다.
   E63(호흡기 신생물)이 그 예다. E631 방사선치료 · E632 전신화학요법 · E633 둘 다 아님 순으로 적혀 있고,
   둘 다 받은 환자는 앞의 E631 로 간다. */
const KG_ORD = {};
KDRG_DEF.forEach((d, i) => { if (KG_ORD[d.c] === undefined) KG_ORD[d.c] = i; });

/* 낱말 하나(항목)를 따진다. 분류집의 표를 가리키면 환자 값과 맞춰 보고, 아니면 모름. */
function kgTerm(word, ctx){
  const w = kgNorm(word);
  if (!w) return null;
  // any OR procedure — ‡ 없는 시술코드가 하나라도 있으면 참
  if (/^any(\s+other)?\s+OR\s+procedures?$/i.test(w)) return Array.from(ctx.codes).some(c => KG_OR.has(c));
  // 시술명 table1을 제외한 OR procedure — 그 표에 없는 OR procedure 가 있으면 참
  const exc = /^(.+?)(?:을|를) 제외한 OR procedures?$/i.exec(w);
  if (exc){
    const t = (KG_TBL[ctx.ts] || {})[kgNorm(exc[1])];
    if (t && t.rows){
      const inTbl = new Set(t.rows.map(r => r[1]));
      return Array.from(ctx.codes).some(c => KG_OR.has(c) && !inTbl.has(c));
    }
  }
  // 재원기간 · 퇴원경로 — 명세서에서 읽을 수 있다
  const los = /^재원(기간|일수)\s*(<|>|≤|≥|=)\s*(\d+)\s*일?$/.exec(w);
  if (los) return kgCmp(ctx.los, los[2], +los[3]);
  if (/^퇴원(경로|유형)\s*=\s*사망 혹은 전원$/.test(w)){
    if (!ctx.result) return null;
    return ctx.result === '4' || ctx.result === '2' || ctx.result === '3';   // 사망 · 이송 · 회송
  }
  if (/^퇴원유형\s*=\s*다른 의료기관으로 이송$/.test(w)){
    if (!ctx.result) return null;
    return ctx.result === '2';
  }
  // 정의식에 직접 적힌 연령 조건 (질병군 이름에 적힌 것과 같은 방식으로 따진다)
  if (/^연령/.test(w)){ const c = kgAgeCond(w); if (c) return kgAgeOk(c, ctx.age); }
  // 인공호흡 시간 — 특정내역 MT026(인공호흡시간, 시간 단위)
  const vent = /^인공호흡\s*(＞|>|≥|≤|<)\s*(\d+)\s*hours?$/i.exec(w);
  if (vent) return kgCmp(ctx.vent, vent[1], +vent[2]);
  // 입원시 체중 — 특정내역 MS004(신생아체중, 그램 단위)
  const wr = /^입원시\s*체중\s*(\d+)\s*[-~]\s*(\d+)\s*g$/.exec(w);
  if (wr) return ctx.wt === null || ctx.wt === undefined ? null : (ctx.wt >= +wr[1] && ctx.wt <= +wr[2]);
  const wc = /^입원시\s*체중\s*(＞|>|≥|≤|<)\s*(\d+)\s*g$/.exec(w);
  if (wc) return kgCmp(ctx.wt, wc[1], +wc[2]);
  // age > 27 days · age < 366 days · age > 0 year — 생년월일과 입원개시일로 낸 일수
  const ad = /^age\s*(?:\(=date of admission - date of birth\))?\s*(＞|>|≥|≤|<)\s*(\d+)\s*(day|year)s?$/i.exec(w);
  if (ad) return kgCmp(ctx.ageDays, ad[1], +ad[2] * (/year/i.test(ad[3]) ? 365 : 1));
  // At least 2 procedures in 시술명 table1 — 그 표에 든 코드가 몇 개인지 센다
  const cnt = /^At least (\d+) procedures? in (.+)$/i.exec(w);
  if (cnt){
    const t = (KG_TBL[ctx.ts] || {})[kgNorm(cnt[2])];
    if (t && t.rows) return t.rows.filter(r => ctx.codes.has(r[1])).length >= +cnt[1];
  }
  // 신생아의 주요 문제 — 책 829쪽. 주요 문제 = 「Diagnosis in table 1」,
  // 다발성 주요 문제 = 「at least 2 diagnoses in table 1」 (MDC 15 의 표 하나를 함께 쓴다)
  if (/^(다발성 )?주요 문제$/.test(w)){
    const g = KG_DXTBL[ctx.mdc + '|1'];
    if (g){
      const n = ctx.dx.filter(d => g.set.has(d)).length;
      return /^다발성/.test(w) ? n >= 2 : n >= 1;
    }
  }
  // MDC 08 의 부위별 진단 표 — 주진단이나 기타진단이 그 부위에 들면 참
  const dt = /^Diagnosis\s*table\s*(\d+)/i.exec(w);
  if (dt){
    const g = KG_DXTBL[ctx.mdc + '|' + dt[1]];
    if (g) return ctx.dx.some(d => g.set.has(d));
  }
  const tabs = KG_TBL[ctx.ts] || {};
  const t = tabs[w];
  if (t){
    if (t.rows) return t.rows.some(r => ctx.codes.has(r[1]));
    if (t.kcd){
      const set = new Set(t.kcd);
      if (/기타진단/.test(w)) return ctx.dx.some(d => set.has(d));         // 주진단 또는 기타진단
      return set.has(ctx.mainDx);
    }
  }
  ctx.unknown.push(w);
  return null;
}

/* ---------- 연령 조건 ----------
   질병군 이름에 적힌 「연령 ≤18세」 「연령 ＜65세」 「연령 0-18세」 로 가른다. */
const KG_AGE_RE = /연령\s*(≤|≥|＜|＞|<|>)?\s*(\d+)\s*(?:[-~]\s*(\d+)\s*)?세/;
/* 「18세< 연령 <65세」처럼 양쪽에서 조이는 것도 있다 (E8041 성인의 세균 폐렴) */
const KG_AGE_BETWEEN = /(\d+)\s*세\s*(≤|<|＜)\s*연령\s*(≤|<|＜)\s*(\d+)\s*세/;
function kgAgeCond(name){
  const bt = KG_AGE_BETWEEN.exec(name || '');
  if (bt) return {lo: +bt[1] + (bt[2] === '≤' ? 0 : 1), hi: +bt[4] - (bt[3] === '≤' ? 0 : 1)};
  const m = KG_AGE_RE.exec(name || '');
  if (!m) return null;
  if (m[3] !== undefined) return {lo: +m[2], hi: +m[3]};
  return {op: m[1] || '=', n: +m[2]};
}
function kgAgeOk(cond, age){
  if (!cond) return true;
  if (age === null || age === undefined) return null;
  if (cond.lo !== undefined) return age >= cond.lo && age <= cond.hi;
  switch (cond.op){
    case '≤': return age <= cond.n;
    case '≥': return age >= cond.n;
    case '＜': case '<': return age < cond.n;
    case '＞': case '>': return age > cond.n;
    default:  return age === cond.n;
  }
}

/* ---------- MDC 고르기 ----------
   주진단 하나가 여러 MDC 목록에 드는 것이 14,101 중 2,007 건인데, 그 겹침은 거의 전부
   **18-1(HIV)과 21-1(다발성 외상)** 이다. 둘은 주진단이 곧장 가는 곳이 아니라 조건이 맞을 때만
   얹히는 목록이라 따로 가른다. 이 둘을 빼면 겹치는 것은 45건뿐이고 모두 12(남성)·13(여성)이라
   성별로 갈린다. */
function kgPickMdc(pt, out){
  let ms = (KG_DX2MDC[pt.mainDx] || []).slice();
  const base = ms.filter(m => m !== '18-1' && m !== '21-1');

  // 18-1(HIV) — HIV 주진단(table1) 이거나, HIV 관련 주진단(table2) + HIV 기타진단(table3)
  if (ms.includes('18-1')){
    const t1 = new Set(KDRG_HIV.t1), t2 = new Set(KDRG_HIV.t2), t3 = new Set(KDRG_HIV.t3);
    const ok = t1.has(pt.mainDx) || (t2.has(pt.mainDx) && pt.dx.some(d => t3.has(d)));
    if (!ok) ms = ms.filter(m => m !== '18-1');
  }
  // 21-1(다발성 외상) — 결정에서는 뺀다. 다발성 외상은 「서로 다른 신체부위」의 중요 외상이 둘 이상일 때인데
  // 그 부위 구분표가 분류집에 없어 여기서 확정할 수 없다. 진단이 둘 이상 걸리면 알려만 준다.
  if (ms.includes('21-1')){
    const t = new Set(KDRG_MDCDX['21-1']);
    const n = pt.dx.filter(d => t.has(d)).length;
    ms = ms.filter(m => m !== '21-1');
    if (n >= 2) out.note21 = '중요 외상 진단이 ' + n + '건입니다 — 서로 다른 신체부위면 MDC 21-1(다발성 외상)이 됩니다. ' +
                             '부위 구분표가 분류집에 없어 여기서는 21-1 로 보지 않았습니다.';
  }
  // 12(남성)·13(여성) — 성별로 가른다
  if (ms.includes('12') && ms.includes('13') && pt.sex)
    ms = ms.filter(m => m === (pt.sex === 'M' ? '12' : '13') || (m !== '12' && m !== '13'));

  if (!ms.length) ms = base;
  return ms;
}

/* ---------- 분류 ----------
   pt = { mainDx, dx[], codes:Set, age, sex }
   돌려주는 것 { mdc, hit[], maybe[], pick, aadrg, sev, note } */
function kgGroup(pt){
  const out = {mdc: '', mdcs: [], hit: [], maybe: [], pick: null, aadrg: '', sev: null, note: '', note21: ''};
  if (!KG_DX2MDC[pt.mainDx]){ out.note = '주진단 ' + (pt.mainDx || '(없음)') + ' 이 분류집의 MDC 주진단 목록에 없습니다 — 999(분류 불가)'; return out; }
  const mdcs = kgPickMdc(pt, out);
  out.mdcs = mdcs;
  out.mdc = mdcs[0];

  for (const mdc of mdcs){
    for (const d of (KG_DEF_MDC[mdc] || [])){
      const pre = KG_GRPPRE[d.grp];
      if (pre && pre.c === d.c) continue;      // 그룹 앞조건 줄 자체는 질병군이 아니다
      if (!KG_SEVMAP[kgAadrg(d.c)]) continue;  // 부표2에 없는 번호는 청구할 수 있는 질병군이 아니다
      const ctx = {ts: d.ts, mdc: mdc, codes: pt.codes, dx: pt.dx, mainDx: pt.mainDx,
                   los: pt.los, result: pt.result, age: pt.age,
                   ageDays: pt.ageDays, wt: pt.wt, vent: pt.vent, unknown: []};
      let v = d.def ? kgParse(kgLex(d.def), ctx) : null;
      if (pre){                                 // 그룹 머리의 공통 조건을 함께 따진다
        const pctx = Object.assign({}, ctx, {ts: pre.ts, unknown: ctx.unknown});
        v = kgAnd(kgParse(kgLex(pre.def), pctx), v);
      }
      const ac = kgAgeCond(d.n);
      if (ac){ const a = kgAgeOk(ac, pt.age); v = a === null ? (v === false ? false : null) : (a ? v : false); }
      if (v === false) continue;
      const item = {d: d, unknown: ctx.unknown.slice(), age: ac};
      if (v === true) out.hit.push(item); else out.maybe.push(item);
    }
  }

  // 외과계(Partition S)가 내과계보다 앞선다 — 시술을 했으면 외과 질병군으로 간다(책 xii쪽).
  // 그 안에서는 MDC별 외과 우선순위표 순서를 따른다.
  const rank = it => {
    const a4 = it.d.c.slice(0, 4);
    const part = (KG_ADRG[a4] || {}).p;
    const r = (KG_PRIO[it.d.mdc] || {})[a4];
    return (part === 'S' ? 0 : part === 'O' ? 10000 : 20000) + (r === undefined ? 9999 : r);
  };
  /* 같은 표묶음(같은 그룹) 안의 갈래는 **좁은 정의가 이긴다** — 우선순위표로 가르지 않는다.
     책은 갈림길의 「아닌 쪽」을 조건 없이 적는다. 예를 들어 H03(담낭절제술) 은
       H032 복강경을 이용한 전담낭절제술 = 시술명 table1 **and 부가코드**(ADC03 복강경)
       H034 기타 전담낭절제술            = 시술명 table1
     이라 복강경을 했으면 둘 다 참이 되는데, 우선순위는 H034(16)가 H032(17)보다 앞이라
     순위로 고르면 거꾸로 간다. 부가코드가 붙은 좁은 쪽이 답이다.
     우선순위표는 **서로 다른 그룹의 시술**끼리 겨룰 때 쓰는 것이다. */
  /* 더 세분된 코드가 이긴다 — E80(성인의 세균 폐렴)은 머리줄 E804 아래에
     E8041(18세< 연령 <65세) · E8042(연령 ≥65세) 가 있고 정의식은 셋 다 「주진단명」이다.
     갈림은 정의식이 아니라 **이름의 연령**에 있어서, 조건 개수만 세면 가려지지 않는다.
     그래서 앞자리가 같으면서 더 긴 코드(E8042)가 참이면 머리줄(E804)은 물린다. */
  const narrower = (o, it) =>
    o !== it && o.d.ts === it.d.ts && o.d.grp === it.d.grp &&
    (kgExtends(o.d.def, it.d.def) ||
     (o.d.c.length > it.d.c.length && o.d.c.indexOf(it.d.c) === 0));
  const prune = list => list.filter(it => !list.some(o => narrower(o, it)));
  out.hit = prune(out.hit);
  out.maybe = prune(out.maybe.filter(it => !out.hit.some(o => narrower(o, it))));

  // 순위가 같으면(내과계처럼 우선순위표에 없는 것들) 책에 적힌 차례를 따른다
  const cmp = (a, b) => (rank(a) - rank(b)) || ((KG_ORD[a.d.c] || 0) - (KG_ORD[b.d.c] || 0));
  out.hit.sort(cmp);
  out.maybe.sort(cmp);

  if (out.hit.length){
    out.pick = out.hit[0];
  } else if (!out.maybe.length){
    // 시술코드가 분류집에 있는데 이 MDC 의 어느 질병군에도 안 걸리면 990 이다
    const anyOr = Array.from(pt.codes).some(c => KG_CODE[c]);
    out.note = anyOr ? '이 MDC 에서 시술과 맞는 질병군이 없습니다 — 990(주진단과 일치하지 않는 수술)'
                     : '걸리는 질병군이 없습니다';
    return out;
  }

  const src = out.pick || out.maybe[0];
  out.aadrg = kgAadrg(src.d.c);
  out.sev = KG_SEVMAP[out.aadrg] || null;
  return out;
}

/* ---------- 중증도 (참고값) ----------
   부표1 로 기타진단마다 CCL 을 읽고 책 1173쪽 식으로 PCCL 을 낸다.
   CC edit 은 분류집에 없어 적용하지 못한다 — 실제보다 높게 나올 수 있다. */
function kgPccl(others, surgical, adrg){
  const rows = [];
  for (const d of others){
    const v = KDRG_CCL[d];
    rows.push({dx: d, ccl: v ? (surgical ? v[0] : v[1]) : 0, known: !!v});
  }
  const vals = rows.map(r => r.ccl).filter(v => v > 0).sort((a, b) => b - a);
  const k = /^P(0[1-9]|[1-5][0-9]|6[0-7])/.test(adrg || '') ? 1 : 2;
  if (!vals.length) return {rows, pccl: 0, x: 0};
  const alpha = 0.4;
  let sum = 0;
  for (let i = k; i <= vals.length; i++) sum += vals[i - 1] * Math.exp(-alpha * (i - k));
  const x = Math.round(Math.log(1 + sum) / (Math.log(3 / alpha) / 4));
  return {rows, pccl: Math.min(4, x), x};
}

/* ---------- SAM 파일 읽기 ---------- */
const KG_DEC = new TextDecoder('euc-kr');
function kgText(b){ return KG_DEC.decode(b).trim(); }
function kgSplitLines(bytes){
  const lines = [];
  let start = 0;
  for (let i = 0; i < bytes.length; i++){
    if (bytes[i] !== 0x0A) continue;
    let end = i;
    if (end > start && bytes[end - 1] === 0x0D) end--;
    lines.push(bytes.subarray(start, end));
    start = i + 1;
  }
  if (start < bytes.length) lines.push(bytes.subarray(start, bytes.length));
  return lines;
}
/* 자리는 레이아웃(js/layout-ndrg.js)에서 뽑는다 — 여기에 숫자를 적어 두지 않는다 */
function kgPos(rec, name){
  const f = LAYOUTS_NDRG[rec].fields.find(x => x.name === name);
  return f ? {pos: f.pos, len: f.len} : null;
}
function kgCut(bytes, p){
  if (!p || p.pos - 1 >= bytes.length) return '';
  return kgText(bytes.subarray(p.pos - 1, Math.min(p.pos - 1 + p.len, bytes.length)));
}

const KG_F = {
  A: {seq: kgPos('A', '명세서일련번호'), kind: kgPos('A', '내역구분'), form: kgPos('A', '서식번호'),
      drg: kgPos('A', '질병군번호'), name: kgPos('A', '수진자성명'), jumin: kgPos('A', '수진자주민등록번호'),
      los: kgPos('A', '입원일수'), start: kgPos('A', '최초입원개시일'), res: kgPos('A', '진료결과'),
      cn: kgPos('A', '청구번호')},
  B: {seq: kgPos('B', '명세서일련번호'), kind: kgPos('B', '내역구분'), gubun: kgPos('B', '상병분류구분'),
      code: kgPos('B', '상병분류기호'), open: kgPos('B', '당월요양개시일'), cn: kgPos('B', '청구번호')},
  C: {seq: kgPos('C', '명세서일련번호'), kind: kgPos('C', '내역구분'), hang: kgPos('C', '항'),
      mok: kgPos('C', '목'), code: kgPos('C', '코드'), cn: kgPos('C', '청구번호')},
  E: {seq: kgPos('E', '명세서일련번호'), kind: kgPos('E', '내역구분'), unit: kgPos('E', '발생단위'),
      div: kgPos('E', '특정내역구분'), val: kgPos('E', '특정내역'), cn: kgPos('E', '청구번호')},
};

/* 분류에 쓰는 명세서단위 특정내역 (세부작성요령 Ⅸ) — 분류집 정의식의 체중·인공호흡 조건이 여기서 온다 */
const KG_SP = {
  'MS004': {name: '신생아체중', unit: 'g',     desc: '출생(또는 신생아 입원) 당시 체중을 그램 단위로 기재'},
  'MT026': {name: '인공호흡시간', unit: 'hours', desc: '동일 입원기간 중 총 인공호흡 시간을 시간 단위로 기재'},
};

/* 주민등록번호 뒷자리 첫 글자 → 성별 (홀수 남 · 짝수 여) */
function kgSex(jumin){
  const j = String(jumin || '').replace(/\D/g, '');
  if (j.length < 7) return '';
  const s = +j[6];
  if (!s) return 'F';
  return s % 2 ? 'M' : 'F';
}

/* 특정내역 값은 앞자리를 0 으로 채워 적는다(MT026 은 9(5) 라 00009) — 숫자로 읽는다 */
function kgNum(v){
  if (v === undefined || v === null || String(v).trim() === '') return null;
  const n = Number(String(v).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

/* 주민등록번호 · 입원개시일 → 생후 일수 (age > 27 days 같은 신생아 조건에 쓴다) */
function kgAgeDays(jumin, ymd8){
  const j = String(jumin || '').replace(/\D/g, '');
  if (j.length < 7 || !/^\d{8}$/.test(ymd8 || '')) return null;
  const s = +j[6];
  const cen = (s === 1 || s === 2 || s === 5 || s === 6) ? 1900 : (s === 9 || s === 0) ? 1800 : 2000;
  const b = Date.UTC(cen + (+j.slice(0, 2)), (+j.slice(2, 4)) - 1, +j.slice(4, 6));
  const a = Date.UTC(+ymd8.slice(0, 4), (+ymd8.slice(4, 6)) - 1, +ymd8.slice(6, 8));
  if (isNaN(b) || isNaN(a)) return null;
  return Math.floor((a - b) / 86400000);
}

/* 주민등록번호 → 만 나이 (기준일이 없으면 오늘) */
function kgAge(jumin, ymd8){
  const j = String(jumin || '').replace(/\D/g, '');
  if (j.length < 7) return null;
  const s = +j[6];
  const cen = (s === 1 || s === 2 || s === 5 || s === 6) ? 1900 : (s === 9 || s === 0) ? 1800 : 2000;
  const y = cen + (+j.slice(0, 2)), m = +j.slice(2, 4), d = +j.slice(4, 6);
  if (!m || !d) return null;
  let by = y, bm = m, bd = d;
  let ry, rm, rd;
  if (/^\d{8}$/.test(ymd8 || '')){ ry = +ymd8.slice(0, 4); rm = +ymd8.slice(4, 6); rd = +ymd8.slice(6, 8); }
  else { const t = new Date(); ry = t.getFullYear(); rm = t.getMonth() + 1; rd = t.getDate(); }
  let age = ry - by;
  if (rm < bm || (rm === bm && rd < bd)) age--;
  return age;
}

function kgReadFiles(list){
  const map = new Map();                       // 청구번호+명일련 → 명세서
  for (const f of list){
    for (const b of kgSplitLines(f.bytes)){
      if (!b.length) continue;
      const kind = kgCut(b, KG_F.A.kind);
      if (kind !== 'A' && kind !== 'B' && kind !== 'C' && kind !== 'E') continue;
      const key = kgCut(b, KG_F[kind].cn) + '|' + kgCut(b, KG_F[kind].seq);
      let r = map.get(key);
      if (!r){ r = {key: key, file: f.name, seq: kgCut(b, KG_F[kind].seq), dx: [], mainDx: '', codes: [], sp: {}, form: ''}; map.set(key, r); }
      if (kind === 'A'){
        r.form = kgCut(b, KG_F.A.form);
        r.drg = kgCut(b, KG_F.A.drg);
        r.name = kgCut(b, KG_F.A.name);
        r.jumin = kgCut(b, KG_F.A.jumin);
        r.los = kgCut(b, KG_F.A.los).replace(/^0+/, '');
        r.start = kgCut(b, KG_F.A.start);
        r.res = kgCut(b, KG_F.A.res);
      } else if (kind === 'B'){
        const c = kgCut(b, KG_F.B.code);
        if (!c) continue;
        if (kgCut(b, KG_F.B.gubun) === '1') r.mainDx = c; else r.dx.push(c);
        if (!r.start) r.start = kgCut(b, KG_F.B.open);
      } else if (kind === 'C'){
        const hang = kgCut(b, KG_F.C.hang), mok = kgCut(b, KG_F.C.mok);
        if (hang !== 'L') continue;
        if (!(mok >= '51' && mok <= '56')) continue;
        r.codes.push({mok: mok, code: kgCut(b, KG_F.C.code)});
      } else {
        // 특정내역 — 분류에 쓰는 것(신생아체중 · 인공호흡시간)만 담는다. 명세서단위(발생단위 '1')다.
        const div = kgCut(b, KG_F.E.div);
        if (!KG_SP[div]) continue;
        const v = kgCut(b, KG_F.E.val);
        if (r.sp[div] === undefined) r.sp[div] = v;
      }
    }
  }
  const recs = Array.from(map.values()).filter(r => r.form === 'P020' || r.form === 'P030');
  recs.forEach(r => {
    r.age = kgAge(r.jumin, r.start);
    r.sex = kgSex(r.jumin);
    r.ageDays = kgAgeDays(r.jumin, r.start);
    r.wt = kgNum(r.sp['MS004']);
    r.vent = kgNum(r.sp['MT026']);
    // MT026 은 「인공호흡을 실시한 경우」에만 적는다(세부작성요령) — 없으면 안 한 것으로 보고 0시간.
    // MS004 는 신생아·분만 명세서면 반드시 적게 되어 있어, 없으면 0 이 아니라 **모름**으로 둔다.
    r.ventUsed = r.vent === null ? 0 : r.vent;
    const set = new Set(r.codes.map(c => c.code));
    r.res2 = kgGroup({mainDx: r.mainDx, dx: [r.mainDx].concat(r.dx), codes: set, age: r.age, sex: r.sex,
                      los: r.los === '' ? null : +r.los, result: r.res,
                      ageDays: r.ageDays, wt: r.wt, vent: r.ventUsed});
    const part = r.res2.pick || r.res2.maybe[0];
    const p4 = part ? part.d.c.slice(0, 4) : '';
    const surgical = !!(KG_ADRG[p4] && KG_ADRG[p4].p === 'S');
    r.sevInfo = kgPccl(r.dx, surgical, p4);
    r.cmp = kgCompare(r);
  });
  recs.sort((a, b) => a.seq.localeCompare(b.seq));
  return recs;
}

/* 파일에 적힌 질병군번호와 견준다 — 앞 5자리(AADRG)까지 본다.
   어긋나면 **기타진단을 주진단 자리에 놓고** 다시 돌려 본다. 이원분류(dagger†/asterisk*)처럼
   주진단이 아니라 별표 진단으로 분류되는 경우가 있어서, 어느 진단으로 보면 파일과 같아지는지
   알려 주는 편이 「다름」 한마디보다 낫다. 분류집에 이원분류 대응표가 없어 규칙으로 삼지는 않는다. */
function kgCompare(r){
  const got = r.res2.aadrg;
  const want = (r.drg || '').slice(0, 5);
  if (!want) return {k: 'none', t: '파일에 번호 없음'};
  if (!got) return {k: 'none', t: '못 정함'};
  if (got === want) return {k: 'ok', t: '일치'};
  for (const d of r.dx){
    const g = kgGroup({mainDx: d, dx: [d].concat([r.mainDx]).concat(r.dx.filter(x => x !== d)),
                       codes: new Set(r.codes.map(c => c.code)), age: r.age, sex: r.sex,
                       los: r.los === '' ? null : +r.los, result: r.res,
                       ageDays: r.ageDays, wt: r.wt, vent: r.ventUsed});
    if (g.aadrg === want) return {k: 'alt', t: '기타진단으로 일치', by: d, g: g};
  }
  if (r.res2.hit.length === 0) return {k: 'warn', t: '확인 필요'};
  return {k: 'bad', t: '다름'};
}

/* 어긋난 까닭으로 짚이는 것 — 판이 다르거나, 분류내역이 빠졌거나 */
function kgHints(r){
  const out = [];
  const want4 = (r.drg || '').slice(0, 4);
  if (!want4) return out;
  if (!KG_ADRG[want4] && !KG_ERR[want4.slice(0, 3)])
    out.push('파일의 <b class="kg-code">' + esc(want4) + '</b> 는 이 판(Version 1.6)의 ADRG 목록에 없습니다 — ' +
             '다른 판(1.4 · 1.5 등)으로 분류된 명세서일 수 있습니다.');
  else {
    const codes = new Set(r.codes.map(c => c.code));
    const ds = KDRG_DEF.filter(d => d.c === want4 || d.c.slice(0, 4) === want4);
    const miss = [], unk = [];
    for (const d of ds){
      if (!d.def) continue;
      const def = kgNorm(d.def), t = KG_TBL[d.ts] || {};
      // 이 정의가 가리키는 시술 표 가운데 환자 코드가 하나도 없는 것
      for (const k of Object.keys(t)){
        if (!/시술명/.test(k) || !t[k].rows || def.indexOf(kgNorm(k)) < 0) continue;
        if (!t[k].rows.some(x => codes.has(x[1])) && !miss.some(m => m.k === k))
          miss.push({k: k, eg: t[k].rows[0]});
      }
      // 파일에서 따져 볼 수 없는 조건
      const ctx = {ts: d.ts, mdc: d.mdc, codes: codes, dx: [r.mainDx].concat(r.dx), mainDx: r.mainDx,
                   los: r.los === '' ? null : +r.los, result: r.res, age: r.age,
                   ageDays: r.ageDays, wt: r.wt, vent: r.ventUsed, unknown: []};
      kgParse(kgLex(d.def), ctx);
      ctx.unknown.forEach(u => { if (unk.indexOf(u) < 0) unk.push(u); });
    }
    if (miss.length)
      out.push('파일의 <b class="kg-code">' + esc(want4) + '</b>(' + esc((KG_ADRG[want4] || {}).n || '') + ')은 ' +
               miss.map(m => '「' + esc(m.k) + '」(' + esc(m.eg[2]) + ' 등)').join(' · ') +
               ' 가 있어야 하는데 L항 51~56목에 그 표의 코드가 <b>없습니다</b> — 질병군 분류내역이 빠졌는지 확인해 보세요.');
    if (unk.length)
      out.push('파일의 <b class="kg-code">' + esc(want4) + '</b> 는 ' + unk.map(u => '「' + esc(u) + '」').join(' · ') +
               ' 조건을 걸고 있는데 <b>여기서는 따져 볼 수 없습니다</b> — 다른 질병군을 가리키는 조건이라 분류집만으로는 풀리지 않습니다.');
  }
  return out;
}

/* ---------- 화면 ---------- */
function kgRender(){
  $('kg-drop').classList.toggle('slim', !!KG.list.length);
  $('kg-clear').style.display = KG.list.length ? '' : 'none';
  const n = KG.recs.length;
  const ok = KG.recs.filter(r => r.cmp.k === 'ok').length;
  const alt = KG.recs.filter(r => r.cmp.k === 'alt').length;
  const bad = n - ok - alt;
  $('kg-sum').innerHTML = !KG.list.length ? '' :
    '<span>파일 <b>' + KG.list.length + '</b></span>' +
    '<span>신포괄 명세서 <b>' + n + '</b></span>' +
    '<span>일치 <b>' + ok + '</b></span>' +
    (alt ? '<span>기타진단으로 일치 <b>' + alt + '</b></span>' : '') +
    (bad ? '<span class="kg-bad">다름 · 확인 필요 <b>' + bad + '</b></span>' : '') +
    '<span class="meta-note">KDRG 분류집 Version 1.6 · 앞 5자리(AADRG)로 대조</span>';
  kgRenderList();
  kgRenderDetail();
  kgRenderFind();
  setStickTop();
}

/* 명일련번호로 찾기 — 파일에는 00123 처럼 앞을 0 으로 채워 적혀 있어서 「123」으로 쳐도 걸리게 한다.
   수진자 이름 · 파일의 질병군번호 · 주진단으로도 걸린다. 찾는 말이 있으면 「다른 것만 보기」는 잠시 접는다 —
   번호를 짚어 찾는데 맞은 명세서라고 안 보이면 못 찾는 것과 같다. */
function kgSeqHit(r, q){
  if (!q) return true;
  const seq = String(r.seq || '').replace(/^0+/, '');
  // 숫자만 쳤으면 명일련번호로만 본다 — 질병군번호·주진단에 든 숫자까지 걸리면 너무 넓어진다
  if (/^[0-9]+$/.test(q)) return seq.indexOf(q.replace(/^0+/, '')) === 0;
  return sgHit((r.seq || '') + ' ' + (r.name || '') + ' ' + (r.drg || '') + ' ' + (r.mainDx || ''), q);
}

function kgRenderList(){
  if (!KG.recs.length){ $('kg-list').innerHTML = ''; return; }
  const q = KG.seq.trim();
  const rows = KG.recs.filter(r => (q ? kgSeqHit(r, q) : (!KG.onlyBad || !kgSettled(r))));
  let h = '<div class="card"><div class="meta-bar" id="kg-listmeta">' +
    '<span>명세서 <b>' + rows.length + '</b>' + (rows.length !== KG.recs.length ? ' / ' + KG.recs.length : '') + '</span>' +
    (q ? '<span class="meta-note">「' + esc(q) + '」 찾는 중 — 「다른 것만 보기」는 잠시 접었습니다</span>' : '') +
    '<span class="meta-note">' + (rows.length > KG.ROWS ? KG.ROWS + '줄씩 보이고 나머지는 표 안에서 스크롤합니다 · ' : '') +
    '줄을 누르면 아래에 분류 과정이 펼쳐집니다</span></div>';
  if (!rows.length){
    h += '<div class="empty">' +
      (q ? '「' + esc(q) + '」 에 걸리는 명세서가 없습니다.'
         : KG.onlyBad ? '모두 맞습니다 — 전체를 보려면 「다른 것만 보기」를 꺼 주세요.'
         : '명세서가 없습니다.') + '</div></div>';
    $('kg-list').innerHTML = h;
    return;
  }
  h += '<div class="kg-listbox"><table class="fields kg-tb"><thead><tr>' +
    '<th style="width:78px;">명일련</th><th style="width:88px;">수진자</th><th style="width:64px;">주진단</th>' +
    '<th style="width:52px;">나이</th><th style="width:64px;">입원일수</th>' +
    '<th style="width:86px;">파일 번호</th><th style="width:86px;">도출 5자리</th>' +
    '<th style="width:70px;">대조</th><th>질병군</th></tr></thead><tbody>';
  for (const r of rows){
    const i = KG.recs.indexOf(r);
    const src = r.res2.pick || r.res2.maybe[0];
    h += '<tr class="kg-row' + (i === KG.sel ? ' on' : '') + '" data-i="' + i + '">' +
      '<td>' + (q ? hilite(r.seq, q) : esc(r.seq)) + '</td>' +
      '<td>' + (q ? hilite(r.name || '', q) : esc(r.name || '')) + '</td>' +
      '<td class="kg-code">' + esc(r.mainDx) + '</td>' +
      '<td>' + (r.age === null ? '—' : r.age) + '</td><td>' + esc(r.los || '') + '</td>' +
      '<td class="kg-code">' + (q ? hilite(r.drg || '—', q) : esc(r.drg || '—')) + '</td>' +
      '<td class="kg-code">' + (r.res2.aadrg ? esc(r.res2.aadrg) : '—') + '</td>' +
      '<td><span class="kg-tag kg-' + r.cmp.k + '">' + esc(r.cmp.t) + '</span></td>' +
      '<td>' + (src ? esc(src.d.n) : '<span class="saved-note">' + esc(r.res2.note) + '</span>') + '</td></tr>';
  }
  h += '</tbody></table></div></div>';
  $('kg-list').innerHTML = h;
  $('kg-list').querySelectorAll('.kg-row').forEach(tr => tr.addEventListener('click', () => {
    KG.sel = +tr.dataset.i; kgRenderList(); kgRenderDetail(); kgKeepView();
  }));
  kgFitList();
}

/* 목록은 10줄까지만 펼치고 나머지는 표 안에서 스크롤한다.
   줄 높이를 그때그때 재서 잡는다 — 글자 크기·여백을 나중에 손봐도 따라간다.
   (표를 감싸는 요소에 overflow 를 주면 머리줄이 페이지가 아니라 그 상자에 붙으므로
    .kg-listbox 안에서는 th{top:0} 으로 되돌린다 — css/style.css 참조.) */
function kgFitList(){
  const box = $('kg-list').querySelector('.kg-listbox');
  if (!box) return;
  const head = box.querySelector('thead');
  const rows = box.querySelectorAll('tbody tr');
  if (rows.length <= KG.ROWS){ box.style.maxHeight = ''; return; }
  let h = head ? head.offsetHeight : 0;
  for (let i = 0; i < KG.ROWS; i++) h += rows[i].offsetHeight;
  box.style.maxHeight = h + 'px';
}

function kgWhere(code){
  const hits = KG_CODE[code] || [];
  const seen = [];
  for (const h of hits){
    for (const d of KDRG_DEF){
      if (d.ts !== h.ts) continue;
      if (!seen.some(s => s.c === d.c)) seen.push({c: d.c, n: d.n, mdc: d.mdc, tbl: h.name});
    }
  }
  return {name: hits.length ? hits[0].row[2] : '', ins: hits.length ? hits[0].row[0] : '', at: seen};
}

function kgRenderDetail(){
  const r = KG.recs[KG.sel];
  if (!r){ $('kg-detail').innerHTML = ''; return; }
  const g = r.res2;
  const src = g.pick || g.maybe[0];

  let h = '<div class="card"><div class="meta-bar">' +
    '<span>명일련 <b>' + esc(r.seq) + '</b></span>' +
    '<span>' + esc(r.name || '') + '</span>' +
    (r.wt !== null ? '<span>신생아체중 <b>' + r.wt + 'g</b> <span class="kg-dim">MS004</span></span>' : '') +
    (r.vent !== null ? '<span>인공호흡 <b>' + r.vent + '시간</b> <span class="kg-dim">MT026</span></span>' : '') +
    '<span class="meta-note">' + esc(r.file) + '</span></div>';

  /* 분류 과정 */
  h += '<table class="fields"><tbody>';
  h += '<tr><th style="width:150px;">① 주진단 → MDC</th><td><b class="kg-code">' + esc(r.mainDx || '(없음)') + '</b> → ' +
       (g.mdcs.length ? g.mdcs.map(m => 'MDC ' + esc(m === '00' ? 'Pre' : m)).join(' · ') : '<span class="kg-bad">목록에 없음</span>') +
       (g.note21 ? '<div class="saved-note">' + esc(g.note21) + '</div>' : '') + '</td></tr>';

  const cand = g.hit.concat(g.maybe);
  h += '<tr><th>② 걸리는 질병군</th><td>' +
       '<div class="saved-note">같은 그룹 안에서 갈리는 것은 <b>좁은 정의</b>가 이깁니다 ' +
       '(부가코드가 붙은 쪽 등) — 우선순위표는 서로 다른 그룹끼리 겨룰 때 씁니다.</div>';
  if (!cand.length) h += '<span class="saved-note">' + esc(g.note || '없음') + '</span>';
  else {
    h += '<table class="fields kg-cand"><thead><tr><th style="width:64px;">질병군</th><th style="width:56px;">순위</th>' +
         '<th>이름</th><th style="width:230px;">정의식</th><th style="width:70px;">판정</th></tr></thead><tbody>';
    for (const it of cand){
      const p = (KG_PRIO[it.d.mdc] || {})[it.d.c.slice(0, 4)];
      const isPick = src && it.d.c === src.d.c;
      h += '<tr' + (isPick ? ' class="kg-pick"' : '') + '><td class="kg-code">' + esc(it.d.c) + '</td>' +
           '<td>' + (p === undefined ? '—' : p) + '</td><td>' + esc(it.d.n) + '</td>' +
           '<td class="kg-def">' + esc(it.d.def || '(주진단만)') + '</td>' +
           '<td>' + (g.hit.includes(it) ? '<span class="kg-tag kg-ok">참</span>'
                                        : '<span class="kg-tag kg-warn">모름</span>') + '</td></tr>';
      if (it.unknown.length)
        h += '<tr><td></td><td colspan="4" class="saved-note">파일에서 확인할 수 없는 조건: ' +
             it.unknown.map(esc).join(' · ') + '</td></tr>';
    }
    h += '</tbody></table>';
  }
  h += '</td></tr>';

  h += '<tr><th>③ 결정</th><td>' +
       (src ? '<b class="kg-code">' + esc(src.d.c) + '</b> ' + esc(src.d.n) +
              (g.hit.length ? '' : ' <span class="kg-tag kg-warn">확인 필요</span>')
            : '<span class="saved-note">—</span>') + '</td></tr>';
  h += '<tr><th>④ AADRG (5자리)</th><td>' + (g.aadrg ? '<b class="kg-code">' + esc(g.aadrg) + '</b>' : '—') + '</td></tr>';

  /* 6자리 후보 */
  h += '<tr><th>⑤ 6자리 후보</th><td>';
  if (g.sev){
    h += '<table class="fields kg-cand"><thead><tr><th style="width:80px;">DRG</th><th>중증도 구분 기준</th></tr></thead><tbody>';
    for (const row of g.sev.rows){
      const on = r.drg && r.drg === row[0];
      h += '<tr' + (on ? ' class="kg-pick"' : '') + '><td class="kg-code">' + esc(row[0]) + '</td><td>' + esc(row[1]) + '</td></tr>';
    }
    h += '</tbody></table>';
    h += '<div class="saved-note">중증도 한 자리는 <b>기타진단의 CC edit 규정이 분류집에 없어</b> 여기서 정하지 않습니다 ' +
         '(책 1173쪽). 아래 PCCL 은 CC edit 을 적용하기 전 값이라 실제보다 높게 나올 수 있습니다.</div>';
  } else h += '<span class="saved-note">부표2 에 이 AADRG 가 없습니다</span>';
  h += '</td></tr>';

  h += '<tr><th>대조</th><td>파일 <b class="kg-code">' + esc(r.drg || '—') + '</b> · 도출 <b class="kg-code">' +
       esc(g.aadrg || '—') + '</b> → <span class="kg-tag kg-' + r.cmp.k + '">' + esc(r.cmp.t) + '</span>' +
       (r.cmp.k === 'alt'
         ? '<div class="saved-note">기타진단 <b class="kg-code">' + esc(r.cmp.by) + '</b> 을 주진단 자리에 놓으면 ' +
           '<b class="kg-code">' + esc(r.cmp.g.aadrg) + '</b> 이라 파일과 같아집니다 — 이원분류(†/*)처럼 ' +
           '별표 진단으로 분류된 경우일 수 있습니다. 분류집에 이원분류 대응표가 없어 규칙으로 삼지 않았습니다.</div>'
         : '') +
       kgHints(r).map(t => '<div class="saved-note">' + t + '</div>').join('') + '</td></tr>';
  h += '</tbody></table>';

  /* L항 51~56 */
  h += '<div class="meta-bar"><span>L항 51~56목 <b>' + r.codes.length + '</b></span>' +
       '<span class="meta-note">질병군 분류내역 — 이 코드들이 분류집의 시술명 표와 맞물립니다</span></div>';
  h += '<table class="fields"><thead><tr><th style="width:120px;">목</th><th style="width:80px;">코드</th>' +
       '<th style="width:120px;">보험코드</th><th>분류집 명칭</th><th style="width:260px;">들어 있는 질병군</th></tr></thead><tbody>';
  for (const c of r.codes){
    const w = kgWhere(c.code);
    const dagger = /‡/.test(w.ins);            // OR procedure 는 아니지만 분류에 이용되는 시술 (책 xviii쪽)
    const at = w.at.filter(a => !g.mdc || a.mdc === g.mdc);
    const rest = w.at.length - at.length;
    h += '<tr><td>' + esc(c.mok) + ' ' + esc(KG_MOK[c.mok] || '') + '</td>' +
         '<td class="kg-code">' + esc(c.code) + '</td><td>' + esc(w.ins) + '</td>' +
         '<td>' + (w.name ? esc(w.name) : '<span class="saved-note">분류집에 없음 (분류에 쓰이지 않는 코드)</span>') + '</td>' +
         '<td>' + (at.length ? at.map(a => '<span class="kg-chip">' + esc(a.c) + '</span>').join(' ')
                             : dagger ? '<span class="saved-note">‡ OR procedure 아님</span>'
                             : w.at.length ? '<span class="saved-note">이 MDC 에는 없음 (다른 MDC ' + w.at.length + '곳)</span>' : '—') +
         (at.length && rest ? ' <span class="saved-note">다른 MDC ' + rest + '곳</span>' : '') + '</td></tr>';
  }
  h += '</tbody></table>';

  /* 중증도 참고 */
  const si = r.sevInfo;
  h += '<div class="meta-bar"><span>기타진단 <b>' + r.dx.length + '</b></span>' +
       '<span>PCCL(CC edit 전) <b>' + si.pccl + '</b></span>' +
       '<span class="meta-note">부표1 — ' + (KG_ADRG[(src ? src.d.c.slice(0, 4) : '')] &&
         KG_ADRG[src.d.c.slice(0, 4)].p === 'S' ? '외과계' : '내과계') + ' 점수</span></div>';
  if (r.dx.length){
    h += '<table class="fields"><thead><tr><th style="width:80px;">기타진단</th><th style="width:80px;">CCL</th><th></th></tr></thead><tbody>';
    for (const row of si.rows)
      h += '<tr><td class="kg-code">' + esc(row.dx) + '</td><td>' + row.ccl + '</td>' +
           '<td>' + (row.known ? '' : '<span class="saved-note">부표1 에 없음 (0점)</span>') + '</td></tr>';
    h += '</tbody></table>';
  }
  h += '</div>';
  $('kg-detail').innerHTML = h;
}

/* ---------- 수가코드로 찾기 (파일 없이도 쓴다) ---------- */
function kgRenderFind(){
  const q = KG.q.trim().toUpperCase();
  if (!q){ $('kg-find').innerHTML = ''; return; }
  const rows = [];
  for (const code of Object.keys(KG_CODE)){
    const hits = KG_CODE[code];
    const nm = hits[0].row[2], ins = hits[0].row[0];
    if (!(sgHit(code, q) || sgHit(nm, q) || sgHit(ins, q))) continue;
    rows.push({code, nm, ins, at: kgWhere(code).at});
    if (rows.length >= 200) break;
  }
  let h = '<div class="card"><div class="meta-bar"><span>찾은 시술코드 <b>' + rows.length + '</b>' +
    (rows.length >= 200 ? ' (200개까지)' : '') + '</span>' +
    '<span class="meta-note">L항 51~56목에 적는 코드입니다</span></div>';
  if (!rows.length) h += '<div class="empty">검색 결과가 없습니다.</div>';
  else {
    h += '<table class="fields"><thead><tr><th style="width:80px;">코드</th><th style="width:130px;">보험코드</th>' +
         '<th>명칭</th><th style="width:300px;">들어 있는 질병군</th></tr></thead><tbody>';
    for (const r of rows)
      h += '<tr><td class="kg-code">' + hilite(r.code, q) + '</td><td>' + hilite(r.ins, q) + '</td>' +
           '<td>' + hilite(r.nm, q) + '</td><td>' +
           r.at.map(a => '<span class="kg-chip" title="' + esc(a.n) + '">' + esc(a.c) + '</span>').join(' ') + '</td></tr>';
    h += '</tbody></table>';
  }
  h += '</div>';
  $('kg-find').innerHTML = h;
}

/* ---------- 놓은 파일 기억하기 (2026-08-26 요청) ----------
   새로고침해도 파일이 날아가지 않게 **원본 바이트를 IndexedDB 에 담아 둔다.**
   localStorage 는 몇 MB 에서 막혀 SAM 파일(20MB 넘는 것도 있다)을 못 담는다.
   담아 두는 것은 파일 그대로다 — 다시 열 때 지금 코드로 새로 읽으므로 분류 규칙을 고치면 그대로 따라간다.

   **파일에는 수진자 이름과 주민등록번호가 들어 있다.** 이 브라우저 안에만 남고 어디로도 보내지 않지만,
   디스크에 남는 것은 맞다. 「비우기」를 누르면 지운다.
   담기·꺼내기가 안 되는 브라우저(사생활 보호 모드 등)에서도 화면은 그대로 돌아간다 — 조용히 넘어간다. */
const KG_DB = 'samguide-kdrg', KG_STORE = 'files', KG_VIEW = 'samguide_kdrg_view';

function kgIdb(){
  return new Promise((res, rej) => {
    const q = indexedDB.open(KG_DB, 1);
    q.onupgradeneeded = () => q.result.createObjectStore(KG_STORE);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
}
async function kgKeep(list){
  try {
    const db = await kgIdb();
    await new Promise((res, rej) => {
      const t = db.transaction(KG_STORE, 'readwrite'), s = t.objectStore(KG_STORE);
      if (list && list.length) s.put(list.map(f => ({name: f.name, bytes: f.bytes})), 'list');
      else s.delete('list');
      t.oncomplete = res; t.onerror = () => rej(t.error);
    });
    db.close();
  } catch (e) { /* 담아 두지 못해도 지금 화면은 그대로 쓴다 */ }
}
async function kgKept(){
  try {
    const db = await kgIdb();
    const v = await new Promise((res, rej) => {
      const r = db.transaction(KG_STORE, 'readonly').objectStore(KG_STORE).get('list');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    });
    db.close();
    return v || null;
  } catch (e) { return null; }
}
/* 보고 있던 자리(고른 줄 · 찾던 번호 · 필터)는 작아서 localStorage 로 충분하다 */
function kgKeepView(){
  try { localStorage.setItem(KG_VIEW, JSON.stringify({sel: KG.sel, seq: KG.seq, onlyBad: KG.onlyBad})); } catch (e) {}
}
function kgKeptView(){
  try { return JSON.parse(localStorage.getItem(KG_VIEW) || 'null'); } catch (e) { return null; }
}

/* ---------- 파일 받기 ---------- */
async function kgTakeFiles(fileList){
  const list = [];
  for (const file of Array.from(fileList)){
    list.push({name: file.name, bytes: new Uint8Array(await file.arrayBuffer())});
  }
  KG.list = list;
  KG.recs = kgReadFiles(list);
  KG.sel = 0;
  KG.seq = ''; $('kg-seq').value = '';        // 새 파일을 놓으면 찾던 번호는 지운다
  kgRender();
  kgKeep(list); kgKeepView();
}

$('kg-pick').addEventListener('click', () => $('kg-file').click());
$('kg-file').addEventListener('change', e => { if (e.target.files.length) kgTakeFiles(e.target.files); });
$('kg-clear').addEventListener('click', () => {
  KG.list = []; KG.recs = []; KG.sel = 0; KG.seq = '';
  $('kg-file').value = ''; $('kg-seq').value = ''; kgRender();
  kgKeep(null); kgKeepView();               // 담아 둔 파일도 함께 지운다
});
$('kg-only').addEventListener('change', e => { KG.onlyBad = e.target.checked; kgRenderList(); kgKeepView(); });
$('kg-seq').addEventListener('input', e => {
  KG.seq = e.target.value;
  // 찾은 것이 있으면 첫 줄을 골라 아래 분류 과정까지 바로 보여 준다
  const q = KG.seq.trim();
  if (q){
    const i = KG.recs.findIndex(r => kgSeqHit(r, q));
    if (i >= 0) KG.sel = i;
  }
  kgRenderList(); kgRenderDetail(); kgKeepView();
});
$('kg-search').addEventListener('input', e => { KG.q = e.target.value; kgRenderFind(); });

function kgDropOn(){ return $('page-kdrg').classList.contains('on'); }
['dragenter', 'dragover'].forEach(ev => document.addEventListener(ev, e => {
  if (!kgDropOn()) return;
  e.preventDefault(); $('kg-drop').classList.add('over');
}));
document.addEventListener('dragleave', e => {
  if (!kgDropOn()) return;
  if (e.relatedTarget) return;
  $('kg-drop').classList.remove('over');
});
document.addEventListener('drop', e => {
  if (!kgDropOn()) return;
  e.preventDefault();
  $('kg-drop').classList.remove('over');
  if (e.dataTransfer && e.dataTransfer.files.length) kgTakeFiles(e.dataTransfer.files);
});

kgRender();

/* 지난번에 놓은 파일이 있으면 다시 읽는다 — 새로고침해도 그대로 이어 본다.
   파일 그대로 담아 두었다가 지금 코드로 새로 읽으므로, 분류 규칙을 고치면 결과도 따라 바뀐다. */
(async function kgResume(){
  const kept = await kgKept();
  if (!kept || !kept.length) return;
  KG.list = kept.map(f => ({name: f.name, bytes: new Uint8Array(f.bytes)}));
  KG.recs = kgReadFiles(KG.list);
  const v = kgKeptView() || {};
  if (v.onlyBad !== undefined) KG.onlyBad = !!v.onlyBad;
  KG.seq = v.seq || '';
  KG.sel = (v.sel >= 0 && v.sel < KG.recs.length) ? v.sel : 0;
  $('kg-only').checked = KG.onlyBad;
  $('kg-seq').value = KG.seq;
  kgRender();
})();
