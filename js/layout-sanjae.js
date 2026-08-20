/* ---------- 산재(SANJAE, 산업재해보상보험) 레이아웃 — DRG와 마찬가지로 청구서/명세서가 파일 여러 개(M010.1/M010.2 + M020.1~.5)로
   나뉘어 있음. 필드 위치는 「★ 산재 SAM(072).doc」, 「SAM_01_산재의치과청구서(072간지포함).doc」,
   「SAM_02_산재의치과명세서(072).doc」(근로복지공단 072버전) + 실샘플 대조 검증(2026-08-11, sim7_20260810103235 폴더). ---------- */

const 산재진료과목코드 = {'01':'내과','02':'신경과','03':'정신건강의학과','04':'외과','05':'정형외과','06':'신경외과','07':'심장혈관흉부외과','08':'성형외과','09':'마취통증의학과','10':'산부인과','11':'소아청소년과','12':'안과','13':'이비인후과','14':'피부과','15':'비뇨의학과','16':'영상의학과','17':'방사선종양학과','18':'병리과','19':'진단검사의학과','20':'결핵과','21':'재활의학과','22':'핵의학과','23':'가정의학과','24':'응급의학과','25':'작업환경의학과','26':'예방의학과','50':'치과','80':'한방','90':'보건기관'};
// GEN/DRG/NDRG가 공유하는 진료형태코드는 코드값(특히 5,6)의 의미가 산재와 겹치지 않게 달라서 별도 테이블로 정의.
const 산재진료형태코드 = {'1':'의과입원/보건기관 입원','2':'의과통원/보건기관 통원','3':'치과입원','4':'치과통원','5':'한방입원','6':'한방통원'};

// M010.1 — 산재보험 진료비청구서(청구서 역할, 서식번호 M110/M120/M130). 진료형태별 청구건수·청구액이 최대 6회 반복(19byte×6=114byte).
const LAYOUT_SANJAE_H = { key:'H', name:'청구서', fields:[
  F(1,3,'an','청구서서식버전',"'072'"),
  F(4,3,'an','명세서서식버전',"'072'"),
  F(7,10,'an','청구번호','요양:CCYYMM+일련4 · 예방:CCYYMM+A+일련3 · 진폐:CCYYMM+B+일련3'),
  F(17,4,'an','서식번호','',{'M110':'산재보험 진료비 청구서','M120':'합병증 등 예방관리비용 청구서','M130':'진폐건강진단비용 청구서'}),
  F(21,7,'an','청구기관코드','근로복지공단이 부여한 산재지정코드'),
  F(28,1,'an','수신기관','',{'2':'근로복지공단'}),
  F(29,1,'an','사업구분','',{'1':'요양급여비용','2':'합병증 등 예방관리비용','3':'진폐건강진단비용'}),
  F(30,1,'an','청구구분','',{'0':'원청구','1':'보완청구','2':'추가청구'}),
  F(31,6,'an','진료년월','입원은 퇴원일이 속한 월. CCYYMM'),
  F(37,8,'an','청구일자','CCYYMMDD'),
  F(45,1,'an','진료형태1','',산재진료형태코드,null,10),
  F(46,6,'n','청구건수1','',null,'money'),
  F(52,12,'n','청구액1','',null,'money'),
  F(64,1,'an','진료형태2','',산재진료형태코드,null,10),
  F(65,6,'n','청구건수2','',null,'money'),
  F(71,12,'n','청구액2','',null,'money'),
  F(83,1,'an','진료형태3','',산재진료형태코드,null,10),
  F(84,6,'n','청구건수3','',null,'money'),
  F(90,12,'n','청구액3','',null,'money'),
  F(102,1,'an','진료형태4','',산재진료형태코드,null,10),
  F(103,6,'n','청구건수4','',null,'money'),
  F(109,12,'n','청구액4','',null,'money'),
  F(121,1,'an','진료형태5','',산재진료형태코드,null,10),
  F(122,6,'n','청구건수5','',null,'money'),
  F(128,12,'n','청구액5','',null,'money'),
  F(140,1,'an','진료형태6','',산재진료형태코드,null,10),
  F(141,6,'n','청구건수6','',null,'money'),
  F(147,12,'n','청구액6','',null,'money'),
  F(159,6,'n','청구건수계','명세서 청구건수의 합',null,'money'),
  F(165,12,'n','청구금액계','명세서 청구액의 합',null,'money'),
  F(177,20,'an','청구인성명','요양기관 대표자(개설자) 성명'),
  F(197,20,'an','작성자성명',''),
  F(217,1750,'an','참조란','미발생시 작성자성명까지 기재 허용'),
]};

// M010.2 — 간병료 산정현황(옵션, 최대 9회 반복). 실샘플에서 항상 0byte라 필드 레이아웃은 검증되지 않았고,
// 편집 UI도 없이 원본 바이트를 그대로 보존만 한다(js/layout-sanjae.js의 parseSanjaeDoc/openSaveSanjae 참조).

const LAYOUT_SANJAE_A = { key:'A', name:'일반내역',
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
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호','00001~'),
  F(16,4,'an','서식번호','',{'M311':'산재보험 진료비명세서','M321':'합병증 등 예방관리비용 명세서','M331':'진폐건강진단비용 명세서'}),
  F(20,7,'an','청구기관코드',''),
  F(27,1,'an','사업구분','',{'1':'요양급여비용','2':'합병증 등 예방관리비용','3':'진폐건강진단비용'}),
  F(28,1,'an','청구구분코드','원청구시 공란',{'1':'보완청구','2':'추가청구'}),
  F(29,15,'an','접수번호','보완·추가청구시 당초 접수번호'),
  F(44,5,'an','명세서일련번호(당초)','보완·추가청구시'),
  F(49,4,'an','사유코드','보완청구시 심사불능 사유코드'),
  F(53,60,'an','산재근로자성명',''),
  F(113,13,'an','산재근로자주민등록번호',"'-' 생략"),
  F(126,8,'an','재해발생일자','CCYYMMDD'),
  F(134,35,'an','소속사업장명칭',''),
  F(169,20,'an','진료과목','2개 이상이면 최대 10개까지 2자리씩 연이어 기재',산재진료과목코드),
  F(189,8,'an','진료개시일','CCYYMMDD'),
  F(197,16,'an','진료기간','CCYYMMDD+CCYYMMDD(From+To)'),
  F(213,3,'n','실진료일수','입원은 입원일수, 통원은 내원일수',null,'money'),
  F(216,3,'n','퇴원약투약일수','입원시 퇴원당일 처방 투여일수',null,'money'),
  F(219,31,'an','내원일','통원시 내원일=1, 비내원일=0'),
  F(250,16,'an','중환자실입원','CCYYMMDD+CCYYMMDD'),
  F(266,3,'n','중환자실입원일수','',null,'money'),
  F(269,2,'an','진료구분','',{'01':'입원 일반','02':'통원 일반','03':'요양장기(정액)','04':'입원 치과','05':'통원 치과','06':'입원 특별진찰','07':'통원 특별진찰','08':'입원 병행진료','09':'통원 병행진료','10':'입원 진폐','11':'통원 진폐','12':'입원 정밀진단','13':'통원 정밀진단','14':'입원 신체감정','15':'통원 신체감정','16':'입원 건강진단1차','17':'통원 건강진단1차','18':'입원 건강진단2차','19':'통원 건강진단2차','20':'사용유보','21':'입원 산재관리의사','22':'통원 산재관리의사','23':'호스피스(정액)','24':'종결후 장해','25':'종결후 보조기구'}),
  F(271,1,'an','치료구분','최종 진료일 산재근로자 상태',{'1':'치유','2':'사망','3':'요양중 사망','4':'전원','5':'계속'}),
  F(272,2,'an','간병범위','',{'01':'두 손가락 상실 등으로 식사 불가','02':'실명 등으로 일상동작 불가','03':'뇌손상으로 의식혼미·착란','04':'신경계·정신장해로 의사소통 불가','05':'체표 35%이상 화상','06':'견인장치·석고붕대로 동작 불가','07':'배뇨배변 곤란·욕창방지 체위변경 필요','08':'신체허약으로 일상동작 불가','09':'수술 등으로 거동제한','10':'그 밖에 제1~9호에 준하는 사람'}),
  F(274,10,'n','기본진료약제특정재료I','종별가산율 미적용',null,'money'),
  F(284,10,'n','진료행위료II','종별가산율 적용',null,'money'),
  F(294,10,'n','청구액','기본진료약제특정재료I+진료행위료II 소계+가산금액(10원미만 절사)',null,'money'),
  F(304,3,'n','가산율','건강보험 종별가산율에 산재 요양급여 산정기준 적용',null,'money'),
]};

const LAYOUT_SANJAE_B = { key:'B', name:'상병내역',
  gridOrder:['상병분류구분','상병분류기호'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,1,'an','상병분류구분','최대: 주상병 1개(필수)+부상병 29개(조건)',{'1':'주상병','2':'부상병'}),
  F(17,6,'an','상병분류기호','한국표준질병·사인분류(KCD) 의과 분류기호'),
]};

const 산재항번호코드 = codesTable([['01','진찰료'],['02','입원료'],['03','투약료 및 처방전'],['04','주사료'],['05','마취료'],['06','이학요법료'],['07','정신요법료'],['08','처치 및 수술료'],['09','검사료'],['10','영상진단 및 방사선치료료'],['S','특수장비'],['L','요양·호스피스 장기(정액)'],['51','간병료'],['52','선택진료'],['53','치과보철'],['54','재활보조기구'],['55','통합재활훈련'],['56','초음파'],['57','수수료'],['58','이송료'],['59','치료보조기구'],['99','기타']]);
const 산재목번호맵 = {
  '01':{'01':'초진','02':'재진','03':'의약품관리료','04':'응급 및 회송료','05':'가정간호기본방문료','06':'만성질환관리료','07':'선택진료비'},
  '02':{'01':'일반','02':'내과,정신과','03':'중환자실','04':'격리병실','05':'상급병실','06':'기타','07':'기본식대','08':'가산식대'},
  '03':{'01':'내복약','02':'외용약','03':'처방전'},
  '04':{'01':'피하 또는 근육내','02':'정맥내','03':'수액제','04':'기타','05':'특정재료','06':'수혈'},
  '05':{'01':'마취료','02':'선택진료비'},
  '06':{'01':'이학요법료'},
  '07':{'01':'정신요법료'},
  '08':{'01':'처치 및 수술(치과포함)','02':'캐스트','03':'선택진료비'},
  '09':{'01':'자체검사','03':'위탁검사'},
  '10':{'01':'진단','02':'치료','03':'선택진료비'},
  'S':{'01':'CT진단','02':'MRI진단','03':'PET진단'},
  'L':{'01':'요양장기(정액)','02':'호스피스(정액)','81':'진찰료','82':'입원료','83':'투약료','84':'주사료','85':'마취료','86':'이학요법료','87':'정신요법료','88':'처치 및 수술료','89':'검사료','90':'영상진단 및 방사선치료료','91':'특수장비','94':'기타'},
  '51':{'01':'간병료'},
  '52':{'01':'선택진료료'},
  '53':{'01':'치과보철'},
  '54':{'01':'재활보조기구','02':'재활보조기구 처방 및 검수료'},
  '55':{'01':'통합재활훈련'},
  '56':{'01':'초음파'},
  '57':{'01':'발급·확인수수료'},
  '58':{'01':'이송료'},
  '59':{'01':'치료보조기구'},
  '99':{'01':'기타'},
};
const LAYOUT_SANJAE_C = { key:'C', name:'진료내역',
  gridOrder:['항','목','줄번호','구분','코드','코드명칭','진료기간','가산구분','단가','수량','일수','금액','치식(우상)','치식(좌상)','치식(우하)','치식(좌하)'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,2,'an','항','항번호',산재항번호코드,null,10),
  F(18,2,'an','목','목번호(항별 하위코드)',null,null,10),
  F(20,4,'n','줄번호','1~9999',null,null,10),
  F(24,1,'an','구분','코드구분',{'1':'수가','2':'준용수가','3':'보험등재약','4':'원료약·자체조제약','8':'치료재료'},null,7),
  F(25,9,'an','코드','',null,null,20),
  F(34,70,'an','코드명칭','진료수가·약제·치료재료 명칭',null,null,52),
  F(104,16,'an','진료기간','CCYYMMDD+CCYYMMDD(From+To)',null,null,16),
  F(120,1,'an','가산구분','',{'1':'기본진료,약제,특정재료(I)','2':'진료행위료(II)'}),
  F(121,12,'n','단가','정수10+소수2',null,2),
  F(133,9,'n','수량','1일투여량 또는 투여(실시)횟수 n(5.4)',null,4),
  F(142,3,'n','일수','총투여일수 또는 실시횟수',null,'money'),
  F(145,10,'n','금액','단가×수량×일수',null,'money'),
  F(155,8,'an','치식(우상)','치과 해당시'),
  F(163,8,'an','치식(좌상)',''),
  F(171,8,'an','치식(우하)',''),
  F(179,8,'an','치식(좌하)',''),
]};

const LAYOUT_SANJAE_D = { key:'D', name:'처방전교부내역',
  gridOrder:['처방전교부번호','처방일수','줄번호','구분','코드','코드명칭','1회투약량','1일투여횟수','총투약일수'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,13,'an','처방전교부번호','CCYYMMDD+일련5자리'),
  F(29,3,'n','처방일수','',null,'money'),
  F(32,4,'n','줄번호','1~9999'),
  F(36,1,'an','구분','코드구분',{'3':'보험등재약','4':'원료·조제약','5':'보험등재약의 일반명'}),
  F(37,9,'an','코드',''),
  F(46,70,'an','코드명칭','',null,null,52),
  F(116,9,'n','1회투약량','n(5.4)',null,4),
  F(125,2,'n','1일투여횟수','',null,'money'),
  F(127,3,'n','총투약일수','',null,'money'),
]};

const LAYOUT_SANJAE_E = { key:'E', name:'특정내역',
  gridOrder:['발생단위','처방전교부번호','줄번호','특정내역구분','특정내역'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,1,'an','발생단위','',{'1':'명세서','2':'진료내역 줄번호단위','3':'처방내역 줄번호단위','4':'처방내역단위'}),
  F(17,13,'an','처방전교부번호','발생단위 3·4일 때',null,null,14),
  F(30,4,'n','줄번호','발생단위 1·4는 space'),
  F(34,5,'an','특정내역구분','근로복지공단 고시 참조'),
  F(39,700,'an','특정내역','기재형식은 고시 참조'),
]};

const LAYOUTS_SANJAE = { H:LAYOUT_SANJAE_H, A:LAYOUT_SANJAE_A, B:LAYOUT_SANJAE_B, C:LAYOUT_SANJAE_C, D:LAYOUT_SANJAE_D, E:LAYOUT_SANJAE_E };

const BLANK_ROW_LEN_SANJAE = { B:22, C:186, D:129, E:738 };

// 산재보험 진료비청구서(M010.1)는 진료형태별 반복그룹 구조라 GEN/DRG/NDRG처럼 "A레코드 필드 합산 → H레코드 필드 1개"로
// 단순 매핑되지 않는다. 부분(선택 명세서만) 저장 시 M010.1의 청구건수/청구액 재계산은 지원하지 않고 원본 그대로 둔다
// (openSaveSanjae가 이 경우 화면에 안내 문구를 보여줌). 전체 저장은 원본 바이트 그대로이므로 문제 없음.

/* ---------- 산재 — M010.1(청구서)+M010.2(간병료,옵션)+M020.1~.5(명세서)가 파일 7개로 나뉜 것을 한 청구(doc)로 합쳐 파싱.
   M010.2는 반복그룹 구조까지는 검증하지 않았고(실샘플에 항상 0byte) 편집 UI도 없어 원본 바이트를 그대로만 보존한다. ---------- */
const SANJAE_ROLE_ORDER = ['H','A','B','C','D','E'];
function parseSanjaeDoc(buffersByRole, namesByRole, label){
  const sources = {};
  const allRecords = []; const recById = new Map();
  let nextId = 0, totalBytes = 0;
  for (const role of SANJAE_ROLE_ORDER){
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
    claimType:'SANJAE',
    fileName: label || '산재청구',
    bytes: { length: totalBytes },
    sources, records: allRecords, recById, nextId,
    claims:[], claimByKey:new Map(), hId:-1, unknown:0,
    edits:new Map(), undoStack:[], redoStack:[], selClaim:-1,
    fileHandles: {},
  };
  buildClaims(doc);
  return doc;
}
function loadSanjaeBuffers(buffersByRole, namesByRole, label, fileHandles, isRestore){
  const doc = parseSanjaeDoc(buffersByRole, namesByRole, label);
  doc.fileHandles = fileHandles || {};
  docs.push(doc);
  switchTab(docs.length-1);
  if (!isRestore){ persistFiles(); schedulePersist(); }
}

let pendingOutputSanjae = null;
function openSaveSanjae(scopeSet){
  try{
    const live = state.records.filter(r=>!r.deleted && (r.t==='H' || !scopeSet || scopeSet.has(claimKeyOfRecord(r))));
    const partsByRole = {H:[],A:[],B:[],C:[],D:[],E:[]};
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
    for (const role of SANJAE_ROLE_ORDER){
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
      const fname = (state.sources[role] && state.sources[role].fileName) || SANJAE_FILE_NAMES[role];
      perFileRows.push('<tr><td>'+esc(fname)+'</td><td>'+esc(curLayouts()[role].name)+'</td><td>'+rep.count.toLocaleString()+'</td><td>'+out.length.toLocaleString()+' byte</td></tr>');
    }
    if (state.sources.H2){
      outputsByRole.H2 = state.sources.H2.bytes;
      perFileRows.push('<tr><td>'+esc(state.sources.H2.fileName)+'</td><td>간병료 산정현황(원본 보존)</td><td>-</td><td>'+state.sources.H2.bytes.length.toLocaleString()+' byte</td></tr>');
    }
    repAgg.typeOk = repAgg.typeBad===0;
    pendingOutputSanjae = outputsByRole;
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
async function downloadOutputSanjae(){
  try{ await downloadOutputSanjaeInner(); }
  catch(e){ alert('저장 중 예상치 못한 오류가 발생했습니다: '+e.message+'\n(이 문구를 스크린샷으로 남겨주세요)'); }
}
async function downloadOutputSanjaeInner(){
  if (!pendingOutputSanjae) return;
  const roles = Object.keys(pendingOutputSanjae);
  const fileHandles = state.fileHandles || {};
  const prefix = document.getElementById('saveName').value.trim();
  const nameFor = (role, canonical) => prefix ? prefix+'_'+canonical : ((state.sources[role] && state.sources[role].fileName) || canonical);
  for (const role of roles){
    const h = fileHandles[role];
    if (!h) continue;
    try{
      const w = await h.createWritable();
      await w.write(pendingOutputSanjae[role]);
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
      const name = nameFor(role, SANJAE_FILE_NAMES[role]);
      try{
        const fh = await dirHandle.getFileHandle(name, {create:true});
        const w = await fh.createWritable();
        await w.write(pendingOutputSanjae[role]);
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
    const name = nameFor(role, SANJAE_FILE_NAMES[role]);
    const buf = pendingOutputSanjae[role];
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

// 파일 목록(File[])을 받아, M010.1/M010.2/M020.1~.5 이름과 일치하는 것들은 자동으로 산재 청구 1건으로 묶어서 열고
// 나머지(그루핑에 쓰이지 않은 파일)는 반환해서 공통 openPickedFiles가 개별 파일로 이어서 처리하게 한다.
// 실샘플은 DRG/자보한방 등과 마찬가지로 앞에 임의의 접두사가 붙는 경우가 있어 접미사 일치로 판별한다.
const SANJAE_FILE_NAMES = { H:'M010.1', H2:'M010.2', A:'M020.1', B:'M020.2', C:'M020.3', D:'M020.4', E:'M020.5' };
const SANJAE_SUFFIX_ROLES = [
  [/M020\.1$/, 'A'], [/M020\.2$/, 'B'], [/M020\.3$/, 'C'], [/M020\.4$/, 'D'], [/M020\.5$/, 'E'],
];
function sanjaeUniqueRoleForFilename(name){
  for (const [re, role] of SANJAE_SUFFIX_ROLES) if (re.test(name)) return role;
  return null;
}
function sanjaeRoleForFilename(name){
  if (/M010\.1$/.test(name)) return 'H';
  if (/M010\.2$/.test(name)) return 'H2';
  return sanjaeUniqueRoleForFilename(name);
}
async function sanjaeGrouperFn(files, handleByName){
  // M010.1/M010.2(청구서·간병료)는 산재 한방(SANJAE_HAN, M021.x)과 공유하는 파일명이라, 산재
  // 고유 파일(M020.x)이 하나도 없으면 개입하지 않는다 — DRG/MG가 겪었던 "공유 파일명 무조건 선점"
  // 버그와 동일한 패턴(자세한 내용은 js/layout-sanjae-han.js 상단 주석 참조).
  const hasSanjaeSpecific = files.some(f => sanjaeUniqueRoleForFilename(f.name));
  if (!hasSanjaeSpecific) return files;
  const sanjaeFiles = [], rest = [];
  for (const file of files){
    (sanjaeRoleForFilename(file.name) ? sanjaeFiles : rest).push(file);
  }
  if (!sanjaeFiles.length) return files;
  const buffersByRole = {}; const namesByRole = {}; const fileHandles = {};
  for (const file of sanjaeFiles){
    const role = sanjaeRoleForFilename(file.name);
    if (file.size===0 && role!=='H2') continue; // H2(간병료)는 0바이트라도 원본 그대로 보존, 나머지는 없는 파일과 동일 취급
    buffersByRole[role] = await file.arrayBuffer();
    namesByRole[role] = file.name;
    const h = handleByName ? handleByName.get(file.name) : null;
    if (h) fileHandles[role] = h;
  }
  if (buffersByRole.H && buffersByRole.A){
    const label = sanjaeFiles[0].webkitRelativePath ? sanjaeFiles[0].webkitRelativePath.split('/')[0] : '산재청구';
    loadSanjaeBuffers(buffersByRole, namesByRole, label, fileHandles);
  } else {
    alert('산재 파일(M010.1, M020.1~.5)로 보이는데, 필수인 M010.1과 M020.1(일반내역)이 함께 선택되지 않았습니다.\n두 파일을 포함해서 다시 선택해 주세요.');
  }
  return rest;
}
registerFileGrouper(sanjaeGrouperFn);
// M010.1 하나만 선택된 경우의 자동완성 — 진료형태별 반복그룹(6슬롯, pos45부터 19byte씩) 중 의과/치과
// (진료형태 1~4)에 실제 청구건수가 있으면 산재(의과/치과), 한방(5~6)에만 있으면 산재한방이다.
// layout-sanjae-han.js가 이 스크립트보다 뒤에 로드되므로 이 헬퍼를 그대로 재사용한다.
function sanjaeH010HasNonzeroCount(bytes, types){
  for (let i=0;i<6;i++){
    const typeIdx = 45 + 19*i - 1; // 0-indexed 진료형태
    const type = String.fromCharCode(bytes[typeIdx]||0);
    if (!types.includes(type)) continue;
    for (let k=0;k<6;k++){
      const ch = bytes[typeIdx+1+k];
      if (ch>=0x31 && ch<=0x39) return true; // 청구건수에 1~9 숫자가 하나라도 있으면 실제 사용된 슬롯
    }
  }
  return false;
}
registerHOnlyAutocomplete({ pattern:/M010\.1$/, detect: bytes => sanjaeH010HasNonzeroCount(bytes, ['1','2','3','4']), roleForFilename:sanjaeRoleForFilename, retry:sanjaeGrouperFn, label:'산재(의과·치과) 청구서' });

/* ---------- 산재(SANJAE) 청구분야 등록 ---------- */
LAYOUT_SANJAE_A.formHidden = ['청구번호','내원일'];
LAYOUT_SANJAE_C.mokMap = 산재목번호맵;
registerRecordLetters(['A','B','C','D','E']);
registerClaimType('SANJAE', {
  layouts: LAYOUTS_SANJAE,
  // 산재 상병내역(B)에는 날짜 필드가 없어(상병분류구분+상병분류기호뿐) 기준을 일반내역(A)의 진료개시일로 삼고,
  // A 자신의 진료기간(From+To)·진료내역(C) 진료기간(From+To)·특정내역(E) 자유서식 속 날짜를 함께 이동시킨다.
  dateAnchor: {
    anchorType:'A', bField:'진료개시일', bFlagField:null, bFlagVal:null,
    shiftFields: [
      { t:'A', name:'진료기간', kind:'range' },
      { t:'C', name:'진료기간', kind:'range' },
      { t:'E', name:'특정내역', kind:'freetext' },
    ],
  },
  blankRowLen: BLANK_ROW_LEN_SANJAE,
  openSave: openSaveSanjae,
  downloadOutput: downloadOutputSanjae,
  parseMultiDoc: parseSanjaeDoc,
  usesContentClassify: false, // 파일명(role)이 유형을 결정하고, 서식번호가 'M'으로 시작해 위치16 바이트가 KNOWN_RECORD_LETTERS에 걸리지 않으므로 classify() 재판별을 하지 않음
  legacyLabelWidth: true, // 통짜(claimType 구분 없는) 라벨폭 저장 시절부터 있던 청구분야
});
