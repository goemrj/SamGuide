/* ---------- DRG(질병군/포괄수가) 레이아웃 — 원본은 「SAM_07_DRG 명세서(092).doc」 = 「★ DRG SAM 명세서 (092).doc」
   (두 문서의 표 내용이 글자까지 동일) + 청구서(H010)는 「★ DRG SAM 청구서 (092).doc」의 공통 서식(LAYOUT_H 재사용).
   실샘플 대조 검증 완료. 문서의 SAMFILE-NAME: D020.1~.6 = 질병군 요양급여비용 명세서 1~6 – 092ver.
   각 레코드 머리말(문서 공통): ◆ 각 레코드는 반드시 CRLF(2Byte)로 구분한다. ◆ Pos.은 각 칼럼의 시작 위치를 의미한다.
   ◆ SAM 파일상의 코드 및 유형은 심사평가원 청구 방법에 준하며, 심사평가원 고시에 따라 사전고지 없이 변경될 수 있습니다.
   (일부 상이한 부분은 SAM 파일 기재방법에 따라 작성합니다.)
   설명(desc)·코드값은 문서의 「코드 및 유형」 칸을 줄여쓰지 않고 그대로 옮긴 것이다. 항목명은 편집기(SamEditor)가
   이름으로 필드를 찾으므로 기존 표기를 유지하고, 문서 항목명이 다른 것만 설명 첫 줄에 「문서 항목명」으로 적었다.
   문서에 「삭제」로 남은 옛 항목(위치가 없어 필드가 아닌 것)은 아래 각 레코드 주석에 적었다.
   반복 최대 건수(문서의 「구조」 칸): B 진단내역 30 · C 진료내역 99 · D 처방내역 100(줄번호 9999) ·
   E 특정내역 300(줄번호 9999 · 특정내역구분 999) · F 열외군 99. ---------- */

// 진료과목 — DRG 진단내역(D020.2) 문서에 적힌 26개 그대로(의과 공통 표와 달리 07을 「흉곽외과」로 적고 치과·한방과는 없다)
const 진료과목코드_DRG = {'01':'내과','02':'신경과','03':'정신건강의학과','04':'외과','05':'정형외과','06':'신경외과','07':'흉곽외과','08':'성형외과','09':'마취통증의학과','10':'산부인과','11':'소아청소년과','12':'안과','13':'이비인후과','14':'피부과','15':'비뇨기과','16':'영상의학과','17':'방사선종양학과','18':'병리과','19':'진단검사의학과','20':'결핵과','21':'재활의학과','22':'핵의학과','23':'가정의학과','24':'응급의학과','25':'직업환경의학과','26':'예방의학과'};

/* D020.1 일반내역 — 필수. 문서에 「삭제」로 남은 옛 항목:
   삭제 an(1) (구 진료결과 항목) *위치이동 / 삭제 an(1) (구 도착경로 항목) / 삭제 an(6) (구 질병군번호 항목) *위치이동 /
   삭제 an(25) (구 질병군부가코드 항목) / 삭제 n(10) (구 행위별진료비총액 항목) *위치이동 /
   삭제 n(10) (구 보훈 100/100 본인부담 총액 항목) / 삭제 n(10) (구 비급여총액 항목) */
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
  F(1,10,'an','청구번호','진료년월(CCYYMM)+DRG구분(D)+일련번호3자리(예:200110D001)'),
  F(11,5,'an','명세서일련번호','00001 - 99999'),
  F(16,1,'an','내역구분','SAM파일 구분자(‘A’: 일반내역)',{'A':'일반내역'}),
  F(17,4,'an','서식번호','',{'D020':'건강보험 의과 입원 질병군 요양급여비용명세서','D030':'(사용유보)'}),
  F(21,8,'an','요양기관기호','문서 항목명: 요양기관(의료급여기관)기호\n요양기관(의료급여기관)기호를 기재'),
  F(29,11,'an','공란','(사용유보)(구 사업장(보장기관)기호 항목)'),
  F(40,1,'an','공란','(사용유보)(구 의료급여종별구분 항목)'),
  F(41,1,'an','공상등구분','문서 항목명: 공상 등 구분',{'0':'무','4':'보훈위탁진료 요양기관의 보훈 국비환자(건강보험)','7':'보훈위탁진료 요양기관의 보훈 국비환자 (상이처,무자격자)','B':'보훈병원 국비보험 1차','C':'차상위 희귀질환.중증난치질환 또는 중증질환 본인부담 경감대상자','E':'차상위 만성질환.18세미만 본인부담경감 대상자','F':'차상위장애인만성질환.18세미만 본인부담경감 대상자','G':'긴급복지 의료지원대상자','H':'희귀질환 지원대상자'}),
  F(42,1,'an','공란',''),
  F(43,2,'an','공란',''),
  F(45,6,'an','질병군번호','질병군번호 6자리기재(=심평원 고시 참조)'),
  F(51,1,'an','청구구분코드','문서 항목명: 청구구분 - 코드',{'1':'보완청구','2':'추가청구','3':'분리청구'}),
  F(52,7,'an','접수번호','문서 항목명: 청구구분 - 접수번호\n보완, 추가, 분리청구시 기청구 명세서 접수번호 기재'),
  F(59,5,'an','명세서일련번호(당초)','문서 항목명: 청구구분 - 명세서일련번호\n보완, 추가, 분리청구시 기청구 명세서 일련번호 기재'),
  F(64,2,'an','사유코드','문서 항목명: 청구구분 - 사유코드\n보완청구시 기청구 명세서의 심사불능코드 기재'),
  F(66,8,'an','최초입원개시일','문서 항목명: 청구구분 - 최초입원개시일\n분리청구시 최초입원개시일 기재'),
  F(74,20,'an','가입자성명','건강보험:가입자성명 기재'),
  F(94,20,'an','증번호','건강보험:증번호 기재'),
  F(114,20,'an','수진자성명','수진자성명 한글로기재(성과이름을 붙여서기재)'),
  F(134,13,'an','수진자주민등록번호','‘-’ 생략 기재'),
  F(147,10,'an','공란',''),
  F(157,3,'n','요양급여일수','질병군 진료를 받은 실일수',null,'money'),
  F(160,3,'n','입원일수','입원 진료 일수',null,'money'),
  F(163,31,'an','공란',''),
  F(194,2,'an','입원경로','도착경로와 입원경로를 조합하여 기재\n도착경로  1 타요양기관경유 / 2 응급구조대후송 / 3 기타\n입원경로  1 응급실 / 2 외래',입원경로코드),
  F(196,1,'an','진료결과','',{'1':'계속','2':'이송','3':'회송','4':'사망','9':'퇴원 또는 외래 치료종결'}),
  F(197,10,'n','요양급여비용총액1','포괄수가와 별도 산정 금액을 합한 총 금액에서 제외금액이 있는 경우 해당 금액을 제외하고 10원 미만 절사한 금액을 기재 (질병군에서의 100/100미만 총액, 100/100본인부담 및 비급여 금액은 제외)',null,'money'),
  F(207,10,'n','본인일부부담금','본인일부부담금을 10원미만 절사한 금액을 기재',null,'money'),
  F(217,10,'n','본인부담상한액초과금','본인일부부담금이 본인부담상한액을 초과시 기재하며, 입원건의 추가청구시에는 원청구와 연계하여 초과한 금액을 기재',null,'money'),
  F(227,10,'n','청구액','요양급여비용총액1 – 본인일부부담금-장애인의료비\n단, 보훈위탁진료 요양기관의 보훈국비환자 중 상이처, 무자격자는 “0”\n보훈병원 보훈감면환자의 경우 요양급여비용총액 1에서 본인일부부담금과 보훈청구액을 제외한 금액을 기재',null,'money'),
  F(237,10,'n','지원금','희귀난치성질환, 긴급복지 의료지원대상자에게 지원하는 비용을 기재',null,'money'),
  F(247,10,'n','장애인의료비','의료급여 2종 장애인 1,2차 진료인 경우(사용유보)\n- 건강보험의 경우 차상위 장애인 만성질환․18세미만 본인부담경감대상자의 경우 해당금액을 기재',null,'money'),
  F(257,10,'an','공란','(구 대불금 항목)'),
  F(267,10,'n','요양급여비용총액2·진료비총액','문서 항목명: 요양급여비용총액2, 진료비총액\n요양급여비용총액2, 진료비총액 10원미만 절사한 금액을 기재',null,'money'),
  F(277,10,'n','보훈청구액','- 보훈위탁진료 요양기관의 보훈국비환자 진료분인 경우 진료비총액에서 본인일부부담금, 청구액 및 보훈 본인일부부담금을 제외한 금액 기재\n- 보훈병원의 보훈감면환자 진료분인 경우 요양급여비용총액 1에서 본인일부부담금과 청구액을 제외한 금액을 기재',null,'money'),
  F(287,10,'an','공란',''),
  F(297,10,'an','공란',''),
  F(307,10,'n','건강보험100/100본인부담금총액','문서 항목명: 건강보험 100/100 본인부담금총액\n건강보험 100분의100본인부담금을 합하여 기재하되, 10원미만 절사한 금액을 기재',null,'money'),
  F(317,10,'n','보훈본인일부부담금','문서 항목명: 보훈 본인일부부담금\n다음의 보훈국비환자인 경우에 한하여 기재\n- 보훈위탁진료 요양기관의 보훈 국비환자의 경우 ‘보훈대상자 의료지원에 관한 규칙’에 따른 보훈 100분의 100본인부담액과 비급여를 합한 금액의 해당 본인일부부담금을 기재하되, 10원미만 절사한 금액을 기재',null,'money'),
  F(327,10,'n','100/100미만총액','문서 항목명: 100/100미만 총액\nA항, B항, D항 및 E항의 치료재료, 약제 등 요양기관 종별가산율이 적용되지 않은 요양급여비용, 요양기관 종별가산율이 적용되는 진료행위와 가산금액을 합하여 총 금액에서 10원미만 절사한 금액을 기재',null,'money'),
  F(337,10,'n','100/100미만본인일부부담금','문서 항목명: 100/100미만 본인일부부담금\n요양급여비용의 100분의100미만의 범위에서 본인부담률을 달리 적용하는 항목 및 부담률의 결정 등에 관한 기준에 따른 본인일부부담금을 기재하되 10원미만 절사한 금액 기재\n- 보훈 국비환자의 경우에는 국가보훈대상자 의료지원에 관한 규칙에 따른 100분의100미만 본인일부부담금을 기재',null,'money'),
  F(347,10,'n','100/100미만청구액','문서 항목명: 100/100미만 청구액\n100분의100미만 총액에서 본인일부부담금을 제외한 금액을 기재. 단, 보훈위탁진료 요양기관의 보훈국비환자 중 상이처, 무자격자인 경우 ‘0’으로 기재',null,'money'),
  F(357,10,'n','100/100미만보훈청구액','문서 항목명: 100/100미만 보훈청구액\n보훈위탁진료 요양기관의 보훈국비환자 진료분인 경우 100분의100미만 총액에서 100분의100미만 본인일부부담금 및 100분의100미만 청구액을 제외한 금액을 기재',null,'money'),
  F(367,10,'n','포괄수가','질병군별 상대가치점수 총합에 점수당 단가를 곱하여 10원 미만 4사5입한 금액을 기재',null,'money'),
  F(377,10,'n','행위별진료비총액','요양급여비용 열외군 명세서인 경우에 한해 질병군 진료 시 소요된 행위, 약제, 치료재료에 대하여 ｢국민건강보험법｣에서 인정한 진료행위별 수가방식에 따라 산정된 진료비용 총액(단, 질병군에서 별도 산정 가능한 선별급여와 100분의100본인부담, 비급여 대상은 제외)을 기재',null,'money'),
  F(387,10,'n','질병군요양급여비용총액','질병군 급여 일반원칙에 따라 산정된 포괄수가와 별도 산정 금액을 합한 총 금액에서 제외금액이 있는 경우 해당 금액을 제외하고 10원 미만 절사한 금액을 기재 (질병군에서의 100분의100미만 총액, 100분의100본인부담 및 비급여 금액은 제외)',null,'money'),
]};
const DRG_A_FORM_HIDDEN = ['청구번호','내역구분','공란','가입자성명'];

/* D020.2 진단내역 — 필수(최대 30). 문서 각주: (*) 최소 한건이상 발생하여야 함
   (예) 주진단 1개, 기타진단 3개인 경우
     202103D00100001B1AAAAAA--------------------
     202103D00100001B2BBBBBB--------------------
     202103D00100001B2CCCCCC--------------------
     202103D00100001B2DDDDDD--------------------
   문서에 「삭제」로 남은 옛 항목: 삭제 an(8) (구 요양개시일 항목) *위치이동 / 삭제 an(6) (구 기타진단분류기호 항목) */
const LAYOUT_DRG_B = { key:'B', name:'진단내역',
  gridOrder:['진단분류구분','질병분류기호','입원시상병유무','진료과목','내과세부','요양개시일','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호','진료년월(CCYYMM)+DRG구분(D)+일련번호3자리(예:200110D001)'),
  F(11,5,'an','명세서일련번호','00001 - 99999'),
  F(16,1,'an','내역구분','SAM파일 구분자(‘B’: 진단내역)',{'B':'진단내역'}),
  F(17,1,'an','진단분류구분','* 1: 주진단(최대 1개: 필수)\n2: 기타진단(최대 29개: 조건)',{'1':'주진단','2':'기타진단'}),
  F(18,6,'an','질병분류기호','통계청 고시에 따라 한국표준질병.사인분류의 분류기호기재'),
  F(24,1,'an','입원시상병유무','입원 당시의 상병 존재 여부 기재',{'Y':'해당 상명이 입원 당시에 존재함','N':'해당 상병이 입원 당시에 존재하지 않음','U':'해당 상병이 입원 당시에 존재하였는지를 결정할 수 있는 기록이 충분하지 못함','W':'해당 상병이 입원 당시에 존재하였는지를 의료제공자가 임상적으로 결정할 수 없음'}),
  F(25,2,'an','진료과목','진료과목이 2개이상인 경우 진단별로 모두 기재',진료과목코드_DRG),
  F(27,2,'an','내과세부','문서 항목명: 내과 세부전문과목\n* 세부전문과목을 운영하고 있는 종합병원, 상급종합병원의 경우 진료를 받은 세부전문과목을 기재하되, 세부전문과목이 2개 이상인 경우 진단별로 모두 기재',{'00':'내과통합','01':'소화기내과','02':'순환기내과','03':'호흡기내과','04':'내분비.대사내과','05':'신장내과','06':'혈액종양내과','07':'감염내과','08':'알레르기내과','09':'류마티스내과'}),
  F(29,8,'an','요양개시일','질병군 진료를 위해 요양기관에 입원한 연월일 기재\n(단, 분리청구의 경우 질병군 진료 시작 연월일 기재)\n*Format: CCYYMMDD'),
  F(37,1,'an','면허종류','주진단명에 대하여 진료한 진료과목의 주된 의사의 해당 면허종류 구분자를 기재',{'1':'의사'}),
  F(38,10,'an','면허번호','주진단명에 대하여 진료한 진료과목의 주된 의사의 면허번호를 기재'),
]};

// 항·목번호 — 진료내역(D020.3)과 열외군 진료내역(D020.6)의 문서 표기가 서로 다르다(C에는 T항이 없고,
// F에는 L항이 없다. 입원료·처치및수술료·특수장비 목번호 문구도 다르다). 각 문서 그대로 따로 만든다.
const DRG_항코드_C = codesTable([['01','진찰료'],['02','입원료'],['03','투약료'],['04','주사료'],['05','마취료'],['06','이학요법료'],['07','정신요법료'],['08','처치 및 수술료'],['09','검사료'],['10','영상진단 및 방사선치료료'],['L','질병군분류내역 및 포괄내역'],['S','특수장비'],['A','100/50 본인부담'],['B','100/80 본인부담'],['D','100/30 본인부담'],['E','100/90 본인부담'],['U','건강보험 100/100 본인부담'],['V','보훈 등 100/100 본인부담'],['W','비급여']]);
const DRG_항코드_F = codesTable([['01','진찰료'],['02','입원료'],['03','투약료'],['04','주사료'],['05','마취료'],['06','이학요법료'],['07','정신요법료'],['08','처치 및 수술료'],['09','검사료'],['10','영상진단 및 방사선치료료'],['S','특수장비'],['T','특수재료 및 관련 행위료'],['A','100분의50 본인부담'],['B','100분의80 본인부담'],['D','100분의30 본인부담'],['E','100분의90 본인부담'],['U','건강보험 100/100본인부담'],['V','보훈등 100/100본인부담'],['W','비급여']]);
const DRG_목_본인부담 = codesTable([['01','의약품'],['02','치료재료'],['03','진료행위']]);
const DRG_목번호맵_C = {
  '01':codesTable([['01','초진'],['02','재진'],['03','응급 및 회송료 등']]),
  '02':codesTable([['01','일반'],['02','내과질환자, 정신질환자, 만8세미만의 소아'],['03','중환자실'],['04','격리병실'],['10','기본식대'],['11','가산식대'],['99','기타 입원료']]),
  '03':codesTable([['01','내복약'],['02','외용약'],['03','처방전']]),
  '04':codesTable([['01','주사'],['99','기타']]),
  '05':codesTable([['01','마취']]),
  '06':codesTable([['01','이학요법료']]),
  '07':codesTable([['01','정신요법료']]),
  '08':codesTable([['01','처치및 수술, (치과)보통 처치외 처치항목'],['02','(치과)절개 외 수술항목'],['03','캐스트'],['99','치과기타']]),
  '09':codesTable([['01','자체검사'],['02','위탁검사']]),
  '10':codesTable([['01','진단'],['02','치료']]),
  'L':codesTable([['51','주사 및 혈액제제'],['52','마취 및 호흡치료'],['53','수술처치'],['54','검사'],['55','방사선'],['56','부가코드'],['81','진찰료'],['82','입원료'],['83','투약료'],['84','주사료'],['85','마취료'],['86','이학요법료'],['87','정신요법료'],['88','처치 및 수술료'],['89','검사료'],['90','영상진단 및 방사선치료료'],['91','특수장비'],['92','100분의100 본인부담'],['93','비급여'],['94','기타']]),
  'S':codesTable([['01','CT진단'],['02','MRI진단'],['03','PET진단']]),
  'A':DRG_목_본인부담,'B':DRG_목_본인부담,'D':DRG_목_본인부담,'E':DRG_목_본인부담,'U':DRG_목_본인부담,'V':DRG_목_본인부담,'W':DRG_목_본인부담,
};
const DRG_목번호맵_F = {
  '01':codesTable([['01','초진'],['02','재진'],['03','응급 및 회송료 등']]),
  '02':codesTable([['01','일반'],['02','내과,정신질환자,만8세미만소아'],['03','중환자실'],['04','격리병실'],['10','기본식대'],['11','가산식대'],['12','(사용유보)'],['13','(사용유보)'],['99','기타입원료']]),
  '03':codesTable([['01','내복약'],['02','외용약'],['03','처방전']]),
  '04':codesTable([['01','주사'],['99','기타']]),
  '05':codesTable([['01','마취']]),
  '06':codesTable([['01','이학요법료']]),
  '07':codesTable([['01','정신요법료']]),
  '08':codesTable([['01','처치및 수술, (치과)보통외 처치'],['02','(치과)절개외 수술항목'],['03','캐스트'],['99','치과기타']]),
  '09':codesTable([['01','자체검사'],['02','위탁검사']]),
  '10':codesTable([['01','진단'],['02','치료']]),
  'S':codesTable([['01','CT진단'],['02','MRI진단'],['03','PET진단'],['04','(사용유보)'],['05','(사용유보)']]),
  'T':codesTable([['01','치료재료'],['02','진료행위']]),
  'A':DRG_목_본인부담,'B':DRG_목_본인부담,'D':DRG_목_본인부담,'E':DRG_목_본인부담,'U':DRG_목_본인부담,'V':DRG_목_본인부담,'W':DRG_목_본인부담,
};

/* D020.3 진료내역 — 옵션(최대 99, 줄번호 9999).
   문서 각주: (*) 항별 해당 사항의 발생이 없을 경우는 0KB 크기의 ‘D020.3’ 파일만 생성함 */
const LAYOUT_DRG_C = { key:'C', name:'진료내역',
  gridOrder:['항','목','줄번호','구분','코드','단가','1회투','일투','총투','금액','보상률','변경일','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호','진료년월(CCYYMM)+DRG구분(D)+일련번호3자리(예:200110D001)'),
  F(11,5,'an','명세서일련번호','00001 - 99999'),
  F(16,1,'an','내역구분','SAM파일 구분자(‘C’: 진료내역)',{'C':'진료내역'}),
  F(17,2,'an','항','문서 항목명: 항번호\n※ V, W항: 보훈위탁진료 요양기관의 보훈국비환자 진료분에 한하여 기재\n㈜ L,S,A,B,D,E,U,V,W 항 기재시 반드시 왼쪽 정렬하여 대문자로 기재\n예) ‘V_’(바른표기)와 ‘_ V’는 서로 다른 항으로 처리함',DRG_항코드_C,null,10),
  F(19,2,'an','목','문서 항목명: 목번호\n항별 목번호는 「항 · 목 코드」 화면 참조',null,null,10),
  F(21,4,'n','줄번호','명일련번호별 항,목순으로 일련번호 기재 : 1-9999',null,null,10),
  F(25,1,'an','구분','문서 항목명: 코드구분',{'1':'수가','2':'준용수가','3':'보험등재약','4':'원료약,요양기관 자체 조제(제제)약','8':'치료재료'},null,7),
  F(26,9,'an','코드','수가, 약가, 재료대 등 코드를 앞에서부터 5-9자리 기재 후 공란은 Space처리',null,null,20),
  F(35,12,'n','단가','*상대가치점수*점수당 단가(10원미만 4사5입)\n*약가,치료재료,원료약의경우 “약제및치료재료의 구입금액에 대한산정기준”에 의한 단가 기재\n*정수부 10자리, 소수부 2자리(총12자리), 소수점 미표기\n예) 720원 -> “_ _ _ _ _ _ _72000”',null,2),
  F(47,7,'n','일투','문서 항목명: 1일투여량, 투여(실시)횟수\n*1일 실시횟수(소수 셋째자리에서 4사5입)를 기재 (의약품인 경우는 1일 투여횟수를 기재)\n* 정수부 5자리, 소수부 2자리(총7자리), 소수점 미표기\n예)1 -> “_ _ _ _100”  1.6 -> “_ _ _ _160”',null,2),
  F(54,3,'n','총투','문서 항목명: 총투여일수, 실시횟수\n총 투여일수 또는 실시횟수 기재\n예)2 -> “_ _2”',null,'money'),
  F(57,9,'n','1회투','문서 항목명: 1회투약량\n*1회 투약량(소수 다섯째자리에서 4사5입)을 기재(의약품인 경우만 해당)\n*정수부 5자리, 소수부 4자리(총9자리),소수점 미표기\n예)12.56→”_ _ _ 125600”',null,4),
  F(66,10,'n','금액','단가 × 1회 투약량 × 1일 투여량(투여(실시)횟수) × 총 투여일수(실시횟수) x보상률을 계산한 후 원 미만은 4사5입하여 기재',null,'money'),
  F(76,10,'n','공란','(상한가)'),
  F(86,10,'n','공란','(약제상한차액)'),
  F(96,6,'n','보상률','별도 산정 항목의 해당 보상률 기재',null,2),
  F(102,8,'an','변경일','format:CCYYMMDD\n해당 진료내역의 투여(실시)일자를 기재',null,null,16),
  F(110,1,'an','면허종류','실제 환자를 진료한 의사의 해당 면허종류 구분자를 기재',{'1':'의사','2':'치과의사','6':'간호사','7':'사회복지사'}),
  F(111,100,'an','면허번호','실제 환자를 진료한 의사의 면허번호를 기재\n* 2개 이상의 면허번호 기재시 ‘/’ 로 구분\n예) “12345/67890/54321……”',null,null,14),
]};

/* D020.4 처방내역 — 옵션(처방전 최대 100, 줄번호 9999). 문서의 열 이름이 「디스켓청구 코드 및 유형」이다.
   위치·길이는 의과(LAYOUT_D)와 같지만 설명이 DRG 문서 기준이라 따로 둔다. */
const LAYOUT_DRG_D = { key:'D', name:'처방내역',
  gridOrder:['처방전발급번호','처방일수','줄번호','구분','코드','1회투','1일투여횟수','총투약일수','본인부담률구분'],
  fields:[
  F(1,10,'an','청구번호','진료년월(CCYYMM)+DRG구분(D)+일련번호3자리(예:200110D001)'),
  F(11,5,'an','명세서일련번호','00001 - 99999'),
  F(16,1,'an','내역구분','SAM 파일 구분자(‘D’: 처방내역)',{'D':'처방내역'}),
  F(17,13,'an','처방전발급번호','요양기관에서 처방전 발급시 부여하는번호\nCCYYMMDD+ 일련번호5자리'),
  F(30,3,'n','처방일수','해당 처방전에 의해 조제투약 하도록 처방한 일수',null,'money'),
  F(33,2,'n','반복조제횟수','처방전 반복조제 가능횟수(사용유보)'),
  F(35,4,'n','줄번호','처방전 교부번호별 일련번호:1-9999'),
  F(39,1,'an','구분','문서 항목명: 코드구분',{'3':'보험등재약','4':'원료,조(제)제약','5':'보험등재약의 일반명'}),
  F(40,9,'an','코드',''),
  F(49,9,'n','1회투','문서 항목명: 1회투약량\n*1회투약량(소수 다섯째자리에서 사사오입)\n*정수부 5자리, 소수부 4자리(총9자리),소수점 미표기\n예)12.56→”_ _ _ 125600”',null,4),
  F(58,2,'n','1일투여횟수','',null,'money'),
  F(60,3,'n','총투약일수','',null,'money'),
  F(63,1,'an','본인부담률구분','문서 항목명: 본인부담률 구분코드',{'A':'100분의50 본인부담','B':'100분의80 본인부담','D':'100분의30 본인부담','E':'100분의90 본인부담','U':'건강보험(의료급여) 100분의100 본인부담','V':'보훈 등 100분의100 본인부담','W':'비급여'}),
]};

/* D020.5 특정내역 기재란 — 옵션(최대 300, 줄번호 9999, 특정내역구분 999). 문서 각주:
   (*) 명세서 단위 별로 특정내역이 발생시 해당 단위 별로 작성하고, 동일 명세서에 여러 특정내역이 발생시에도
       각각으로 생성 하여 레코드 반복 기재함
   (*) 동일 특정내역구분에 특정내역이 700 바이트 이상 발생할 경우 기재 방법
       - 청구번호에서 특정내역구분까지 동일하게 기재후 추가된 특정내역 기재하여 레코드 반복기재함
   (예시)
     202103D00100001E1                     MT008 주민번호(첫 6자리) / 진료(조제)일수
     202103D00100001E1                     MS00520050101/09301230
     202103D00100001E1                     MX999 명세서 특정내역
     202103D00100001E2                  1  JS999 준용명
     202103D00100001E2                  1  JX999 진료내역 특정내역
     202103D00100001E2                  3  JT001a/b/c/
     202103D00100001E32021030200001     1  JX999 기타내역
     202103D00100001E32021030200001     2  JX999 기타내역
     202103D00100001E42021030200001        CT001 중복처방사유코드 */
const LAYOUT_DRG_E = { key:'E', name:'특정내역', fields:[
  F(1,10,'an','청구번호','진료년월(CCYYMM)+DRG구분(D)+일련번호3자리(예:200110D001)'),
  F(11,5,'an','명세서일련번호','00001 - 99999'),
  F(16,1,'an','내역구분','SAM 파일 구분자(‘E’: 특정내역기재란)',{'E':'특정내역기재란'}),
  F(17,1,'an','발생단위','문서 항목명: 발생단위구분',{'1':'명세서단위','2':'줄번호단위','3':'처방내역 줄번호단위','4':'처방내역단위'}),
  F(18,13,'an','처방전발급번호','요양기관에서 처방전 발급시 부여하는번호\nCCYYMMDD+ 일련번호5자리',null,null,14),
  F(31,4,'n','줄번호','발생단위구분 1,4 -> space\n발생단위구분 2,3 ->1-9999'),
  F(35,5,'an','특정내역구분','(=심평원 고시 참조)\n별표8.특정내역구분코드'),
  F(40,700,'an','특정내역','심평원고시 특정내역 기재형식에 따라 기재\n*기재 내역 실제 길이만큼만 생성 하여도 허용\n예)원내투약일수 9(3) 인경우 “3” 1byte만 기재하여도 됨'),
]};

/* D020.6 요양급여비용 열외군 행위별 진료내역 — 옵션(최대 99, 줄번호 9999) */
const LAYOUT_DRG_F = { key:'F', name:'열외군명세서진료내역',
  gridOrder:['항','목','줄번호','구분','코드','단가','1회투','일투','총투','금액','변경일','면허종류','면허번호'],
  fields:[
  F(1,10,'an','청구번호','진료년월(CCYYMM)+DRG구분(D)+일련번호3자리(예:200110D001)'),
  F(11,5,'an','명세서일련번호','00001 - 99999'),
  F(16,1,'an','내역구분','SAM 파일 구분자 (‘F’: 요양급여비용 열외군 행위별 진료내역)',{'F':'요양급여비용 열외군 행위별 진료내역'}),
  F(17,2,'an','항','문서 항목명: 항번호\n㈜ S,T,A,B,D,E,U,V,W 항 기재시 반드시 왼쪽 정렬하여 대문자로 기재\n예) ‘V_’(바른표기)와 ‘_ V’는 서로 다름',DRG_항코드_F,null,10),
  F(19,2,'an','목','문서 항목명: 목번호\n항별 목번호는 「항 · 목 코드」 화면 참조',null,null,10),
  F(21,4,'n','줄번호','명일련번호별 항,목순으로 일련번호 기재 : 1-9999',null,null,10),
  F(25,1,'an','구분','문서 항목명: 코드구분',{'1':'수가(상대가치점수표에수록된코드)','2':'준용수가','3':'보험등재약','4':'원료약,요양기관 자체 조제(제제)약','8':'치료재료'},null,7),
  F(26,9,'an','코드','진료수가, 보험등재약, 원료약, 조제.제제약, 치료재료 코드를 앞에서부터 5-9자리 수록 후 공란은 Space처리',null,null,20),
  F(35,12,'n','단가','상대가치점수표상의 점수에 점수당 단가를 곱하여 10원 미만은 4사5입한 금액을 기재\n단, 약가, 치료재료, 원료약 등의 경우는 “약제 및 치료재료의비용에 대한 결정기준”에 의한 단가를 원 미만은 4사5입하여 기재하되, 단가가 1원 미만인 경우 1원으로 기재',null,2),
  F(47,7,'n','일투','문서 항목명: 1일투여량,투여(실시)횟수\n* 1일 실시횟수(소수 셋째자리에서 사사오입하여 소수 둘째자리까지 기재)를 기재(의약품인 경우는 1일 투여횟수를 기재)\n* 위탁검사의 경우 위탁검사관리료를 반영하여 1.1을 기재.\n* 위탁진료, 개방병원진료 및 시설 등의 공동이용 진료시에는 실시(수탁)한 기관의 종별 가산율을 적용\n* 정수부 5자리, 소수부 2자리(총7자리), 소수점 미표기\n예)1 -> “_ _ _ _100”  1.6 -> “_ _ _ _160”',null,2),
  F(54,3,'n','총투','문서 항목명: 총투여일수,실시횟수\n예)2 -> “_ _2”',null,'money'),
  F(57,9,'n','1회투','문서 항목명: 1회투약량\n*1회 투약량(소수 다섯째자리에서 사사오입하여 소수 넷째자리까지 기재)을 기재(의약품인 경우만 해당)\n*정수부 5자리, 소수부 4자리(총9자리),소수점 미표기\n예)12.56→”_ _ _ 125600”',null,4),
  F(66,10,'n','금액','단가×1회 투약량×1일 투여량(투여(실시)횟수)×총 투여일수(실시횟수)를 계산한 후 원미만은 4사5입하여 기재',null,'money'),
  F(76,8,'an','변경일','format:CCYYMMDD\n다음의 (당월 요양개시일 이후에 신설되거나 단가가변경된) 경우, 변경(또는 신설)된 단가의 최초 투여(실시) 일자를 기재\n* 당월 요양개시일 이후 단가 변경된 경우\n* 당월요양개시일 이후 코드가 신설된 경우',null,null,16),
  F(84,1,'an','면허종류','실제 환자를 진료한 의사의 해당 면허종류 구분자를 기재',{'1':'의사'}),
  F(85,100,'an','면허번호','실제 환자를 진료한 의사의 면허번호를 기재\n* 2개 이상의 면허번호 기재시 ‘/’ 로 구분\n예) “12345/67890/54321……”',null,null,14),
]};


const LAYOUTS_DRG = { H:LAYOUT_H, A:LAYOUT_DRG_A, B:LAYOUT_DRG_B, C:LAYOUT_DRG_C, D:LAYOUT_DRG_D, E:LAYOUT_DRG_E, F:LAYOUT_DRG_F };

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
LAYOUT_DRG_F.mokMap = DRG_목번호맵_F;
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
