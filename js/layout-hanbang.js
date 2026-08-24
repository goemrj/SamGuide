/* ---------- 한방(HANBANG, 일반 한방 입원/외래 — 첩약 시범사업이 아닌 통상적인 한의원/한방병원 청구)
   레이아웃 — 파일 구성은 H010(청구서)+K020.1~.4(일반/상병/진료/특정내역)로 첩약(CHUB)과 파일명이
   완전히 동일하다(처방내역 K020.5만 없음 — 한방은 처방전 발급 개념 자체가 없어 진료내역/C에 바로
   기준처방·가미제·감미제·임의처방 코드를 적어 넣는 구조). 그래서 파일명만으로는 첩약과 구분이 안
   되고, H010의 진료형태(pos35, '8'=한방입원/'9'=한방외래 — GEN의 기존 진료형태코드에 이미 있던 값)로
   실제 내용을 확인해서 구분한다 — layout-chub.js의 그루퍼가 먼저 등록되어 있어 그쪽에서 'F'/'G'가
   아니면 파일을 그대로 돌려주고, 이 스크립트의 그루퍼가 이어받아 '8'/'9'를 확인한다.
   A(일반내역)는 첩약의 A와 필드 구성이 완전히 동일(325byte, 서식번호 K020/K021/K030/K031 공유) —
   이번 세션에서 방금 고친 첩약 A-form의 formGroups(가입자성명/증번호/보장기호를 "일반내역" 섹션으로,
   100분의100미만 필드들을 별도 "100/100미만" 섹션으로 분리)를 그대로 재사용한다. B(상병내역, 43byte)도
   첩약과 동일. C(진료내역)는 1회투약량 필드가 없고 단가가 10byte(8+2)라 182byte로 첩약(193byte)보다
   짧고, 코드구분도 A/B/C/G/H(첩약의 D/E 대신 G=구협약재료대)로 다르다. E(특정내역)는 처방전발급번호
   필드 자체가 없어(처방내역이 없으므로) 725byte. D(처방내역)는 존재하지 않는다.
   필드 위치는 「★ 한방 SAM (091).doc」기준 (2026-08-13, 한방입원 실샘플 1종 대조: H=2096(GEN과 완전
   동일)/A=325/B=43/C=182/E=725byte 전부 일치, 전부 CRLF). ---------- */

/* 명세서 K020.1~.4 — 문서 이름: 한방 요양급여비용 명세서 1~4 – 091Ver.
   설명·코드값은 「★ 한방 SAM (091).doc」(=「SAM_03_한방 명세서(091).doc」)의 「코드 및 유형」 칸 그대로.
   항목명은 편집기가 이름으로 필드를 찾으므로 기존 표기를 유지하고, 문서 항목명이 다른 것만 설명 첫 줄에 적었다.
   반복 최대(문서 「구조」 칸): B 상병내역 40 · C 진료내역 99(줄번호 9999) · E 특정내역(줄번호 9999 · 특정내역구분 999).
   ※ C(진료내역)의 Pos. 는 문서와 실제 파일이 어긋난다 — 문서 Pos. 는 단가 34 다음이 46(단가를 12byte 로 본 것)이지만
   문서 자신의 설명이 「정수부 8자리, 소수부 2자리(총 10자리)」이고 실샘플도 10byte(레코드 182byte)다.
   실샘플에 맞춰 단가 10byte·이후 필드를 2byte 앞으로 둔다(문서대로면 184byte). */
const LAYOUT_HANBANG_A = { key:'A', name:'일반내역',
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
  F(1,10,'an','청구번호','진료년월(CCYYMM)+일련번호 4자리'),
  F(11,5,'an','명세서일련번호','문서 항목명: 명세서 일련번호\n00001-99999'),
  F(16,4,'an','서식번호','',{'K020':'건강보험 한방 입원 요양급여비용명세서','K021':'건강보험 한방 외래 요양급여비용명세서','K030':'의료급여 한방 입원 명세서','K031':'의료급여 한방 외래 명세서'}),
  F(20,8,'an','요양기관기호','문서 항목명: 요양기관(의료급여기관)기호\n요양기관(의료급여기관)기호를 기재'),
  F(28,11,'an','보장기관기호','의료급여 수급권자의 관할 시군구 기호를 기재'),
  F(39,1,'an','의료급여종별구분','',{'1':'1종','2':'2종','4':'행려','6':'2종 장애인의 2차의료급여','8':'2종 장애인의 1차의료급여','9':'노숙자 및 외국인근로자','N':'노숙인 1종'}),
  F(40,1,'an','공상등구분','문서 항목명: 공상 등 구분',{'0':'무','1':'공상','4':'보훈위탁진료 요양기관의 보훈국비환자 (건강보험 또는 의료급여 수급권자)','7':'보훈위탁진료 요양기관의 보훈국비환자 (상이처, 무자격자)','8':'군인가족, 예비역장군 및 대령, 창군 및 6.25 참전요원의 군 요양기관 이용시','9':'군인.군무원의 군 요양기관 이용시','C':'차상위 희귀질환.중증난치질환 또는 중증질환 본인부담경감대상자','E':'차상위만성질환.18세미만 본인부담경감 대상자','F':'차상위장애인만성질환.18세미만 본인부담경감 대상자','G':'긴급복지 의료지원대상자','H':'희귀질환 지원대상자'}),
  F(41,1,'an','정액정률구분','문서 항목명: 정액.정율구분\n읍·면소재 한방병원의 건강보험 외래요양급여비용명세서를 월단위로 통합하여 작성하는 경우 기재 (2007.7.31일까지의 진료분만 해당)',{'0':'정액','9':'정율'}),
  F(42,1,'an','청구구분코드','문서 항목명: 청구구분 - 코드',{'1':'보완청구','2':'추가청구','3':'분리청구'}),
  F(43,7,'an','접수번호','문서 항목명: 청구구분 - 접수번호\n보완, 추가, 분리 청구시 기입'),
  F(50,5,'an','명세서일련번호(당초)','문서 항목명: 청구구분 - 명세서일련번호\n보완, 추가, 분리 청구시 기입'),
  F(55,2,'an','사유코드','문서 항목명: 청구구분 - 사유코드\n보완청구시 기입, 심사불능 사유코드를 기재'),
  F(57,8,'an','최초입원개시일','문서 항목명: 청구구분 - 최초입원개시일\n입원 요양급여비용 분리청구시 기재\nformat:CCYYMMDD'),
  F(65,20,'an','가입자(세대주)성명','건강보험:가입자성명, 의료급여:세대주성명\n(성과이름을 붙여서 기재)'),
  F(85,20,'an','증번호','문서 항목명: 증번호(보장시설 및 노숙인시설기호)\n- 건강보험:증번호 기재\n- 보장시설 입소 의료급여환자 또는 노숙인 의료급여환자: 보장시설기호 또는 노숙인시설기호 기재'),
  F(105,20,'an','수진자성명','수진자성명 한글로기재(성과이름을 붙여서 기재)'),
  F(125,13,'an','수진자주민등록번호','‘-’ 생략 기재'),
  F(138,3,'n','요양급여일수','요양급여 받은 실일수 기재.\n입원(내원)일수에 원내투약일수를 산입하여 기재\n(내원 또는 입원일수와 투약일수가 중복시 1일로계산)',null,'money'),
  F(141,3,'n','입원일수,총내원일수','입(내)원 진료 실일수 기재',null,'money'),
  F(144,31,'an','공란','공란(구 내원일 항목)'),
  F(175,1,'an','진료결과','',{'1':'계속','2':'이송','3':'회송','4':'사망','9':'퇴원또는외래치료종결'}),
  F(176,10,'n','요양급여비용총액1','기본진료료,약제소계+진료행위소계+가산금액\n(총 금액에서 10원미만 절사)',null,'money'),
  F(186,10,'n','본인일부부담금','본인일부부담금은 100원 미만 절사한 금액으로 기재하되, 입원진료의 경우에는 10원 미만 절사한 금액으로 기재(단, 상급종합병원, 종합병원, 병원, 치과병원 및 요양병원의 2009.6.30일 이전 진료분까지는 10원 미만 절사한 금액으로 기재)',null,'money'),
  F(196,10,'n','본인부담상한액초과금','본인일부부담금이 본인부담상한액을 초과시 기재하며, 입원건의 분리 또는 추가청구시에는 원청구와 연계하여 초과한 금액을 기재',null,'money'),
  F(206,10,'n','청구액','본인일부부담금을 제회한 금액 기재, 차상위 장애인 만성질환.18세미만 본인부담경감대상자의 경우 요양급여비용총액1에서 본인일부부담금과 장애인의료비를 제외한 금액을 기재\n단, 보훈위탁진료 요양기관의 보훈국비환자중 상이처, 무자격자인 경우 ‘0’ 기재',null,'money'),
  F(216,10,'n','지원금','희귀난치성질환, 긴급복지 의료지원대상자에게 지원하는 비용을 기재.',null,'money'),
  F(226,10,'n','장애인의료비','- 의료급여 2종 장애인 1,2차 진료\n- 건강보험의 경우 차상위 장애인 만성질환․18세미만 본인부담경감대상자의 경우 해당 금액을 기재',null,'money'),
  F(236,10,'n','대불금','2종 의료급여 수급권자의 입원진료의 경우 대불금 신청시만 기재',null,'money'),
  F(246,10,'n','요양급여비용총액2,진료비총액','문서 항목명: 요양급여비용총액 2, 진료비총액\n- 요양급여비용총액2: 요양급여비용총액1과 건강보험(의료급여) 100분의100본인부담금총액을 합하여 기재하되, 10원미만 절사한 금액을 기재\n- 진료비총액: 다음의 보훈국비환자인 경우에 한하여 기재\n․ 보훈위탁진료 요양기관의 보훈국비환자 진료분인 경우 비급여와 요양급여비용(건강보험(의료급여)100분의100본인부담금총액, 보훈 등 100분의100본인부담 포함)을 모두 합하여 총 금액을 기재하되, 10원미만 절사한 금액을 기재',null,'money'),
  F(256,10,'n','보훈청구액','보훈위탁진료 요양기관의 보훈국비환자 진료분인 경우 진료비총액에서 본인일부부담금, 청구액, 보훈 본인일부부담금 및 건강보험(의료급여) 100분의100본인부담금총액을 제외한 금액을 기재',null,'money'),
  F(266,10,'n','건강보험(의료급여)100분의100본인부담금총액','문서 항목명: 건강보험(의료급여) 100/100 본인부담금총액\n건강보험(의료급여) 100분의100본인부담금을 합하여 기재하되, 10원미만 절사한 금액을 기재',null,'money'),
  F(276,10,'n','보훈본인일부부담금','문서 항목명: 보훈 본인일부부담금\n다음의 보훈국비환자인 경우에 한하여 기재\n- 보훈위탁진료 요양기관의 보훈 국비환자 명세서의 경우 ‘국가보훈대상자 의료지원에 관한 규칙’에 따른 보훈 등 100분의100본인부담액과 비급여를 합한 금액의 해당 본인일부부담금을 기재\n- 보훈 본인일부부담금은 100원 미만 절사한 금액으로 기재하되, 입원진료의 경우에는 10원미만 절사한 금액으로 기재',null,'money'),
  F(286,10,'n','100분의100미만총액','문서 항목명: 100/100 미만 총액\nA,B,D항 및 E항의 치료재료, 약제 등 요양기관 종별가산율이 적용되지 않은 요양급여비용, 요양기관 종별가산율이 적용되는 진료행위와 가산금액을 합하여 총 금액에서 10원미만 절사한 금액을 기재',null,'money'),
  F(296,10,'n','100분의100미만본인일부부담금','문서 항목명: 100/100 미만 본인일부부담금\n요양급여비용의 100분의100미만의 범위에서 본인부담률을 달리 적용하는 항목 및 부담률의 결정 등에 관한 기준에 따른 본인일부부담금을 기재하되 10원미만 절사한 금액을 기재\n- 보훈 국비환자의 경우에는 국가보훈대상자 의료지원에 관한 규칙에 따른 100분의100미만 본인일부부담금을 기재',null,'money'),
  F(306,10,'n','100분의100미만청구액','문서 항목명: 100/100 미만 청구액\n100분의100미만 총액에서 본인일부부담금을 제외한 금액을 기재. 단, 보훈위탁진료 요양기관의 보훈국비환자 중 상이처, 무자격자인 경우 ‘0’으로 기재',null,'money'),
  F(316,10,'n','100분의100미만보훈청구액','문서 항목명: 100/100 미만 보훈청구액\n보훈위탁진료 요양기관의 보훈국비환자 진료분인 경우 100분의100미만 총액에서 100분의100미만 본인일부부담금 및 100분의100미만 청구액을 제외한 금액을 기재',null,'money'),
]};

// 진료과목 — 한방 명세서 문서(091)에 적힌 9개 그대로. 의과 공통 표와 86·87이 뒤바뀌어 있다
// (한방 문서: 86 한방재활의학과 · 87 사상체질과 / 의과 공통 표: 86 사상체질과 · 87 한방재활의학과).
const 진료과목코드_한방 = {'80':'한방내과','81':'한방부인과','82':'한방소아과','83':'한방안과이비인후과피부과','84':'한방신경정신과','85':'침구과','86':'한방재활의학과','87':'사상체질과','88':'한방응급'};

/* K020.2 [ 상병내역 ] – 필수(최대 40).
   문서 각주: (*)명세서일련번호당 상병분류기호 내역은 최대 40개 발생 가능함. 레코드 반복으로 표시함 */
const LAYOUT_HANBANG_B = { key:'B', name:'상병내역',
  gridOrder:['상병분류구분','상병분류기호','진료과목','진료개시일','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호','진료년월(CCYYMM)+일련번호 4자리'),
  F(11,5,'an','명세서일련번호','00001- 99999'),
  F(16,1,'an','상병분류구분','* 1: 주상병(최대 1개: 필수)\n2: 부상병(최대 29개: 조건)\n3: 배제된 상병(최대 10개: 조건)',{'1':'주상병','2':'부상병','3':'배제된 상병'}),
  F(17,6,'an','상병분류기호','통계청 고시에 따라 한국표준질병.사인분류의 분류기호를 중요도 순서로 기재'),
  F(23,2,'an','진료과목','진료과목이 2개이상에 해당시 상병별로 모두 기재',진료과목코드_한방),
  F(25,8,'an','진료개시일','문서 항목명: 내원일자, 당월요양개시일\n- 내원일자 : 외래 요양급여비용명세서의 경우 진료일자를 기재\n- 당월요양개시일 : 입원 요양급여비용명세서의 경우 요양기관에 해당 상병 진료를 위하여 그 달에 최초 입원한 년·월·일을 기재. 단, 입원요양급여비용 분리청구시 해당 요양급여비용명세서의 최초 진료일자를 기재\nformat:CCYYMMDD'),
  F(33,1,'an','면허종류','주상병명에 대하여 진료한 진료과목의 주된 의사의 해당 면허종류 구분자를 기재',{'3':'한의사'}),
  F(34,10,'an','면허번호','주상병명에 대하여 진료한 진료과목의 주된 의사의 면허번호를 기재'),
]};

const 항번호코드_한방 = codesTable([
  ['01','진찰료'],['02','입원료'],['03','투약료'],['04','시술 및 처치료'],['05','검사료'],
  ['A','100분의 50 본인부담'],['B','100분의 80 본인부담'],['D','100분의 30 본인부담'],['E','100분의 90 본인부담'],
  ['U','건강보험(의료급여) 100/100 본인부담'],['V','보훈 등 100/100 본인부담'],['W','비급여'],
]);
const 목_한방본인부담 = codesTable([['01','의약품'],['02','치료재료'],['03','진료행위']]);
const 목번호맵_한방 = {
  '01':codesTable([['01','초진'],['02','재진'],['99','기타']]),
  '02':codesTable([['01','일반'],['02','내과질환자,정신질환자,만8세미만소아과'],['03','중환자실'],['04','기본식대'],['05','안치료'],['11','가산식대'],['12','(사용유보)'],['13','(사용유보)'],['99','기타']]),
  '03':codesTable([['01','내복약'],['02','조제, 복약지도료'],['99','기타']]),
  '04':codesTable([['01','침술'],['02','구술'],['03','부황술'],['04','처치료'],['99','기타']]),
  '05':codesTable([['01','검사료']]),
  'A':목_한방본인부담,'B':목_한방본인부담,'D':목_한방본인부담,'E':목_한방본인부담,'U':목_한방본인부담,'V':목_한방본인부담,'W':목_한방본인부담,
};

/* K020.3 [ 진료내역 ] – 옵션(최대 99, 줄번호 9999). Pos. 는 실샘플 기준(위 머리말 참조) */
const LAYOUT_HANBANG_C = { key:'C', name:'진료내역',
  gridOrder:['항','목','줄번호','구분','코드','단가','일투','총투','금액','가감등구분','변경일','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호','진료년월(CCYYMM)+일련번호 4자리'),
  F(11,5,'an','명세서일련번호','00001- 99999'),
  F(16,2,'an','항','문서 항목명: 항번호\n㈜ A,B,D,E,U,V,W 항 기재시 반드시 왼쪽 정렬하여 대문자로 기재\n예) ‘V_’(바른표기)와 ‘_V’는 서로 다른 항으로 처리함',항번호코드_한방,null,10),
  F(18,2,'an','목','문서 항목명: 목번호\n항별 목번호는 「항 · 목 코드」 화면 참조',null,null,10),
  F(20,4,'n','줄번호','명일련번호별 항,목순으로 일련번호 기재(1 – 9999)',null,null,10),
  F(24,1,'an','구분','문서 항목명: 코드구분',{'A':'수가','B':'준용수가','C':'약가','G':'구 협약재료대(2000.12.31 이전진료분 해당)','H':'치료재료'},null,7),
  F(25,9,'an','코드','',null,null,20),
  F(34,10,'n','단가','*상대가치점수표상의 점수*점수당 단가(10원미만사사오입)\n*약가,치료재료경우 “약제 및 치료재료의 구입금액에 대한산정기준”에 의한 단가 기재\n*정수부 8자리, 소수부 2자리(총 10자리), 소수점 미표기\n예) 720원 -> “_ _ _ _ _72000”',null,2),
  F(44,7,'n','일투','문서 항목명: 1일 투여량, 투여(실시)횟수\n*1일투여량(소수 셋째자리 사사오입)또는 투여(실시)횟수 기재\n* 정수부 5자리, 소수부 2자리(총 7자리), 소수점 미표기\n예)1 -> “_ _ _ _100”  1.6 -> “_ _ _ _160”',null,2),
  F(51,3,'n','총투','문서 항목명: 총투여일수, 실시횟수\n예)2 -> “_ _2”',null,'money'),
  F(54,10,'n','금액','단가*1일투여량 * 총투여일수(원미만 사사오입)\n기준처방에대해 감미한경우 해당 단미제에’-‘금액기재\n예) -295 -> “______-295”',null,'money'),
  F(64,10,'an','가감등구분','문서 항목명: 가감 등 구분\n기준처방에 단미제를 가,감하는 경우나 임의처방의 경우 처방 및 단미제 코드에 다음의 유형으로 코드 기재\nB#########  기준처방\nA#########  가미제\nS#########  감미제\nH#########  임의처방 및 임의처방에 사용한 단미제\n#########는 한약제제 코드와 동일한 9자리'),
  F(74,8,'an','변경일','format:CCYYMMDD\n(월 요양개시일 이후 단가변경,신설경우)'),
  F(82,1,'an','면허종류','실제 환자를 진료한 의사 및 실시한 간호사 등의 아래 면허종류(단, 사회복지사는 자격종류)를 기재',{'3':'한의사','6':'간호사','7':'사회복지사'}),
  F(83,100,'an','면허번호','실제 환자를 진료한 의사 및 실시한 간호사 등의 면허번호(단, 사회복지사는 자격번호)를 기재\n* 2개 이상의 면허번호 기재시 ‘/’ 로 구분\n예) “12345/67890/54321……”',null,null,14),
]};

/* K020.4 [ 특정내역 기재란 ] – 옵션(줄번호 9999 · 특정내역구분 999). 문서 각주:
   (*) 명세서 및 줄번호 단위 별로 특정내역이 발생시 해당 단위 별로 작성하고, 동일 명세서 및 줄번호에
       여러 특정내역이 발생시에도 각각으로 생성하여 레코드 반복 기재함
   (*) 동일 특정내역구분에 특정내역이 700 바이트 이상 발생할 경우 기재 방법
       - 청구번호에서 특정내역구분까지 동일하게 기재 후 추가된 특정내역 기재하여 레코드 반복 기재함
   (예시)
     2004051111000011      MT008 주민번호(첫 6자리)/진료(조제)일수
     2004051111000011      MT005 11234567890332
     2004051111000011      MX999 명세서 특정내역
     2004051111000012   1  JS009 준용명
     2004051111000012   1  JX999 진료내역 1번줄 특정내역
     2004051111000012   3  JX999 진료내역 3번줄 특정내역 */
const LAYOUT_HANBANG_E = { key:'E', name:'특정내역',
  gridOrder:['발생단위구분','줄번호','특정내역구분','특정내역'],
  fields:[
  F(1,10,'an','청구번호','CCYYMM+ 일련번호 4자리'),
  F(11,5,'an','명세서일련번호','00001 - 99999'),
  F(16,1,'an','발생단위구분','',{'1':'명세서단위','2':'줄번호단위'}),
  F(17,4,'n','줄번호','발생단위구분이 청구서 또는 명세서 -> space\n발생단위구분 진료내역 ->1-9999'),
  F(21,5,'an','특정내역구분','(=심평원 고시 참조)\n별표 8.특정내역구분코드'),
  F(26,700,'an','특정내역','심평원고시 특정내역 기재형식에 따라 기재\n*기재 내역 실제 길이만큼만 생성 하여도 허용\n예)원내투약일수 9(3) 인 경우 “3” 1byte 만 기재하여도 됨'),
]};

const LAYOUTS_HANBANG = { H:LAYOUT_H, A:LAYOUT_HANBANG_A, B:LAYOUT_HANBANG_B, C:LAYOUT_HANBANG_C, E:LAYOUT_HANBANG_E };

const H_SUM_FIELD_PAIRS_HANBANG = [
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

const BLANK_ROW_LEN_HANBANG = { B:43, C:182, E:725 };

/* ---------- H010+K020.1~.4가 파일 여러 개로 나뉜 것을 한 청구(doc)로 합쳐 파싱. 첩약과 동일한
   구조지만 D(처방내역) 역할 자체가 없다. 실샘플은 전부 CRLF(첩약과 달리 LF-only 파일이 없었음) —
   그래도 detectLineSep/splitRecordsBySep(js/layout-jabo-han.js)를 그대로 써서 혹시 LF-only인
   실제 제출 파일이 나와도 안전하게 처리되도록 한다. ---------- */
const HANBANG_ROLE_ORDER = ['H','A','B','C','E'];
function parseHanbangDoc(buffersByRole, namesByRole, label){
  const sources = {};
  const allRecords = []; const recById = new Map();
  let nextId = 0, totalBytes = 0;
  for (const role of HANBANG_ROLE_ORDER){
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
    claimType:'HANBANG',
    fileName: label || '한방청구',
    bytes: { length: totalBytes },
    sources, records: allRecords, recById, nextId,
    claims:[], claimByKey:new Map(), hId:-1, unknown:0,
    edits:new Map(), undoStack:[], redoStack:[], selClaim:-1,
    fileHandles: {},
  };
  buildClaims(doc);
  return doc;
}
function loadHanbangBuffers(buffersByRole, namesByRole, label, fileHandles, isRestore){
  const doc = parseHanbangDoc(buffersByRole, namesByRole, label);
  doc.fileHandles = fileHandles || {};
  docs.push(doc);
  switchTab(docs.length-1);
  if (!isRestore){ persistFiles(); schedulePersist(); }
}

let pendingOutputHanbang = null;
function openSaveHanbang(scopeSet){
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
    for (const role of HANBANG_ROLE_ORDER){
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
      const fname = (state.sources[role] && state.sources[role].fileName) || HANBANG_FILE_NAMES[role];
      perFileRows.push('<tr><td>'+esc(fname)+'</td><td>'+esc(curLayouts()[role].name)+'</td><td>'+rep.count.toLocaleString()+'</td><td>'+out.length.toLocaleString()+' byte</td></tr>');
    }
    repAgg.typeOk = repAgg.typeBad===0;
    pendingOutputHanbang = outputsByRole;
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
async function downloadOutputHanbang(){
  try{ await downloadOutputHanbangInner(); }
  catch(e){ alert('저장 중 예상치 못한 오류가 발생했습니다: '+e.message+'\n(이 문구를 스크린샷으로 남겨주세요)'); }
}
async function downloadOutputHanbangInner(){
  if (!pendingOutputHanbang) return;
  const roles = Object.keys(pendingOutputHanbang);
  const fileHandles = state.fileHandles || {};
  const prefix = document.getElementById('saveName').value.trim();
  const nameFor = (role, canonical) => prefix ? prefix+'_'+canonical : ((state.sources[role] && state.sources[role].fileName) || canonical);
  for (const role of roles){
    const h = fileHandles[role];
    if (!h) continue;
    try{
      const w = await h.createWritable();
      await w.write(pendingOutputHanbang[role]);
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
      const name = nameFor(role, HANBANG_FILE_NAMES[role]);
      try{
        const fh = await dirHandle.getFileHandle(name, {create:true});
        const w = await fh.createWritable();
        await w.write(pendingOutputHanbang[role]);
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
    const name = nameFor(role, HANBANG_FILE_NAMES[role]);
    const buf = pendingOutputHanbang[role];
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

/* ---------- 파일명 자동 인식 — H010(청구서) + K020.1~.4(명세서). 첩약(CHUB)과 파일명이 완전히
   똑같아 layout-chub.js의 그루퍼가 먼저 시도하고, H010의 진료형태가 'F'/'G'가 아니면(=한방) 파일을
   그대로 돌려준다 — 이 그루퍼가 이어받아 '8'/'9'인지 확인한다. ---------- */
const HANBANG_FILE_NAMES = { H:'H010', A:'K020.1', B:'K020.2', C:'K020.3', E:'K020.4' };
const HANBANG_SUFFIX_ROLES = [
  [/K0[23][01]\.1$/, 'A'], [/K0[23][01]\.2$/, 'B'], [/K0[23][01]\.3$/, 'C'], [/K0[23][01]\.4$/, 'E'],
];
function hanbangUniqueRoleForFilename(name){
  for (const [re, role] of HANBANG_SUFFIX_ROLES) if (re.test(name)) return role;
  return null;
}
function hanbangRoleForFilename(name){
  if (/H010$/.test(name)) return 'H';
  return hanbangUniqueRoleForFilename(name);
}

async function hanbangGrouperFn(files, handleByName){
  const hasHanbangSpecific = files.some(f => hanbangUniqueRoleForFilename(f.name));
  if (!hasHanbangSpecific) return files;
  const hbFiles = [], rest = [];
  for (const file of files){
    (hanbangRoleForFilename(file.name) ? hbFiles : rest).push(file);
  }
  if (!hbFiles.length) return files;
  const buffersByRole = {}; const namesByRole = {}; const fileHandles = {};
  for (const file of hbFiles){
    if (file.size<=1) continue;
    const role = hanbangRoleForFilename(file.name);
    buffersByRole[role] = await file.arrayBuffer();
    namesByRole[role] = file.name;
    const h = handleByName ? handleByName.get(file.name) : null;
    if (h) fileHandles[role] = h;
  }
  if (!buffersByRole.H || !buffersByRole.A){
    alert('한방 파일(H010, K020.1~.4)로 보이는데, 필수인 H010(청구서)과 .1(일반내역)이 함께 선택되지 않았습니다.\n두 파일을 포함해서 다시 선택해 주세요.');
    return rest;
  }
  const hBytes = new Uint8Array(buffersByRole.H);
  const formType = hBytes.length>34 ? String.fromCharCode(hBytes[34]) : '';
  if (formType!=='8' && formType!=='9') return files; // 첩약도 아니고 한방도 아니면 그대로 반환
  const label = hbFiles[0].webkitRelativePath ? hbFiles[0].webkitRelativePath.split('/')[0] : '한방청구';
  loadHanbangBuffers(buffersByRole, namesByRole, label, fileHandles);
  return rest;
}
registerFileGrouper(hanbangGrouperFn);
// H010 하나만 선택된 경우의 자동완성 — 진료형태(pos35, 0-indexed 34)가 '8'/'9'면 한방으로 확정.
registerHOnlyAutocomplete({ pattern:/H010$/, detect: bytes => bytes[34]===0x38||bytes[34]===0x39, roleForFilename:hanbangRoleForFilename, retry:hanbangGrouperFn, label:'한방 청구서' });

/* ---------- 한방(HANBANG) 청구분야 등록 ---------- */
LAYOUT_HANBANG_C.mokMap = 목번호맵_한방;
PATIENT_NAME_FIELDS.add('수진자성명');
JUMIN_FIELDS.add('수진자주민등록번호');
registerRecordLetters(['A','B','C','E']);
registerClaimType('HANBANG', {
  layouts: LAYOUTS_HANBANG,
  dateAnchor: {
    anchorType:'B', bField:'진료개시일', bFlagField:'상병분류구분', bFlagVal:'1',
    shiftFields: [
      { t:'A', name:'최초입원개시일' },
      { t:'C', name:'변경일' },
      { t:'E', name:'특정내역', kind:'freetext' },
    ],
  },
  hSumPairs: H_SUM_FIELD_PAIRS_HANBANG,
  blankRowLen: BLANK_ROW_LEN_HANBANG,
  usesContentClassify: false,
  openSave: openSaveHanbang,
  downloadOutput: downloadOutputHanbang,
  parseMultiDoc: parseHanbangDoc,
});
