/* ================= ④ 항 · 목 ================= */
/* 별도 데이터 파일이 없다. SAM 레이아웃(js/layout-*.js)의 진료내역 레코드가 이미
   "항" 필드의 코드표와, 항별 목번호를 담은 mokMap 을 들고 있어서 그대로 꺼내 쓴다.
   레이아웃을 새로 복사해 오면 이 화면도 자동으로 따라간다. */
const hm = { claim: 'GEN' };

// 항·목을 가진 레코드(대개 진료내역 C, DRG는 F도 있다)를 청구분야별로 찾는다
function hangmokRecords(claimKey){
  const L = CLAIM_TYPES[claimKey].layouts;
  const out = [];
  for (const rk of Object.keys(L)){
    const lay = L[rk];
    const hangField = lay.fields.find(f => f.name === '항' && f.codes);
    if (hangField || lay.mokMap) out.push({ rec: rk, name: lay.name, hang: hangField, mok: lay.mokMap || {} });
  }
  return out;
}
function hangmokClaims(){
  return availableClaims().filter(([k]) => hangmokRecords(k).some(r => r.hang || Object.keys(r.mok).length));
}
function renderHmClaims(){
  $('hm-claims').innerHTML = hangmokClaims().map(([key, label]) =>
    '<button class="chip' + (key === hm.claim ? ' on' : '') + '" data-k="' + key + '">' + esc(label) + '</button>'
  ).join('');
  $('hm-claims').querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => { hm.claim = c.dataset.k; renderHmClaims(); renderHm(); });
  });
}

// 항 코드 순서는 스펙에 적힌 순서(codesOrder)를 따르고, mokMap 에만 있는 항은 뒤에 붙인다
function hangRows(r){
  const codes = r.hang ? r.hang.codes : {};
  const order = r.hang ? codesOrder(codes).slice() : [];
  for (const k of Object.keys(r.mok)) if (!order.includes(k)) order.push(k);
  return order.map(k => ({ code: k, name: codes[k] || '', mok: r.mok[k] || null }));
}

function renderHm(){
  const needle = $('hm-search').value.trim().toLowerCase();
  const all = $('hm-all').checked;
  const claims = all ? hangmokClaims().map(c => c[0]) : [hm.claim];

  let html = '', total = 0, shown = 0;
  for (const ck of claims){
    for (const r of hangmokRecords(ck)){
      let rows = hangRows(r);
      total += rows.length;
      if (needle){
        rows = rows.filter(h => {
          if (sgHit(h.code + ' ' + h.name, needle)) return true;
          if (!h.mok) return false;
          return Object.keys(h.mok).some(m => sgHit(m + ' ' + h.mok[m], needle));
        });
      }
      if (!rows.length) continue;
      shown += rows.length;

      html += '<div class="hm-rec">' + esc(claimLabel(ck)) + ' · ' + esc(r.rec) + ' ' + esc(r.name) + '</div>';
      html += '<table class="fields hm"><thead><tr><th>항</th><th>항 이름</th><th>목</th></tr></thead><tbody>';
      for (const h of rows){
        const mokKeys = h.mok ? codesOrder(h.mok) : [];
        html += '<tr>' +
          '<td class="hm-code">' + esc(h.code) + '</td>' +
          '<td class="hm-name">' + esc(h.name || '—') + '</td>' +
          '<td class="hm-mok">' + (mokKeys.length
            ? mokKeys.map(m => '<span class="code' +
                (needle && sgHit(m + ' ' + h.mok[m], needle) ? ' mark' : '') +
                '"><b>' + esc(m) + '</b><span>' + esc(h.mok[m]) + '</span></span>').join('')
            : '<span class="saved-note">목 구분 없음</span>') + '</td>' +
        '</tr>';
      }
      html += '</tbody></table>';
    }
  }

  $('hm-meta').innerHTML =
    (all ? '<span><b>모든 청구분야</b></span>' : '<span><b>' + esc(claimLabel(hm.claim)) + '</b></span>') +
    '<span>항 <b>' + (needle ? shown + '</b> / ' + total : total + '</b>') + '</span>' +
    '<span class="meta-note">SAM 레이아웃의 진료내역 레코드에서 추출</span>';
  $('hm-body').innerHTML = html || '<div class="empty">검색 결과가 없습니다.</div>';
}
$('hm-search').addEventListener('input', renderHm);
$('hm-all').addEventListener('change', renderHm);
renderHmClaims(); renderHm();
