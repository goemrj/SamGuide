/* ---------- ⑤ 특정내역 ----------
   데이터(data/detail-codes.js)는 「특정내역코드_통합본.xlsx」가 마스터이고,
   세부작성요령 PDF의 자세한 작성요령(body)이 현재 판에만 붙어 있다.

   화면은 다른 카테고리와 같은 한 장의 표다(목록 + 상세 두 칸 구조를 걷어냈다).
   필터는 SAM 파일 레이아웃과 같은 두 줄 — 분야는 네모 칩(대분류),
   내역구분은 밝은 하이라이트 pill(소분류).
   세부작성요령은 접지 않고 코드마다 그 줄 아래에 원문 모양대로 펼쳐 둔다.      */
const dt = { field: '', rec: '', showOld: false };
const DT_FIELDS = ['의과', '산재', '자보', 'DRG', '신DRG', '한방', '요양병원'];
const DT_RECS   = ['일반내역', '진료내역', '처방일반내역', '처방줄단위내역'];

/* 열 너비 기본값 — ① 본인부담금 규칙과 같은 방식으로 **% 로** 적는다(합 100).
   px 로 박으면 창이 좁은 PC 에서 표가 창을 넘겨 가로 스크롤이 생긴다(전체 전제 위반).
   머리줄 손잡이로 끌어 바꾼 값이 있으면 그쪽이 이기고, 그 값은 그 브라우저에만 남는다. */
const DT_COLW = ['8%', '17%', '75%'];
const DT_TKEY = 'detail#dt3';

function dtBase(){
  return dt.showOld ? DETAIL_CODES : DETAIL_CODES.filter(d => d.cur);
}
function dtMatch(d){
  if (dt.field && !d.fields.includes(dt.field)) return false;
  if (dt.rec && d.rec !== dt.rec) return false;
  return true;
}
function renderDtFilters(){
  const base = dtBase();
  chipRow($('dt-fields'), DT_FIELDS, dt.field, '전체 분야',
    v => base.filter(d => (!v || d.fields.includes(v)) && (!dt.rec || d.rec === dt.rec)).length,
    v => { dt.field = v; renderDtFilters(); renderDtTable(); });
  chipRow($('dt-recs'), DT_RECS, dt.rec, '전체 내역구분',
    v => base.filter(d => (!v || d.rec === v) && (!dt.field || d.fields.includes(dt.field))).length,
    v => { dt.rec = v; renderDtFilters(); renderDtTable(); });
}
// 세부작성요령 본문은 원본 변환에서 줄바꿈이 "\n" 두 글자로 들어와 있다 —
// 원본 글자는 그대로 두고 화면에 그릴 때만 실제 줄바꿈으로 바꾼다.
function dtBody(d){
  return String(d.body || '').replace(/\\n/g, '\n');
}
function dtHaystack(d){
  return (d.code + ' ' + d.name + ' ' + d.format + ' ' + d.guide + ' ' + dtBody(d)).toLowerCase();
}
function fieldTags(d){
  if (d.onlyPdf) return '<span class="ftag none">분야 미상</span>';
  if (!d.fields.length) return '<span class="saved-note">—</span>';
  return d.fields.map(f => '<span class="ftag">' + esc(f) + '</span>').join('');
}
const dtId = d => d.code + '|' + d.from;

/* ================= 세부작성요령 본문 그리기 =================
   본문은 세부작성요령 PDF 를 `pdftotext -table` 로 뽑은 것이라,
   ♦ 항목 · ※ 주석과 함께 **칸을 공백으로 맞춘 표가 글자 그림으로** 섞여 있다.
   여기서 하는 일은 원문의 모양을 다시 세우는 것뿐이다 — 글자는 하나도 바꾸지 않는다.

     ♦ 로 시작하는 줄        → 항목 하나 (작성요령 · 기재형식 · (예시) · 적용일 …)
     <…> 만 있는 줄          → 그 아래 표의 이름
     칸이 맞은 줄 묶음        → <table> (아래 dtBoundary 가 칸 경계를 찾는다)
     구분코드 + 값 인 줄      → 기재 예시 표 (PDF 의 예시 상자)
     그 밖의 줄              → 글줄. PDF 양끝맞춤으로 벌어진 공백만 한 칸으로 줄인다

   표의 행은 **원문 한 줄 = 표 한 줄** 이다. 원문에서 한 칸이 여러 줄로 넘어간 것을
   묶어 한 행으로 만들지 않는다 — 어디서 행이 끝나는지는 글자만 보고 알 수 없고,
   잘못 묶으면 심사 기준이 틀어진다. 첫 칸이 빈 줄은 위 줄에 이어지는 줄이므로
   가로선을 그리지 않아 원문처럼 한 칸으로 읽힌다.                                */

/* --- 칸 경계 찾기 ---
   원문 한 줄에서 폭 2 이상인 공백 띠가 칸 사이를 벌린다. 어느 컬럼이 칸 경계인지는
   **여러 줄이 같은 자리에서 벌어져 있는지**(3줄 이상)로 정한다 — pdftotext 가 맞춘
   칸은 한 컬럼씩 어긋나 있어서 "모든 줄이 공백"으로는 못 찾고, 반대로 PDF 양끝맞춤으로
   벌어진 글줄이 표로 잡히는 것도 막아야 한다.                                     */

// c 를 품는 공백 띠 [시작, 끝]. 줄 끝 뒤는 끝없는 띠(Infinity)로 본다. 한 칸 공백은 아니다.
function dtRunAt(line, c){
  if (c >= line.length) return [line.length, Infinity];
  if (line.charAt(c) !== ' ') return null;
  let s = c, e = c;
  while (s > 0 && line.charAt(s - 1) === ' ') s--;
  while (e < line.length - 1 && line.charAt(e + 1) === ' ') e++;
  if (e === line.length - 1) return [s, Infinity];
  return (e - s + 1) >= 2 ? [s, e] : null;
}
const dtText = (line, from, to) =>
  line.slice(from, to === Infinity ? undefined : to).trim() !== '';

// (lo, hi) 안에서 가장 많은 줄이 벌어져 있는 컬럼. 3줄 미만이면 경계가 아니다.
function dtBoundary(lines, lo, hi, indent){
  const w = Math.max.apply(null, lines.map(l => l.length));
  let best = -1, bestN = 2;
  for (let c = Math.max(lo, indent + 1); c < Math.min(hi, w); c++){
    let n = 0;
    lines.forEach(l => {
      const r = dtRunAt(l, c);
      if (!r || r[0] <= indent) return;                 // 왼쪽 들여쓰기는 경계가 아니다
      if (!dtText(l, lo, r[0])) return;                 // 왼쪽에 글자가 있어야 한다
      if (!dtText(l, r[1] === Infinity ? l.length : r[1] + 1, hi)) return;
      n++;
    });
    if (n > bestN){ bestN = n; best = c; }
  }
  return best;
}
// 경계를 왼쪽·오른쪽으로 더 찾아 여러 칸 표(제출자료별 세부코드 등)도 세운다
function dtBoundaries(lines, lo, hi, indent, depth){
  const c = dtBoundary(lines, lo, hi, indent);
  if (c < 0 || depth >= 4) return [];
  return dtBoundaries(lines, lo, c, indent, depth + 1)
    .concat([c], dtBoundaries(lines, c + 1, hi, indent, depth + 1));
}
/* 한 줄을 경계로 나눈다. 글자는 그대로 두고 앞뒤 공백만 떼낸다.
   그 줄이 경계에서 벌어져 있지 않으면(칸을 가로지르면) null — 표 안에서 한 줄을
   통째로 쓰는 줄(원문에서 칸을 넘어 이어진 줄)로 그린다. */
function dtSplitAt(line, bs){
  const cells = [];
  let from = 0;
  for (const c of bs){
    if (c < from){ cells.push(''); continue; }
    const r = dtRunAt(line, c);
    if (r && r[0] >= from){
      cells.push(dtNorm(line.slice(from, r[0])));
      from = r[1] === Infinity ? line.length : r[1] + 1;
    } else if (line.slice(from).search(/\S/) + from > c){
      cells.push('');                                   // 이 칸은 비었고 글자는 뒤 칸부터
    } else {
      return null;
    }
  }
  cells.push(dtNorm(line.slice(from)));
  return cells;
}
const dtNorm = s => s.replace(/\s+/g, ' ').trim();

/* 본문 표에 붙이는 이름 — 열 너비를 손으로 바꾼 값을 다시 찾아오기 위한 것이다(common.js).
   검색·필터로 표를 다시 그려도 같은 이름이 나오도록 "코드|적용일자|그 코드 안에서 몇 번째 표"
   로 만든다(화면 순서로 세면 필터 때마다 어긋난다). dtDocHtml 이 코드마다 세워 준다. */
let dtDocKey = '', dtTblN = 0;

/* --- 첫 칸(구분)의 병합 되살리기 ---
   원문 표의 구분 칸은 여러 행을 묶는 병합 셀이고, PDF 는 그 글자를 묶음 **가운데**에 놓는다.
   그래서 텍스트에서는 구분 글자가 묶음 중간의 한두 줄에만 나온다.
     진료 / 기록부  → 6행을 묶는 "진료기록부" 한 칸
   글자가 나온 줄묶음(아래 blk)을 찾고, 묶음 사이 빈 구간의 **가운데**를 경계로 본다.
   글자는 이어 붙일 뿐 바뀌지 않는다("진료"+"기록부" = "진료기록부").
   구분 칸이 행마다 값을 갖는 표(MT018 의 M001·M002 …)는 병합하지 않는다 — 아래 조건으로 가른다. */
function dtSpans(rows){
  if (rows.some(r => !r)) return null;                 // 칸을 가로지르는 줄이 섞이면 손대지 않는다
  if (!rows.some(r => !r[0])) return null;             // 첫 칸이 행마다 차 있으면 병합이 아니다
  const blk = [];
  rows.forEach((r, i) => {
    if (!r[0]) return;
    const last = blk[blk.length - 1];
    if (last && last.to === i - 1) last.to = i;
    else blk.push({from: i, to: i});
  });
  if (!blk.length || blk.length * 2 > rows.length) return null;
  // 병합 셀의 글자는 짧다(구분 이름). 길거나 여러 줄이면 그냥 값이 든 칸으로 본다.
  const text = b => rows.slice(b.from, b.to + 1).map(r => r[0]).join('');
  if (!blk.every(b => b.to - b.from < 3 && text(b).length <= 12)) return null;

  const out = [];
  blk.forEach((b, i) => {
    const start = i === 0 ? 0
      : (() => { const p = blk[i - 1]; return p.to + 1 + Math.round((b.from - p.to - 1) / 2); })();
    out.push({start, text: text(b)});
  });
  out.forEach((g, i) => { g.end = (i + 1 < out.length ? out[i + 1].start : rows.length) - 1; });
  return out.every(g => g.start <= g.end) ? out : null;
}

/* --- 마지막 칸이 여러 줄로 넘어간 것을 한 칸으로 합치기 ---
   원문 표는 칸 폭에 맞춰 글자를 끊어 넣는다. 화면의 칸은 그보다 넓어서 그 끊김이
   뜻 없는 줄바꿈으로 보인다(MT018 M013 의 "노숙인 1종"). 마지막 칸만 채워진 줄은
   앞이나 뒤 행의 마지막 칸에 이어 붙인다.

   어느 행에 붙는지 — PDF 는 구분코드를 칸 **가운데** 줄에 놓으므로 조각이 코드 줄
   위에 오는 경우(B007)도 아래에 오는 경우(M013)도 있다. 아래 순서로 가른다.
     ① "- " · "·" · "1." 로 시작하면 같은 칸의 **새 줄머리**다 → 앞 행에 줄바꿈으로 붙인다
     ② 여는·닫는 괄호나 조사(에서·을·의 …)로 시작하면 앞 글자에 딱 붙는다 → 앞 행, 공백 없이
     ③ 앞 행의 마지막 칸이 ')' 로 끝나고(문장이 닫혔다) 뒤 행이 새 코드로 시작하면 → 뒤 행
     ④ 그 밖에는 앞 행

   띄어쓰기 — 원문은 칸 끝에서 글자를 끊을 때 공백을 남기지 않아 PDF 글자만으로는
   그 자리에 공백이 있었는지 알 수 없다. 그래서 **붙여 쓸 근거가 있을 때만** 붙이고
   그 밖에는 공백을 넣는다(근거: 열린 괄호가 안 닫힌 채 끊겼거나, 붙여 쓴 꼴이
   세부작성요령 다른 줄에 실제로 나오거나). 판단 근거는 README 에 적어 두었다. */
const DT_PARTICLE = /^(에서|에게|에|을|를|이|가|은|는|의|와|과|으로|로|부터|까지|만|도|라|나)(?![가-힣])/;
const DT_BULLET   = /^([-·*]\s|[0-9]+[.)]\s|[①-⑳])/;
let DT_CORPUS = null;
function dtCorpus(){
  if (DT_CORPUS !== null) return DT_CORPUS;
  // 줄을 넘어 붙이지 않는다 — 지금 합치려는 그 자리가 근거로 잡히면 안 된다
  const parts = [];
  DETAIL_CODES.forEach(d => {
    if (d.guide) parts.push(dtNorm(d.guide));
    String(d.body || '').replace(/\\n/g, '\n').split('\n').forEach(l => parts.push(dtNorm(l)));
  });
  DT_CORPUS = '' + parts.join('') + '';
  return DT_CORPUS;
}
// 붙여 써야 하는가 (공백 없이 이어야 하는가)
function dtNoGap(prev, frag){
  if (!prev || !frag) return true;
  if (/^[)\]」｣.,·]/.test(frag)) return true;      // 닫는 괄호·마침표는 앞말에 붙는다
  if (/^\(/.test(frag)) return true;               // "외래진료(2종)" 처럼 여는 소괄호도 붙는다
  if (/^[「｢\[]/.test(frag)) return false;          // 법령 이름 앞은 띄운다
  if (DT_PARTICLE.test(frag)) return true;         // 조사는 앞말에 붙는다
  // 괄호를 연 **직후**에 끊긴 경우 — 낱말 가운데가 잘렸다("만성질환자(의료" + "급여 …")
  if (/[(\[「｢][^)\]」｣]{0,3}$/.test(prev)) return true;
  /* 붙여 쓴 꼴이 세부작성요령 다른 줄에 실제로 있는지 본다.
     앞말 끝·뒷말 머리를 네 글자씩 보고, 그 창으로 판가름이 안 나면 두 글자씩 다시 본다
     ("…선택의료급"+"여기관이" 는 두 글자 창(료급+여기)에서 "선택의료급여기관" 이 걸린다). */
  const tailW = (prev.match(/\S+$/) || [''])[0];
  const headW = (frag.match(/^\S+/) || [''])[0];
  if (!tailW || !headW) return false;
  const c = dtCorpus();
  const count = s => { let n = 0, i = 0; while ((i = c.indexOf(s, i)) >= 0){ n++; i++; } return n; };
  for (const w of [4, 2]){
    const a = tailW.slice(-w), b = headW.slice(0, w);
    if (a.length < w || b.length < w) continue;
    const fused = count(a + b), spaced = count(a + ' ' + b);
    if (fused && !spaced) return true;
    if (spaced && !fused) return false;
    // 두 꼴이 다 있으면 더 자주 쓰인 쪽을 따른다 ("외래진료" 가 "외래 진료" 보다 흔하다)
    if (fused && spaced && fused !== spaced) return fused > spaced;
  }
  return false;                                    // 판가름이 안 나면 띄어 쓴다(흔한 쪽)
}
/* 조각 줄을 앞뒤 행의 마지막 칸에 이어 붙인다. rows·lines 를 줄인 새 배열을 돌려준다. */
function dtJoinFrags(rows, lines){
  const n = rows.reduce((m, r) => Math.max(m, r ? r.length : 0), 0);
  if (n < 2) return {rows: rows, lines: lines};
  const R = rows.slice(), L = lines.slice();
  const isFrag = i => {
    const r = R[i];
    return !!r && r.length === n && !!r[n - 1] && r.slice(0, n - 1).every(c => !c);
  };
  const lastOf = i => (R[i] ? R[i][n - 1] : '');

  for (let i = R.length - 1; i > 0; i--){          // 뒤에서부터 — 여러 줄이 이어져도 한 번에 접힌다
    if (!isFrag(i)) continue;
    const frag = R[i][n - 1];
    const prev = R[i - 1], next = R[i + 1];
    const bullet = DT_BULLET.test(frag);
    let to = -1;
    if (!bullet && !/^[)\]」｣.,]/.test(frag) && !DT_PARTICLE.test(frag) &&
        prev && lastOf(i - 1) && /\)$/.test(lastOf(i - 1)) && next && next[0])
      to = i + 1;                                   // 뒤 행으로
    else if (prev && lastOf(i - 1)) to = i - 1;      // 앞 행으로
    if (to < 0) continue;

    if (to === i - 1){
      const sep = bullet ? '\n' : (dtNoGap(lastOf(to), frag) ? '' : ' ');
      R[to] = R[to].slice(); R[to][n - 1] = lastOf(to) + sep + frag;
    } else {
      const sep = DT_BULLET.test(lastOf(to)) ? '\n' : (dtNoGap(frag, lastOf(to)) ? '' : ' ');
      R[to] = R[to].slice(); R[to][n - 1] = frag + sep + lastOf(to);
    }
    R.splice(i, 1); L.splice(i, 1);
  }
  return {rows: R, lines: L};
}

/* 줄 묶음(쪽마다 하나) → 표 하나. 첫 줄이 짧은 칸들로만 되어 있으면 머리줄로 본다.
   chunks = [{lines, bs}, …] — 쪽이 넘어가며 갈라진 것을 한 표로 그린다. */
function dtTableHtml(chunks, mark){
  const rows = [], lines = [];
  chunks.forEach(c => {
    const cand = c.lines.map(l => dtSplitAt(l, c.bs));
    /* 첫 칸의 왼쪽 끝 — 칸이 두 개 이상 채워진 줄들이 글자를 시작하는 자리.
       원문에서 칸 안의 글자가 다음 줄로 넘어간 것을 pdftotext 가 줄 맨 왼쪽에 놓는 일이 있어,
       그 자리보다 **왼쪽에서 시작하는 줄**이 생긴다(MT018 M013·M014 의 "노숙인 1종").
       어느 칸에 딸린 글자인지는 글자만 보고 알 수 없으므로 — 앞 줄에 붙이면 M013,
       뒤 줄에 붙이면 B007 이 맞다 — 첫 칸에 밀어넣지 않고 한 칸으로 통째로 그린다. */
    let edge = 9999;
    c.lines.forEach((l, i) => {
      if (cand[i] && cand[i].filter(x => x).length >= 2) edge = Math.min(edge, l.search(/\S/));
    });
    c.lines.forEach((l, i) => {
      let cc = cand[i];
      if (cc && cc[0] && cc.filter(x => x).length === 1 && l.search(/\S/) < edge) cc = null;
      lines.push(l); rows.push(cc);
    });
  });
  const n = Math.max.apply(null, chunks.map(c => c.bs.length + 1));
  const head = rows[0] && rows[0].every(c => c.length <= 12) && rows[0].filter(c => c).length >= 2
             ? rows[0] : null;
  const headKey = head ? head.map(dtNorm).join('|') : null;

  // 머리줄을 뺀 본문 줄에서 조각 줄을 합치고, 그 다음에 구분 칸의 병합을 본다
  const joined = dtJoinFrags(head ? rows.slice(1) : rows, head ? lines.slice(1) : lines);
  const body = joined.rows, bodyLines = joined.lines;
  const spans = dtSpans(body);
  const spanAt = i => spans && spans.find(g => g.start === i);
  const inSpan = i => spans && spans.some(g => i > g.start && i <= g.end);

  let html = '<table class="dt-tb" data-k="' + esc('dtb|' + dtDocKey + '|' + (dtTblN++)) + '">';
  if (head) html += '<thead><tr>' + head.map(c => '<th>' + mark(c) + '</th>').join('') + '</tr></thead>';
  html += '<tbody>';
  body.forEach((r, i) => {
    if (!r){                                            // 칸을 가로지르는 줄 — 한 칸으로
      html += '<tr class="wide"><td colspan="' + n + '">' + mark(dtNorm(bodyLines[i])) + '</td></tr>';
      return;
    }
    const rehead = headKey && r.map(dtNorm).join('|') === headKey;
    /* 원문에서 한 칸이 여러 줄로 넘어간 줄 — 첫 칸이나 마지막 칸이 비어 있다.
       가로선을 지워 위 줄과 한 칸처럼 읽히게 한다(글자는 그대로 둔다).
       구분 칸을 병합한 표에서는 첫 칸이 비는 게 정상이므로 마지막 칸만 본다. */
    const cont = !rehead && i > 0 && (spans ? !r[r.length - 1] : (!r[0] || !r[r.length - 1]));
    const g = spanAt(i);
    const cls = rehead ? ' class="rehead"' : (g && i > 0 ? ' class="gstart"' : (cont ? ' class="cont"' : ''));
    html += '<tr' + cls + '>' +
      r.map((c, j) => {
        if (j === 0 && spans){
          if (inSpan(i)) return '';                     // 병합된 칸 — 묶음 첫 줄이 대신 그린다
          const rs = g ? g.end - g.start + 1 : 1;
          return '<td class="grp"' + (rs > 1 ? ' rowspan="' + rs + '"' : '') + '>' +
                 mark(g ? g.text : c) + '</td>';
        }
        // 합친 칸 안의 줄머리("- " 로 시작하는 항목)는 줄을 나눠 그린다
        return '<td>' + (c ? mark(c).replace(/\n/g, '<br>') : '') + '</td>';
      }).join('') + '</tr>';
  });
  return html + '</tbody></table>';
}

const DT_EXLINE = /^\s*([A-Z]{2}[0-9]{3})\s{2,}(\S.*)$/;   // 예시: 구분코드 + 기재값
const DT_CAPTION = /^\s*<[^<>]+>\s*$/;                     // <본인부담구분코드> 같은 표 이름
const DT_BREAK   = /^\s*(※|☞|-|·|[0-9]+\.|\()/;            // 여기서 글줄을 새로 시작한다

// 기재 예시 줄 묶음 → 두 칸 표 (PDF 의 예시 상자)
function dtExHtml(lines, mark){
  return '<table class="dt-tb dt-ex"><tbody>' + lines.map(l => {
    const m = l.match(DT_EXLINE);
    return '<tr><td class="c">' + mark(m[1]) + '</td><td>' + mark(m[2].trim()) + '</td></tr>';
  }).join('') + '</tbody></table>';
}
// 표가 아닌 줄들 — 표 이름 · 기재 예시 · 글줄
function dtLinesHtml(lines, mark){
  let html = '', buf = [], mode = '';
  const flush = () => {
    if (!buf.length) return;
    if (mode === 'ex') html += dtExHtml(buf, mark);
    else {
      // PDF 양끝맞춤으로 벌어진 공백만 한 칸으로 줄이고, ※ · ☞ · 번호에서 줄을 나눈다
      const out = [];
      buf.forEach(l => {
        const t = dtNorm(l);
        if (!t) return;
        if (!out.length || DT_BREAK.test(l)) out.push(t);
        else out[out.length - 1] += ' ' + t;
      });
      html += out.map(t =>
        '<div class="dt-ln' + (/^(※|☞)/.test(t) ? ' note' : '') + '">' + mark(t) + '</div>').join('');
    }
    buf = [];
  };
  lines.forEach(l => {
    if (DT_CAPTION.test(l)){ flush(); mode = ''; html += '<div class="dt-cap">' + mark(dtNorm(l)) + '</div>'; return; }
    const m = DT_EXLINE.test(l) ? 'ex' : 'p';
    if (m !== mode){ flush(); mode = m; }
    buf.push(l);
  });
  flush();
  return html;
}

/* 한 묶음(빈 줄 · ※ · ☞ 로 끊긴 구간)을 앞 글줄 / 표 / 뒤 각주로 가른다.
   표는 {lines, bs} 묶음(chunk)으로 넘긴다 — PDF 쪽이 넘어가며 갈라진 표를 나중에
   한 표로 이어 붙일 때, **쪽마다 칸 위치가 다르므로 경계(bs)도 쪽마다 따로** 들고 있어야 한다.
   (줄만 이어 붙이면 두 쪽의 칸이 어긋나 안 쪼개지는 줄이 생긴다.) */
function dtRunParts(lines){
  if (lines.every(l => DT_EXLINE.test(l))) return {pre: lines};

  const indent = Math.min.apply(null, lines.map(l => {
    const i = l.search(/\S/); return i < 0 ? 9999 : i;
  }));
  let bs = dtBoundaries(lines, 0, 9999, indent, 0);
  if (!bs.length) return {pre: lines};

  /* 표 앞에 붙은 글줄(※ 머리글 · <표 이름> 등)을 떼어낸다.
     표의 첫 줄은 칸이 두 개 이상 채워진 줄이어야 한다 — 짧아서 경계 뒤가 빈 줄은
     칸이 맞은 것처럼 보이지만 실은 표 앞 글줄이다. */
  let i = 0;
  while (i < lines.length){
    const c = dtSplitAt(lines[i], bs);
    if (c && c.filter(x => x).length >= 2) break;
    i++;
  }
  const pre = lines.slice(0, i), rest = lines.slice(i);
  if (rest.length < 2) return {pre: lines};

  // 표만 남기고 경계를 다시 잰다 (앞 글줄이 섞이면 자리가 흔들린다)
  const ind2 = Math.min.apply(null, rest.map(l => {
    const j = l.search(/\S/); return j < 0 ? 9999 : j;
  }));
  bs = dtBoundaries(rest, 0, 9999, ind2, 0);
  if (!bs.length) return {pre: lines};

  const full = l => { const c = dtSplitAt(l, bs); return !!c && c.filter(x => x).length >= 2; };

  /* 기재 예시(구분코드 + 값)가 여러 줄 이어지면 그것도 칸이 맞아 보이지만 표가 아니다.
     칸이 맞은 줄의 반 이상이 예시 줄이면 표로 세우지 않고 예시 상자 + 글줄로 그린다. */
  const solid = rest.filter(full);
  if (solid.filter(l => DT_EXLINE.test(l)).length * 2 > solid.length) return {pre: lines};

  /* 표 뒤에 붙은 각주는 표 밖으로 뺀다 — 맨 끝에서 칸이 안 맞는 줄들을 묶어 보고,
     그 안에 * · ※ · ☞ 로 시작하는 줄이 있으면 각주 덩어리로 본다(둘째 줄부터는
     글머리표가 없다). 각주가 아니면 원문에서 칸을 넘어 이어진 줄이므로 표 안에 둔다. */
  let k = rest.length;
  while (k > 0 && !full(rest[k - 1])) k--;
  const j = rest.slice(k).some(l => /^\s*[*※☞]/.test(l)) ? k : rest.length;
  const post = rest.slice(j), tbl = rest.slice(0, j);
  if (tbl.length < 2) return {pre: lines};

  return {pre: pre, tbl: {chunks: [{lines: tbl, bs: bs}]}, post: post};
}


function dtDocHtml(body, mark, key){
  dtDocKey = key || '';                     // 이 코드 안의 표들에 붙일 이름 (열 너비 저장용)
  dtTblN = 0;
  // ♦ 로 시작하는 줄에서 항목을 자른다
  const items = [];
  body.split('\n').forEach(l => {
    if (/^\s*[♦◆]/.test(l) || !items.length) items.push([]);
    items[items.length - 1].push(l);
  });

  return items.map(lines => {
    let html = '', headText = '';
    if (/^\s*[♦◆]/.test(lines[0])){
      headText = dtNorm(lines[0].replace(/^\s*[♦◆]\s*/, ''));
      html += '<div class="dt-dia">' + mark(headText) + '</div>';
      lines = lines.slice(1);
    }
    /* 「적용일」·「기재형식」 항목은 표가 아니다 — 여러 줄이 날짜·형식으로 자리가 맞아
       표로 잡히는 일이 있어(MT064 의 적용일 3줄) 여기서는 글줄로만 그린다. */
    if (/^(적용일|기재형식)/.test(headText)){
      if (lines.length) html += dtLinesHtml(lines, mark);
      return '<div class="dt-item">' + html + '</div>';
    }
    /* 묶음을 나누는 자리 — 빈 줄(PDF 에서 표가 끊긴 자리)과 ※ · ☞ 로 시작하는 줄.
       ※ 는 표 앞머리에도 표 뒤 주석에도 나오므로 거기서 끊어야 표가 섞이지 않는다. */
    const runs = [];
    let run = [];
    const flush = () => { if (run.length){ runs.push(run); run = []; } };
    lines.forEach(l => {
      if (dtNorm(l) === ''){ flush(); return; }
      if (/^\s*(※|☞)/.test(l)) flush();
      run.push(l);
    });
    flush();

    const parts = runs.map(dtRunParts);

    /* PDF 쪽이 넘어가면서 **같은 머리줄로 다시 시작한** 표는 원문에서 한 표다
       (MT015 제출자료별 세부코드 · MT018 본인부담구분코드 …). 뒤 묶음을 앞 표의
       쪽묶음으로 붙이고 다시 나온 머리줄은 뺀다. 칸 경계는 쪽마다 그대로 둔다. */
    for (let i = parts.length - 1; i > 0; i--){
      const a = parts[i - 1], b = parts[i];
      if (!a.tbl || !b.tbl || (b.pre && b.pre.length)) continue;
      const aHead = dtNorm(a.tbl.chunks[0].lines[0]);
      const bc = b.tbl.chunks[0];
      if (!aHead || dtNorm(bc.lines[0]) !== aHead) continue;
      if (bc.lines.length < 2) continue;
      // b 가 이미 뒤 쪽을 품고 있을 수 있다(쪽이 셋 이상) — 그 쪽묶음까지 다 옮긴다
      b.tbl.chunks.forEach((c, k) => {
        a.tbl.chunks.push(k === 0 ? {lines: c.lines.slice(1), bs: c.bs} : c);
      });
      a.post = (a.post || []).concat(b.post || []);
      parts.splice(i, 1);
    }

    parts.forEach(p => {
      if (p.pre && p.pre.length) html += dtLinesHtml(p.pre, mark);
      if (p.tbl) html += dtTableHtml(p.tbl.chunks, mark);
      if (p.post && p.post.length) html += dtLinesHtml(p.post, mark);
    });
    return '<div class="dt-item">' + html + '</div>';
  }).join('');
}

/* ================= 화면 ================= */
function renderDtTable(){
  const needle = $('dt-search').value.trim().toLowerCase();
  let rows = dtBase().filter(dtMatch);
  if (needle){
    rows = rows.filter(d => dtHaystack(d).includes(needle));
    // 코드를 그대로 친 경우(MT002 등) 그 코드가 먼저 나오게 한다 —
    // 다른 코드의 작성요령이 그 코드를 언급만 해도 검색에는 걸리기 때문
    // 코드 > 특정내역명 > 본문 순으로 앞세운다
    const hit = d => d.code.toLowerCase().includes(needle) ? 0
                   : d.name.toLowerCase().includes(needle) ? 1 : 2;
    rows = rows.slice().sort((a, b) => hit(a) - hit(b));
  }

  $('dt-meta').innerHTML =
    '<span><b>' + esc(dt.field || '전체 분야') + '</b> · ' + esc(dt.rec || '전체 내역구분') + '</span>' +
    '<span>' + rows.length.toLocaleString() + '건' +
      (needle ? ' (검색)' : '') +
      (dt.showOld ? ' · 지난 판 포함' : '') + '</span>' +
    '<span class="meta-note">특정내역코드 통합본 + 세부작성요령(2025.8.1.) Ⅸ장</span>';

  if (!rows.length){
    $('dt-table').innerHTML = '<div class="empty">검색 결과가 없습니다.</div>';
    return;
  }

  const mark = t => hilite(t, needle);
  const head = ['구분코드', '특정내역명', '작성요령 및 기재형식'];
  const saved = colwOf(DT_TKEY, head.length);     // common.js — 열 개수가 같을 때만 돌려준다
  const colw  = saved ? saved.map(n => n + 'px') : DT_COLW;
  let html = '<table class="fields dt fixed" data-k="' + DT_TKEY + '"><thead><tr>' +
    head.map((h, i) => '<th style="width:' + colw[i] + '">' + esc(h) + '</th>').join('') +
    '</tr></thead><tbody>' +
    rows.map(d => {
      const body = dtBody(d);
      /* 작성요령 칸은 세부작성요령 PDF 의 「작성요령」 단을 그대로 옮긴 것이다.
         PDF 에 없는 코드(통합본에만 있는 것)는 통합본의 작성요령·기재형식을 쓴다. */
      let doc = '<div class="dt-src">' + (body
        ? '세부작성요령 (2025.8.1. ' + d.page + '쪽)'
        : '특정내역코드 통합본 — 세부작성요령에 없는 코드') + '</div>';
      if (body){
        doc += dtDocHtml(body, mark, dtId(d));
      } else {
        doc += (d.guide ? '<div class="dt-item"><div class="dt-ln">' + mark(d.guide) + '</div></div>' : '') +
               '<div class="dt-item"><div class="dt-dia">기재형식: ' + mark(d.format) + '</div></div>';
      }
      // 맨 마지막에 분야 (통합본 값이라 원문 항목과 구분해 둔다)
      doc += '<div class="dt-fld"><b>분야</b>' + fieldTags(d) + '</div>';

      return '<tr' + (d.cur ? '' : ' class="dt-past"') + '>' +
        '<td class="dt-code">' + mark(d.code) +
          (d.cur ? '' : '<span class="ftag old">지난 판 ~' + esc(ymd(d.to)) + '</span>') + '</td>' +
        '<td class="dt-name">' + mark(d.name) + '</td>' +
        '<td class="dt-guide-cell"><div class="dt-doc">' + doc + '</div></td></tr>';
    }).join('') + '</tbody></table>';

  $('dt-table').innerHTML = html;
}
$('dt-search').addEventListener('input', renderDtTable);
$('dt-old').addEventListener('change', () => {
  dt.showOld = $('dt-old').checked;
  renderDtFilters(); renderDtTable();
});
renderDtFilters();
renderDtTable();
