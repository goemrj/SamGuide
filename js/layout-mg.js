/* ---------- 의료급여정액(MG) 레이아웃 — DRG/산재/자보한방처럼 청구서(H010)+명세서(H040.1~.5)가
   파일 여러 개로 나뉜다. H010은 GEN의 LAYOUT_H와 완전히 동일(서식번호 H011, 진료구분='5')해 그대로
   재사용. H040.1~.5는 GEN의 A~E와 같은 필드 폭·유형 구성이지만 내역구분(1byte) 필드가 없어(서식번호가
   그 자리를 대신 차지) 전부 1바이트씩 앞으로 당겨져 있다 — 자보 한방과 동일한 패턴.
   필드 위치는 「SAM_06_의료급여비용정액명세서(092).doc」+「★ 의료급여정액 SAM 청구서(092).doc」 기준
   (2026-08-13, 정신과정액입원/혈액투석정액외래/낮병동정액 실샘플 3종 대조). ---------- */

const LAYOUT_MG_A = { key:'A', name:'일반내역',
  formGroups:[
    {title:'수진자현황', widthGroup:'main', labels:{'명세서일련번호':'명일련','수진자성명':'수진자','수진자주민등록번호':'','입원일수,총내원일수':'입내원일','당월의료급여일수':'진료기간','당월진료개시일':'진료개시일','의료급여종별구분':'급여종별'}, rows:[
      ['명세서일련번호'],
      ['수진자성명','수진자주민등록번호'],
      ['입원일수,총내원일수','당월의료급여일수'],
      ['당월진료개시일','의료급여종별구분'],
      ['공상등구분'],
    ]},
    {title:'진료비내역', widthGroup:'main', labels:{'의료급여비용총액1':'총진료비','본인일부부담금':'본인부담금','의료급여비용총액2,진료비총액':'진료비총액','장애인의료비':'장애의료비','의료급여정액수가행위별총액':'행위별총액','보훈본인일부부담금':'보훈본인액','의료급여100/100본인부담금총액':'100/100'}, rows:[
      ['의료급여비용총액1','본인일부부담금'],
      ['의료급여비용총액2,진료비총액','청구액'],
      ['장애인의료비','의료급여정액수가행위별총액'],
      ['보훈본인일부부담금','보훈청구액'],
      ['약제상한액','대불금'],
      ['의료급여100/100본인부담금총액','비급여총액'],
    ]},
    {title:'일반내역', widthGroup:'main', labels:{'세대주성명':'가입자성명','보장기관기호':'보장기호','보장시설및노숙인시설기호':'증번호','입원경로':'도착입원'}, rows:[
      ['세대주성명','보장기관기호'],
      ['보장시설및노숙인시설기호'],
      ['입원경로','진료결과'],
    ]},
    {title:'청구구분', labels:{'청구구분코드':'청구구분','명세서일련번호(당초)':'명일련번호','최초입원개시일':'최초입원일'}, rows:[
      ['청구구분코드','접수번호'],
      ['명세서일련번호(당초)','사유코드'],
      ['최초입원개시일'],
    ]},
  ],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호','00001~99999'),
  F(16,4,'an','서식번호','',{'H040':'의료급여 정신건강의학과정액 입원','H041':'의료급여 정신건강의학과정액 외래','H042':'의료급여 정신건강의학과정액 낮병동','H043':'의료급여 혈액투석정액 외래'}),
  F(20,8,'an','요양기관기호',''),
  F(28,8,'an','보장기관기호','수급권자 관할 시군구 기호'),
  F(36,1,'an','의료급여종별구분','',{'1':'1종','2':'2종','4':'행려','6':'2종 장애인의 2차','8':'2종 장애인의 1차','N':'노숙인 1종'}),
  F(37,1,'an','공상등구분','',{'0':'무','4':'보훈위탁진료 요양기관의 보훈국비환자(의료급여 수급권자)','B':'보훈병원의 국비급여 1차'}),
  F(38,1,'an','청구구분코드','',{'1':'보완청구','2':'추가청구','3':'분리청구'}),
  F(39,7,'an','접수번호','보완·추가·분리시 당초 접수번호'),
  F(46,5,'an','명세서일련번호(당초)','보완·추가·분리시'),
  F(51,2,'an','사유코드','보완청구시 심사불능코드'),
  F(53,8,'an','최초입원개시일','분리청구시 CCYYMMDD'),
  F(61,8,'an','당월진료개시일','그 달 최초 내원일. CCYYMMDD'),
  F(69,20,'an','세대주성명',''),
  F(89,20,'an','보장시설및노숙인시설기호',''),
  F(109,20,'an','수진자성명',''),
  F(129,13,'an','수진자주민등록번호',"'-' 생략"),
  F(142,3,'n','당월의료급여일수','원내투약일수 산입',null,'money'),
  F(145,3,'n','입원일수,총내원일수','',null,'money'),
  F(179,2,'an','입원경로','도착(1타기관/2응급대/3기타)+입원(1응급실/2외래)',입원경로코드),
  F(181,1,'an','진료결과','',{'1':'계속','2':'이송','3':'회송','4':'사망','9':'퇴원'}),
  F(190,10,'n','의료급여비용총액1','X항·Z항 정액수가+별도산정 합. 100/100·비급여 제외',null,'money'),
  F(200,10,'n','본인일부부담금','',null,'money'),
  F(210,10,'n','청구액','의료급여비용총액1-본인일부부담금-장애인의료비',null,'money'),
  F(220,10,'n','장애인의료비','의료급여 2종 장애인 1,2차',null,'money'),
  F(230,10,'n','대불금','2종 수급권자 입원진료 대불금 신청시',null,'money'),
  F(240,10,'n','비급여총액','보훈위탁 국비환자 진료분',null,'money'),
  F(250,10,'n','의료급여비용총액2,진료비총액','',null,'money'),
  F(260,10,'n','보훈청구액','',null,'money'),
  F(270,10,'n','의료급여정액수가행위별총액','X·Z항 중 종별가산 적용대상 합',null,'money'),
  F(280,10,'n','약제상한액','구 약제상한차액총액',null,'money'),
  F(290,10,'n','보훈본인일부부담금','',null,'money'),
  F(300,10,'n','의료급여100/100본인부담금총액','',null,'money'),
]};

const LAYOUT_MG_B = { key:'B', name:'상병내역',
  gridOrder:['상병분류구분','상병분류기호','진료과목','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,1,'an','상병분류구분','',{'1':'주상병','2':'부상병','3':'배제된 상병'}),
  F(17,6,'an','상병분류기호','한국표준질병·사인분류(KCD)'),
  F(23,2,'an','진료과목','',진료과목코드),
  F(25,1,'an','면허종류','',{'1':'의사'}),
  F(26,10,'an','면허번호',''),
]};

const 항번호코드_의료급여정액 = codesTable([['01','진찰료'],['02','입원료'],['03','투약료'],['04','주사료'],['05','마취료'],['06','이학요법료'],['07','정신요법료'],['08','처치 및 수술료'],['09','검사료'],['10','영상진단및방사선치료료'],['S','특수장비'],['U','의료급여 100분의100 본인부담'],['V','보훈 등 100분의100 본인부담'],['W','비급여'],['X','정신건강의학과정액'],['Z','혈액투석정액'],['99','기타']]);
const 목번호맵_의료급여정액 = {
  '01':{'01':'초진','02':'재진','03':'응급 및 회송료 등'},
  '02':{'01':'일반','02':'내과질환자·정신질환자·만8세미만 소아','03':'중환자실','04':'격리병실','10':'기본식대','99':'기타입원료'},
  '03':{'01':'내복약','02':'외용약','03':'처방전','99':'기타'},
  '04':{'01':'주사','99':'기타'},
  '05':{'01':'마취'},
  '06':{'01':'이학요법료'},
  '07':{'01':'정신요법료'},
  '08':{'01':'처치 및 수술, (치과)보통외 처치','03':'캐스트'},
  '09':{'01':'자체검사','02':'위탁검사'},
  '10':{'01':'진단','02':'치료'},
  'S':{'01':'CT진단','02':'MRI진단','03':'PET진단'},
  'U':{'01':'의약품','02':'치료재료','03':'진료행위'},
  'V':{'01':'의약품','02':'치료재료','03':'진료행위'},
  'W':{'01':'의약품','02':'치료재료','03':'진료행위'},
  'X':codesTable([['01','의료급여 정신질환 정액수가(외래·낮병동·입원·외박수가)'],['02','투약 1일당 정액수가'],['03','퇴원약제'],['81','진찰료'],['82','입원료'],['83','투약료'],['84','주사료'],['85','마취료'],['86','이학요법료'],['87','정신요법료'],['88','처치 및 수술료'],['89','검사료'],['90','영상진단 및 방사선치료료'],['91','특수장비'],['92','100분의100본인부담'],['93','비급여'],['94','기타']]),
  'Z':{'01':'의료급여 혈액투석 정액수가'},
};

const LAYOUT_MG_C = { key:'C', name:'진료내역',
  gridOrder:['항','목','줄번호','구분','코드','단가','1회투','일투','총투','금액','변경일','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,2,'an','항','항번호',항번호코드_의료급여정액,null,10),
  F(18,2,'an','목','목번호(항별 하위코드)',null,null,10),
  F(20,4,'n','줄번호','1~9999',null,null,10),
  F(24,1,'an','구분','코드구분',{'1':'수가','2':'준용수가','3':'보험등재약','4':'원료약·자체조제약','8':'치료재료'},null,7),
  F(25,9,'an','코드','수가/약제/치료재료 코드',null,null,20),
  F(34,12,'n','단가','정수8+소수2',null,2),
  F(46,7,'n','일투','1일투여량·투여(실시)횟수 n(5.2)',null,2),
  F(53,3,'n','총투','총투여일수·실시횟수',null,'money'),
  F(56,9,'n','1회투','1회투약량 n(5.4) 의약품만',null,4),
  F(65,10,'n','금액','단가×1회투×일투×총투',null,'money'),
  F(75,10,'n','공란','(구 상한가)'),
  F(85,10,'n','공란','(구 약제상한차액)'),
  F(95,8,'an','변경일','CCYYMMDD',null,null,16),
  F(103,1,'an','면허종류','',{'1':'의사','6':'간호사','7':'사회복지사'}),
  F(104,100,'an','면허번호',"복수시 '/'구분",null,null,14),
]};

const LAYOUT_MG_D = { key:'D', name:'처방내역',
  gridOrder:['처방전발급번호','처방일수','줄번호','구분','코드','1회투','1일투여횟수','총투약일수','본인부담률구분'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,13,'an','처방전발급번호','CCYYMMDD+일련5자리'),
  F(29,3,'n','처방일수','',null,'money'),
  F(32,2,'n','반복조제횟수','(사용유보)'),
  F(34,4,'n','줄번호','1~9999'),
  F(38,1,'an','구분','코드구분',{'3':'보험등재약','4':'원료약','5':'보험등재약의 일반명'}),
  F(39,9,'an','코드',''),
  F(48,9,'n','1회투','1회투약량 n(5.4)',null,4),
  F(57,2,'n','1일투여횟수','',null,'money'),
  F(59,3,'n','총투약일수','',null,'money'),
  F(62,1,'an','본인부담률구분','',{'A':'100/50','B':'100/80','D':'100/30','E':'100/90','U':'건보(의급)100/100','V':'보훈100/100','W':'비급여'}),
]};

const LAYOUT_MG_E = { key:'E', name:'특정내역',
  gridOrder:['발생단위','처방전발급번호','줄번호','특정내역구분','특정내역'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,1,'an','발생단위','',{'1':'명세서단위','2':'줄번호단위','3':'처방내역 줄번호단위','4':'처방내역단위'}),
  F(17,13,'an','처방전발급번호','발생단위 3·4일 때',null,null,14),
  F(30,4,'n','줄번호','발생단위 1·4=space'),
  F(34,5,'an','특정내역구분','심평원 고시 별표8'),
  F(39,700,'an','특정내역','기재형식은 고시 참조'),
]};

const LAYOUTS_MG = { H:LAYOUT_H, A:LAYOUT_MG_A, B:LAYOUT_MG_B, C:LAYOUT_MG_C, D:LAYOUT_MG_D, E:LAYOUT_MG_E };

const H_SUM_FIELD_PAIRS_MG = [
  ['의료급여비용총액1','요양급여비용총액1'],
  ['본인일부부담금','본인일부부담금'],
  ['청구액','청구액'],
  ['장애인의료비','장애인의료비'],
  ['의료급여비용총액2,진료비총액','총액2·진료비총액'],
  ['보훈청구액','보훈청구액'],
  ['의료급여100/100본인부담금총액','100/100본인부담총액'],
  ['보훈본인일부부담금','보훈 본인일부부담금'],
];

const BLANK_ROW_LEN_MG = { B:35, C:203, D:62, E:738 };

/* ---------- H010(청구서)+H040.1~.5(명세서)가 파일 여러 개로 나뉜 것을 한 청구(doc)로 합쳐 파싱.
   DRG/자보한방의 parse*Doc과 동일한 구조 — 소스 파일 자체가 role을 결정하므로 classify() 없이
   r.t=role 그대로 부여. 실샘플 대조 결과 자보 한방과 똑같이 H010/H040.1은 CRLF를 쓰지만 H040.2/.3/.5
   (상병·진료·특정내역)는 LF만 쓴다 — detectLineSep/splitRecordsBySep(js/layout-jabo-han.js에서 정의,
   이 스크립트가 그 뒤에 로드되므로 그대로 재사용)로 파일별 실제 구분자를 감지해서 나누고 저장한다. ---------- */
const MG_ROLE_ORDER = ['H','A','B','C','D','E'];
function parseMgDoc(buffersByRole, namesByRole, label){
  const sources = {};
  const allRecords = []; const recById = new Map();
  let nextId = 0, totalBytes = 0;
  for (const role of MG_ROLE_ORDER){
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
    claimType:'MG',
    fileName: label || '의료급여정액청구',
    bytes: { length: totalBytes },
    sources, records: allRecords, recById, nextId,
    claims:[], claimByKey:new Map(), hId:-1, unknown:0,
    edits:new Map(), undoStack:[], redoStack:[], selClaim:-1,
    fileHandles: {},
  };
  buildClaims(doc);
  return doc;
}
function loadMgBuffers(buffersByRole, namesByRole, label, fileHandles, isRestore){
  const doc = parseMgDoc(buffersByRole, namesByRole, label);
  doc.fileHandles = fileHandles || {};
  docs.push(doc);
  switchTab(docs.length-1);
  if (!isRestore){ persistFiles(); schedulePersist(); }
}

let pendingOutputMg = null;
function openSaveMg(scopeSet){
  try{
    const live = state.records.filter(r=>!r.deleted && (r.t==='H' || !scopeSet || scopeSet.has(claimKeyOfRecord(r))));
    const partsByRole = {H:[],A:[],B:[],C:[],D:[],E:[]};
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
    for (const role of MG_ROLE_ORDER){
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
      const fname = (state.sources[role] && state.sources[role].fileName) || MG_FILE_NAMES[role];
      perFileRows.push('<tr><td>'+esc(fname)+'</td><td>'+esc(curLayouts()[role].name)+'</td><td>'+rep.count.toLocaleString()+'</td><td>'+out.length.toLocaleString()+' byte</td></tr>');
    }
    repAgg.typeOk = repAgg.typeBad===0;
    pendingOutputMg = outputsByRole;
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
      +(scopeSet?'<div style="font-size:11.5px;color:var(--ok)">✓ 청구서(H010)의 건수·합계금액이 선택된 명세서 기준으로 재계산되었습니다.</div>':'')
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
async function downloadOutputMg(){
  try{ await downloadOutputMgInner(); }
  catch(e){ alert('저장 중 예상치 못한 오류가 발생했습니다: '+e.message+'\n(이 문구를 스크린샷으로 남겨주세요)'); }
}
async function downloadOutputMgInner(){
  if (!pendingOutputMg) return;
  const roles = Object.keys(pendingOutputMg);
  const fileHandles = state.fileHandles || {};
  const prefix = document.getElementById('saveName').value.trim();
  const nameFor = (role, canonical) => prefix ? prefix+'_'+canonical : ((state.sources[role] && state.sources[role].fileName) || canonical);
  for (const role of roles){
    const h = fileHandles[role];
    if (!h) continue;
    try{
      const w = await h.createWritable();
      await w.write(pendingOutputMg[role]);
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
      const name = nameFor(role, MG_FILE_NAMES[role]);
      try{
        const fh = await dirHandle.getFileHandle(name, {create:true});
        const w = await fh.createWritable();
        await w.write(pendingOutputMg[role]);
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
    const name = nameFor(role, MG_FILE_NAMES[role]);
    const buf = pendingOutputMg[role];
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

/* ---------- 파일명 자동 인식 — H010(청구서) + H040.1~.5(명세서). 실샘플을 보면 "2025121H05_H040.1"처럼
   앞에 임의의 접두사가 붙는 경우가 있어(자보 한방과 동일한 문제) 접미사 일치로 판별한다.
   H010은 GEN 등 다른 청구분야도 공유하는 이름이라, MG 고유 파일(H040.x)이 하나도 없으면 이 그루퍼는
   개입하지 않는다(DRG 그루퍼와 동일한 안전장치). ---------- */
const MG_FILE_NAMES = { H:'H010', A:'H040.1', B:'H040.2', C:'H040.3', D:'H040.4', E:'H040.5' };
const MG_SUFFIX_ROLES = [
  [/H040\.1$/, 'A'], [/H040\.2$/, 'B'], [/H040\.3$/, 'C'], [/H040\.4$/, 'D'], [/H040\.5$/, 'E'],
];
function mgUniqueRoleForFilename(name){
  for (const [re, role] of MG_SUFFIX_ROLES) if (re.test(name)) return role;
  return null;
}
function mgRoleForFilename(name){
  if (/H010$/.test(name)) return 'H';
  return mgUniqueRoleForFilename(name);
}

async function mgGrouperFn(files, handleByName){
  const hasMgSpecific = files.some(f => mgUniqueRoleForFilename(f.name));
  if (!hasMgSpecific) return files;
  const mgFiles = [], rest = [];
  for (const file of files){
    (mgRoleForFilename(file.name) ? mgFiles : rest).push(file);
  }
  if (!mgFiles.length) return files;
  const buffersByRole = {}; const namesByRole = {}; const fileHandles = {};
  for (const file of mgFiles){
    if (file.size===0) continue; // H040.4처럼 해당 내역이 없어 0byte인 경우 — 없는 파일과 동일하게 취급
    const role = mgRoleForFilename(file.name);
    buffersByRole[role] = await file.arrayBuffer();
    namesByRole[role] = file.name;
    const h = handleByName ? handleByName.get(file.name) : null;
    if (h) fileHandles[role] = h;
  }
  if (buffersByRole.H && buffersByRole.A){
    const label = mgFiles[0].webkitRelativePath ? mgFiles[0].webkitRelativePath.split('/')[0] : '의료급여정액청구';
    loadMgBuffers(buffersByRole, namesByRole, label, fileHandles);
  } else {
    alert('의료급여정액 파일(H010, H040.1~.5)로 보이는데, 필수인 H010(청구서)과 .1(일반내역)이 함께 선택되지 않았습니다.\n두 파일을 포함해서 다시 선택해 주세요.');
  }
  return rest;
}
registerFileGrouper(mgGrouperFn);
// H010 하나만 선택된 경우의 자동완성 — MG는 서식번호(pos17,4byte)가 'H011'로 GEN·DRG의 'H010'과 다르다.
registerHOnlyAutocomplete({ pattern:/H010$/, detect: bytes => bytesAscii(bytes,16,4)==='H011', roleForFilename:mgRoleForFilename, retry:mgGrouperFn, label:'의료급여정액 청구서' });

/* ---------- 의료급여정액(MG) 청구분야 등록 ---------- */
LAYOUT_MG_A.formHidden = ['청구번호'];
LAYOUT_MG_C.mokMap = 목번호맵_의료급여정액;
PATIENT_NAME_FIELDS.add('수진자성명');
JUMIN_FIELDS.add('수진자주민등록번호');
registerRecordLetters(['A','B','C','D','E']);
registerClaimType('MG', {
  layouts: LAYOUTS_MG,
  // MG의 상병내역(B)에는 날짜 필드가 없어(산재와 동일한 상황) 기준을 일반내역(A) 자신의
  // 당월진료개시일로 삼는다. 산재와 동일한 shiftFields 패턴 — A 자신의 최초입원개시일(분리청구시만
  // 값 있음, 그 외엔 공란이라 tryShift가 건드리지 않음), 진료내역(C)의 변경일, 처방내역(D)·특정내역(E)의
  // 처방전발급번호, 특정내역(E) 자유서식 속 날짜까지 함께 이동.
  dateAnchor: {
    anchorType:'A', bField:'당월진료개시일', bFlagField:null, bFlagVal:null,
    shiftFields: [
      { t:'A', name:'최초입원개시일' },
      { t:'C', name:'변경일' },
      { t:'D', name:'처방전발급번호', kind:'prescNo' },
      { t:'E', name:'처방전발급번호', kind:'prescNo' },
      { t:'E', name:'특정내역', kind:'freetext' },
    ],
  },
  hSumPairs: H_SUM_FIELD_PAIRS_MG,
  blankRowLen: BLANK_ROW_LEN_MG,
  usesContentClassify: false, // 파일명(role)이 유형을 결정하므로 저장 후 재검증 시 classify() 재판별을 하지 않음
  openSave: openSaveMg,
  downloadOutput: downloadOutputMg,
  parseMultiDoc: parseMgDoc,
});
