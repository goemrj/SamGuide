/* ---------- 완화(호스피스, WANHWA) — 청구서(H010)·명세서(H020/H021 등) 구조가 GEN(의과)과
   완전히 동일. 두 서식(호스피스 정액입원/가정형 호스피스 외래) 모두 청구서의 "진료형태" 값 하나로만
   구분되므로(B=호스피스 정액입원, C=가정형 호스피스 외래) 레이아웃은 GEN 것을 그대로 재사용하고
   formTypeChars로만 구분한다 — 새 필드·새 레이아웃 없음.
   (2026-08-13, 호스피스 정액입원(B11.ghp)/가정형 호스피스 외래(B02.GHP) 실샘플 2종 대조: H=2096,
   A=348, B=78, C=236byte로 GEN과 레코드 길이 완전 일치, A의 서식번호도 GEN이 이미 쓰는 H020/H021
   그대로, 정액정율구분·진료결과 등 필드 위치도 전부 동일 확인.) ---------- */
registerClaimType('WANHWA', {
  layouts: LAYOUTS,
  dateAnchor: { bField:'진료개시일', bFlagField:'상병구분', bFlagVal:'1' },
  hSumPairs: H_SUM_FIELD_PAIRS,
  blankRowLen: BLANK_ROW_LEN,
  formTypeChars: ['B','C'], // H010의 진료형태='B'(호스피스 정액입원)/'C'(가정형 호스피스 외래)로 GEN 단일파일과 구분
});
