/* ---------- 자동차보험 한방(오리엔탈) 명세서 — DRG/산재처럼 청구서(C010)+명세서(A~E)가 파일 여러 개로
   나뉜다. 의·치과 자보(js/layout-jabo.js)와 달리 내역구분(A/B/C/E 구분 문자) 필드 자체가 없고 —
   서식번호(C110/C111)가 그 위치를 대신 차지해 필드가 전부 1바이트씩 앞으로 당겨져 있다 — 처방내역(D)도
   없다. H(청구서, C010)는 의·치과와 위치·길이가 완전히 동일해 LAYOUT_JABO_H를 그대로 재사용. ---------- */

/* 2. 진료수가 명세서 (2) 한방 — 설명·코드값은 「★ 자보 SAM (021).pdf」(=「자동차보험진료수가 심사업무처리에
   관한 규정」 【별첨 2】 전자문서 작성요령)의 「항 목 설 명」 칸 그대로. */
const LAYOUT_JABO_HAN_A = { key:'A', name:'일반내역',
  formGroups:[
    {title:'수진자현황', widthGroup:'main', labels:{'명세서일련번호':'명일련','환자성명':'수진자','환자주민등록번호':'','총내원일수':'입내원일수','진료일수':'진료기간'}, rows:[
      ['명세서일련번호'],
      ['환자성명','환자주민등록번호'],
      ['총내원일수','진료일수'],
      ['진료결과'],
    ]},
    {title:'진료비현황', widthGroup:'main', rows:[
      ['진료비총액','환자납부총액'],
      ['청구액'],
    ]},
    {title:'자동차보험정보', widthGroup:'main', labels:{'보험회사등코드':'보험회사'}, rows:[
      ['보험회사등코드'],
      ['사고접수번호'],
      ['지급보증번호'],
    ]},
    {title:'청구구분', labels:{'명세서일련번호(당초)':'명일련'}, rows:[
      ['청구구분코드','접수번호'],
      ['명세서일련번호(당초)','사유코드'],
      ['최초입원개시일'],
    ]},
  ],
  fields:[
  F(1,10,'an','청구번호','(진료수가 청구서의 항목설명 참조)'),
  F(11,5,'an','명세서일련번호',자보명일련설명),
  F(16,4,'an','서식번호','▪서식번호',{'C110':'자동차보험 한방 입원 진료수가 명세서','C111':'자동차보험 한방 외래 진료수가 명세서'}),
  F(20,8,'an','의료기관기호','(진료수가 청구서와 동일)'),
  F(28,1,'an','청구구분코드','문서 항목명: 청구구분 - 코드\n보완청구, 추가청구(진료내역 일부 누락분 추가청구), 입원 진료수가 분리청구시 구분코드를 기재',{'1':'보완청구','2':'추가청구','3':'분리청구'}),
  F(29,7,'an','접수번호','보완청구, 추가청구, 입원 진료수가 분리청구의 경우 당초 청구한 명세서의 접수번호를 기재'),
  F(36,5,'an','명세서일련번호(당초)','문서 항목명: 명세서일련번호\n보완청구, 추가청구, 입원 진료수가 분리청구의 경우 당초 청구한 명세서의 일련번호를 기재'),
  F(41,2,'an','사유코드','보완청구의 경우 당초 청구한 명세서의 심사불능 사유를 기재'),
  F(43,8,'an','최초입원개시일','입원 진료수가 분리청구의 경우 최초 입원개시일을 기재\n▪유형 : CCYYMMDD'),
  F(51,30,'an','사고접수번호','자동차사고 접수시 보험회사등에서 부여한 일련번호를 기재하되 “-”기재 포함'),
  F(81,17,'an','지급보증번호','자동차보험진료수가의 지급의사와 한도를 통지받은 관리번호를 기재하되 “-”기재 포함'),
  F(98,20,'an','환자성명','환자의 성명을 한글 또는 영문으로 기재'),
  F(118,13,'an','환자주민등록번호','문서 항목명: 환자 주민등록번호\n환자의 주민등록번호를 기재하되 생년월일 다음의 “-”는 기재 생략'),
  F(131,3,'n','진료일수','해당 진료수가 명세서에서 진료를 받은 실 일수를 기재하되, 입원 또는 내원일수에 원내투약일수를 산입하여 기재. 이때 내원 또는 입원일수와 투약일수가 중복될 때에는 1일로 계산함',null,'money'),
  F(134,3,'n','총내원일수','문서 항목명: 입원일수, 총내원일수\n입원 또는 내원하여 진료를 받은 실 일수를 기재',null,'money'),
  F(137,1,'an','진료결과','진료수가 명세서상 최종 진료일의 환자상태를 구분하여 기재\n▪진료결과',{'1':'계속','2':'이송','3':'회송','4':'사망','9':'퇴원 또는 외래 치료종결'}),
  F(138,10,'n','진료비총액','기본진료료, 약제 등 의료기관 종별가산율이 적용되지 않는 진료수가, 의료기관 종별가산율이 적용되는 진료행위료와 가산금액을 합한 총금액을 10원미만 절사하여 기재',null,'money'),
  F(148,10,'n','환자납부총액','환자납부액의 기본진료료, 약제 등 의료기관 종별가산율이 적용되지 않는 진료수가, 의료기관 종별가산율이 포함된 진료행위료를 모두 합하여, 10원미만 절사한 금액을 기재',null,'money'),
  F(158,10,'n','청구액','진료비총액에서 환자납부총액을 제외한 금액을 기재',null,'money'),
  F(168,2,'an','보험회사등코드','문서 항목명: 보험회사등(코드)\n보험회사등(코드)는 “별표 6”에 의해 기재',보험회사코드_자보),
]};

/* 2) 명세서 상병내역 */
const LAYOUT_JABO_HAN_B = { key:'B', name:'상병내역',
  gridOrder:['상병분류구분','상병분류기호','진료과목','내원일자'],
  fields:[
  F(1,10,'an','청구번호','(진료수가 청구서의 항목설명 참조)'),
  F(11,5,'an','명세서일련번호',자보명일련설명),
  F(16,1,'an','상병분류구분','- 각 상병분류기호별 주․부상병, 배제된 상병을 구분하는 구분자로서 상병분류기호별로 반드시 해당 구분자를 기재\n- 구분코드 ‘1’(주상병)은 ‘상병분류기호’ 첫 번째 자리(제1단)의 상병에만 기재\n▪구분코드',{'1':'주상병(진료기간 중 치료나 검사 등에 대한 환자의 요구가 가장 컸던 상병)','2':'부상병(진료기간 중 주상병과 함께 있었거나 발생된 상병으로 환자 진료에 영향을 주었던 상병)','3':'배제된 상병(최종상병이 확진된 경우 이전에 고려하였지만 배제된 상병)'}),
  F(17,6,'an','상병분류기호','- 통계청 고시에 따라 ｢한국표준질병․사인분류｣의 분류기호를 주상병, 부상병, 배제된 상병순으로 기재하되, 주상병은 반드시 첫 번째 자리(제1단)에만 기재하고, 부상병, 배제된 상병은 각각 2개 이상인 경우 중요도 순으로 각각 기재\n- 영문자는 반드시 대문자로 기재하고 ‘‧’ 또는 ‘*’, ‘†’ 등 특수기호는 기재 생략'),
  F(23,2,'an','진료과목','진료를 받은 진료과목(병원급이상) 또는 상병명에 해당하는 진료과목(의원급)을 기재하되, 진료과목이 2개 이상에 해당되는 경우 상병별로 모두 기재하며, 진료과목별 코드는 “별표 3”과 같이 한다'),
  F(25,8,'an','내원일자','문서 항목명: 내원일자, 당월진료개시일\n- 내원일자: 외래 진료수가 명세서의 경우 진료일자를 기재\n- 당월진료개시일: 입원 진료수가 명세서의 경우 의료기관에 해당 상병 진료를 위하여 그 달에 최초 입원한 년·월·일을 기재. 단, 입원 진료수가 분리청구시 해당 진료수가 명세서의 최초 입원일자를 기재\n▪유형：CCYYMMDD'),
]};

const 항번호코드_자보한방 = codesTable([['01','진찰료'],['02','입원료'],['03','투약료'],['04','시술 및 처치료'],['05','검사료'],['11','환자납부액']]);
const 목번호맵_자보한방 = {
  '01':codesTable([['01','초진'],['02','재진'],['99','기타']]),
  '02':codesTable([['01','일반'],['02','내과질환자, 정신질환자, 만8세미만의 소아'],['03','중환자실'],['04','기본식대'],['11','가산식대'],['14','상급병실료'],['99','기타']]),
  '03':codesTable([['01','내복약'],['02','조제․복약지도료'],['99','기타']]),
  '04':codesTable([['01','침술'],['02','구술'],['03','부항술'],['04','처치료'],['05','기타']]),
  '05':codesTable([['01','검사료']]),
  '11':codesTable([['01','진료행위'],['02','의약품'],['03','치료재료']]),
};

/* 3) 명세서 진료내역 */
const LAYOUT_JABO_HAN_C = { key:'C', name:'진료내역',
  gridOrder:['항','목','줄번호','구분','코드','단가','일투','총투','금액','가감등구분','변경일'],
  fields:[
  F(1,10,'an','청구번호','(진료수가 청구서의 항목설명 참조)'),
  F(11,5,'an','명세서일련번호',자보명일련설명),
  F(16,2,'an','항','문서 항목명: 항번호\n“진찰료”항부터 “환자납부액”항까지 6개 항에 부여된 번호 기재',항번호코드_자보한방,null,10),
  F(18,2,'an','목','문서 항목명: 목번호\n6개 항의 소분류 단위로 부여된 번호 기재\n항별 목번호는 「항 · 목 코드」 화면 참조',null,null,10),
  F(20,4,'n','줄번호','진료코드에 일련번호를 4자리 숫자로 부여하되 항, 목 순으로 연이어 부여 기재\n▪유형 (3번째 줄번호인 경우 다음과 같이 기재) - 0003',null,null,10),
  F(24,1,'an','구분','문서 항목명: 코드구분\n코드를 구분하는 구분자로서, 코드를 기재할 경우는 반드시 해당 구분자를 기재\n▪코드구분',{'A':'수가','B':'준용수가, 신의료기술등 급여 결정신청건(행위 및 치료재료 포함)','C':'약제','H':'치료재료'},null,7),
  F(25,9,'an','코드','진료수가, 약제, 치료재료 코드를 기재하며, 코드에 대한 세부내역은 “진료코드” 참조',null,null,20),
  F(34,12,'n','단가','｢상대가치점수표｣상의 점수에 점수당 단가를 곱하여 10원 미만은 4사5입한 금액을 기재\n단, 다음의 경우는 원 미만은 4사5입하여 기재하되, 단가(비용)가 1원 미만인 경우 1원으로 기재\n- 건강보험기준에서의 급여 약제, 치료재료, 원료약 등의 경우는 ｢약제 및 치료재료의 비용에 대한 결정기준｣에 따른 단가\n- 비급여 치료재료 및 비급여 약제는 치료재료 및 비급여 약제 구입내역 통보서상의 단가\n- 신의료기술등의 급여 결정신청건, ｢자동차보험진료수가에 관한 기준｣ 별표2의 항목 중 비용이 정해지지 않은 진료항목은 비용산정 통보서상 비용 또는 단가',null,2),
  F(46,7,'n','일투','문서 항목명: 1일투여량, 투여(실시)횟수\n1일 투여량(소수 셋째자리에서 4사5입하여 소수 둘째자리까지 기재) 또는 투여(실시)횟수를 기재\n개방병원진료 및 시설 등의 공동이용 진료시에는 실시(수탁)한 기관의 종별가산율을 적용하여 기재',null,2),
  F(53,3,'n','총투','문서 항목명: 총투여일수, 실시횟수\n총 투여일수 또는 실시횟수를 기재',null,'money'),
  F(56,10,'n','금액','단가×1일 투여량×총 투여일수(실시횟수)를 계산한 후 원 미만은 4사5입하여 기재. 기준처방에 대하여 감미한 경우는 해당 단미제에 ‘-’ 금액으로 기재',null,'money'),
  F(66,10,'an','가감등구분','문서 항목명: 가감 등 구분\n기준처방에 단미제를 가․감하는 경우나 임의처방의 경우 처방 및 단미제 코드에 다음의 유형으로 해당 코드 기재\n▪유형\n- 기준처방 : B#########\n- 가미제 : A#########\n- 감미제 : S#########\n- 임의처방 및 임의처방에 사용한 단미제 : H#########\n(#########은 한약제제 코드와 동일한 9자리)',null,null,20),
  F(76,8,'an','변경일','다음의(당월진료개시일 이후에 신설되거나 단가가 변경된) 경우 변경(신설)된 단가의 최초 투여(실시)일자를 기재\n▪당월진료개시일 이후에 단가가 변경된 경우\n- 수가 등의 고시가가 변경 고시된 경우\n- 실구입가 인정품목(치료재료 등)을 진료개시일 이후에 구입(조제)하여 사용한 경우\n- 보건복지부에서 실구입가 인정품목 중 가격을 기준단가 범위 내 실구입가로 인정하도록 별도 고시한 품목의 기준단가 기준이 변경된 경우\n- 비용산정 통보서상 해당 진료에 소요되는 실제 비용이 변경된 경우\n▪당월진료개시일 이후에 신설된 경우\n- 수가 항목이 신설되거나 의약품이 신규 등재된 경우 등\n▪유형 : CCYYMMDD',null,null,16),
]};

/* 4) 명세서 특정내역기재란 — 원내투약일수 등을 기재 */
const LAYOUT_JABO_HAN_E = { key:'E', name:'특정내역',
  gridOrder:['발생단위','줄번호','특정내역구분','특정내역'],
  fields:[
  F(1,10,'an','청구번호','(진료수가 청구서의 항목설명 참조)'),
  F(11,5,'an','명세서일련번호',자보명일련설명),
  F(16,1,'an','발생단위','문서 항목명: 발생단위구분\n특정내역기재란 — 원내투약일수 등을 기재\n특정내역 발생 단위별로 해당 구분자를 기재',{'1':'명세서단위','2':'줄번호단위'}),
  F(17,4,'n','줄번호','진료내역의 줄번호단위로 특정내역을 기재할 경우에 해당 줄번호를 4자리 숫자로 기재\n단, 명세서단위의 특정내역인 경우에는 기재하지 않음'),
  F(21,5,'an','특정내역구분','해당 내역의 구분코드를 특정내역 구분란에 기재하고 그에 해당되는 기술사항을 특정내역란에 기재하되, 세부구분코드는 별표 5. “특정내역 구분코드”를 참조'),
  F(26,700,'an','특정내역','해당 내역의 구분코드를 특정내역 구분란에 기재하고 그에 해당되는 기술사항을 특정내역란에 기재하되, 세부구분코드는 별표 5. “특정내역 구분코드”를 참조'),
]};

const LAYOUTS_JABO_HAN = { H:LAYOUT_JABO_H, A:LAYOUT_JABO_HAN_A, B:LAYOUT_JABO_HAN_B, C:LAYOUT_JABO_HAN_C, E:LAYOUT_JABO_HAN_E };

const BLANK_ROW_LEN_JABO_HAN = { B:32, C:83, E:725 };

/* ---------- H(C010)+A~E(C110.1~.4 / C111.1~.4)가 파일 여러 개로 나뉜 것을 한 청구(doc)로 합쳐 파싱.
   DRG의 parseDrgDoc과 동일한 구조 — 소스 파일 자체가 role을 결정하므로 classify() 없이 r.t=role 그대로 부여.
   실샘플 대조 결과 청구서(C010)·일반내역(C110.1)은 CRLF를 쓰지만 상병·진료·특정내역(C110.2~.4)은
   LF만 쓴다 — 파일마다 실제 줄바꿈 방식을 감지해서 그대로 나누고, 저장할 때도 같은 방식을 재사용해
   원본 줄바꿈을 그대로 보존한다(항상 CRLF로 다시 쓰면 원본과 바이트가 달라짐). ---------- */
function detectLineSep(bytes){
  for (let i=0; i<bytes.length; i++){
    if (bytes[i]===10) return (i>0 && bytes[i-1]===13) ? [13,10] : [10];
  }
  return [13,10]; // 레코드가 1건이라 구분자가 안 보이면 기본값
}
function splitRecordsBySep(bytes, startId, sep){
  const records = []; const recById = new Map();
  let start = 0, id = startId||0;
  for (let i=0; i<=bytes.length-sep.length; i++){
    let match = true;
    for (let k=0;k<sep.length;k++){ if (bytes[i+k]!==sep[k]){ match=false; break; } }
    if (match){
      const rec = { id:id++, b: bytes.subarray(start, i), t:'?', deleted:false, added:false };
      records.push(rec); recById.set(rec.id, rec);
      start = i+sep.length; i += sep.length-1;
    }
  }
  let trailingCRLF = true;
  if (start < bytes.length){
    const rec = { id:id++, b: bytes.subarray(start), t:'?', deleted:false, added:false };
    records.push(rec); recById.set(rec.id, rec);
    trailingCRLF = false;
  }
  return { records, recById, nextId:id, trailingCRLF };
}
const JABO_HAN_ROLE_ORDER = ['H','A','B','C','E'];
function parseJaboHanDoc(buffersByRole, namesByRole, label){
  const sources = {};
  const allRecords = []; const recById = new Map();
  let nextId = 0, totalBytes = 0;
  for (const role of JABO_HAN_ROLE_ORDER){
    const buf = buffersByRole[role];
    if (!buf) continue;
    const bytes = new Uint8Array(buf);
    const sep = detectLineSep(bytes);
    const { records, trailingCRLF } = splitRecordsBySep(bytes, nextId, sep);
    for (const r of records){ r.t = role; allRecords.push(r); recById.set(r.id, r); }
    nextId += records.length;
    totalBytes += bytes.length;
    sources[role] = { fileName: (namesByRole && namesByRole[role]) || role, bytes, trailingCRLF, sep };
  }
  const doc = {
    claimType:'JABO_HAN',
    fileName: label || '자보한방청구',
    bytes: { length: totalBytes },
    sources, records: allRecords, recById, nextId,
    claims:[], claimByKey:new Map(), hId:-1, unknown:0,
    edits:new Map(), undoStack:[], redoStack:[], selClaim:-1,
    fileHandles: {},
  };
  buildClaims(doc);
  return doc;
}
function loadJaboHanBuffers(buffersByRole, namesByRole, label, fileHandles, isRestore){
  const doc = parseJaboHanDoc(buffersByRole, namesByRole, label);
  doc.fileHandles = fileHandles || {};
  docs.push(doc);
  switchTab(docs.length-1);
  if (!isRestore){ persistFiles(); schedulePersist(); }
}

let pendingOutputJaboHan = null;
function openSaveJaboHan(scopeSet){
  try{
    const live = state.records.filter(r=>!r.deleted && (r.t==='H' || !scopeSet || scopeSet.has(claimKeyOfRecord(r))));
    const partsByRole = {H:[],A:[],B:[],C:[],E:[]};
    let changedRecs=0, changedFields=0, lenChanged=0;
    for (const r of live){
      const isHOverride = scopeSet && r.id===state.hId;
      const nb = isHOverride ? buildHBytesForOutput(scopeSet) : buildRecordBytes(r.id);
      if (nb !== r.b){
        changedRecs++;
        changedFields += state.edits.has(r.id) ? state.edits.get(r.id).size : 0;
        if (nb.length!==r.b.length) lenChanged++;
      }
      partsByRole[r.t].push(nb);
    }
    const {add, del} = addDelCountScoped(scopeSet);
    const outputsByRole = {};
    const repAgg = {count:0, typeBad:0, numBad:0, notes:[]};
    const perFileRows = [];
    for (const role of JABO_HAN_ROLE_ORDER){
      const parts = partsByRole[role];
      if (!parts.length) continue;
      const trailingCRLF = state.sources[role] ? state.sources[role].trailingCRLF : true;
      const sep = (state.sources[role] && state.sources[role].sep) || [13,10];
      let total=0; for (const p of parts) total += p.length + sep.length;
      if (!trailingCRLF) total -= sep.length;
      const out = new Uint8Array(Math.max(total,0));
      let off=0;
      for (let k=0;k<parts.length;k++){
        out.set(parts[k], off); off += parts[k].length;
        if (k<parts.length-1 || trailingCRLF){ out.set(sep, off); off+=sep.length; }
      }
      outputsByRole[role] = out;
      const liveOfRole = live.filter(r=>r.t===role);
      const rep = verifyOutput(out, liveOfRole, sep);
      repAgg.count += rep.count; repAgg.typeBad += rep.typeBad; repAgg.numBad += rep.numBad;
      repAgg.notes.push(...rep.notes);
      const fname = (state.sources[role] && state.sources[role].fileName) || JABO_HAN_FILE_NAMES[role];
      perFileRows.push('<tr><td>'+esc(fname)+'</td><td>'+esc(curLayouts()[role].name)+'</td><td>'+rep.count.toLocaleString()+'</td><td>'+out.length.toLocaleString()+' byte</td></tr>');
    }
    repAgg.typeOk = repAgg.typeBad===0;
    pendingOutputJaboHan = outputsByRole;
    pendingOutput = null;
    const scopeLine = !scopeSet
      ? '<div>저장 범위</div><div><b>전체 명세서</b> ('+state.claims.length.toLocaleString()+'건)</div>'
      : '<div>저장 범위</div><div><b>선택 '+scopeSet.size.toLocaleString()+'</b>건 / 전체 '+state.claims.length.toLocaleString()+'건 중</div>';
    const g = document.getElementById('saveReport');
    g.innerHTML =
      '<div class="report-grid">'
      +scopeLine
      +'<div>원본 폴더</div><div><b>'+esc(state.fileName)+'</b></div>'
      +'<div>변경된 레코드 / 필드</div><div><b>'+changedRecs.toLocaleString()+'</b>건 / <b>'+changedFields.toLocaleString()+'</b>건</div>'
      +'<div>행 추가 / 삭제</div><div><b>'+add+'</b>건 / <b>'+del+'</b>건</div>'
      +'<div>길이가 변경된 레코드</div><div><b>'+lenChanged+'</b>건</div>'
      +'<div>비변경 레코드 바이트 보존</div><div><span class="ok">원본 바이트 그대로 복사 ✓</span></div>'
      +'<div>레코드 타입 재식별</div><div>'+(repAgg.typeOk?'<span class="ok">전체 정상 ✓</span>':'<span class="bad">'+repAgg.typeBad+'건 식별 불가 ✗</span>')+'</div>'
      +'<div>숫자 필드 형식 검사</div><div>'+(repAgg.numBad===0?'<span class="ok">오류 없음 ✓</span>':'<span class="bad">'+repAgg.numBad+'건 오류</span>')+'</div>'
      +'</div>'
      +'<div style="font-weight:700;color:var(--navy);margin:10px 0 5px">파일별 생성 결과 ('+perFileRows.length+'개 파일)</div>'
      +'<table class="mini"><tr><th>파일</th><th>내역</th><th>레코드 수</th><th>크기</th></tr>'+perFileRows.join('')+'</table>'
      +(scopeSet?'<div style="font-size:11.5px;color:var(--ok)">✓ 청구서(C010)의 건수·합계금액이 선택된 명세서 기준으로 재계산되었습니다.</div>':'')
      +(repAgg.notes.length?'<div style="font-size:12px;color:var(--danger)">'+repAgg.notes.map(esc).join('<br>')+'</div>':'')
      +buildHAggDetail(scopeSet)
      +buildChangedDetail(changedFields)
      +'<div style="font-size:12px;color:var(--txt3);margin-top:9px">인코딩 EUC-KR · 레코드 구분 CRLF · 파일 '+perFileRows.length+'개로 나눠 저장</div>';
    document.getElementById('btnDownload').disabled = !(repAgg.count===live.length && repAgg.typeOk);
    document.getElementById('saveNameLabel').textContent = '파일명 접두사(선택)';
    document.getElementById('saveName').value = '';
    document.getElementById('saveName').placeholder = '입력 시 모든 파일명 앞에 "입력값_" 붙여서 저장 (예: DRG테스트_H010)';
    const handleCount = Object.keys(state.fileHandles||{}).length;
    document.getElementById('btnDownloadLabel').textContent = handleCount>0 ? '저장' : (window.showSaveFilePicker || window.showDirectoryPicker ? '저장' : '다운로드');
    showModal('mSave');
  }catch(e){
    alert('생성 중 오류: '+e.message);
  }
}
async function downloadOutputJaboHan(){
  try{ await downloadOutputJaboHanInner(); }
  catch(e){ alert('저장 중 예상치 못한 오류가 발생했습니다: '+e.message+'\n(이 문구를 스크린샷으로 남겨주세요)'); }
}
async function downloadOutputJaboHanInner(){
  if (!pendingOutputJaboHan) return;
  const roles = Object.keys(pendingOutputJaboHan);
  const fileHandles = state.fileHandles || {};
  const prefix = document.getElementById('saveName').value.trim();
  const nameFor = (role, canonical) => prefix ? prefix+'_'+canonical : ((state.sources[role] && state.sources[role].fileName) || canonical);
  for (const role of roles){
    const h = fileHandles[role];
    if (!h) continue;
    try{
      const w = await h.createWritable();
      await w.write(pendingOutputJaboHan[role]);
      await w.close();
    }catch(e){
      alert((state.sources[role]&&state.sources[role].fileName||role)+' 저장 중 오류: '+e.message);
    }
  }
  const remaining = roles.filter(role=>!fileHandles[role]);
  if (!remaining.length){ hideModal('mSave'); return; }

  if (window.showDirectoryPicker){
    let dirHandle;
    try{
      let startHandle = null;
      try{ startHandle = await idbGet('lastSaveDirHandle'); }catch(e){}
      const opts = {id:'samSaveDir'};
      if (startHandle) opts.startIn = startHandle;
      dirHandle = await window.showDirectoryPicker(opts);
      idbSet('lastSaveDirHandle', dirHandle).catch(()=>{});
    }catch(e){
      if (e && e.name==='AbortError') return;
      alert('폴더 선택 중 오류: '+e.message);
      return;
    }
    let anyError = false;
    for (const role of remaining){
      const name = nameFor(role, JABO_HAN_FILE_NAMES[role]);
      try{
        const fh = await dirHandle.getFileHandle(name, {create:true});
        const w = await fh.createWritable();
        await w.write(pendingOutputJaboHan[role]);
        await w.close();
      }catch(e){
        anyError = true;
        alert(name+' 저장 중 오류: '+e.message);
      }
    }
    if (!anyError) hideModal('mSave');
    return;
  }

  if (!window.showSaveFilePicker){
    alert('이 환경에서는 저장 위치를 직접 선택할 수 없어, 브라우저의 기본 다운로드 폴더에 '+remaining.length+'개 파일이 저장됩니다.\n(주소창 없는 "앱" 형태로 실행 중이라면, 일반 브라우저 창(탭)으로 열면 위치를 선택할 수 있습니다.)');
  }
  for (let idx=0; idx<remaining.length; idx++){
    const role = remaining[idx];
    const name = nameFor(role, JABO_HAN_FILE_NAMES[role]);
    const buf = pendingOutputJaboHan[role];
    if (window.showSaveFilePicker){
      try{
        const handle = await window.showSaveFilePicker({ suggestedName:name, id:'samSaveDir' });
        const w = await handle.createWritable();
        await w.write(buf);
        await w.close();
        continue;
      }catch(e){
        if (e && e.name==='AbortError'){
          const left = remaining.length - idx;
          alert('저장을 취소해서 나머지 '+left+'개 파일은 저장되지 않았습니다.\n이어서 저장하려면 아래 [저장]을 다시 눌러주세요.');
          return;
        }
      }
    }
    const blob = new Blob([buf], {type:'application/octet-stream'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href), 5000);
  }
  hideModal('mSave');
}

/* ---------- 파일명 자동 인식 — C010(청구서) + C110.1~.4(입원) 또는 C111.1~.4(외래).
   실샘플을 보면 요양기관이 "청구번호_C010"처럼 앞에 임의의 접두사를 붙여 저장하는 경우가 있어(예:
   "202507Z018_C010"), 파일명 전체 일치가 아니라 끝부분(접미사) 일치로 판별한다 — 접두사가 없는
   맨 "C010" 같은 이름도 당연히 그대로 걸린다(끝이 곧 전체와 같으므로). ---------- */
const JABO_HAN_FILE_NAMES = { H:'C010', A:'C110.1', B:'C110.2', C:'C110.3', E:'C110.4' };
const JABO_HAN_UNIQUE_SUFFIX_ROLES = [
  [/C11[01]\.1$/, 'A'],
  [/C11[01]\.2$/, 'B'],
  [/C11[01]\.3$/, 'C'],
  [/C11[01]\.4$/, 'E'],
];
function jaboHanUniqueRoleForFilename(name){
  for (const [re, role] of JABO_HAN_UNIQUE_SUFFIX_ROLES) if (re.test(name)) return role;
  return null;
}
function jaboHanRoleForFilename(name){
  if (/C010$/.test(name)) return 'H';
  return jaboHanUniqueRoleForFilename(name);
}

async function jaboHanGrouperFn(files, handleByName){
  // C010은 지금은 자보 한방만 쓰는 이름이지만, DRG/MG/SANJAE가 겪은 "공유 파일명 무조건 선점" 버그를
  // 다시 만들지 않도록 다른 청구분야와 동일하게 고유 파일(C110.x/C111.x) 존재를 먼저 확인한다.
  const hasJaboHanSpecific = files.some(f => jaboHanUniqueRoleForFilename(f.name));
  if (!hasJaboHanSpecific) return files;
  const hanFiles = [], rest = [];
  for (const file of files){
    (jaboHanRoleForFilename(file.name) ? hanFiles : rest).push(file);
  }
  if (!hanFiles.length) return files;
  const buffersByRole = {}; const namesByRole = {}; const fileHandles = {};
  for (const file of hanFiles){
    if (file.size===0) continue; // 해당 내역이 없어 0byte인 경우 — 없는 파일과 동일하게 취급
    const role = jaboHanRoleForFilename(file.name);
    buffersByRole[role] = await file.arrayBuffer();
    namesByRole[role] = file.name;
    const h = handleByName ? handleByName.get(file.name) : null;
    if (h) fileHandles[role] = h;
  }
  if (buffersByRole.H && buffersByRole.A){
    const label = hanFiles[0].webkitRelativePath ? hanFiles[0].webkitRelativePath.split('/')[0] : '자보한방청구';
    loadJaboHanBuffers(buffersByRole, namesByRole, label, fileHandles);
  } else {
    alert('자보 한방 파일(C010, C110.1~.4 또는 C111.1~.4)로 보이는데, 필수인 C010(청구서)과 .1(일반내역)이 함께 선택되지 않았습니다.\n두 파일을 포함해서 다시 선택해 주세요.');
  }
  return rest;
}
registerFileGrouper(jaboHanGrouperFn);
// C010 하나만 선택된 경우의 자동완성 — C010은 지금 자보 한방만 쓰는 이름이라 내용 확인 없이 바로 확정.
registerHOnlyAutocomplete({ pattern:/C010$/, detect:()=>true, roleForFilename:jaboHanRoleForFilename, retry:jaboHanGrouperFn, label:'자보 한방 청구서' });

/* ---------- 자동차보험 한방(JABO_HAN) 청구분야 등록 ---------- */
LAYOUT_JABO_HAN_A.formHidden = ['청구번호'];
LAYOUT_JABO_HAN_C.mokMap = 목번호맵_자보한방;
registerRecordLetters(['A','B','C','E']);
registerClaimType('JABO_HAN', {
  layouts: LAYOUTS_JABO_HAN,
  // 자보한방은 D(처방내역) 자체가 없어 common.js의 기본 이동 경로(D 존재를 가정)를 타면 죽는다 —
  // 한방(HANBANG)과 동일하게 이동 대상을 직접 지정한다: A의 최초입원개시일, C의 변경일, E 특정내역 자유서식.
  dateAnchor: {
    bField:'내원일자', bFlagField:'상병분류구분', bFlagVal:'1',
    shiftFields: [
      { t:'A', name:'최초입원개시일' },
      { t:'C', name:'변경일' },
      { t:'E', name:'특정내역', kind:'freetext' },
    ],
  },
  hSumPairs: H_SUM_FIELD_PAIRS_JABO,
  blankRowLen: BLANK_ROW_LEN_JABO_HAN,
  usesContentClassify: false, // 파일명(role)이 유형을 결정하므로 저장 후 재검증 시 classify() 재판별을 하지 않음
  openSave: openSaveJaboHan,
  downloadOutput: downloadOutputJaboHan,
  parseMultiDoc: parseJaboHanDoc,
});
