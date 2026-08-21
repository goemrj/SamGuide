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
const DT_COLW = ['7%', '15%', '9%', '13%', '8%', '9%', '39%'];
const DT_TKEY = 'detail#dt';

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

// 줄 묶음 → 표. 첫 줄이 짧은 칸들로만 되어 있으면 머리줄로 본다.
function dtTableHtml(lines, bs, mark){
  const rows = lines.map(l => dtSplitAt(l, bs));
  const n = bs.length + 1;
  const head = rows[0] && rows[0].every(c => c.length <= 12) && rows[0].filter(c => c).length >= 2
             ? rows[0] : null;
  const headKey = head ? head.map(dtNorm).join('|') : null;

  let html = '<table class="dt-tb">';
  if (head) html += '<thead><tr>' + head.map(c => '<th>' + mark(c) + '</th>').join('') + '</tr></thead>';
  html += '<tbody>';
  rows.forEach((r, i) => {
    if (head && i === 0) return;
    if (!r){                                            // 칸을 가로지르는 줄 — 한 칸으로
      html += '<tr class="wide"><td colspan="' + n + '">' + mark(dtNorm(lines[i])) + '</td></tr>';
      return;
    }
    const rehead = headKey && r.map(dtNorm).join('|') === headKey;
    /* 원문에서 한 칸이 여러 줄로 넘어간 줄 — 첫 칸이나 마지막 칸이 비어 있다.
       가로선을 지워 위 줄과 한 칸처럼 읽히게 한다(글자는 그대로 둔다). */
    const cont = !rehead && i > 0 && (!r[0] || !r[r.length - 1]);
    html += '<tr' + (rehead ? ' class="rehead"' : (cont ? ' class="cont"' : '')) + '>' +
      r.map(c => '<td>' + (c ? mark(c) : '') + '</td>').join('') + '</tr>';
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

// 한 묶음(빈 줄 · ※ · ☞ 로 끊긴 구간) 을 표 · 예시 · 글줄로 그린다
function dtRunHtml(lines, mark){
  if (lines.every(l => DT_EXLINE.test(l))) return dtExHtml(lines, mark);

  const indent = Math.min.apply(null, lines.map(l => {
    const i = l.search(/\S/); return i < 0 ? 9999 : i;
  }));
  let bs = dtBoundaries(lines, 0, 9999, indent, 0);
  if (!bs.length) return dtLinesHtml(lines, mark);

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
  if (rest.length < 2) return dtLinesHtml(lines, mark);

  // 표만 남기고 경계를 다시 잰다 (앞 글줄이 섞이면 자리가 흔들린다)
  const ind2 = Math.min.apply(null, rest.map(l => {
    const j = l.search(/\S/); return j < 0 ? 9999 : j;
  }));
  bs = dtBoundaries(rest, 0, 9999, ind2, 0);
  if (!bs.length) return dtLinesHtml(lines, mark);

  const full = l => { const c = dtSplitAt(l, bs); return !!c && c.filter(x => x).length >= 2; };

  /* 기재 예시(구분코드 + 값)가 여러 줄 이어지면 그것도 칸이 맞아 보이지만 표가 아니다.
     칸이 맞은 줄의 반 이상이 예시 줄이면 표로 세우지 않고 예시 상자 + 글줄로 그린다. */
  const solid = rest.filter(full);
  if (solid.filter(l => DT_EXLINE.test(l)).length * 2 > solid.length)
    return dtLinesHtml(lines, mark);

  /* 표 뒤에 붙은 각주(* · ※ · ☞ 로 시작하는 줄)는 표 밖으로 뺀다.
     그 밖의 줄은 원문에서 칸을 넘어 이어진 줄이므로 표 안에 그대로 둔다. */
  let j = rest.length;
  while (j > 0 && !full(rest[j - 1]) && /^\s*[*※☞]/.test(rest[j - 1])) j--;
  const post = rest.slice(j), body = rest.slice(0, j);
  if (body.length < 2) return dtLinesHtml(lines, mark);

  return (pre.length ? dtLinesHtml(pre, mark) : '') +
         dtTableHtml(body, bs, mark) +
         (post.length ? dtLinesHtml(post, mark) : '');
}


function dtDocHtml(body, mark){
  // ♦ 로 시작하는 줄에서 항목을 자른다
  const items = [];
  body.split('\n').forEach(l => {
    if (/^\s*[♦◆]/.test(l) || !items.length) items.push([]);
    items[items.length - 1].push(l);
  });

  return items.map(lines => {
    let html = '';
    if (/^\s*[♦◆]/.test(lines[0])){
      html += '<div class="dt-dia">' + mark(dtNorm(lines[0].replace(/^\s*[♦◆]\s*/, ''))) + '</div>';
      lines = lines.slice(1);
    }
    /* 묶음을 나누는 자리 — 빈 줄(PDF 에서 표가 끊긴 자리)과 ※ · ☞ 로 시작하는 줄.
       ※ 는 표 앞머리에도 표 뒤 주석에도 나오므로 거기서 끊어야 표가 섞이지 않는다. */
    let run = [];
    const flush = () => { if (run.length){ html += dtRunHtml(run, mark); run = []; } };
    lines.forEach(l => {
      if (dtNorm(l) === ''){ flush(); return; }
      if (/^\s*(※|☞)/.test(l)) flush();
      run.push(l);
    });
    flush();
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
  const head = ['구분코드', '특정내역명', '내역구분', '기재형식', '분야', '적용기간', '작성요령 (통합본)'];
  const saved = colwOf(DT_TKEY, head.length);     // common.js — 열 개수가 같을 때만 돌려준다
  const colw  = saved ? saved.map(n => n + 'px') : DT_COLW;
  let html = '<table class="fields dt fixed" data-k="' + DT_TKEY + '"><thead><tr>' +
    head.map((h, i) => '<th style="width:' + colw[i] + '">' + esc(h) + '</th>').join('') +
    '</tr></thead><tbody>' +
    rows.map(d => {
      const body = dtBody(d);
      let tr = '<tr' + (d.cur ? '' : ' class="dt-past"') + '>' +
        '<td class="dt-code">' + mark(d.code) + '</td>' +
        '<td class="dt-name">' + mark(d.name) + '</td>' +
        '<td class="dt-rec">' + esc(d.rec) + '</td>' +
        '<td class="dt-fmt">' + mark(d.format) + '</td>' +
        '<td class="dt-field">' + fieldTags(d) + '</td>' +
        '<td class="dt-when">' + esc(ymd(d.from) || '?') + ' ~ ' + esc(ymd(d.to)) +
          (d.cur ? '' : '<span class="ftag old">지난 판</span>') + '</td>' +
        '<td class="dt-guide-cell">' + (d.guide ? mark(d.guide) : '<span class="saved-note">—</span>') +
        '</td></tr>';

      // 세부작성요령은 칸 안에 넣으면 너무 좁다 — 그 줄 아래에 표 전체 폭으로 펼친다
      if (body){
        tr += '<tr class="dt-bodyrow"><td colspan="' + head.length + '">' +
              '<div class="dt-sec">세부작성요령 (2025.8.1. ' + d.page + '쪽)</div>' +
              '<div class="dt-doc">' + dtDocHtml(body, mark) + '</div></td></tr>';
      }
      return tr;
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
