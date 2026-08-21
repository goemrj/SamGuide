/* ---------- SAM 변환오류 — 서식번호를 읽어 레코드 길이가 맞는지 확인한다 ----------

   파일은 이 브라우저 안에서만 읽는다(File.arrayBuffer). 어디로도 보내지 않는다.

   하는 일
     1. 파일명 · 서식번호 · 진료형태로 청구분야를 고른다 (칩으로 바꿀 수 있다)
     2. 줄마다 레코드(H · A~F)를 판별한다 — 서식번호 → 내역구분 → 파일명 → 길이 순
     3. 줄의 바이트 길이를 그 레코드의 허용 길이와 견준다
     4. 어긋난 줄은 "몇 byte 모자란지/남는지 · 어느 필드에서 끊겼는지"를 적고,
        줄을 누르면 팝업이 떠서 **파일을 그대로** 그 줄로 옮겨 보여 준다(필드별 분해도 같은 팝업 안)
     5. 어긋난 줄이 어느 명세서인지 — 명일련번호와 수진자 이름을 함께 적는다
        (이름은 일반내역(A)에만 있어 같은 청구번호+명일련번호의 A 줄에서 가져온다)
     6. 파일 구조 — 청구서(H)는 파일에 1줄만, 청구서의 건수는 일반내역 줄 수와 같아야 한다

   허용 길이는 레이아웃(js/layout-*.js)에서 그대로 뽑는다 — 여기에 숫자를 적어 두지 않는다.
     · 전체 길이 = 필드 끝 위치의 최대값
     · 맨 뒤 필드의 설명에 "생략 허용" · "기재 허용" · "(옵션)" 이 적혀 있으면 그 앞까지도 허용
       (청구서의 참조란 1,750byte · 진료내역의 치식 4칸)
     · SamEditor 가 빈 줄을 만들 때 쓰는 길이(blankRowLen)도 허용

   길이는 모두 바이트(EUC-KR, 한글 2byte)다. 파일을 바이트로 읽어 세므로 글자수와 섞이지 않는다.
   ------------------------------------------------------------------------ */

const SC = { list: [], claim: '', why: '', forced: false, onlyBad: true, cands: [],
             res: [], view: null, caret: 1, vtab: 'raw', vwrap: true };

const SC_DEC = new TextDecoder('euc-kr');
function scText(bytes){ return SC_DEC.decode(bytes); }
function scHas(o, k){ return Object.prototype.hasOwnProperty.call(o, k); }

/* 그 위치의 바이트를 ASCII 로 읽는다. 줄이 그 위치까지 오지 않으면 null. */
function scAscii(bytes, pos, len){
  if (pos - 1 + len > bytes.length) return null;
  let s = '';
  for (let i = pos - 1; i < pos - 1 + len; i++) s += String.fromCharCode(bytes[i]);
  return s;
}
function scSlice(bytes, f){ return bytes.subarray(f.pos - 1, Math.min(f.pos - 1 + f.len, bytes.length)); }

/* ---------- 레코드 규격 ---------- */
const SC_OPT_RE = /생략 허용|기재 허용|\(옵션\)/;

function scFull(L){ return L.fields.reduce((m, f) => Math.max(m, f.pos + f.len - 1), 0); }

/* 허용 길이 — 전체 길이 + 뒤쪽 "생략 허용" 필드 묶음을 통째로 뗀 길이.
   묶음 중간 경계(치식 4칸 중 2칸만)는 만들지 않는다 — 실제로 다 있거나 다 없고
   (실샘플 1,047줄: 진료내역 708줄이 모두 236byte), 중간 경계를 허용하면 진단이 나빠진다
   (231byte 를 "236 에서 5byte 모자람"이 아니라 "228 에 3byte 더 붙음"으로 읽는다). */
function scAllowed(claim, rk){
  const L = layoutsOf(claim)[rk];
  const set = new Set([scFull(L)]);
  let cut = 0;
  for (let i = L.fields.length - 1; i >= 0; i--){
    const f = L.fields[i];
    if (!SC_OPT_RE.test(f.desc || '')) break;
    cut = f.pos - 1;
  }
  if (cut > 0) set.add(cut);
  const blank = (CLAIM_TYPES[claim].blankRowLen || {})[rk];
  if (blank) set.add(blank);
  return Array.from(set).sort((a, b) => a - b);
}

function scFieldNamed(L, name){ return L.fields.find(f => f.name === name); }

/* 어느 명세서의 줄인지 짚는 데 쓰는 필드.
   명일련번호는 분야마다 이름이 다르고(의과는 '명일련번호', 나머지는 '명세서일련번호'),
   수진자 이름 필드도 분야마다 다르다 — 이름 모음은 layout-shim.js 의 PATIENT_NAME_FIELDS 에
   있고 레이아웃 파일들이 로드 중에 자기 이름을 보탠다(수진자성함 · 수진자성명 · 산재근로자성명 · 환자성명).
   '명세서일련번호(당초)' 같은 다른 필드에 걸리지 않도록 이름이 정확히 같은 것만 찾는다. */
const SC_SEQ_NAMES = ['명세서일련번호', '명일련번호'];
function scSeqField(L){
  for (const n of SC_SEQ_NAMES){ const f = scFieldNamed(L, n); if (f) return f; }
  return null;
}
function scNameField(L){ return L.fields.find(f => PATIENT_NAME_FIELDS.has(f.name)) || null; }

// 청구분야 하나의 점검 규격 — 레코드마다 서식번호 · 내역구분 위치와 허용 길이
function scSpec(claim){
  const L = layoutsOf(claim);
  const recs = {};
  for (const rk of Object.keys(L)){
    const form = scFieldNamed(L[rk], '서식번호');
    const kind = scFieldNamed(L[rk], '내역구분');
    recs[rk] = {
      key: rk, name: L[rk].name, layout: L[rk],
      form: form && form.codes ? form : null,
      kind: kind && kind.codes ? kind : null,
      ftype: scFieldNamed(L[rk], '진료형태') || null,
      cn: scFieldNamed(L[rk], '청구번호') || null,
      seq: scSeqField(L[rk]),
      pname: scNameField(L[rk]),
      allowed: scAllowed(claim, rk),
      full: scFull(L[rk]),
    };
  }
  // 레코드를 판별하지 못한 줄에서도 명일련번호를 읽으려면 기준 자리가 필요하다.
  // 청구서(H)를 뺀 나머지 레코드가 청구번호·명일련번호 자리를 똑같이 쓰는 분야에서만 쓴다
  // (지금 11분야 모두 청구번호 1~10 · 명일련번호 11~15 로 같다).
  let head = null, headOk = true;
  for (const rk of Object.keys(recs)){
    const r = recs[rk];
    if (rk === 'H' || !r.cn || !r.seq) continue;
    const cur = r.cn.pos + ':' + r.cn.len + '/' + r.seq.pos + ':' + r.seq.len;
    if (!head) head = {key: cur, cn: r.cn, seq: r.seq};
    else if (head.key !== cur) headOk = false;
  }
  // 내역구분을 쓰는 청구분야는 한 파일에 여러 레코드가 섞여 들어온다(GEN · DRG · NDRG · JABO · WANHWA).
  // 내역구분이 없는 쪽(MG · CHUB · HANBANG · SANJAE · SANJAE_HAN · JABO_HAN)은 파일 하나가 레코드 하나다.
  const multiFile = !Object.keys(recs).some(k => recs[k].kind);
  return { claim, recs, multiFile, detailHead: headOk ? head : null,
           ftc: CLAIM_TYPES[claim].formTypeChars || null };
}

const SC_SPECS = {};
availableClaims().forEach(([k]) => { SC_SPECS[k] = scSpec(k); });

/* ---------- 파일명 → 레코드 ----------
   레이아웃 파일이 들고 있는 판별 함수를 그대로 쓴다(여기에 파일명 규칙을 다시 적지 않는다).
   *Unique* 는 그 청구분야만 쓰는 이름(D020.1 등), 아닌 쪽은 여러 분야가 나눠 쓰는 이름(H010 · C010 · M010.1). */
const SC_ROLE_FNS = [
  ['DRG',        'drgUniqueRoleForFilename',        'drgRoleForFilename'],
  ['MG',         'mgUniqueRoleForFilename',         'mgRoleForFilename'],
  ['CHUB',       'chubUniqueRoleForFilename',       'chubRoleForFilename'],
  ['HANBANG',    'hanbangUniqueRoleForFilename',    'hanbangRoleForFilename'],
  ['SANJAE',     'sanjaeUniqueRoleForFilename',     'sanjaeRoleForFilename'],
  ['SANJAE_HAN', 'sanjaeHanUniqueRoleForFilename',  'sanjaeHanRoleForFilename'],
  ['JABO_HAN',   'jaboHanUniqueRoleForFilename',    'jaboHanRoleForFilename'],
];
function scRoleHits(name){
  const hits = [];
  for (const [claim, uniq, any] of SC_ROLE_FNS){
    if (!SC_SPECS[claim]) continue;
    const fu = window[uniq], fa = window[any];
    const ru = typeof fu === 'function' ? fu(name) : null;
    if (ru){ hits.push({claim, role: ru, unique: true}); continue; }
    const ra = typeof fa === 'function' ? fa(name) : null;
    if (ra) hits.push({claim, role: ra, unique: false});
  }
  return hits;
}

/* ---------- 줄 나누기 ---------- */
function scSplitLines(bytes){
  const lines = [];
  let start = 0, crlf = 0, lf = 0;
  for (let i = 0; i < bytes.length; i++){
    if (bytes[i] !== 0x0A) continue;
    let end = i;
    if (end > start && bytes[end - 1] === 0x0D){ end--; crlf++; } else { lf++; }
    lines.push(bytes.subarray(start, end));
    start = i + 1;
  }
  if (start < bytes.length) lines.push(bytes.subarray(start, bytes.length));  // 마지막 줄에 개행이 없는 경우
  const nl = crlf && lf ? '섞임(CRLF+LF)' : crlf ? 'CRLF' : lf ? 'LF' : '없음';
  return { lines, nl };
}

/* ---------- 인코딩 확인 ---------- */
function scEncNote(bytes){
  const head = bytes.subarray(0, Math.min(bytes.length, 400000));
  if (!scText(head).includes('�')) return '';
  let u8 = null;
  try { u8 = new TextDecoder('utf-8', {fatal: true}).decode(head); } catch (e) { u8 = null; }
  if (u8 && /[가-힣]/.test(u8))
    return 'UTF-8 로 저장된 것 같습니다 — 한글이 2byte 가 아니라 3byte 로 들어가 길이가 어긋납니다. EUC-KR(CP949) 로 다시 저장해 주세요.';
  return 'EUC-KR 로 읽히지 않는 바이트가 있습니다.';
}

/* ---------- 청구분야 판별 ---------- */
function scDetectClaim(list){
  const score = {}, why = {};
  const add = (c, n, reason) => {
    if (!SC_SPECS[c] || !n) return;
    score[c] = (score[c] || 0) + n;
    (why[c] = why[c] || new Set()).add(reason);
  };

  for (const f of list){
    // 파일명
    for (const h of scRoleHits(f.name)) add(h.claim, h.unique ? 6 : 1, '파일명');

    const sample = f.lines.slice(0, 40).filter(b => b.length);
    for (const claim of Object.keys(SC_SPECS)){
      const spec = SC_SPECS[claim];
      let formHits = 0, kindHits = 0, lenHits = 0;
      for (const line of sample){
        for (const rk of Object.keys(spec.recs)){
          const r = spec.recs[rk];
          if (r.kind){
            const v = scAscii(line, r.kind.pos, r.kind.len);
            if (v && scHas(r.kind.codes, v)) kindHits++;
          }
          if (r.form){
            const v = scAscii(line, r.form.pos, r.form.len);
            if (v && scHas(r.form.codes, v)){
              formHits++;
              // 청구서의 진료형태로만 갈리는 분야(완화 · 신포괄)를 여기서 가른다
              if (r.ftype && spec.ftc){
                const t = scAscii(line, r.ftype.pos, r.ftype.len);
                if (t && spec.ftc.indexOf(t) >= 0) add(claim, 8, '청구서 진료형태 ' + t);
              }
            }
          }
          if (r.allowed.indexOf(line.length) >= 0) lenHits++;
        }
      }
      if (formHits) add(claim, Math.min(formHits, 3) * 3, '서식번호');
      if (kindHits) add(claim, Math.min(kindHits, 3) * 2, '내역구분');
      if (sample.length) add(claim, Math.round(4 * Math.min(1, lenHits / sample.length)), '레코드 길이');
    }
  }

  const cands = Object.keys(score).sort((a, b) => score[b] - score[a]);
  return {
    cands,
    best: cands[0] || '',
    why: cands[0] ? Array.from(why[cands[0]]).join(' · ') : '',
  };
}

/* ---------- 줄 하나의 레코드 판별 ---------- */
function scPickRec(spec, bytes, fileRole){
  for (const rk of Object.keys(spec.recs)){          // 1. 서식번호
    const r = spec.recs[rk];
    if (!r.form) continue;
    const v = scAscii(bytes, r.form.pos, r.form.len);
    if (v && scHas(r.form.codes, v)) return {rec: r, by: '서식번호로', form: v};
  }
  for (const rk of Object.keys(spec.recs)){          // 2. 내역구분
    const r = spec.recs[rk];
    if (!r.kind) continue;
    const v = scAscii(bytes, r.kind.pos, r.kind.len);
    if (v && scHas(r.kind.codes, v)) return {rec: r, by: '내역구분으로', form: null};
  }
  if (spec.multiFile && fileRole && spec.recs[fileRole])   // 3. 파일명 (파일 하나 = 레코드 하나인 분야만)
    return {rec: spec.recs[fileRole], by: '파일명으로', form: null};
  const fit = Object.keys(spec.recs).filter(rk => spec.recs[rk].allowed.indexOf(bytes.length) >= 0);
  if (fit.length === 1) return {rec: spec.recs[fit[0]], by: '길이로', form: null};   // 4. 길이
  return null;
}

/* ---------- 길이 진단 ---------- */
function scDiag(rec, bytes){
  const len = bytes.length, allowed = rec.allowed;
  if (allowed.indexOf(len) >= 0) return null;
  let near = allowed[0];
  for (const a of allowed) if (Math.abs(a - len) < Math.abs(near - len)) near = a;
  const fields = rec.layout.fields;

  if (len < near){
    const at = len + 1;                                     // 있어야 하는데 없는 첫 바이트
    const cut = fields.find(f => at >= f.pos && at <= f.pos + f.len - 1);
    const lost = fields.filter(f => f.pos > len).map(f => f.name);
    return {
      short: true, diff: near - len, near, lost,
      head: (near - len).toLocaleString() + 'byte 모자랍니다',
      where: cut ? cut.name + '(위치 ' + cut.pos + '~' + (cut.pos + cut.len - 1) + ') 에서 끊겼습니다'
                 : '레코드 끝에서 끊겼습니다',
    };
  }
  const extra = scText(bytes.subarray(near));
  return {
    short: false, diff: len - near, near, lost: [],
    head: (len - near).toLocaleString() + 'byte 더 붙어 있습니다',
    where: near + 'byte 뒤에 남은 값이 있습니다',
    extra: /^ +$/.test(extra) ? '공백 ' + (len - near) + 'byte'
         : extra.length > 60 ? extra.slice(0, 60) + '…' : extra,
  };
}

/* ---------- 어느 명세서의 줄인가 ----------
   청구번호 + 명일련번호로 명세서를 가리키고, 수진자 이름은 일반내역(A)에만 있으므로
   같은 열쇠를 가진 A 줄에서 가져온다(명세서 파일이 따로 오는 분야도 있어 파일을 가로질러 찾는다). */
function scWho(spec, rec, bytes){
  const cnF = rec ? rec.cn : (spec.detailHead && spec.detailHead.cn);
  const seqF = rec ? rec.seq : (spec.detailHead && spec.detailHead.seq);
  return {
    cn: cnF ? scAscii(bytes, cnF.pos, cnF.len) : null,
    seq: seqF ? scAscii(bytes, seqF.pos, seqF.len) : null,
    // 잘린 줄이면 이름이 반만 들어올 수 있다 — 있는 만큼 읽는다
    pname: rec && rec.pname ? scText(scSlice(bytes, rec.pname)).trim() : '',
    guessed: !rec,                  // 레코드를 판별하지 못해 표준 앞머리(1~15)로 읽은 경우
  };
}
function scKey(row){
  return row.cn != null && row.seq != null ? row.cn + '/' + row.seq : '';
}
// A(일반내역)에서 읽은 이름을 같은 명세서의 다른 줄에 채워 넣는다
function scFillNames(res){
  const byKey = {};
  res.forEach(r => r.rows.forEach(row => {
    const k = scKey(row);
    if (k && row.pname) byKey[k] = row.pname;
  }));
  res.forEach(r => r.rows.forEach(row => {
    const k = scKey(row);
    if (k && !row.pname && byKey[k]) row.pname = byKey[k];
  }));
}

/* ---------- 파일 구조 점검 ----------
   1. 청구서(H)는 파일에 딱 1줄이다. 두 청구를 한 파일에 이어 붙이면 여기서 걸린다
      (2026-08-21 실샘플: H010 이 2줄 — 건수 1건/3건, 청구일자 08-05/08-12).
   2. 청구서의 「건수」(= 명세서 청구건수 합)는 일반내역(A) 줄 수와 같아야 한다.
      청구서가 1줄이고 일반내역이 함께 첨부된 때만 본다 — 명세서 파일을 안 놓으면 셀 수 없다. */
function scStructCheck(res, claim){
  const hAll = [];
  let aTotal = 0;
  res.forEach(r => r.rows.forEach(row => {
    if (!row.rec) return;
    if (row.rec.key === 'H') hAll.push(row);
    if (row.rec.key === 'A') aTotal++;
  }));

  res.forEach(r => {
    const hs = r.rows.filter(x => x.rec && x.rec.key === 'H');
    r.hCount = hs.length;
    if (hs.length < 2) return;
    hs.forEach((x, i) => {
      if (!i) return;
      x.struct = '청구서가 이 파일에 ' + hs.length + '줄 있습니다 — 청구서는 1줄만 있어야 합니다' +
        ' (첫 청구서는 ' + hs[0].no + '줄)';
    });
  });

  if (hAll.length === 1 && aTotal){
    const h = hAll[0], cf = scFieldNamed(h.rec.layout, '건수');
    const raw = cf ? scAscii(h.bytes, cf.pos, cf.len) : null;
    const v = raw === null ? NaN : parseInt(raw, 10);
    if (!isNaN(v) && v !== aTotal)
      h.struct = '청구서의 건수 ' + v.toLocaleString() + '건이 일반내역(A) ' + aTotal.toLocaleString() + '줄과 다릅니다';
  }
  res.forEach(r => { r.structBad = r.rows.filter(x => x.struct).length; });
}

/* 숫자 칸에 숫자가 아닌 값이 들어간 곳 — 줄이 밀린 자리를 짚는 데 쓴다(확정이 아니라 짐작) */
function scNumBad(rec, bytes){
  const out = [];
  for (const f of rec.layout.fields){
    if (f.mode !== 'n') continue;
    if (f.pos - 1 + f.len > bytes.length) break;
    const s = scText(scSlice(bytes, f));
    if (/^[0-9 ]*$/.test(s)) continue;
    out.push({name: f.name, pos: f.pos, len: f.len, val: s});
  }
  return out;
}

/* ---------- 파일 한 개 점검 ---------- */
function scCheckFile(file, claim){
  const spec = SC_SPECS[claim];
  const roleHit = scRoleHits(file.name).find(h => h.claim === claim);
  const fileRole = roleHit ? roleHit.role : null;

  let lines = file.lines, mode = '줄바꿈';
  // 줄바꿈이 없는 파일 — 첫 덩어리로 레코드를 알아내고 그 길이로 잘라 본다
  if (file.nl === '없음' && file.bytes.length){
    const guess = scPickRec(spec, file.bytes.subarray(0, Math.min(file.bytes.length, 4096)), fileRole);
    const cut = guess && guess.rec.allowed.find(a => a > 0 && file.bytes.length % a === 0);
    if (cut){
      lines = [];
      for (let i = 0; i < file.bytes.length; i += cut) lines.push(file.bytes.subarray(i, i + cut));
      mode = '고정길이 ' + cut + 'byte';
    }
  }

  const rows = [], counts = {}, forms = {}, dist = {};
  let bad = 0, unknown = 0, blankLines = 0;

  lines.forEach((b, i) => {
    const no = i + 1;
    if (!b.length){ blankLines++; rows.push({no, len: 0, blank: true}); return; }
    dist[b.length] = (dist[b.length] || 0) + 1;
    const pick = scPickRec(spec, b, fileRole);
    if (!pick){
      unknown++;
      rows.push(Object.assign({no, len: b.length, bytes: b, rec: null, head: scText(b.subarray(0, 24))},
                              scWho(spec, null, b)));
      return;
    }
    counts[pick.rec.key] = (counts[pick.rec.key] || 0) + 1;
    if (pick.form){
      const prev = forms[pick.form];
      forms[pick.form] = {mean: pick.rec.form.codes[pick.form] || '', rec: pick.rec.key, n: (prev ? prev.n : 0) + 1};
    }
    const diag = scDiag(pick.rec, b);
    if (diag) bad++;
    rows.push(Object.assign({no, len: b.length, bytes: b, rec: pick.rec, by: pick.by, form: pick.form, diag},
                            scWho(spec, pick.rec, b)));
  });

  return {
    name: file.name, size: file.bytes.length, nl: file.nl, bom: file.bom, enc: file.enc,
    mode, fileRole, rows, counts, forms, dist, bad, unknown, blankLines, lineCount: lines.length,
    lines,   // 팝업이 파일을 그대로 보여 줄 때 같은 줄 나눔을 쓴다
  };
}

/* ---------- 그리기 ---------- */
function scRender(){
  const wrap = $('sc-out');
  $('sc-clear').style.display = SC.list.length ? '' : 'none';
  // 파일을 놓기 전에는 크게, 결과를 보는 동안에는 얇은 띠로
  $('sc-drop').classList.toggle('slim', !!SC.list.length);
  if (!SC.list.length){
    $('sc-claim-row').style.display = 'none';
    $('sc-filter-row').style.display = 'none';
    wrap.innerHTML = '';
    return;
  }
  const claim = SC.claim;

  // 대분류 — 청구분야 (짐작한 순서대로, 나머지는 뒤에). 못 알아냈을 때도 직접 고를 수 있게 늘 보여 준다.
  const order = SC.cands.concat(availableClaims().map(r => r[0]).filter(k => SC.cands.indexOf(k) < 0));
  $('sc-claim-row').style.display = '';
  $('sc-claims').innerHTML = order.map(k =>
    '<button class="chip' + (k === claim ? ' on' : '') + '" data-claim="' + esc(k) + '">' + esc(claimLabel(k)) +
    (SC.cands[0] === k ? '<small>짐작</small>' : '') + '</button>').join('');
  $('sc-claims').querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    SC.claim = c.dataset.claim; SC.forced = true; scRender();
  }));

  if (!claim){
    $('sc-filter-row').style.display = 'none';
    wrap.innerHTML = '<div class="card"><div class="card-pad"><div class="empty">' +
      '서식번호 · 파일명으로 청구분야를 알아내지 못했습니다. 위에서 직접 골라 주세요.</div></div></div>';
    return;
  }

  const res = SC.list.map(f => scCheckFile(f, claim));
  scFillNames(res);                 // 수진자 이름을 일반내역에서 가져와 같은 명세서의 줄에 채운다
  scStructCheck(res, claim);        // 청구서 1줄 · 건수 = 일반내역 줄 수
  const tot = res.reduce((a, r) => ({
    lines: a.lines + r.lineCount, bad: a.bad + r.bad, unknown: a.unknown + r.unknown,
    struct: a.struct + r.structBad,
  }), {lines: 0, bad: 0, unknown: 0, struct: 0});

  $('sc-filter-row').style.display = '';
  $('sc-only').innerHTML =
    '<button class="chip' + (SC.onlyBad ? ' on' : '') + '" data-only="1">어긋난 줄만<small>' +
      (tot.bad + tot.unknown + tot.struct) + '</small></button>' +
    '<button class="chip' + (SC.onlyBad ? '' : ' on') + '" data-only="0">모든 줄<small>' + tot.lines + '</small></button>';
  $('sc-only').querySelectorAll('.chip').forEach(c => c.addEventListener('click', () => {
    SC.onlyBad = c.dataset.only === '1'; scRender();
  }));

  // 어긋난 줄이 먼저 보여야 한다 — 총계 한 줄 → 어긋난 줄 표 → 파일별 요약 순서로 둔다
  wrap.innerHTML =
    '<div class="card"><div class="meta-bar">' +
      '<span><b>' + esc(claimLabel(claim)) + '</b> 서식으로 봤습니다' +
        (SC.forced ? ' (직접 고름)' : SC.why ? ' — 짐작한 근거: ' + esc(SC.why) : '') + '</span>' +
      '<span>파일 <b>' + res.length + '</b>개</span>' +
      '<span>줄 <b>' + tot.lines.toLocaleString() + '</b></span>' +
      '<span>길이 어긋남 <b>' + tot.bad.toLocaleString() + '</b></span>' +
      '<span>구조 오류 <b>' + tot.struct.toLocaleString() + '</b></span>' +
      '<span>판별 못한 줄 <b>' + tot.unknown.toLocaleString() + '</b></span>' +
      '<span class="meta-note">길이는 바이트(EUC-KR, 한글 2byte) 기준</span>' +
    '</div></div>' +
    '<div class="card"><div class="meta-bar"><span><b>' + (SC.onlyBad ? '어긋난 줄' : '모든 줄') +
      '</b> — 줄을 누르면 필드별로 잘라서 보여 줍니다</span></div><div id="sc-rows"></div></div>' +
    '<div class="card"><div class="meta-bar"><span><b>파일별 요약</b> — 읽어낸 서식번호 · 레코드 구성 · 길이 분포</span></div>' +
      '<div id="sc-sum"></div></div>';

  SC.res = res;                     // 팝업이 같은 결과를 그대로 쓴다
  SC_MAPS = {};                     // 청구분야를 바꾸면 줄 나눔이 달라질 수 있다(줄바꿈 없는 파일)
  scRenderSummary(res, claim);
  scRenderRows(res);

  // 줄을 누르면 파일을 그대로 보여 주는 팝업이 뜨고 그 줄로 옮겨 간다
  $('sc-rows').querySelectorAll('.sc-row').forEach(tr => tr.addEventListener('click', () => {
    const k = tr.dataset.key;
    if (!k) return;
    const [fi, no] = k.split(':').map(Number);
    scOpenView(fi, no);
  }));
}

// 파일마다 한 줄 — 읽어낸 서식번호 · 레코드 구성 · 길이 분포
function scRenderSummary(res, claim){
  let s = '<table class="fields"><thead><tr><th>파일</th><th>크기</th><th>줄</th><th>줄바꿈</th>' +
    '<th>읽어낸 서식번호</th><th>레코드 구성</th><th>결과</th></tr></thead><tbody>';
  res.forEach(r => {
    const fkeys = Object.keys(r.forms);
    const fhtml = fkeys.length
      ? fkeys.map(k => '<span class="code"><b>' + esc(k) + '</b><span>' + esc(r.forms[k].mean) + '</span></span>').join('')
      : '<span class="sc-dim">이 파일에는 서식번호 칸이 없습니다<br>(청구서 · 일반내역에만 있습니다)</span>';
    const ckeys = Object.keys(r.counts);
    const chtml = ckeys.length
      ? ckeys.map(k => esc(k) + ' ' + esc(SC_SPECS[claim].recs[k].name) + ' ' + r.counts[k].toLocaleString() + '줄').join('<br>')
      : '<span class="sc-dim">—</span>';
    const notes = [];
    if (r.bom) notes.push('파일 앞에 BOM(EF BB BF) 3byte 가 붙어 있습니다 — 첫 줄이 3byte 길어집니다.');
    if (r.enc) notes.push(r.enc);
    if (r.nl === '섞임(CRLF+LF)') notes.push('줄바꿈이 CRLF 와 LF 로 섞여 있습니다.');
    if (r.mode !== '줄바꿈') notes.push('줄바꿈이 없어 ' + r.mode + ' 로 잘라서 봤습니다.');
    if (r.nl === '없음' && r.mode === '줄바꿈') notes.push('줄바꿈이 없습니다 — 파일 전체를 한 줄로 봤습니다.');
    if (r.blankLines) notes.push('빈 줄 ' + r.blankLines + '개');
    if (r.hCount > 1) notes.push('청구서(H)가 ' + r.hCount + '줄입니다 — 청구서는 1줄만 있어야 합니다. 청구 두 건이 한 파일에 이어 붙었을 수 있습니다.');
    const okLines = r.lineCount - r.bad - r.unknown - r.blankLines;
    const verdict = (r.bad || r.unknown || r.blankLines || r.structBad)
      ? '<b class="sc-bad">' + [
          r.bad ? '길이 어긋남 ' + r.bad + '줄' : '',
          r.structBad ? '구조 오류 ' + r.structBad + '건' : '',
          r.unknown ? '판별 불가 ' + r.unknown + '줄' : '',
          r.blankLines ? '빈 줄 ' + r.blankLines + '개' : '',
        ].filter(Boolean).join(' · ') + '</b>'
      : '<b class="sc-ok">모두 맞습니다</b>';
    const distHtml = Object.keys(r.dist).map(Number).sort((a, b) => b - a)
      .map(len => len.toLocaleString() + 'byte ' + r.dist[len].toLocaleString() + '줄').join(' · ');
    s += '<tr><td>' + esc(r.name) +
        (r.fileRole ? '<br><span class="sc-dim">파일명 → ' + esc(r.fileRole) + '</span>' : '') + '</td>' +
      '<td class="sc-num">' + r.size.toLocaleString() + '</td>' +
      '<td class="sc-num">' + r.lineCount.toLocaleString() + '</td>' +
      '<td>' + esc(r.nl) + '</td>' +
      '<td>' + fhtml + '</td>' +
      '<td>' + chtml + '</td>' +
      '<td>' + verdict +
        '<div class="sc-dim">맞는 줄 ' + okLines.toLocaleString() + '</div>' +
        '<div class="sc-dim">길이 분포 ' + esc(distHtml) + '</div>' +
        notes.map(n => '<div class="sc-warn">' + esc(n) + '</div>').join('') +
      '</td></tr>';
  });
  $('sc-sum').innerHTML = s + '</tbody></table>';
}

// 줄 표 — 어긋난 줄(또는 모든 줄)
function scRenderRows(res){
  let t = '<table class="fields"><thead><tr><th>파일 · 줄</th><th>명일련 · 수진자</th><th>레코드</th><th>서식번호</th>' +
    '<th>길이</th><th>허용 길이</th><th>어디서 어긋났나</th></tr></thead><tbody>';
  let shown = 0, hidden = 0;
  res.forEach((r, fi) => {
    r.rows.forEach(row => {
      const isBad = row.blank || !row.rec || !!row.diag || !!row.struct;
      if (SC.onlyBad && !isBad) return;
      if (shown >= 500){ hidden++; return; }
      shown++;
      if (row.blank){
        t += '<tr><td>' + esc(r.name) + '<br><span class="sc-dim">' + row.no + '줄</span></td>' +
          '<td colspan="6"><b class="sc-bad">빈 줄</b> — 레코드가 없습니다.</td></tr>';
        return;
      }
      const key = fi + ':' + row.no;
      const rec = row.rec;
      const why = !rec
        ? '<b class="sc-bad">레코드를 판별하지 못했습니다</b>' +
          '<div class="sc-dim">서식번호 · 내역구분이 있어야 할 자리의 값이 코드표에 없습니다.</div>' +
          '<div class="sc-dim">앞 24byte: <span class="sc-val">' + esc(row.head) + '</span></div>'
        : row.diag
          ? '<b class="sc-bad">' + esc(row.diag.head) + '</b> — ' + esc(row.diag.where) +
            (row.diag.extra ? '<div class="sc-dim">남은 값: <span class="sc-val">' + esc(row.diag.extra) + '</span></div>' : '') +
            (row.diag.lost.length
              ? '<div class="sc-dim">빠진 필드 ' + row.diag.lost.length + '개: ' +
                esc(row.diag.lost.slice(0, 6).join(' · ')) + (row.diag.lost.length > 6 ? ' …' : '') + '</div>'
              : '')
          : row.struct ? '<span class="sc-dim">길이는 맞습니다</span>' : '<span class="sc-ok">맞습니다</span>';
      const struct = row.struct ? '<div><b class="sc-bad">' + esc(row.struct) + '</b></div>' : '';
      t += '<tr class="sc-row' + (isBad ? ' sc-hit' : '') + '" data-key="' + key + '">' +
        '<td>' + esc(r.name) + '<br><span class="sc-dim">' + row.no + '줄</span></td>' +
        '<td>' + scWhoCell(row, rec) + '</td>' +
        '<td>' + (rec
            ? '<span class="tag an">' + esc(rec.key) + '</span> ' + esc(rec.name) +
              '<div class="sc-dim">' + esc(row.by) + ' 판별</div>'
            : '<span class="sc-dim">—</span>') + '</td>' +
        '<td>' + (row.form ? '<span class="code"><b>' + esc(row.form) + '</b></span>' : '<span class="sc-dim">—</span>') + '</td>' +
        '<td class="sc-num">' + row.len.toLocaleString() + '</td>' +
        '<td class="sc-num">' + (rec ? rec.allowed.join(' / ') : '—') + '</td>' +
        '<td>' + struct + why + '</td></tr>';
    });
  });
  if (hidden) t += '<tr><td colspan="7" class="sc-dim">줄이 너무 많아 500줄까지만 보여 줍니다 (' + hidden.toLocaleString() + '줄 생략).</td></tr>';
  if (!shown) t += '<tr><td colspan="7" style="text-align:center;padding:22px;">' +
    '<span class="sc-ok">모든 줄의 길이가 서식과 맞습니다.</span></td></tr>';
  $('sc-rows').innerHTML = t + '</tbody></table>';
}

/* 명일련번호 · 수진자 칸.
   청구서(H)는 명세서 하나를 가리키는 줄이 아니라 명일련번호가 없다.
   레코드를 판별하지 못한 줄은 표준 앞머리(청구번호 1~10 · 명일련번호 11~15)로 읽은 값이라 그렇게 적어 준다. */
function scWhoCell(row, rec){
  if (rec && rec.key === 'H')
    return '<span class="sc-dim">청구서 — 명세서 단위가 아닙니다</span>';
  const seq = row.seq == null ? '' : row.seq.trim();
  const parts = [];
  parts.push(seq ? '<span class="sc-seq">' + esc(seq) + '</span>'
                 : '<span class="sc-dim">명일련 못 읽음</span>');
  parts.push(row.pname ? '<div>' + esc(row.pname) + '</div>'
                       : '<div class="sc-dim">이름은 일반내역(A)에 있습니다</div>');
  if (row.guessed) parts.push('<div class="sc-dim">앞 15byte 로 읽음 (레코드 판별 전)</div>');
  return parts.join('');
}

/* 필드별로 잘라 보여 준다 — 어디서 끊겼는지 · 숫자 칸에 숫자가 아닌 값이 있는지 */
function scBreak(rec, row){
  const b = row.bytes;
  const numBad = scNumBad(rec, b);
  const badPos = {};
  numBad.forEach(x => { badPos[x.pos] = 1; });

  let h = '';
  if (numBad.length)
    h += '<div class="sc-warn">숫자 칸에 숫자가 아닌 값이 있습니다 — <b>' + esc(numBad[0].name) +
      '(위치 ' + numBad[0].pos + ')</b> 부터 밀린 것으로 보입니다. 짐작이니 아래 표에서 확인해 주세요.</div>';

  h += '<table class="fields sc-fields"><thead><tr><th>위치</th><th>길이</th><th>형식</th>' +
    '<th>항목명</th><th>값</th></tr></thead><tbody>';
  rec.layout.fields.forEach(f => {
    const end = f.pos + f.len - 1;
    const cut = f.pos > b.length ? 'gone' : end > b.length ? 'cut' : '';
    let v = cut === 'gone' ? '' : scText(scSlice(b, f));
    if (v.length > 90) v = v.slice(0, 90) + '…';
    h += '<tr' + (cut || badPos[f.pos] ? ' class="sc-hit"' : '') + '>' +
      '<td class="sc-num">' + f.pos + ' ~ ' + end + '</td>' +
      '<td class="sc-num">' + f.len + '</td>' +
      '<td><span class="tag ' + esc(f.mode) + '">' + esc(f.mode) + '</span></td>' +
      '<td>' + esc(f.name) + '</td>' +
      '<td><span class="sc-val">' + esc(v) + '</span>' +
        (cut === 'gone' ? '<span class="sc-bad"> 줄이 여기까지 오지 않았습니다</span>'
         : cut === 'cut' ? '<span class="sc-bad"> 이 칸 안에서 끊겼습니다 (' + (b.length - f.pos + 1) + '/' + f.len + 'byte)</span>'
         : badPos[f.pos] ? '<span class="sc-bad"> 숫자 칸에 맞지 않는 값</span>' : '') +
      '</td></tr>';
  });
  if (row.diag && !row.diag.short)
    h += '<tr class="sc-hit"><td class="sc-num">' + (row.diag.near + 1) + ' ~ ' + b.length + '</td>' +
      '<td class="sc-num">' + row.diag.diff + '</td><td></td>' +
      '<td><b class="sc-bad">서식에 없는 부분</b></td>' +
      '<td><span class="sc-val">' + esc(scText(b.subarray(row.diag.near))) + '</span></td></tr>';
  return h + '</tbody></table>';
}

/* ---------- 파일 그대로 보기 팝업 ----------
   어긋난 줄을 누르면 뜬다. 파일 전체를 한 번에 그리면(줄 수천 · 줄마다 2,096byte) 화면이 멎으므로
   그 줄 앞뒤로 창을 열어 보여 주고, 「더 보기」로 넓힌다. 줄번호로 바로 갈 수도 있다.
   기본은 칸 안에서 접어 보여 준다 — 「한 줄로」를 고르면 이 상자 안에서만 좌우로 움직인다
   (페이지에 가로 스크롤은 만들지 않는다는 전제는 그대로다). */
const SC_WIN = 60;         // 처음 보여 주는 앞뒤 줄 수
const SC_MORE = 200;       // 「더 보기」 한 번에 넓히는 줄 수

function scIsBad(row){ return !!(row.blank || !row.rec || row.diag || row.struct); }

// 표에 뜬 것과 같은 순서로 모은 어긋난 줄 — 팝업의 이전/다음이 이 목록을 따라간다
function scBadList(){
  const out = [];
  (SC.res || []).forEach((r, fi) => r.rows.forEach(row => { if (scIsBad(row)) out.push({fi, no: row.no}); }));
  return out;
}

// 커서를 처음 놓는 자리 — 어긋난 자리(짧으면 끊긴 곳, 길면 서식에 없는 첫 바이트)로 데려간다
function scCaretStart(row){
  if (!row || row.blank || !row.len) return 1;
  const d = row.diag;
  if (d && d.short) return row.len;
  if (d && !d.short) return Math.min(row.len, d.near + 1);
  return 1;
}

function scOpenView(fi, no){
  const r = (SC.res || [])[fi];
  if (!r) return;
  SC.view = {fi, no, from: Math.max(1, no - SC_WIN), to: Math.min(r.lines.length, no + SC_WIN)};
  SC.caret = scCaretStart(r.rows.find(x => x.no === no));
  $('sc-modal').classList.add('on');
  scDrawView(true);
}
function scCloseView(){ $('sc-modal').classList.remove('on'); }
function scViewOpen(){ return $('sc-modal').classList.contains('on'); }

// 줄번호를 바꿔 다시 그린다 — 창 밖으로 나가면 그 줄을 가운데 두고 창을 다시 잡는다
function scGoLine(no, keepCaret){
  const v = SC.view, r = SC.res[v.fi];
  no = Math.max(1, Math.min(r.lines.length, no));
  const was = v.no;
  v.no = no;
  const len = r.lines[no - 1].length;
  SC.caret = keepCaret ? Math.max(1, Math.min(len, SC.caret || 1))
                       : scCaretStart(r.rows.find(x => x.no === no));
  if (no < v.from || no > v.to){
    v.from = Math.max(1, no - SC_WIN);
    v.to = Math.min(r.lines.length, no + SC_WIN);
    scDrawView(true);
    return;
  }
  // 창 안이면 두 줄만 다시 그린다 — 줄이 수백 개면 전체를 다시 그릴 이유가 없다
  scPaintLine(was);
  scPaintLine(no);
  $('scln-' + was) && $('scln-' + was).classList.remove('cur');
  $('scln-' + no) && $('scln-' + no).classList.add('cur');
  $('sc-goto').value = no;
  scShowPos(no, SC.caret);
  scScrollCaret();
}

// 그 줄 하나만 다시 그린다
function scPaintLine(no){
  const v = SC.view, r = SC.res[v.fi], el = $('scln-' + no);
  if (!el || no < 1 || no > r.lines.length) return;
  const row = r.rows.find(x => x.no === no);
  el.querySelector('.tx').innerHTML =
    scLineHtml(r.lines[no - 1], row, v.fi, no, no === v.no ? SC.caret : 0);
}
function scScrollCaret(){
  const el = $('scln-' + SC.view.no);
  const car = el && el.querySelector('.car');
  (car || el) && (car || el).scrollIntoView({block: 'nearest', inline: 'nearest'});
}

// 커서를 바이트 단위로 옮긴다. step 이 'field' 면 필드 경계로 건너뛴다.
function scMoveCaret(d, step){
  const v = SC.view, r = SC.res[v.fi];
  const b = r.lines[v.no - 1], row = r.rows.find(x => x.no === v.no);
  if (!b || !b.length) return;
  let next;
  if (step === 'field' && row && row.rec){
    const f = scFieldAt(row.rec, SC.caret);
    if (d < 0){
      const prev = row.rec.layout.fields.filter(x => x.pos < (f ? f.pos : SC.caret)).pop();
      next = f && SC.caret > f.pos ? f.pos : prev ? prev.pos : 1;
    } else {
      const nxt = row.rec.layout.fields.find(x => x.pos > SC.caret);
      next = nxt ? nxt.pos : b.length;
    }
  } else if (step === 'end'){
    next = d < 0 ? 1 : b.length;
  } else {
    next = SC.caret + d;
  }
  SC.caret = Math.max(1, Math.min(b.length, next));
  scPaintLine(v.no);
  scShowPos(v.no, SC.caret);
  scScrollCaret();
}

/* ---------- 바이트 자리 ↔ 글자 자리 ----------
   EUC-KR 은 한글이 2byte 라 글자 수와 바이트 수가 다르다. 화면에서 커서가 짚는 것은 글자인데
   알려 줘야 하는 것은 바이트 자리이므로, 줄마다 "글자 i 의 첫 바이트 자리"를 만들어 둔다.
   CP949 규칙(0x00~0x7F 는 1byte 한 글자, 0x81~0xFE 로 시작하면 2byte 한 글자)으로 훑고,
   TextDecoder 가 낸 글자 수와 맞는지 확인한다 — 어긋나면 자리를 셀 수 없다고 알린다. */
let SC_MAPS = {};
function scMapOf(fi, no, b){
  const key = fi + ':' + no;
  if (SC_MAPS[key]) return SC_MAPS[key];
  // 줄마다 글자 수만큼 배열을 만든다 — 훑고 지나간 줄이 쌓이면 비운다
  if (Object.keys(SC_MAPS).length > 400) SC_MAPS = {};
  const starts = [];
  for (let i = 0; i < b.length; ){
    starts.push(i + 1);
    i += (b[i] >= 0x81 && b[i] <= 0xFE && i + 1 < b.length) ? 2 : 1;
  }
  const txt = scText(b);
  return (SC_MAPS[key] = {starts, txt, ok: starts.length === txt.length});
}
// 글자 자리 → 바이트 자리(1부터) / 바이트 자리 → 글자 자리
function scCharToByte(map, ci){
  if (!map.starts.length) return 0;
  return map.starts[Math.max(0, Math.min(map.starts.length - 1, ci))];
}
function scByteToChar(map, byte){
  let lo = 0, hi = map.starts.length - 1, at = 0;
  while (lo <= hi){
    const mid = (lo + hi) >> 1;
    if (map.starts[mid] <= byte){ at = mid; lo = mid + 1; } else hi = mid - 1;
  }
  return at;
}
function scFieldAt(rec, byte){
  if (!rec) return null;
  return rec.layout.fields.find(f => byte >= f.pos && byte <= f.pos + f.len - 1) || null;
}

/* 줄 하나를 그린다. 커서가 없고 어긋난 꼬리도 없으면 글자 그대로 내보낸다(빠른 길).
   커서가 있으면 글자마다 (서식에 없는 자리 · 커서가 든 필드 · 커서) 를 매겨 같은 것끼리 묶어 낸다. */
function scLineHtml(b, row, fi, no, caret){
  const d = row && row.diag;
  const cutTail = d && d.short
    ? '<i class="cut">여기서 끊김 · ' + d.diff.toLocaleString() + 'byte 모자람</i>' : '';
  const exFrom = d && !d.short ? d.near + 1 : 0;
  const map = (caret || exFrom) ? scMapOf(fi, no, b) : null;
  if (!map || !map.ok) return esc(scText(b)) + cutTail;

  const fld = caret && row && row.rec ? scFieldAt(row.rec, caret) : null;
  const st = map.starts;
  let html = '', run = '', runCls = null;
  const flush = () => {
    if (!run) return;
    html += runCls ? '<span class="' + runCls + '">' + esc(run) + '</span>' : esc(run);
    run = '';
  };
  for (let i = 0; i < st.length; i++){
    const from = st[i], to = (i + 1 < st.length ? st[i + 1] : b.length + 1) - 1;
    let cls = '';
    if (exFrom && to >= exFrom) cls += ' ex';
    if (fld && to >= fld.pos && from <= fld.pos + fld.len - 1) cls += ' fld';
    if (caret && from <= caret && to >= caret) cls += ' car';
    cls = cls.slice(1);
    if (cls !== runCls){ flush(); runCls = cls; }
    run += map.txt[i];
  }
  flush();
  return html + cutTail;
}

function scRawHtml(r){
  const v = SC.view;
  const byNo = {};
  r.rows.forEach(row => { byNo[row.no] = row; });
  let h = '';
  if (v.from > 1)
    h += '<div class="sc-more"><button class="btn" data-more="up">↑ 앞 ' +
      Math.min(SC_MORE, v.from - 1).toLocaleString() + '줄 더 보기</button>' +
      '<button class="btn" data-more="top">맨 앞으로</button></div>';
  h += '<div class="sc-raw' + (SC.vwrap ? '' : ' nowrap') + '">';
  for (let n = v.from; n <= v.to; n++){
    const b = r.lines[n - 1], row = byNo[n];
    h += '<div class="ln' + (row && scIsBad(row) ? ' bad' : '') + (n === v.no ? ' cur' : '') +
        '" id="scln-' + n + '" data-no="' + n + '">' +
      '<span class="no">' + n.toLocaleString() + '<i>' + b.length.toLocaleString() + 'b</i></span>' +
      '<span class="tx">' + scLineHtml(b, row, v.fi, n, n === v.no ? SC.caret : 0) + '</span></div>';
  }
  h += '</div>';
  if (v.to < r.lines.length)
    h += '<div class="sc-more"><button class="btn" data-more="down">↓ 뒤 ' +
      Math.min(SC_MORE, r.lines.length - v.to).toLocaleString() + '줄 더 보기</button>' +
      '<button class="btn" data-more="end">맨 뒤로</button></div>';
  return h;
}

/* 커서 자리 알림 — 몇 줄 몇 byte 이고, 그 자리가 어느 필드이며 그 필드에 무엇이 들었는지.
   커서를 갖다 댄 것(hover)과 방향키로 옮긴 것(caret) 둘 다 같은 띠에 적는다. */
function scShowPos(no, byte, hover){
  const v = SC.view, r = SC.res[v.fi];
  const b = r.lines[no - 1];
  if (!b){ $('sc-pos').innerHTML = ''; return; }
  const map = scMapOf(v.fi, no, b);
  if (!map.ok){
    $('sc-pos').innerHTML = '<b>' + no.toLocaleString() + '줄</b> · ' +
      '<span class="sc-bad">바이트 자리를 셀 수 없습니다</span> — EUC-KR 로 읽히지 않는 바이트가 있습니다.';
    return;
  }
  const row = r.rows.find(x => x.no === no);
  const parts = [(hover ? '커서 ' : '방향키 ') + '<b>' + no.toLocaleString() + '줄 ' +
                 byte.toLocaleString() + ' byte</b> <span class="sc-dim">/ ' + b.length.toLocaleString() + 'byte</span>'];
  const f = row && row.rec ? scFieldAt(row.rec, byte) : null;
  if (f){
    const end = f.pos + f.len - 1;
    parts.push('<b>' + esc(f.name) + '</b> <span class="sc-dim">' + f.pos + '~' + end +
      ' · ' + f.len + 'byte · ' + esc(f.mode) + '</span>');
    parts.push('이 필드의 ' + (byte - f.pos + 1) + '번째 byte');
    let val = scText(scSlice(b, f));
    if (val.length > 40) val = val.slice(0, 40) + '…';
    parts.push('값 <span class="sc-val">' + esc(val) + '</span>');
    if (end > b.length) parts.push('<span class="sc-bad">이 필드는 줄이 끊겨 다 오지 않았습니다</span>');
  } else if (row && row.rec){
    parts.push('<span class="sc-bad">서식에 없는 자리</span>' +
      ' <span class="sc-dim">(' + esc(row.rec.key) + ' ' + esc(row.rec.name) + ' 은 ' +
      row.rec.full.toLocaleString() + 'byte 까지입니다)</span>');
  } else {
    parts.push('<span class="sc-dim">레코드를 판별하지 못해 필드를 짚을 수 없습니다</span>');
  }
  $('sc-pos').innerHTML = parts.join(' · ');
}

/* 커서가 짚은 글자 자리 — .tx 안의 텍스트 노드를 훑어 앞쪽 글자 수를 더한다.
   끝에 붙는 「여기서 끊김」 꼬리표(.cut)는 원본 글자가 아니므로 센 것에서 빼야 한다. */
function scCharUnderPointer(tx, x, y){
  let node = null, off = 0;
  if (document.caretPositionFromPoint){
    const p = document.caretPositionFromPoint(x, y);
    if (!p) return -1;
    node = p.offsetNode; off = p.offset;
  } else if (document.caretRangeFromPoint){
    const rg = document.caretRangeFromPoint(x, y);
    if (!rg) return -1;
    node = rg.startContainer; off = rg.startOffset;
  }
  if (!node || !tx.contains(node)) return -1;
  const walk = document.createTreeWalker(tx, NodeFilter.SHOW_TEXT);
  let total = 0, n, gi = -1;
  while ((n = walk.nextNode())){
    if (n.parentNode && n.parentNode.classList && n.parentNode.classList.contains('cut')) continue;
    if (n === node){ gi = total + off; break; }
    total += n.nodeValue.length;
  }
  if (gi < 0) return -1;
  // caretPositionFromPoint 는 "글자 사이" 자리를 준다 — 글자의 오른쪽 절반을 짚으면 다음 글자 번호가 온다.
  // 앞 글자의 사각형 안에 그 점이 들어 있으면 앞 글자로 되돌린다(그 점이 실제로 덮고 있는 글자).
  if (off > 0){
    const rg = document.createRange();
    rg.setStart(node, off - 1); rg.setEnd(node, off);
    const rc = rg.getBoundingClientRect();
    if (x >= rc.left && x <= rc.right && y >= rc.top && y <= rc.bottom) return gi - 1;
  }
  return gi;
}

/* 커서를 갖다 대면 그 자리를 알려 준다. 너무 자주 계산하지 않도록 16ms 로 묶는다 —
   requestAnimationFrame 은 쓰지 않는다(창이 화면에 없으면 콜백이 오지 않아 값이 멈춘다). */
let scHoverAt = 0;
$('sc-modal-body').addEventListener('mousemove', e => {
  if (SC.vtab !== 'raw') return;
  const now = performance.now();
  if (now - scHoverAt < 16) return;
  scHoverAt = now;
  const ln = e.target.closest ? e.target.closest('.ln') : null;
  if (!ln) return;
  const no = Number(ln.dataset.no);
  const b = SC.res[SC.view.fi].lines[no - 1];
  if (!b) return;
  const ci = scCharUnderPointer(ln.querySelector('.tx'), e.clientX, e.clientY);
  scShowPos(no, ci < 0 ? 1 : scCharToByte(scMapOf(SC.view.fi, no, b), ci), true);
});
// 커서가 빠져나가면 방향키 자리로 되돌린다
$('sc-modal-body').addEventListener('mouseleave', () => {
  if (SC.view) scShowPos(SC.view.no, SC.caret);
});
// 줄을 누르면 그 자리로 커서를 옮긴다
$('sc-modal-body').addEventListener('click', e => {
  if (SC.vtab !== 'raw') return;
  const ln = e.target.closest && e.target.closest('.ln');
  if (!ln) return;
  const no = Number(ln.dataset.no);
  const b = SC.res[SC.view.fi].lines[no - 1];
  const ci = scCharUnderPointer(ln.querySelector('.tx'), e.clientX, e.clientY);
  const byte = ci < 0 ? 1 : scCharToByte(scMapOf(SC.view.fi, no, b), ci);
  if (no !== SC.view.no) scGoLine(no, true);
  SC.caret = Math.max(1, Math.min(b.length || 1, byte));
  scPaintLine(no);
  scShowPos(no, SC.caret);
});

function scDrawView(scroll){
  const v = SC.view, r = SC.res[v.fi];
  const row = r.rows.find(x => x.no === v.no);

  $('sc-modal-title').textContent = r.name;
  const bits = ['<b>' + v.no.toLocaleString() + '줄</b> / 전체 ' + r.lines.length.toLocaleString() + '줄'];
  if (row && !row.blank){
    bits.push(row.len.toLocaleString() + 'byte');
    if (row.rec) bits.push(esc(row.rec.key) + ' ' + esc(row.rec.name) + ' (허용 ' + row.rec.allowed.join(' / ') + ')');
    const seq = row.seq == null ? '' : row.seq.trim();
    if (row.rec && row.rec.key !== 'H' && (seq || row.pname))
      bits.push('명일련 ' + esc(seq || '?') + (row.pname ? ' · ' + esc(row.pname) : ''));
  }
  if (row && row.struct) bits.push('<b class="sc-bad">' + esc(row.struct) + '</b>');
  else if (row && row.diag) bits.push('<b class="sc-bad">' + esc(row.diag.head) + ' — ' + esc(row.diag.where) + '</b>');
  else if (row && row.blank) bits.push('<b class="sc-bad">빈 줄</b>');
  else if (row && !row.rec) bits.push('<b class="sc-bad">레코드를 판별하지 못했습니다</b>');
  $('sc-modal-sub').innerHTML = bits.join(' · ');

  $('sc-modal-view').innerHTML =
    '<button class="chip' + (SC.vtab === 'raw' ? ' on' : '') + '" data-tab="raw">파일 그대로</button>' +
    '<button class="chip' + (SC.vtab === 'fields' ? ' on' : '') + '" data-tab="fields">필드별로</button>';
  $('sc-wrap').textContent = SC.vwrap ? '한 줄로' : '접어 보기';
  $('sc-wrap').style.display = SC.vtab === 'raw' ? '' : 'none';
  $('sc-goto').value = v.no;

  if (SC.vtab === 'fields'){
    $('sc-modal-body').innerHTML = row && row.rec
      ? '<div class="card"><div class="card-pad">' + scBreak(row.rec, row) + '</div></div>'
      : '<div class="empty">레코드를 판별하지 못한 줄은 필드로 나눌 수 없습니다. 「파일 그대로」로 보세요.</div>';
  } else {
    $('sc-modal-body').innerHTML = scRawHtml(r);
  }

  const bad = scBadList();
  const at = bad.findIndex(x => x.fi === v.fi && x.no === v.no);
  $('sc-mv-prev').disabled = at <= 0;
  $('sc-mv-next').disabled = at < 0 || at >= bad.length - 1;
  $('sc-modal-foot').innerHTML = (at >= 0
      ? '어긋난 줄 <b>' + (at + 1) + '</b> / ' + bad.length + '번째'
      : '이 줄은 어긋난 줄 목록에 없습니다') +
    ' · <b>← →</b> 한 byte씩 · <b>Ctrl+← →</b> 필드 경계로 · <b>Home End</b> 줄 끝으로' +
    ' · <b>↑ ↓</b> 앞뒤 줄 · <b>Shift+← →</b> 앞뒤 어긋난 줄 · <b>Esc</b> 닫기' +
    ' · 줄 번호를 적고 Enter 로 그 줄로 갑니다 · 파일은 이 브라우저 안에서만 읽습니다';

  $('sc-pos').style.display = SC.vtab === 'raw' ? '' : 'none';
  if (SC.vtab === 'raw') scShowPos(v.no, SC.caret);

  if (scroll && SC.vtab === 'raw'){
    const el = $('scln-' + v.no);
    if (el) el.scrollIntoView({block: 'center'});
    scScrollCaret();
  }
}

// 팝업 안 단추들
$('sc-modal-close').addEventListener('click', scCloseView);
$('sc-modal-scrim').addEventListener('click', scCloseView);
$('sc-wrap').addEventListener('click', () => { SC.vwrap = !SC.vwrap; scDrawView(true); });
$('sc-modal-view').addEventListener('click', e => {
  const b = e.target.closest('.chip');
  if (!b) return;
  SC.vtab = b.dataset.tab;
  scDrawView(true);
});
/* 앞뒤 어긋난 줄로. 지금 줄이 목록에 없으면(방향키로 옮겨 다니다 보면 그렇게 된다)
   그 줄을 기준으로 바로 앞/뒤에 있는 어긋난 줄로 간다. */
function scStepBad(d){
  const bad = scBadList(), v = SC.view;
  const at = bad.findIndex(x => x.fi === v.fi && x.no === v.no);
  let next;
  if (at >= 0) next = bad[at + d];
  else if (d > 0) next = bad.find(x => x.fi > v.fi || (x.fi === v.fi && x.no > v.no));
  else next = bad.filter(x => x.fi < v.fi || (x.fi === v.fi && x.no < v.no)).pop();
  if (next) scOpenView(next.fi, next.no);
}
$('sc-mv-prev').addEventListener('click', () => scStepBad(-1));
$('sc-mv-next').addEventListener('click', () => scStepBad(1));
$('sc-goto').addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const n = parseInt($('sc-goto').value, 10);
  if (!isNaN(n)) scGoLine(n);
});
$('sc-modal-body').addEventListener('click', e => {
  const b = e.target.closest('[data-more]');
  if (!b) return;
  const v = SC.view, r = SC.res[v.fi];
  if (b.dataset.more === 'up')   v.from = Math.max(1, v.from - SC_MORE);
  if (b.dataset.more === 'top')  v.from = 1;
  if (b.dataset.more === 'down') v.to = Math.min(r.lines.length, v.to + SC_MORE);
  if (b.dataset.more === 'end')  v.to = r.lines.length;
  scDrawView(false);
});
/* 키 배치 — 방향키는 바이트 커서를 옮긴다(사용자 요청). 앞뒤 어긋난 줄은 Shift 를 같이 누른다. */
document.addEventListener('keydown', e => {
  if (!scViewOpen()) return;
  if (e.key === 'Escape'){ scCloseView(); return; }
  if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
  if (SC.vtab !== 'raw') return;
  const step = (e.ctrlKey || e.altKey || e.metaKey) ? 'field' : '';
  switch (e.key){
    case 'ArrowLeft':  e.preventDefault(); e.shiftKey ? scStepBad(-1) : scMoveCaret(-1, step); break;
    case 'ArrowRight': e.preventDefault(); e.shiftKey ? scStepBad(1)  : scMoveCaret(1, step);  break;
    case 'ArrowUp':    e.preventDefault(); scGoLine(SC.view.no - 1, true); break;
    case 'ArrowDown':  e.preventDefault(); scGoLine(SC.view.no + 1, true); break;
    case 'Home':       e.preventDefault(); scMoveCaret(-1, 'end'); break;
    case 'End':        e.preventDefault(); scMoveCaret(1, 'end');  break;
  }
});

/* ---------- 파일 받기 ---------- */
async function scTakeFiles(fileList){
  const list = [];
  for (const file of Array.from(fileList)){
    const bytes = new Uint8Array(await file.arrayBuffer());
    const bom = bytes.length >= 3 && bytes[0] === 0xEF && bytes[1] === 0xBB && bytes[2] === 0xBF;
    const split = scSplitLines(bytes);
    list.push({name: file.name, bytes, bom, enc: scEncNote(bytes), lines: split.lines, nl: split.nl});
  }
  SC.list = list;
  scCloseView();
  SC.forced = false;
  const det = scDetectClaim(list);
  SC.cands = det.cands;
  SC.claim = det.best;
  SC.why = det.why;
  scRender();
}

$('sc-pick').addEventListener('click', () => $('sc-file').click());
$('sc-file').addEventListener('change', e => { if (e.target.files.length) scTakeFiles(e.target.files); });
$('sc-clear').addEventListener('click', () => {
  SC.list = []; SC.claim = ''; SC.why = ''; SC.cands = []; scCloseView();
  $('sc-file').value = '';
  scRender();
});

/* 놓는 자리는 화면 전체다 — 결과를 보는 동안 놓는 상자가 얇은 띠로 줄어들기 때문에,
   표 위에 놓아도 받는다. 이 화면이 열려 있을 때만 가로챈다(다른 화면의 드래그를 건드리지 않는다). */
const scDropZone = $('sc-drop');
function scDropOn(){ return $('page-samcheck').classList.contains('on'); }
['dragenter', 'dragover'].forEach(ev => document.addEventListener(ev, e => {
  if (!scDropOn()) return;
  e.preventDefault(); scDropZone.classList.add('over');
}));
document.addEventListener('dragleave', e => {
  if (!scDropOn()) return;
  if (e.relatedTarget) return;               // 창 밖으로 나갈 때만 표시를 끈다
  scDropZone.classList.remove('over');
});
document.addEventListener('drop', e => {
  if (!scDropOn()) return;
  e.preventDefault();
  scDropZone.classList.remove('over');
  if (e.dataTransfer && e.dataTransfer.files.length) scTakeFiles(e.dataTransfer.files);
});

scRender();
