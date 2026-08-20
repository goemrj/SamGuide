/* ---------- DRG(질병군/포괄수가) 레이아웃 — H010/D020.4(처방내역)/D020.5(특정내역)는 기존 LAYOUT_H/LAYOUT_D/LAYOUT_E와
   위치·길이가 완전히 동일해 그대로 재사용. D020.1/.2/.3/.6만 신규 정의(SAM_07_DRG 명세서(092) 문서 + 실샘플 대조 검증). ---------- */
const LAYOUT_DRG_A = { key:'A', name:'일반내역',
  formGroups:[
    {title:'수진자현황', widthGroup:'main', labels:{'명세서일련번호':'명일련','수진자성명':'수진자','수진자주민등록번호':'','입원일수':'입내원일','요양급여일수':'진료기간'}, rows:[
      ['명세서일련번호'],
      ['수진자성명','수진자주민등록번호'],
      ['입원일수','요양급여일수'],
      ['진료결과','공상등구분'],
    ]},
    {title:'진료비현황', widthGroup:'main', labels:{'요양급여비용총액1':'총진료비','본인일부부담금':'본인부담금','요양급여비용총액2·진료비총액':'진료비총액','본인부담상한액초과금':'상한초과금','장애인의료비':'장애의료비','건강보험100/100본인부담금총액':'100/100','보훈본인일부부담금':'보훈본인액'}, rows:[
      ['요양급여비용총액1','본인일부부담금'],
      ['요양급여비용총액2·진료비총액','본인부담상한액초과금'],
      ['지원금','청구액'],
      ['장애인의료비','건강보험100/100본인부담금총액'],
      ['보훈본인일부부담금','보훈청구액'],
    ]},
    {title:'100/100미만', widthGroup:'main', stripPrefix:'100/100미만', labels:{'100/100미만본인일부부담금':'본인부담금'}, rows:[
      ['100/100미만총액','100/100미만본인일부부담금'],
      ['100/100미만보훈청구액','100/100미만청구액'],
    ]},
    {title:'질병군 내역', widthGroup:'main', labels:{'질병군번호':'DRG번호','행위별진료비총액':'행위총액','질병군요양급여비용총액':'질병군총액'}, rows:[
      ['질병군번호','포괄수가'],
      ['행위별진료비총액','질병군요양급여비용총액'],
    ]},
    {title:'일반내역', widthGroup:'main', labels:{'입원경로':'도착입원'}, rows:[
      ['입원경로'],
      ['증번호'],
    ]},
    {title:'청구구분', labels:{'청구구분코드':'청구구분','명세서일련번호(당초)':'명일련','최초입원개시일':'최초입원일'}, rows:[
      ['청구구분코드'],
      ['접수번호','명세서일련번호(당초)'],
      ['사유코드','최초입원개시일'],
    ]},
  ],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호','00001~'),
  F(16,1,'an','내역구분','',{'A':'일반내역'}),
  F(17,4,'an','서식번호','',{'D020':'건강보험 의과 입원 질병군 요양급여비용명세서','D030':'(사용유보)'}),
  F(21,8,'an','요양기관기호',''),
  F(29,11,'an','공란',''),
  F(40,1,'an','공란',''),
  F(41,1,'an','공상등구분','',{'0':'무','4':'보훈위탁(건강보험)','7':'보훈위탁(상이처·무자격자)','B':'보훈병원 국비보험1차','C':'차상위 희귀난치·중증질환','E':'차상위 만성질환·18세미만','F':'차상위장애인 만성질환·18세미만','G':'긴급복지 의료지원대상자','H':'희귀질환 지원대상자'}),
  F(42,1,'an','공란',''),
  F(43,2,'an','공란',''),
  F(45,6,'an','질병군번호','심평원 고시 참조'),
  F(51,1,'an','청구구분코드','',{'1':'보완청구','2':'추가청구','3':'분리청구'}),
  F(52,7,'an','접수번호','보완·추가·분리시 당초 접수번호'),
  F(59,5,'an','명세서일련번호(당초)','보완·추가·분리시'),
  F(64,2,'an','사유코드','보완청구시 심사불능코드'),
  F(66,8,'an','최초입원개시일','분리청구시 CCYYMMDD'),
  F(74,20,'an','가입자성명',''),
  F(94,20,'an','증번호',''),
  F(114,20,'an','수진자성명',''),
  F(134,13,'an','수진자주민등록번호',"'-' 생략"),
  F(147,10,'an','공란',''),
  F(157,3,'n','요양급여일수','질병군 진료 실일수',null,'money'),
  F(160,3,'n','입원일수','',null,'money'),
  F(163,31,'an','공란',''),
  F(194,2,'an','입원경로','도착(1타기관/2응급대/3기타)+입원(1응급실/2외래) 조합 2자리',입원경로코드),
  F(196,1,'an','진료결과','',{'1':'계속','2':'이송','3':'회송','4':'사망','9':'퇴원'}),
  F(197,10,'n','요양급여비용총액1','',null,'money'),
  F(207,10,'n','본인일부부담금','',null,'money'),
  F(217,10,'n','본인부담상한액초과금','',null,'money'),
  F(227,10,'n','청구액','요양급여비용총액1-본인일부부담금-장애인의료비',null,'money'),
  F(237,10,'n','지원금','',null,'money'),
  F(247,10,'n','장애인의료비','',null,'money'),
  F(257,10,'an','공란',''),
  F(267,10,'n','요양급여비용총액2·진료비총액','',null,'money'),
  F(277,10,'n','보훈청구액','',null,'money'),
  F(287,10,'an','공란',''),
  F(297,10,'an','공란',''),
  F(307,10,'n','건강보험100/100본인부담금총액','',null,'money'),
  F(317,10,'n','보훈본인일부부담금','',null,'money'),
  F(327,10,'n','100/100미만총액','',null,'money'),
  F(337,10,'n','100/100미만본인일부부담금','',null,'money'),
  F(347,10,'n','100/100미만청구액','',null,'money'),
  F(357,10,'n','100/100미만보훈청구액','',null,'money'),
  F(367,10,'n','포괄수가','질병군별 상대가치점수×점수당 단가',null,'money'),
  F(377,10,'n','행위별진료비총액','열외군 명세서에 한함',null,'money'),
  F(387,10,'n','질병군요양급여비용총액','',null,'money'),
]};
const DRG_A_FORM_HIDDEN = ['청구번호','내역구분','공란','가입자성명'];

const LAYOUT_DRG_B = { key:'B', name:'진단내역',
  gridOrder:['진단분류구분','질병분류기호','입원시상병유무','진료과목','내과세부','요양개시일','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,1,'an','내역구분','',{'B':'진단내역'}),
  F(17,1,'an','진단분류구분','최대 주진단1+기타진단29',{'1':'주진단','2':'기타진단'}),
  F(18,6,'an','질병분류기호','한국표준질병·사인분류(KCD)'),
  F(24,1,'an','입원시상병유무','',{'Y':'입원당시 존재함','N':'존재하지 않음','U':'기록 불충분','W':'임상적 결정 불가'}),
  F(25,2,'an','진료과목','',진료과목코드),
  F(27,2,'an','내과세부','',{'00':'내과통합','01':'소화기내과','02':'순환기내과','03':'호흡기내과','04':'내분비·대사내과','05':'신장내과','06':'혈액종양내과','07':'감염내과','08':'알레르기내과','09':'류마티스내과'}),
  F(29,8,'an','요양개시일','CCYYMMDD'),
  F(37,1,'an','면허종류','',{'1':'의사'}),
  F(38,10,'an','면허번호',''),
]};

const DRG_항코드_C = withOverrides(항번호코드, {L:'질병군분류내역·포괄내역'});
const DRG_목번호맵_C = Object.assign({}, 목번호맵, {
  L:{'51':'주사 및 혈액제제','52':'마취 및 호흡치료','53':'수술처치','54':'검사','55':'방사선','56':'부가코드','81':'진찰료','82':'입원료','83':'투약료','84':'주사료','85':'마취료','86':'이학요법료','87':'정신요법료','88':'처치및수술료','89':'검사료','90':'영상진단및방사선치료료','91':'특수장비','92':'100분의100본인부담','93':'비급여','94':'기타'},
});
const LAYOUT_DRG_C = { key:'C', name:'진료내역',
  gridOrder:['항','목','줄번호','구분','코드','단가','1회투','일투','총투','금액','보상률','변경일','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,1,'an','내역구분','',{'C':'진료내역'}),
  F(17,2,'an','항','항번호. L,S,A,B,D,E,U,V,W는 왼쪽정렬·대문자',DRG_항코드_C,null,10),
  F(19,2,'an','목','목번호(항별 하위코드)',null,null,10),
  F(21,4,'n','줄번호','1~9999',null,null,10),
  F(25,1,'an','구분','코드구분',{'1':'수가','2':'준용수가','3':'보험등재약','4':'원료약·자체조제약','8':'치료재료'},null,7),
  F(26,9,'an','코드','수가/약제/치료재료 코드',null,null,20),
  F(35,12,'n','단가','정수10+소수2',null,2),
  F(47,7,'n','일투','1일투여량·투여(실시)횟수 n(5.2)',null,2),
  F(54,3,'n','총투','총투여일수·실시횟수',null,'money'),
  F(57,9,'n','1회투','1회투약량 n(5.4)',null,4),
  F(66,10,'n','금액','단가×1회투×일투×총투×보상률',null,'money'),
  F(76,10,'n','공란','(상한가)'),
  F(86,10,'n','공란','(약제상한차액)'),
  F(96,6,'n','보상률','n(4.2)',null,2),
  F(102,8,'an','변경일','CCYYMMDD',null,null,16),
  F(110,1,'an','면허종류','',{'1':'의사','2':'치과의사','6':'간호사','7':'사회복지사'}),
  F(111,100,'an','면허번호',"복수시 '/'구분",null,null,14),
]};

const LAYOUT_DRG_F = { key:'F', name:'열외군명세서진료내역',
  gridOrder:['항','목','줄번호','구분','코드','단가','1회투','일투','총투','금액','변경일','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,1,'an','내역구분','',{'F':'열외군명세서진료내역'}),
  F(17,2,'an','항','항번호. S,T,A,B,D,E,U,V,W는 왼쪽정렬·대문자',항번호코드,null,10),
  F(19,2,'an','목','목번호(항별 하위코드)',null,null,10),
  F(21,4,'n','줄번호','1~9999',null,null,10),
  F(25,1,'an','구분','코드구분',{'1':'수가','2':'준용수가','3':'보험등재약','4':'원료약·자체조제약','8':'치료재료'},null,7),
  F(26,9,'an','코드','',null,null,20),
  F(35,12,'n','단가','정수10+소수2',null,2),
  F(47,7,'n','일투','1일투여량·투여(실시)횟수 n(5.2)',null,2),
  F(54,3,'n','총투','총투여일수·실시횟수',null,'money'),
  F(57,9,'n','1회투','1회투약량 n(5.4)',null,4),
  F(66,10,'n','금액','단가×1회투×일투×총투',null,'money'),
  F(76,8,'an','변경일','CCYYMMDD',null,null,16),
  F(84,1,'an','면허종류','',{'1':'의사'}),
  F(85,100,'an','면허번호',"복수시 '/'구분",null,null,14),
]};


const LAYOUTS_DRG = { H:LAYOUT_H, A:LAYOUT_DRG_A, B:LAYOUT_DRG_B, C:LAYOUT_DRG_C, D:LAYOUT_D, E:LAYOUT_E, F:LAYOUT_DRG_F };

// DRG — H010 + D020.1~.6이 파일 7개로 나뉘어 있는 것을 한 청구(doc)로 합쳐 파싱.
// buffersByRole: {H:buf, A:buf, ...} (H,A는 필수, 나머지는 실제 존재하는 것만). classify() 없이
// 소스 파일 자체가 타입을 결정하므로(파일마다 레코드 타입이 고정) 바이트를 안 보고 role을 그대로 r.t로 부여.
const DRG_ROLE_ORDER = ['H','A','B','C','D','E','F'];
function parseDrgDoc(buffersByRole, namesByRole, label){
  const sources = {};
  const allRecords = []; const recById = new Map();
  let nextId = 0, totalBytes = 0;
  for (const role of DRG_ROLE_ORDER){
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
    claimType:'DRG',
    fileName: label || 'DRG청구',
    bytes: { length: totalBytes }, // 상태바/저장모달의 크기 표시용 — 실제 바이트는 sources[role].bytes에 있음
    sources, records: allRecords, recById, nextId,
    claims:[], claimByKey:new Map(), hId:-1, unknown:0,
    edits:new Map(), undoStack:[], redoStack:[], selClaim:-1,
    fileHandles: {}, // role별 원본 파일 핸들(있는 것만) — 저장 시 대화상자 없이 그 파일에 바로 되돌려 씀
  };
  buildClaims(doc);
  return doc;
}

function loadDrgBuffers(buffersByRole, namesByRole, label, fileHandles, isRestore){
  const doc = parseDrgDoc(buffersByRole, namesByRole, label);
  doc.fileHandles = fileHandles || {};
  docs.push(doc);
  switchTab(docs.length-1);
  if (!isRestore){ persistFiles(); schedulePersist(); }
}

const BLANK_ROW_LEN_DRG = { B:47, C:210, D:63, E:739, F:184 };

const H_SUM_FIELD_PAIRS_DRG = [
  ['요양급여비용총액1','요양급여비용총액1'],
  ['본인일부부담금','본인일부부담금'],
  ['본인부담상한액초과금','본인부담상한액초과금'],
  ['청구액','청구액'],
  ['지원금','지원금'],
  ['장애인의료비','장애인의료비'],
  ['요양급여비용총액2·진료비총액','총액2·진료비총액'],
  ['보훈청구액','보훈청구액'],
  ['건강보험100/100본인부담금총액','100/100본인부담총액'],
  ['보훈본인일부부담금','보훈 본인일부부담금'],
  ['100/100미만총액','100/100미만 총액'],
  ['100/100미만본인일부부담금','100/100미만 본인부담'],
  ['100/100미만청구액','100/100미만 청구액'],
  ['100/100미만보훈청구액','100/100미만 보훈청구'],
];

function openSaveDrg(scopeSet){
  try{
    const live = state.records.filter(r=>!r.deleted && (r.t==='H' || !scopeSet || scopeSet.has(claimKeyOfRecord(r))));
    const partsByRole = {H:[],A:[],B:[],C:[],D:[],E:[],F:[]};
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
    for (const role of DRG_ROLE_ORDER){
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
      const fname = (state.sources[role] && state.sources[role].fileName) || DRG_FILE_NAMES[role];
      perFileRows.push('<tr><td>'+esc(fname)+'</td><td>'+esc(curLayouts()[role].name)+'</td><td>'+rep.count.toLocaleString()+'</td><td>'+out.length.toLocaleString()+' byte</td></tr>');
    }
    repAgg.typeOk = repAgg.typeBad===0;
    pendingOutputDrg = outputsByRole;
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

async function downloadOutputDrg(){
  try{ await downloadOutputDrgInner(); }
  catch(e){ alert('저장 중 예상치 못한 오류가 발생했습니다: '+e.message+'\n(이 문구를 스크린샷으로 남겨주세요)'); }
}
async function downloadOutputDrgInner(){
  if (!pendingOutputDrg) return;
  const roles = Object.keys(pendingOutputDrg);
  const fileHandles = state.fileHandles || {};
  // 이미 열려있던 파일에 그대로 덮어쓰는 경우(fileHandles)는 원래 이름을 유지하고, 새로 위치를
  // 고르는 경우(폴더선택/개별저장)에만 사용자가 입력한 접두사를 파일명 앞에 붙인다.
  const prefix = document.getElementById('saveName').value.trim();
  // 접두사를 입력한 경우 "접두사_원래역할이름"으로(예: DRG테스트_H010) — 원본 파일명(접두사가 이미
  // 붙어있을 수 있음)은 무시한다. 입력이 없으면 기존처럼 원본 파일명을 그대로 쓴다.
  const nameFor = (role, canonical) => prefix ? prefix+'_'+canonical : ((state.sources[role] && state.sources[role].fileName) || canonical);
  // 원본을 열 때 얻은 파일 핸들이 있는 파일은 대화상자 없이 바로 그 파일에 되돌려 쓴다.
  for (const role of roles){
    const h = fileHandles[role];
    if (!h) continue;
    try{
      const w = await h.createWritable();
      await w.write(pendingOutputDrg[role]);
      await w.close();
    }catch(e){
      alert((state.sources[role]&&state.sources[role].fileName||role)+' 저장 중 오류: '+e.message);
    }
  }
  const remaining = roles.filter(role=>!fileHandles[role]);
  if (!remaining.length){ hideModal('mSave'); return; }

  // 핸들이 없는 나머지 파일 — 폴더를 한 번만 골라서 그 안에 전부 저장한다(파일마다 창이 뜨지 않도록).
  // id만으로는 file:// 문서에서 브라우저가 마지막 폴더를 기억하지 못하는 경우가 있어, 직접 IndexedDB에
  // 저장해둔 이전 폴더 핸들을 startIn으로 넘겨 같은 폴더에서 시작하게 한다(단일 파일 저장과 동일한 방식).
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
      if (e && e.name==='AbortError') return; // 취소 — 아무것도 만들지 않고 모달을 그대로 둠
      alert('폴더 선택 중 오류: '+e.message);
      return;
    }
    let anyError = false;
    for (const role of remaining){
      const name = nameFor(role, DRG_FILE_NAMES[role]);
      try{
        const fh = await dirHandle.getFileHandle(name, {create:true});
        const w = await fh.createWritable();
        await w.write(pendingOutputDrg[role]);
        await w.close();
      }catch(e){
        anyError = true;
        alert(name+' 저장 중 오류: '+e.message);
      }
    }
    if (!anyError) hideModal('mSave');
    return;
  }

  // showDirectoryPicker 미지원 브라우저 — 파일별로 순서대로 저장창을 띄움(기존 방식).
  // 저장창을 취소하면 그 즉시 전체를 중단한다 — 취소한 파일만 건너뛰고 나머지를 자동으로 다운로드하면
  // "취소했는데 파일이 생겼다"는 혼란을 주기 때문.
  if (!window.showSaveFilePicker){
    alert('이 환경에서는 저장 위치를 직접 선택할 수 없어, 브라우저의 기본 다운로드 폴더에 '+remaining.length+'개 파일이 저장됩니다.\n(주소창 없는 "앱" 형태로 실행 중이라면, 일반 브라우저 창(탭)으로 열면 위치를 선택할 수 있습니다.)');
  }
  for (let idx=0; idx<remaining.length; idx++){
    const role = remaining[idx];
    const name = nameFor(role, DRG_FILE_NAMES[role]);
    const buf = pendingOutputDrg[role];
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
          return; // 모달을 닫지 않고 그대로 둠 — 다시 [저장]을 누르면 이어서 시도할 수 있게
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

/* ---------- DRG(질병군) 파일명 자동 인식 — "파일 열기"/드래그드롭에서 여러 개를 한꺼번에 골라도 자동으로 묶는다.
   실샘플은 "87956_208258_202608D101_B01_D020.1"처럼 앞에 임의의 접두사가 붙는 경우가 있어(자보한방·
   의료급여정액·첩약·한방·산재한방과 동일한 문제) 접미사 일치로 판별한다. ---------- */
const DRG_FILE_NAMES = { H:'H010', A:'D020.1', B:'D020.2', C:'D020.3', D:'D020.4', E:'D020.5', F:'D020.6' };
const DRG_SUFFIX_ROLES = [
  [/D020\.1$/, 'A'], [/D020\.2$/, 'B'], [/D020\.3$/, 'C'], [/D020\.4$/, 'D'], [/D020\.5$/, 'E'], [/D020\.6$/, 'F'],
];
function drgUniqueRoleForFilename(name){
  for (const [re, role] of DRG_SUFFIX_ROLES) if (re.test(name)) return role;
  return null;
}
function drgRoleForFilename(name){
  if (/H010$/.test(name)) return 'H';
  return drgUniqueRoleForFilename(name);
}

// 파일 목록(File[])을 받아, H010/D020.1~.6 이름과 일치하는 것들은 자동으로 DRG 청구 1건으로 묶어서 열고
// 나머지(그루핑에 쓰이지 않은 파일)는 반환해서 공통 openPickedFiles가 개별 파일로 이어서 처리하게 한다.
// H010은 GEN/의료급여정액 등 다른 단일·다중파일 청구분야도 그대로 쓰는 공용 이름이라, D020.x처럼
// DRG만 쓰는 고유 파일이 하나도 안 보이면(예: H010+H040.x만 골랐는데 DRG 그루퍼가 먼저 도는 경우)
// H010까지 삼켜버려 다른 청구분야의 그루핑을 막는 문제가 있었다 — DRG 고유 파일이 최소 1개 있어야만
// 이 그루퍼가 개입한다.
async function drgGrouperFn(files, handleByName){
  const hasDrgSpecific = files.some(f => drgUniqueRoleForFilename(f.name));
  if (!hasDrgSpecific) return files;
  const drgFiles = [], rest = [];
  for (const file of files){
    (drgRoleForFilename(file.name) ? drgFiles : rest).push(file);
  }
  if (!drgFiles.length) return files;
  const buffersByRole = {}; const namesByRole = {}; const fileHandles = {};
  for (const file of drgFiles){
    if (file.size===0) continue; // D020.4처럼 해당 내역이 없어 0byte인 경우 — 없는 파일과 동일하게 취급
    const role = drgRoleForFilename(file.name);
    buffersByRole[role] = await file.arrayBuffer();
    namesByRole[role] = file.name;
    const h = handleByName ? handleByName.get(file.name) : null;
    if (h) fileHandles[role] = h;
  }
  if (buffersByRole.H && buffersByRole.A){
    const label = drgFiles[0].webkitRelativePath ? drgFiles[0].webkitRelativePath.split('/')[0] : 'DRG청구';
    loadDrgBuffers(buffersByRole, namesByRole, label, fileHandles);
  } else {
    alert('DRG 파일(H010, D020.1~.6)로 보이는데, 필수인 H010과 D020.1(일반내역)이 함께 선택되지 않았습니다.\n두 파일을 포함해서 다시 선택해 주세요. (나머지 D020.2~.6은 있는 만큼만 선택해도 됩니다)');
  }
  return rest;
}
registerFileGrouper(drgGrouperFn);
// H010 하나만 선택된 경우의 자동완성 — DRG는 H010 내용에 자기만의 표식이 없어(서식번호·진료형태 모두
// GEN과 동일) 다른 어떤 분야(MG/첩약/한방)로도 식별되지 않을 때만 시도하는 최후의 추측(fallback)이다.
registerHOnlyAutocomplete({ pattern:/H010$/, detect:()=>true, fallback:true, roleForFilename:drgRoleForFilename, retry:drgGrouperFn, label:'DRG(질병군) 청구서' });

/* ---------- DRG(질병군) 청구분야 등록 ---------- */
LAYOUT_DRG_A.formHidden = DRG_A_FORM_HIDDEN;
LAYOUT_DRG_C.mokMap = DRG_목번호맵_C;
LAYOUT_DRG_F.mokMap = 목번호맵;
registerRecordLetters(['A','B','C','D','E','F']);
registerClaimType('DRG', {
  layouts: LAYOUTS_DRG,
  dateAnchor: { bField:'요양개시일', bFlagField:'진단분류구분', bFlagVal:'1' },
  hSumPairs: H_SUM_FIELD_PAIRS_DRG,
  blankRowLen: BLANK_ROW_LEN_DRG,
  legacyLabelWidth: true, // 통짜(claimType 구분 없는) 라벨폭 저장 시절부터 있던 청구분야
  openSave: openSaveDrg,
  downloadOutput: downloadOutputDrg,
  parseMultiDoc: parseDrgDoc,
  usesContentClassify: false, // 파일명(role)이 유형을 결정하므로 저장 후 재검증 시 classify() 재판별을 하지 않음
});
