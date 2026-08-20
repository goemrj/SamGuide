/* ---------- layout-shim.js — SamEditor의 js/layout-*.js를 "데이터로만" 읽기 위한 최소 구현.
   SamEditor의 common.js(편집기 본체, 12만자)는 파일 입출력·화면 편집 로직이라 참고 사이트에는 필요 없다.
   레이아웃 파일들이 로드 시점에 호출하는 함수만 여기서 같은 이름·같은 반환값으로 흉내내고,
   편집기에서만 쓰이는 등록 함수(레코드문자·파일 그룹퍼)는 받아만 두고 아무것도 하지 않는다.
   ★ 레이아웃 파일 자체는 절대 수정하지 않는다. SamEditor에서 갱신되면 그대로 복사해 오면 된다. ---------- */

function F(pos, len, mode, name, desc, codes, fmt, w){ return {pos, len, mode, name, desc: desc||'', codes: codes||null, fmt, w}; }

// 코드표는 '10','11' 같은 정수형 키가 객체에서 자동으로 맨 앞·오름차순으로 밀려나므로,
// 스펙에 적힌 순서를 __order(열거 제외)에 따로 보관한다. (SamEditor common.js와 동일 규약)
function codesTable(pairs){
  const o = {};
  for (const [k,v] of pairs) o[k] = v;
  Object.defineProperty(o, '__order', { value: pairs.map(p=>p[0]), enumerable:false });
  return o;
}
function withOverrides(codesObj, overrides){
  const order = codesObj.__order || Object.keys(codesObj);
  return codesTable(order.map(k => [k, Object.prototype.hasOwnProperty.call(overrides,k) ? overrides[k] : codesObj[k]]));
}
function codesOrder(codesObj){ return (codesObj && codesObj.__order) || Object.keys(codesObj||{}); }

const CLAIM_TYPES = {};
function registerClaimType(key, descriptor){ CLAIM_TYPES[key] = descriptor; }

// 아래는 편집기 전용(파일을 읽어 레코드를 자르고 청구분야를 자동판별하는 용도) — 참고 사이트에서는 쓰지 않는다.
// 다만 레이아웃 파일이 로드 도중 호출하므로, 없으면 그 줄에서 스크립트가 끊겨 registerClaimType까지 가지 못한다.
function registerRecordLetters(){}
function registerFileGrouper(){}
function registerHOnlyAutocomplete(){}

// 수진자 성명 필드 이름 모음 — 레이아웃 파일들이 로드 중에 .add()로 자기 이름을 보탠다(common.js와 동일)
const PATIENT_NAME_FIELDS = new Set(['수진자성함','수진자성명','산재근로자성명']);
const JUMIN_FIELDS = new Set(['수진자주민등록번호','산재근로자주민등록번호']);
