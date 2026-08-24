/* ---------- 산재 한방(SANJAE_HAN, 산재보험 한의과 진료비명세서) 레이아웃 — 기존 산재(SANJAE, 의과/치과)와
   청구서(M010.1)+간병료(M010.2)는 완전히 공유(재사용)하고, 명세서만 M021.1~.4(일반/상병/진료/특정내역)로
   따로 나뉜다 — DRG/MG가 H010을 공유하면서 각자 고유한 D020.x/H040.x로 구분되는 것과 동일한 패턴.
   상병내역(B)은 산재 의과의 LAYOUT_SANJAE_B와 완전히 동일(22byte)해 그대로 재사용. 일반내역(A)은
   의과와 거의 같지만 진료과목이 다중코드(20byte, 최대10개)가 아니라 단일코드 '80'(한방) 고정 2byte라
   그 뒤 모든 필드가 18byte씩 앞으로 당겨져 288byte(의과 306byte-18). 진료내역(C)은 치식(우상/좌상/우하/
   좌하) 4×8=32byte가 없어(한방은 치과 서식이 아님) 154byte(의과 186byte-32). 특정내역(E)은 처방전교부
   번호 필드가 없어(한방은 처방내역 자체가 없음) 725byte(의과 738byte-13) — 처방전교부내역(D) 레코드
   자체도 존재하지 않는다.
   필드 위치는 「SAM_03_산재한의과명세서(072).doc」기준 (2026-08-13, 한방입원 1종+한방통원 1종 실샘플
   대조: H=2096(SANJAE와 완전 동일)/A=288/B=22/C=154/E=725byte 전부 일치, A만 CRLF·B/C/E는 LF-only —
   자보한방/의료급여정액/첩약/한방과 동일한 줄바꿈 불일치 패턴). ---------- */

/* M021.1 [일반내역] - 필수. 설명·코드값은 「SAM_03_산재한의과명세서(072).doc」의 「코드 및 유형」 칸 그대로
   (문서 이름: 산재보험 진료비명세서(한의과) – 072ver). 한의과 문서의 청구번호는 요양·예방 두 가지만 적혀 있다
   (의과는 진폐까지 셋). 항목명은 편집기가 이름으로 필드를 찾으므로 기존 표기를 유지하고, 문서 항목명이
   다른 것만 설명 첫 줄에 적었다. */
const 산재한방청구번호설명 = '(=요양청구번호: CCYYMM+Seq.4(일련번호))\n(=예방청구번호: CCYYMM+A+Seq.3(일련번호))';
const LAYOUT_SANJAEHAN_A = { key:'A', name:'일반내역',
  formHidden: ['청구번호','내원일'],
  formGroups:[
    {title:'수진자현황', widthGroup:'main', labels:{'산재근로자성명':'수진자','산재근로자주민등록번호':'','실진료일수':'입내원일'}, rows:[
      ['명세서일련번호'],
      ['산재근로자성명','산재근로자주민등록번호'],
      ['실진료일수','퇴원약투약일수'],
      ['진료개시일','치료구분'],
    ]},
    {title:'진료비현황', widthGroup:'main', labels:{'기본진료약제특정재료I':'치료재료','진료행위료II':'진료행위'}, rows:[
      ['기본진료약제특정재료I','청구액'],
      ['진료행위료II','가산율'],
    ]},
    {title:'일반내역', widthGroup:'main', labels:{'중환자실입원일수':'ICU일수','중환자실입원':'ICU입원','소속사업장명칭':'사업체명칭','재해발생일자':'재해일자'}, rows:[
      ['진료기간'],
      ['중환자실입원일수','진료구분'],
      ['중환자실입원'],
      ['진료과목'],
      ['소속사업장명칭'],
      ['재해발생일자','간병범위'],
    ]},
    {title:'청구구분', labels:{'청구구분코드':'청구구분','청구기관코드':'기관코드','명세서일련번호(당초)':'명일련'}, rows:[
      ['청구구분코드','청구기관코드'],
      ['명세서일련번호(당초)','사유코드'],
      ['접수번호'],
      ['서식번호'],
      ['사업구분'],
    ]},
  ],
  fields:[
  F(1,10,'an','청구번호',산재한방청구번호설명),
  F(11,5,'an','명세서일련번호','00001 - 99999'),
  F(16,4,'an','서식번호','',{'M312':'산재보험 진료비명세서','M322':'합병증 등 예방관리비용 명세서'}),
  F(20,7,'an','청구기관코드','산재보험 의료기관 지정을 신청, 부여받은 산재지정코드를 기재'),
  F(27,1,'an','사업구분','',{'1':'요양급여비용','2':'합병증 등 예방관리비용'}),
  F(28,1,'an','청구구분코드','문서 항목명: 청구구분 - 코드\n* 원청구시에는 space 처리',{'1':'보완청구','2':'추가청구'}),
  F(29,15,'an','접수번호','문서 항목명: 청구구분 - 접수번호\n보완,추가청구시 최초 청구한 명세서 접수번호 기재'),
  F(44,5,'an','명세서일련번호(당초)','문서 항목명: 청구구분 - 명세서일련번호\n보완,추가청구시 최초 청구한 명세서일련번호 기재'),
  F(49,4,'an','사유코드','문서 항목명: 청구구분 - 사유코드\n보완청구시 기청구 명세서의 심사불능 사유코드 기재'),
  F(53,60,'an','산재근로자성명','문서 항목명: 산재근로자 성명'),
  F(113,13,'an','산재근로자주민등록번호','문서 항목명: 산재근로자 주민등록번호\n‘-’ 생략 기재'),
  F(126,8,'an','재해발생일자','Format: CCYYMMDD'),
  F(134,35,'an','소속사업장명칭','문서 항목명: 소속 사업장 명칭\n업무상 재해발생 당시 소속된 사업장명을 기재'),
  F(169,2,'an','진료과목','',{'80':'한방'}),
  F(171,8,'an','진료개시일','Format: CCYYMMDD'),
  F(179,16,'an','진료기간','청구 월 해당 청구명세서의 진료 시작일과 종료일을 기재\nFormat: CCYYMMDDCCYYMMDD',null,null,16),
  F(195,3,'n','실진료일수','해당 명세서건에 실제 진료한 일수를 기재\n(입원은 입원일수, 통원은 내원일수)',null,'money'),
  F(198,3,'n','퇴원약투약일수','입원인 경우 기재, 퇴원당일 처방된 퇴원약 투여일수 기재',null,'money'),
  F(201,31,'an','내원일','진료구분이 통원인 경우 기재, 실제 내원한 일자 모두기재\n내원일에 ‘1’, 비내원일에 ‘0’'),
  F(232,16,'an','중환자실입원','문서 항목명: 중환자실 입원\nFormat: CCYYMMDDCCYYMMDD',null,null,16),
  F(248,3,'n','중환자실입원일수','문서 항목명: 중환자실 입원일수',null,'money'),
  F(251,2,'an','진료구분','',{'01':'입원 일반','02':'통원 일반','03':'요양장기(정액)','04':'입원 특별진찰','05':'통원 특별진찰','06':'입원 병행진료','07':'통원 병행진료','08':'입원 신체감정','09':'통원 신체감정','10':'사용유보','11':'사용유보','12':'종결후 장해','13':'종결후 보조기'}),
  F(253,1,'an','치료구분','해당 명세서 작성시 최종 진료일 산재근로자 상태를 구분기재',{'1':'치유','2':'사망','3':'요양중 사망','4':'전원','5':'계속'}),
  F(254,2,'an','간병범위','',{'01':'두 손의 손가락을 모두 잃거나 사용하지 못하게 되어 혼자 힘으로 식사를 할 수 없는 사람','02':'두 눈의 실명 등으로 일상생활에 필요한 동작을 혼자 힘으로 할 수 없는 사람','03':'뇌의 손상으로 정신이 혼미하거나 착란을 일으켜 일상생활에 필요한 동작을 혼자 힘으로 할 수 없는 사람','04':'신경계통 또는 정신의 장해로 의사소통을 할 수 없는 등 치료에 뚜렷한 지장이 있는 사람','05':'체표면적(체표면적)의 35퍼센트 이상에 걸친 화상을 입어 수시로 적절한 조치를 할 필요가 있는 사람','06':'골절로 인한 견인장치 또는 석고붕대 등을 하여 일상생활에 필요한 동작을 혼자 힘으로 할 수 없는 사람','07':'하반신 마비 등으로 배뇨ㆍ배변을 제대로 하지 못하거나 욕창 방지를 위하여 수시로 체위를 변경 시킬 필요가 있는 사람','08':'업무상 질병으로 신체가 몹시 허약하여 일상생활에 필요한 동작을 혼자 힘으로 할 수 없는 사람','09':'수술 등으로 일정 기간 거동이 제한되어 일상생활에 필요한 동작을 혼자 힘으로 할 수 없는 사람','10':'그 밖에 부상ㆍ질병 상태가 제1호부터 제9호까지의 규정에 준하는 사람'}),
  F(256,10,'n','기본진료약제특정재료I','문서 항목명: 기본진료,약제,특정재료(I)\n요양기관 종별가산율이 적용되지 않는 기본진료, 약제, 특정재료(Ⅰ)',null,'money'),
  F(266,10,'n','진료행위료II','문서 항목명: 진료행위료(II)\n요양기관 종별가산율이 적용되는 진료행위료(Ⅱ)',null,'money'),
  F(276,10,'n','청구액','소계와 가산율 가산금액의 합을 기재하되 10원미만은 절사한 금액을 기재',null,'money'),
  F(286,3,'n','가산율','건강보험 요양기관 종별가산율에 ‘산업재해보상보험 요양급여 산정기준’을 적용하여 종별가산율 기재',null,'money'),
]};

const 산재한방항번호코드 = codesTable([['01','진찰료'],['02','입원료'],['03','투약료'],['04','시술 및 처치료'],['05','검사료'],['06','한방물리요법'],['51','간병료'],['52','선택진료'],['57','수수료'],['58','이송료'],['60','한방 첩약 및 탕전료'],['99','기타']]);
const 산재한방목번호맵 = {
  '01':codesTable([['01','초진'],['02','재진'],['03','기타'],['04','가정간호기본방문료'],['05','선택진료비']]),
  '02':codesTable([['01','일반'],['02','내과,정신과'],['03','중환자실'],['04','상급병실'],['05','기타'],['06','기본식대'],['07','가산식대']]),
  '03':codesTable([['01','내복약'],['02','처방.조제.복약지도료']]),
  '04':codesTable([['01','침술'],['02','구술'],['03','부항술'],['04','처치료'],['05','기타']]),
  '05':codesTable([['01','양도락검사'],['02','맥전도검사'],['03','경락기능검사'],['04','기타']]),
  '06':codesTable([['01','이학요법료']]),
  '51':codesTable([['01','간병료']]),
  '52':codesTable([['01','선택진료료(특별진찰 시 발생한 전체 항목 진료비에 대한 합)']]),
  '57':codesTable([['01','발급.확인수수료']]),
  '58':codesTable([['01','이송료']]),
  '60':codesTable([['01','첩약'],['02','탕전료']]),
  '99':codesTable([['01','기타']]),
};

/* M021.3 [진료내역] – 필수(항·목 반복 99, 줄번호 9999) */
const LAYOUT_SANJAEHAN_C = { key:'C', name:'진료내역',
  gridOrder:['항','목','줄번호','구분','코드','코드명칭','진료기간','가산구분','단가','수량','일수','금액'],
  fields:[
  F(1,10,'an','청구번호',산재한방청구번호설명),
  F(11,5,'an','명세서일련번호','00001 – 99999'),
  F(16,2,'an','항','문서 항목명: 항번호',산재한방항번호코드,null,10),
  F(18,2,'an','목','문서 항목명: 목번호\n항별 목번호는 「항 · 목 코드」 화면 참조',null,null,10),
  F(20,4,'n','줄번호','명일련번호별 항,목순으로 일련번호 기재',null,null,10),
  F(24,1,'an','구분','문서 항목명: 코드구분',{'1':'수가(상대가치점수표 등에 수록된코드)','2':'준용수가','3':'약가','8':'치료재료'},null,7),
  F(25,9,'an','코드','진료수가,보험등재약,치료재료를 앞에서 부터 5-9자리 수록후 공란은 Space처리',null,null,20),
  F(34,70,'an','코드명칭','',null,null,52),
  F(104,16,'an','진료기간','Format: CCYYMMDDCCYYMMDD',null,null,16),
  F(120,1,'an','가산구분','',{'1':'기본진료,약제,특정재료(I)','2':'진료행위료(II)'}),
  F(121,12,'n','단가','- 상대가치점수표상의 점수*점수당 단가 (10원미만 4사5입)\n- 약가,치료재료,원료약의경우 “약제및치료재료의 구입금액에 대한산정기준”에 의한 단가 기재 단가가 1원 미만인 경우 1원으로 기재\n- 정수부 10자리, 소수부 2자리(총12자리), 소수점 미표기\n예) 720원 → “_ _ _ _ _ _ _72000”',null,2),
  F(133,9,'n','수량','- 1일투여량(소수 다섯째자리 4사5입) 또는 투여(실시)횟수 기재\n- 정수부 5자리, 소수부 4자리(총9자리), 소수점 미표기\n예) 1 → “_ _ _ _10000”  1.6 → “_ _ _ _16000”',null,4),
  F(142,3,'n','일수','- 총투여일수 또는 실시횟수를 기재\n- 단, 수탁기관에 위탁한 진료(검사)료 산정시에는 총실시횟수(1일진료(검사)실시횟수*총실시일수)를 기재\n예) 2 → “_ _2”',null,'money'),
  F(145,10,'n','금액','단가 * 수량 * 일수를 계산한 후 원 미만은 4사5입',null,'money'),
]};

/* M021.4 [특정내역] – 옵션(발생단위구분 반복 300 · 줄번호 9999 · 특정내역구분 999). 문서 각주:
   (*) 명세서 및 줄번호 단위 별로 특정내역이 발생시 해당 단위 별로 작성하고, 동일 명세서 및 줄번호에
       여러 특정내역이 발생시에도 각각으로 생성하여 레코드 반복 기재함
   (*) 동일 특정내역구분에 특정내역이 700 바이트 이상 발생할 경우 기재 방법
       - 청구번호에서 특정내역구분까지 동일하게 기재후 추가된 특정내역 기재하여 레코드 반복 기재함
   (예시)
     200405111100001E1                        MT011  패혈증정보
     200405111100001E1                        MT004  소명자료 구분
     200405111100001E1                        MX999  명세서 특정내역
     200405111100001E2                    1JB001     마취과전문의
     200405111100001E2                    1JS003     입원시각
     200405111100001E2                    3JS004     퇴원시각 */
const LAYOUT_SANJAEHAN_E = { key:'E', name:'특정내역',
  gridOrder:['발생단위구분','줄번호','특정내역구분','특정내역'],
  fields:[
  F(1,10,'an','청구번호',산재한방청구번호설명),
  F(11,5,'an','명세서일련번호','00001 – 99999'),
  F(16,1,'an','발생단위구분','',{'1':'명세서','2':'진료내역 줄번호 단위'}),
  F(17,4,'n','줄번호','발생단위구분 1 → space\n발생단위구분 2 → 1-9999'),
  F(21,5,'an','특정내역구분','(=근로복지공단 고시 참조)'),
  F(26,700,'an','특정내역','특정내역 기재형식에 따라 기재'),
]};

const LAYOUTS_SANJAEHAN = { H:LAYOUT_SANJAE_H, A:LAYOUT_SANJAEHAN_A, B:LAYOUT_SANJAE_B, C:LAYOUT_SANJAEHAN_C, E:LAYOUT_SANJAEHAN_E };

const BLANK_ROW_LEN_SANJAEHAN = { B:22, C:154, E:725 };

/* ---------- M010.1(청구서, 산재와 공유)+M010.2(간병료, 옵션, 산재와 동일하게 원본만 보존)+M021.1~.4(명세서)가
   파일 여러 개로 나뉜 것을 한 청구(doc)로 합쳐 파싱. A(M021.1)는 CRLF지만 B/C/E(M021.2~.4)는 LF-only —
   detectLineSep/splitRecordsBySep(js/layout-jabo-han.js, 이 스크립트보다 먼저 로드됨)로 파일별 실제
   구분자를 감지해서 나누고 저장한다. ---------- */
const SANJAEHAN_ROLE_ORDER = ['H','A','B','C','E'];
function parseSanjaeHanDoc(buffersByRole, namesByRole, label){
  const sources = {};
  const allRecords = []; const recById = new Map();
  let nextId = 0, totalBytes = 0;
  for (const role of SANJAEHAN_ROLE_ORDER){
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
  if (buffersByRole.H2){
    const h2Bytes = new Uint8Array(buffersByRole.H2);
    totalBytes += h2Bytes.length;
    sources.H2 = { fileName: (namesByRole && namesByRole.H2) || 'M010.2', bytes: h2Bytes };
  }
  const doc = {
    claimType:'SANJAE_HAN',
    fileName: label || '산재한방청구',
    bytes: { length: totalBytes },
    sources, records: allRecords, recById, nextId,
    claims:[], claimByKey:new Map(), hId:-1, unknown:0,
    edits:new Map(), undoStack:[], redoStack:[], selClaim:-1,
    fileHandles: {},
  };
  buildClaims(doc);
  return doc;
}
function loadSanjaeHanBuffers(buffersByRole, namesByRole, label, fileHandles, isRestore){
  const doc = parseSanjaeHanDoc(buffersByRole, namesByRole, label);
  doc.fileHandles = fileHandles || {};
  docs.push(doc);
  switchTab(docs.length-1);
  if (!isRestore){ persistFiles(); schedulePersist(); }
}

let pendingOutputSanjaeHan = null;
function openSaveSanjaeHan(scopeSet){
  try{
    const live = state.records.filter(r=>!r.deleted && (r.t==='H' || !scopeSet || scopeSet.has(claimKeyOfRecord(r))));
    const partsByRole = {H:[],A:[],B:[],C:[],E:[]};
    let changedRecs=0, changedFields=0, lenChanged=0;
    for (const r of live){
      const nb = buildRecordBytes(r.id);
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
    for (const role of SANJAEHAN_ROLE_ORDER){
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
      const fname = (state.sources[role] && state.sources[role].fileName) || SANJAEHAN_FILE_NAMES[role];
      perFileRows.push('<tr><td>'+esc(fname)+'</td><td>'+esc(curLayouts()[role].name)+'</td><td>'+rep.count.toLocaleString()+'</td><td>'+out.length.toLocaleString()+' byte</td></tr>');
    }
    if (state.sources.H2){
      outputsByRole.H2 = state.sources.H2.bytes;
      perFileRows.push('<tr><td>'+esc(state.sources.H2.fileName)+'</td><td>간병료 산정현황(원본 보존)</td><td>-</td><td>'+state.sources.H2.bytes.length.toLocaleString()+' byte</td></tr>');
    }
    repAgg.typeOk = repAgg.typeBad===0;
    pendingOutputSanjaeHan = outputsByRole;
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
      +(scopeSet?'<div style="font-size:11.5px;color:#a4700a">⚠ 청구서(M010.1)의 청구건수/청구액은 부분 저장 시 자동 재계산되지 않습니다. 필요하면 직접 수정하거나 전체 저장을 이용하세요.</div>':'')
      +(repAgg.notes.length?'<div style="font-size:12px;color:var(--danger)">'+repAgg.notes.map(esc).join('<br>')+'</div>':'')
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
async function downloadOutputSanjaeHan(){
  try{ await downloadOutputSanjaeHanInner(); }
  catch(e){ alert('저장 중 예상치 못한 오류가 발생했습니다: '+e.message+'\n(이 문구를 스크린샷으로 남겨주세요)'); }
}
async function downloadOutputSanjaeHanInner(){
  if (!pendingOutputSanjaeHan) return;
  const roles = Object.keys(pendingOutputSanjaeHan);
  const fileHandles = state.fileHandles || {};
  const prefix = document.getElementById('saveName').value.trim();
  const nameFor = (role, canonical) => prefix ? prefix+'_'+canonical : ((state.sources[role] && state.sources[role].fileName) || canonical);
  for (const role of roles){
    const h = fileHandles[role];
    if (!h) continue;
    try{
      const w = await h.createWritable();
      await w.write(pendingOutputSanjaeHan[role]);
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
      const name = nameFor(role, SANJAEHAN_FILE_NAMES[role]);
      try{
        const fh = await dirHandle.getFileHandle(name, {create:true});
        const w = await fh.createWritable();
        await w.write(pendingOutputSanjaeHan[role]);
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
    const name = nameFor(role, SANJAEHAN_FILE_NAMES[role]);
    const buf = pendingOutputSanjaeHan[role];
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

/* ---------- 파일명 자동 인식 — M010.1(청구서, 산재와 공유)+M010.2(간병료)+M021.1~.4(명세서). 산재(의과)는
   M020.x를 쓰고 산재 한방은 M021.x를 써서 명세서 파일명 자체가 서로 겹치지 않는다(첩약/한방이 K020.x를
   공유해서 내용을 봐야 했던 것과 달리, 여기는 CHUB/HANBANG 같은 내용 확인이 필요 없음) — M010.1/.2만
   공유되는데 이건 이미 layout-sanjae.js의 그루퍼가 "산재 고유 파일(M020.x)이 하나도 없으면 개입하지
   않음" 가드를 갖고 있어(DRG/MG와 동일한 안전장치) 그대로 넘어와도 문제없다. 실샘플 중 하나는
   "12316_5575_202407800292_M021.4"처럼 접두사가 붙어 있어(자보한방/의료급여정액/첩약과 동일한 문제)
   접미사 일치로 판별한다. ---------- */
const SANJAEHAN_FILE_NAMES = { H:'M010.1', H2:'M010.2', A:'M021.1', B:'M021.2', C:'M021.3', E:'M021.4' };
const SANJAEHAN_SUFFIX_ROLES = [
  [/M021\.1$/, 'A'], [/M021\.2$/, 'B'], [/M021\.3$/, 'C'], [/M021\.4$/, 'E'],
];
function sanjaeHanUniqueRoleForFilename(name){
  for (const [re, role] of SANJAEHAN_SUFFIX_ROLES) if (re.test(name)) return role;
  return null;
}
function sanjaeHanRoleForFilename(name){
  if (/M010\.1$/.test(name)) return 'H';
  if (/M010\.2$/.test(name)) return 'H2';
  return sanjaeHanUniqueRoleForFilename(name);
}

async function sanjaeHanGrouperFn(files, handleByName){
  const hasSanjaeHanSpecific = files.some(f => sanjaeHanUniqueRoleForFilename(f.name));
  if (!hasSanjaeHanSpecific) return files;
  const shFiles = [], rest = [];
  for (const file of files){
    (sanjaeHanRoleForFilename(file.name) ? shFiles : rest).push(file);
  }
  if (!shFiles.length) return files;
  const buffersByRole = {}; const namesByRole = {}; const fileHandles = {};
  for (const file of shFiles){
    const role = sanjaeHanRoleForFilename(file.name);
    if (file.size===0 && role!=='H2') continue; // H2(간병료)는 0바이트라도 원본 보존, 나머지는 없는 파일과 동일 취급
    buffersByRole[role] = await file.arrayBuffer();
    namesByRole[role] = file.name;
    const h = handleByName ? handleByName.get(file.name) : null;
    if (h) fileHandles[role] = h;
  }
  if (buffersByRole.H && buffersByRole.A){
    const label = shFiles[0].webkitRelativePath ? shFiles[0].webkitRelativePath.split('/')[0] : '산재한방청구';
    loadSanjaeHanBuffers(buffersByRole, namesByRole, label, fileHandles);
  } else {
    alert('산재 한방 파일(M010.1, M021.1~.4)로 보이는데, 필수인 M010.1과 M021.1(일반내역)이 함께 선택되지 않았습니다.\n두 파일을 포함해서 다시 선택해 주세요.');
  }
  return rest;
}
registerFileGrouper(sanjaeHanGrouperFn);
// M010.1 하나만 선택된 경우의 자동완성 — 진료형태 5(한방입원)/6(한방통원) 슬롯에 청구건수가 있으면
// 산재한방이다. sanjaeH010HasNonzeroCount는 layout-sanjae.js(이 스크립트보다 먼저 로드됨)에서 정의.
registerHOnlyAutocomplete({ pattern:/M010\.1$/, detect: bytes => sanjaeH010HasNonzeroCount(bytes, ['5','6']), roleForFilename:sanjaeHanRoleForFilename, retry:sanjaeHanGrouperFn, label:'산재 한방 청구서' });

/* ---------- 산재 한방(SANJAE_HAN) 청구분야 등록 ---------- */
LAYOUT_SANJAEHAN_A.formHidden = ['청구번호','내원일'];
LAYOUT_SANJAEHAN_C.mokMap = 산재한방목번호맵;
registerRecordLetters(['A','B','C','E']);
registerClaimType('SANJAE_HAN', {
  layouts: LAYOUTS_SANJAEHAN,
  // 산재(의과)와 동일한 상황 — 상병내역(B)에 날짜 필드가 없어 일반내역(A)의 진료개시일을 기준으로 삼고,
  // A 자신의 진료기간(From+To)·진료내역(C) 진료기간(From+To)·특정내역(E) 자유서식 속 날짜를 함께 이동.
  dateAnchor: {
    anchorType:'A', bField:'진료개시일', bFlagField:null, bFlagVal:null,
    shiftFields: [
      { t:'A', name:'진료기간', kind:'range' },
      { t:'C', name:'진료기간', kind:'range' },
      { t:'E', name:'특정내역', kind:'freetext' },
    ],
  },
  blankRowLen: BLANK_ROW_LEN_SANJAEHAN,
  openSave: openSaveSanjaeHan,
  downloadOutput: downloadOutputSanjaeHan,
  parseMultiDoc: parseSanjaeHanDoc,
  usesContentClassify: false,
});
