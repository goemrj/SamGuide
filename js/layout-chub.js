/* ---------- 첩약(한방 첩약, CHUB) 레이아웃 — DRG/산재/자보한방/의료급여정액처럼 청구서(H010)+
   명세서(K020.1~.5)가 파일 여러 개로 나뉜다. H010은 GEN의 LAYOUT_H와 완전히 동일(서식번호 H010/H011,
   진료형태='F' 한방첩약외래/'G' 한방첩약약국)해 그대로 재사용. K020.1~.5는 각각 일반내역·상병내역·
   진료내역·특정내역·처방내역 순서로 나뉘어 있으며(문서 순서상 특정내역이 처방내역보다 앞이지만, GEN의
   문자 배정(D=처방내역,E=특정내역) 관례를 그대로 따라 .4→E, .5→D로 맵핑한다), 필드 위치는 GEN과
   유사하지만 내역구분(1byte) 필드가 없어(파일 자체가 role을 결정) 독자적인 바이트 배치를 쓴다.
   필드 위치는 「첩약 건강보험 적용 2단계 시범사업 지침」 pdf p.243~260(문서쪽 번호 기준) 기준
   (2026-08-13, 한방 첩약 외래 실샘플 1종 대조: H=2096, A=325, B=43, C=193, E=738byte 전부 일치,
   D(처방내역)는 이 샘플에 처방전 발급이 없어 0byte였음). ---------- */

const 항번호코드_첩약 = codesTable([
  ['01','진찰료'],['02','입원료'],['03','투약료'],['04','시술 및 처치료'],['05','검사료'],
  ['A','100분의50 본인부담'],['B','100분의80 본인부담'],['D','100분의30 본인부담'],['E','100분의90 본인부담'],
  ['L','첩약 기타내역 등'],
  ['U','건강보험(의료급여) 100분의100 본인부담'],['V','보훈 등 100분의100 본인부담'],['W','비급여'],
]);
const 목번호맵_첩약 = {
  '01':{'01':'초진','02':'재진','99':'기타'},
  '02':{'01':'일반','02':'내과질환자·정신질환자·만8세미만의 소아','03':'중환자실','04':'기본식대','05':'안치료','11':'가산식대','99':'기타'},
  '03':{'01':'내복약','02':'조제·복약지도료','99':'기타'},
  '04':{'01':'침술','02':'구술','03':'부항술','04':'처치료','99':'기타'},
  '05':{'01':'검사료'},
  'A':{'01':'의약품','02':'치료재료','03':'진료행위'},
  'B':{'01':'의약품','02':'치료재료','03':'진료행위'},
  'D':{'01':'의약품','02':'치료재료','03':'진료행위'},
  'E':{'01':'의약품','02':'치료재료','03':'진료행위'},
  'L':{'93':'비급여','94':'기타'},
  'U':{'01':'의약품','02':'치료재료','03':'진료행위'},
  'V':{'01':'의약품','02':'치료재료','03':'진료행위'},
  'W':{'01':'의약품','02':'치료재료','03':'진료행위'},
};
const 본인부담률코드_첩약 = {'A':'100분의50','B':'100분의80','D':'100분의30','E':'100분의90','U':'100분의100 본인부담'};

const LAYOUT_CHUB_A = { key:'A', name:'일반내역',
  formHidden: ['청구번호','공란'],
  formGroups:[
    {title:'수진자현황', widthGroup:'main', labels:{'명세서일련번호':'명일련','수진자성명':'수진자','수진자주민등록번호':'','입원일수,총내원일수':'입내원일','요양급여일수':'진료기간','의료급여종별구분':'급여종별'}, rows:[
      ['명세서일련번호'],
      ['수진자성명','수진자주민등록번호'],
      ['입원일수,총내원일수','요양급여일수'],
      ['의료급여종별구분','진료결과'],
      ['공상등구분'],
    ]},
    {title:'진료비현황', widthGroup:'main', labels:{'요양급여비용총액1':'총진료비','본인일부부담금':'본인부담금','본인부담상한액초과금':'상한초과금','요양급여비용총액2,진료비총액':'진료비총액','장애인의료비':'장애의료비','건강보험(의료급여)100분의100본인부담금총액':'100/100','보훈본인일부부담금':'보훈본인액'}, rows:[
      ['요양급여비용총액1','본인일부부담금'],
      ['요양급여비용총액2,진료비총액','본인부담상한액초과금'],
      ['지원금','청구액'],
      ['장애인의료비','건강보험(의료급여)100분의100본인부담금총액'],
      ['보훈본인일부부담금','보훈청구액'],
      ['대불금'],
    ]},
    {title:'100/100미만', widthGroup:'main', stripPrefix:'100분의100미만', labels:{'100분의100미만본인일부부담금':'본인부담금'}, rows:[
      ['100분의100미만총액','100분의100미만본인일부부담금'],
      ['100분의100미만보훈청구액','100분의100미만청구액'],
    ]},
    {title:'일반내역', widthGroup:'main', labels:{'가입자(세대주)성명':'가입자성명','보장기관기호':'보장기호','정액정률구분':'정액정률'}, rows:[
      ['가입자(세대주)성명'],
      ['증번호'],
      ['보장기관기호'],
      ['정액정률구분'],
    ]},
    {title:'청구구분', labels:{'청구구분코드':'청구구분','명세서일련번호(당초)':'명일련번호','최초입원개시일':'최초입원일'}, rows:[
      ['청구구분코드'],
      ['접수번호','명세서일련번호(당초)'],
      ['사유코드','최초입원개시일'],
    ]},
  ],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호','00001~99999'),
  F(16,4,'an','서식번호','',{'K020':'건강보험 한방 입원','K021':'건강보험 한방 외래','K030':'의료급여 한방 입원','K031':'의료급여 한방 외래'}),
  F(20,8,'an','요양기관기호',''),
  F(28,11,'an','보장기관기호','의료급여 수급권자 관할 시군구 기호'),
  F(39,1,'an','의료급여종별구분','',{'1':'1종','2':'2종','4':'행려','6':'2종 장애인의 2차','8':'2종 장애인의 1차','N':'노숙인 1종'}),
  F(40,1,'an','공상등구분','',{'0':'무','1':'공상','4':'보훈위탁진료 요양기관의 보훈국비환자','7':'보훈위탁진료 요양기관의 보훈국비환자(상이처·무자격자)','8':'군인가족 등 군 요양기관 이용시','9':'군인·군무원의 군 요양기관 이용시','C':'차상위 희귀난치성중증질환 본인부담경감대상자','E':'차상위 만성질환·18세미만 본인부담경감대상자','F':'차상위 장애인 만성질환·18세미만 본인부담경감대상자','G':'긴급복지 의료지원대상자','H':'희귀질환 지원대상자'}),
  F(41,1,'an','정액정률구분','읍면 한방병원 외래 월단위 통합청구시(2007.7.31. 진료분까지)',{'0':'정액','9':'정률'}),
  F(42,1,'an','청구구분코드','',{'1':'보완청구','2':'추가청구','3':'분리청구'}),
  F(43,7,'an','접수번호','보완·추가·분리시 당초 접수번호'),
  F(50,5,'an','명세서일련번호(당초)','보완·추가·분리시'),
  F(55,2,'an','사유코드','보완청구시 심사불능코드'),
  F(57,8,'an','최초입원개시일','분리청구시 CCYYMMDD'),
  F(65,20,'an','가입자(세대주)성명',''),
  F(85,20,'an','증번호','보장시설 및 노숙인시설기호'),
  F(105,20,'an','수진자성명',''),
  F(125,13,'an','수진자주민등록번호',"'-' 생략"),
  F(138,3,'n','요양급여일수','',null,'money'),
  F(141,3,'n','입원일수,총내원일수','',null,'money'),
  F(144,31,'an','공란',''),
  F(175,1,'an','진료결과','',{'1':'계속','2':'이송','3':'회송','4':'사망','9':'퇴원'}),
  F(176,10,'n','요양급여비용총액1','',null,'money'),
  F(186,10,'n','본인일부부담금','',null,'money'),
  F(196,10,'n','본인부담상한액초과금','',null,'money'),
  F(206,10,'n','청구액','',null,'money'),
  F(216,10,'n','지원금','',null,'money'),
  F(226,10,'n','장애인의료비','',null,'money'),
  F(236,10,'n','대불금','',null,'money'),
  F(246,10,'n','요양급여비용총액2,진료비총액','',null,'money'),
  F(256,10,'n','보훈청구액','',null,'money'),
  F(266,10,'n','건강보험(의료급여)100분의100본인부담금총액','',null,'money'),
  F(276,10,'n','보훈본인일부부담금','',null,'money'),
  F(286,10,'n','100분의100미만총액','',null,'money'),
  F(296,10,'n','100분의100미만본인일부부담금','',null,'money'),
  F(306,10,'n','100분의100미만청구액','',null,'money'),
  F(316,10,'n','100분의100미만보훈청구액','',null,'money'),
]};

const LAYOUT_CHUB_B = { key:'B', name:'상병내역',
  gridOrder:['상병분류구분','상병분류기호','진료과목','내원일자,당월요양개시일','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,1,'an','상병분류구분','',{'1':'주상병','2':'부상병','3':'배제된 상병'}),
  F(17,6,'an','상병분류기호','한국표준질병·사인분류(KCD)'),
  F(23,2,'an','진료과목','',진료과목코드),
  F(25,8,'an','내원일자,당월요양개시일','CCYYMMDD'),
  F(33,1,'an','면허종류','',{'3':'한의사'}),
  F(34,10,'an','면허번호',''),
]};

const LAYOUT_CHUB_C = { key:'C', name:'진료내역',
  gridOrder:['항','목','줄번호','구분','코드','단가','1회투','1일투','총투','금액','가감등구분','변경일','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,2,'an','항','항번호',항번호코드_첩약,null,10),
  F(18,2,'an','목','목번호(항별 하위코드)',null,null,10),
  F(20,4,'n','줄번호','1~9999',null,null,10),
  F(24,1,'an','구분','코드구분',{'A':'수가','B':'준용수가','C':'약가','D':'기준처방코드','E':'한약재 제품코드','H':'치료재료'},null,7),
  F(25,9,'an','코드','',null,null,20),
  F(34,12,'n','단가','상대가치점수×단가. 정수10+소수2',null,2),
  F(46,9,'n','1회투','1회투약량 n(5.4), 의약품만',null,4),
  F(55,7,'n','1일투','1일투여량·투여(실시)횟수 n(5.2)',null,2),
  F(62,3,'n','총투','총투여일수·실시횟수',null,'money'),
  F(65,10,'n','금액','단가×1회투×1일투×총투',null,'money'),
  F(75,10,'an','가감등구분','기준처방(L)/제품가(M)/용량가(N)/제품감(O)/용량감(P) 등+한약재제품코드9자리'),
  F(85,8,'an','변경일','단가 변경·신설시 최초 투여일. CCYYMMDD'),
  F(93,1,'an','면허종류','',{'3':'한의사','4':'약사','5':'한약사','6':'간호사','7':'사회복지사'}),
  F(94,100,'an','면허번호',"복수시 '/'구분",null,null,14),
]};

const LAYOUT_CHUB_D = { key:'D', name:'처방내역',
  gridOrder:['처방전발급번호','처방일수','줄번호','구분','코드','1회투','1일투여횟수','총투약일수','본인부담률코드','가감등구분'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,13,'an','처방전발급번호','CCYYMMDD+일련5자리'),
  F(29,3,'n','처방일수','',null,'money'),
  F(32,4,'n','줄번호','1~9999'),
  F(36,1,'an','구분','코드구분',{'D':'기준처방코드','F':'한약재 주성분코드'}),
  F(37,9,'an','코드',''),
  F(46,9,'n','1회투','1회투약량 n(5.4)',null,4),
  F(55,2,'n','1일투여횟수','',null,'money'),
  F(57,3,'n','총투약일수','',null,'money'),
  F(60,1,'an','본인부담률코드','',본인부담률코드_첩약),
  F(61,10,'an','가감등구분','기준처방(L)/제품가(M)/용량가(N)/제품감(O)/용량감(P) 등+한약재주성분코드9자리'),
]};

const LAYOUT_CHUB_E = { key:'E', name:'특정내역',
  gridOrder:['발생단위구분','처방전발급번호','줄번호','특정내역구분','특정내역'],
  fields:[
  F(1,10,'an','청구번호',''),
  F(11,5,'an','명세서일련번호',''),
  F(16,1,'an','발생단위구분','',{'1':'명세서단위','2':'줄번호단위','3':'처방내역 줄번호단위','4':'처방내역단위'}),
  F(17,13,'an','처방전발급번호','발생단위 3·4일 때',null,null,14),
  F(30,4,'n','줄번호','발생단위 1·4=space'),
  F(34,5,'an','특정내역구분','심평원 고시 별표8'),
  F(39,700,'an','특정내역','기재형식은 고시 참조'),
]};

const LAYOUTS_CHUB = { H:LAYOUT_H, A:LAYOUT_CHUB_A, B:LAYOUT_CHUB_B, C:LAYOUT_CHUB_C, D:LAYOUT_CHUB_D, E:LAYOUT_CHUB_E };

const H_SUM_FIELD_PAIRS_CHUB = [
  ['총진료비','요양급여비용총액1'],
  ['본인부담금','본인일부부담금'],
  ['상한초과금','본인부담상한액초과금'],
  ['청구액','청구액'],
  ['지원금','지원금'],
  ['장애의료비','장애인의료비'],
  ['진료비총액','요양급여비용총액2,진료비총액'],
  ['보훈청구액','보훈청구액'],
  ['100/100본인부담총액','건강보험(의료급여)100분의100본인부담금총액'],
  ['보훈본인액','보훈본인일부부담금'],
  ['100/100미만총액','100분의100미만총액'],
  ['100/100미만본인부담금','100분의100미만본인일부부담금'],
  ['100/100미만청구액','100분의100미만청구액'],
  ['100/100미만보훈청구액','100분의100미만보훈청구액'],
];

const BLANK_ROW_LEN_CHUB = { B:43, C:193, D:70, E:738 };

/* ---------- H010(청구서)+K020.1~.5(명세서)가 파일 여러 개로 나뉜 것을 한 청구(doc)로 합쳐 파싱.
   MG/자보한방의 parse*Doc과 동일한 구조 — 소스 파일 자체가 role을 결정하므로 classify() 없이
   r.t=role 그대로 부여. 실샘플 대조 결과 H010/K020.1(일반내역)은 CRLF를 쓰지만 K020.2/.3/.4
   (상병·진료·특정내역)는 LF만 쓴다 — detectLineSep/splitRecordsBySep(js/layout-jabo-han.js에서 정의,
   이 스크립트가 그 뒤에 로드되므로 그대로 재사용)로 파일별 실제 구분자를 감지해서 나누고 저장한다. ---------- */
const CHUB_ROLE_ORDER = ['H','A','B','C','D','E'];
function parseChubDoc(buffersByRole, namesByRole, label){
  const sources = {};
  const allRecords = []; const recById = new Map();
  let nextId = 0, totalBytes = 0;
  for (const role of CHUB_ROLE_ORDER){
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
    claimType:'CHUB',
    fileName: label || '첩약청구',
    bytes: { length: totalBytes },
    sources, records: allRecords, recById, nextId,
    claims:[], claimByKey:new Map(), hId:-1, unknown:0,
    edits:new Map(), undoStack:[], redoStack:[], selClaim:-1,
    fileHandles: {},
  };
  buildClaims(doc);
  return doc;
}
function loadChubBuffers(buffersByRole, namesByRole, label, fileHandles, isRestore){
  const doc = parseChubDoc(buffersByRole, namesByRole, label);
  doc.fileHandles = fileHandles || {};
  docs.push(doc);
  switchTab(docs.length-1);
  if (!isRestore){ persistFiles(); schedulePersist(); }
}

let pendingOutputChub = null;
function openSaveChub(scopeSet){
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
    for (const role of CHUB_ROLE_ORDER){
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
      const fname = (state.sources[role] && state.sources[role].fileName) || CHUB_FILE_NAMES[role];
      perFileRows.push('<tr><td>'+esc(fname)+'</td><td>'+esc(curLayouts()[role].name)+'</td><td>'+rep.count.toLocaleString()+'</td><td>'+out.length.toLocaleString()+' byte</td></tr>');
    }
    repAgg.typeOk = repAgg.typeBad===0;
    pendingOutputChub = outputsByRole;
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
async function downloadOutputChub(){
  try{ await downloadOutputChubInner(); }
  catch(e){ alert('저장 중 예상치 못한 오류가 발생했습니다: '+e.message+'\n(이 문구를 스크린샷으로 남겨주세요)'); }
}
async function downloadOutputChubInner(){
  if (!pendingOutputChub) return;
  const roles = Object.keys(pendingOutputChub);
  const fileHandles = state.fileHandles || {};
  const prefix = document.getElementById('saveName').value.trim();
  const nameFor = (role, canonical) => prefix ? prefix+'_'+canonical : ((state.sources[role] && state.sources[role].fileName) || canonical);
  for (const role of roles){
    const h = fileHandles[role];
    if (!h) continue;
    try{
      const w = await h.createWritable();
      await w.write(pendingOutputChub[role]);
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
      const name = nameFor(role, CHUB_FILE_NAMES[role]);
      try{
        const fh = await dirHandle.getFileHandle(name, {create:true});
        const w = await fh.createWritable();
        await w.write(pendingOutputChub[role]);
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
    const name = nameFor(role, CHUB_FILE_NAMES[role]);
    const buf = pendingOutputChub[role];
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

/* ---------- 파일명 자동 인식 — H010(청구서) + K020.1~.5(명세서, 문서 순서=일반·상병·진료·특정·처방이지만
   내부 역할문자는 GEN 관례를 따라 .4→E(특정내역)/.5→D(처방내역)로 배정). 실샘플은 서식번호가 K021(건강
   보험 한방외래)이어도 파일명 자체는 항상 "K020.n" 그룹명을 쓰며, 앞에 임의의 접두사가 붙는 경우가 있어
   (자보 한방·의료급여정액과 동일한 문제) 접미사 일치로 판별한다. H010은 GEN 등 다른 청구분야도 공유하는
   이름이라, 첩약 고유 파일(K02x.n/K03x.n)이 하나도 없으면 이 그루퍼는 개입하지 않는다. ---------- */
const CHUB_FILE_NAMES = { H:'H010', A:'K020.1', B:'K020.2', C:'K020.3', D:'K020.5', E:'K020.4' };
const CHUB_SUFFIX_ROLES = [
  [/K0[23][01]\.1$/, 'A'], [/K0[23][01]\.2$/, 'B'], [/K0[23][01]\.3$/, 'C'],
  [/K0[23][01]\.5$/, 'D'], [/K0[23][01]\.4$/, 'E'],
];
function chubUniqueRoleForFilename(name){
  for (const [re, role] of CHUB_SUFFIX_ROLES) if (re.test(name)) return role;
  return null;
}
function chubRoleForFilename(name){
  if (/H010$/.test(name)) return 'H';
  return chubUniqueRoleForFilename(name);
}

async function chubGrouperFn(files, handleByName){
  const hasChubSpecific = files.some(f => chubUniqueRoleForFilename(f.name));
  if (!hasChubSpecific) return files;
  const chubFiles = [], rest = [];
  for (const file of files){
    (chubRoleForFilename(file.name) ? chubFiles : rest).push(file);
  }
  if (!chubFiles.length) return files;
  const buffersByRole = {}; const namesByRole = {}; const fileHandles = {};
  for (const file of chubFiles){
    if (file.size<=1) continue; // K020.5(처방내역)처럼 해당 내역이 없어 0byte(또는 개행문자 1개)인 경우 — 없는 파일과 동일하게 취급
    const role = chubRoleForFilename(file.name);
    buffersByRole[role] = await file.arrayBuffer();
    namesByRole[role] = file.name;
    const h = handleByName ? handleByName.get(file.name) : null;
    if (h) fileHandles[role] = h;
  }
  if (!buffersByRole.H || !buffersByRole.A){
    alert('첩약 파일(H010, K020.1~.5)로 보이는데, 필수인 H010(청구서)과 .1(일반내역)이 함께 선택되지 않았습니다.\n두 파일을 포함해서 다시 선택해 주세요.');
    return rest;
  }
  // 한방(HANBANG, 일반 한방입원/외래)도 파일명이 똑같이 K020.1~.4/H010이라 파일명만으로는 구분이
  // 안 된다 — H010의 진료형태(pos35)로 실제 내용을 확인해서 첩약('F'/'G')이 아니면 아무 파일도
  // 건드리지 않고 그대로 돌려줘서, 뒤에 등록된 layout-hanbang.js의 그루퍼가 대신 처리하게 한다.
  const hBytes = new Uint8Array(buffersByRole.H);
  const formType = hBytes.length>34 ? String.fromCharCode(hBytes[34]) : '';
  if (formType!=='F' && formType!=='G') return files;
  const label = chubFiles[0].webkitRelativePath ? chubFiles[0].webkitRelativePath.split('/')[0] : '첩약청구';
  loadChubBuffers(buffersByRole, namesByRole, label, fileHandles);
  return rest;
}
registerFileGrouper(chubGrouperFn);
// H010 하나만 선택된 경우의 자동완성 — 진료형태(pos35, 0-indexed 34)가 'F'/'G'면 첩약으로 확정.
registerHOnlyAutocomplete({ pattern:/H010$/, detect: bytes => bytes[34]===0x46||bytes[34]===0x47, roleForFilename:chubRoleForFilename, retry:chubGrouperFn, label:'첩약 청구서' });

/* ---------- 첩약(CHUB) 청구분야 등록 ---------- */
LAYOUT_CHUB_C.mokMap = 목번호맵_첩약;
PATIENT_NAME_FIELDS.add('수진자성명');
JUMIN_FIELDS.add('수진자주민등록번호');
registerRecordLetters(['A','B','C','D','E']);
registerClaimType('CHUB', {
  layouts: LAYOUTS_CHUB,
  // 첩약의 상병내역(B)에 내원일자·당월요양개시일이 있으므로 산재/DRG와 동일하게 상병(주상병,
  // 상병분류구분='1')을 기준으로 삼는다. 진료내역(C)의 변경일, 처방내역(D)·특정내역(E)의 처방전발급번호,
  // 특정내역(E) 자유서식 속 날짜까지 함께 이동.
  dateAnchor: {
    anchorType:'B', bField:'내원일자,당월요양개시일', bFlagField:'상병분류구분', bFlagVal:'1',
    shiftFields: [
      { t:'A', name:'최초입원개시일' },
      { t:'C', name:'변경일' },
      { t:'D', name:'처방전발급번호', kind:'prescNo' },
      { t:'E', name:'처방전발급번호', kind:'prescNo' },
      { t:'E', name:'특정내역', kind:'freetext' },
    ],
  },
  hSumPairs: H_SUM_FIELD_PAIRS_CHUB,
  blankRowLen: BLANK_ROW_LEN_CHUB,
  usesContentClassify: false, // 파일명(role)이 유형을 결정하므로 저장 후 재검증 시 classify() 재판별을 하지 않음
  openSave: openSaveChub,
  downloadOutput: downloadOutputChub,
  parseMultiDoc: parseChubDoc,
});
