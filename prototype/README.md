# 공구온 OPS — SNS 공동구매 운영 자동화 프로토타입

스마트스토어·스룩페이 주문 수집부터 멀티몰 상품 등록, 송장 일괄 매칭, 일 정산, 기업은행 대량이체 파일, 셀러·브랜드 셀프 포털까지 하나의 흐름으로 체험하는 제안용 웹 프로토타입입니다. 공고에서 가장 중요하다고 한 **「시스템 정산이 기존 엑셀 정산과 같은지 오픈 전에 검증」**을 별도 화면(엑셀 대조)으로 구현했습니다. 제안서 `../제안서.md`의 §3-3 ~ §3-5, §7과 대응합니다.

## 실행 · 배포

빌드 없이 정적 파일만으로 동작합니다. `index.html`을 열거나 이 폴더를 정적 HTTP 서버로 제공합니다. GitHub Pages에는 이 폴더 내용을 그대로 올리면 되며, Jekyll 처리를 끄는 `.nojekyll`을 함께 두었습니다. 화면 이동은 주소의 `#/...` 해시를 사용하므로 별도 라우팅 설정이 필요 없습니다.

| 화면 | 로그인 경로 | 샘플 계정 |
| --- | --- | --- |
| 첫 화면 | `#/` | 로그인 불필요 |
| 운영자 콘솔 | `#/login/ops` | `ops.manager` 김운영(작성·검토), `ops.finance` 이정산(확정·이체 파일) |
| 셀러 포털 | `#/login/seller` | `daily.min`, `homecafe_jiyu`, `fit.hana`, `mom.picks`, `gourmet.tae` |
| 브랜드 포털 | `#/login/brand` | `greenday`, `moaliving`, `forestlab`, `bareunmeal` |

로그인 화면 아래 샘플 계정을 선택하면 아이디·비밀번호가 입력됩니다. 공통 비밀번호는 **`demo1234!`**이며, 선택 후 로그인 버튼을 눌러야 진입합니다. 비로그인 상태에서 `#/ops`, `#/seller`, `#/brand` 및 하위 주소를 열면 해당 역할의 로그인 화면으로 안내합니다.

체험 기준일은 **2027-02-04(목) 09:40, 엑셀 병행 운영 4일차**로 고정했습니다. 로그인 화면 맨 아래 **샘플 데이터 관리 → 샘플 데이터 초기화**에서 업무 데이터를 초기화합니다. 업무 화면에는 계정명과 로그아웃 버튼을 표시하며, 계정을 바꾸려면 다시 로그인합니다.

## 강조 기능과 화면

| 공고 강조 사항 | 화면 | 체험 내용 |
| --- | --- | --- |
| ★ 엑셀 정산 일치 검증 | 운영자 › 엑셀 대조 | 02-03 기존 엑셀 결과 올리기(샘플 또는 CSV) → 셀러·브랜드별 자동 대조 → 차이 원인 분류(반올림·누락 주문·수식 오류·취소 시점, 자동 추정·근거 보기) → 「설명되지 않는 차이 0원」 → 대조 통과. 병행 8영업일 진행표, 과거 1개월 재계산 결과 |
| 일 단위 정산 · 대량이체 | 일 정산 / 지급·이체 | 작성 → 검토 → 확정 → 지급, **병행 대조 통과 전 확정 차단**, 검토자≠확정자, 확정 후 조정 항목 방식, 원천징수 3.3%, 정산서(인쇄·PDF·엑셀), 세금계산서 발행 대상 집계. 이체 파일 생성(계좌 변경 보류 제외) → 은행 업로드 → 결과 반영 → 예금주 불일치 재처리 → 보류 해제분 |
| 주문 수집 자동화 | 주문 장부 | 스마트스토어 API 수집 재현(중복 제외), 스룩페이 주문 엑셀 업로드 3단계(열 매핑 → 검증 리포트: 신규·중복·취소·오류), 채널 원본↔장부 일일 대사. 실패 재시도 시나리오는 회귀 검사에서 확인 |
| 스룩페이 API 미확보 대응 | 주문 장부 / 상품·공구 | 주문 엑셀 업로드, 상품 업로드 엑셀 생성 → 등록 결과 연결, 송장 업로드 엑셀 생성 |
| 멀티몰 상품 등록 | 상품·공구 | 통합 상품, 몰별 변환 규칙, 스마트스토어 API 등록(고시정보 누락 오류 → 보완 → 재등록), 가격·재고 일괄 수정, 공구 조건 등록 |
| 송장 일괄 매칭 | 배송·송장 | 송장 파일 검증(없는 주문·중복·이미 발송·택배사 오기) → 수정·제외 → 반영 → 채널 전송, 송장 입력 요청 알림톡 |
| 예외만 처리 | 확인 필요 | 수집 실패·엑셀 미업로드·공구 미연결 주문·발송 지연·계좌 변경 보류·이체 실패·대조 차이·가입 심사를 한 목록으로 |
| 포털 권한 경계·개인정보 | 셀러·브랜드 포털 | 자기 데이터만 조회, 다른 셀러·브랜드 정산서 주소 직접 접근 차단(이력 기록), 셀러 화면 구매자 정보 가림, 브랜드는 발송 대기 주문만 배송 정보 열람, 미확정 정산 비공개, 계좌 변경 시 지급 보류 |

## 초기 검증 기록 (2026-11-23)

- JavaScript 구문 검사(`node --check`)와 Node 회귀 검사 **19건 통과** — 정산 규칙(당일/사후 취소, 원천징수 단수, 1회 반올림, 합계), 수동 조정, 전체 화면 렌더링(`undefined`·`NaN` 미노출), 스룩페이 업로드, 공구 연결, 송장 매칭·전송, 병행 대조 통과 전 확정 차단, 권한 분리, 이체 보류·실패 재처리·보류 해제, 포털 접근 차단·개인정보 가림·계좌 변경 보류, 브랜드 송장 검증, CSV 수식 방어, 출력 이스케이프.
- 내장 브라우저에서 데스크톱 1440px로 첫 화면·대시보드·엑셀 대조(샘플 대조 실행)·일 정산·셀러 포털·스룩페이 업로드 3단계를 확인했습니다.
- 모바일 375px에서 23개 경로의 가로 넘침을 측정해 브랜드 송장 입력 화면의 넘침을 수정했고, 수정 후 전 경로 375px 이내를 확인했습니다. 콘솔 오류 없음.

```sh
node tests/regression.cjs
```

## 체험 범위

모든 셀러·브랜드·구매자·주문·금액은 가상 데이터이며, 업무 데이터는 현재 브라우저의 localStorage에 저장됩니다. 로그인 계정 식별자는 해당 탭의 sessionStorage에 저장하고 비밀번호와 로그인 상태는 업무 저장소에 저장하지 않습니다. 네이버 커머스API·스룩페이·기업은행·카카오 알림톡·국세청과 연결하지 않으며, 수집·발송·이체 결과는 체험용으로 재현한 것입니다. 이체 파일·상품 업로드·송장 업로드 파일의 열 구성은 **예시 레이아웃**이며 실제 양식은 착수 후 각 기관·채널 문서로 확정합니다. 정산 규칙(결제일 기준 일 마감, 원천징수 단수 처리 등)은 G1에서 확정할 내용을 보여 주는 예시입니다. 로그인·권한은 브라우저의 화면·업무 흐름을 검증하는 프로토타입용입니다. 데이터와 샘플 자격정보가 정적 소스에 있으므로 실제 비공개 데이터의 보호 수단은 아니며, 운영 서비스에는 서버 인증·세션 관리·요청별 권한 검증이 필요합니다.

엑셀 내려받기는 SheetJS(cdnjs, 0.18.5)를 사용하고, 불러오지 못하면 CSV로 내려받습니다. 엑셀 대조 화면의 파일 올리기는 「대조 양식」 CSV(대상코드, 대상명, 지급액)를 읽습니다. 스룩페이 주문·송장 업로드는 샘플 데이터를 이용한 시연이며 선택한 임의 파일의 실제 내용을 파싱하지 않습니다.

## 화면 개선 및 검증 (2026-11-23)

- 첫 화면을 운영자·셀러·브랜드 업무 공간과 주요 업무 바로가기 중심으로 구성했습니다. 공고 설명·제안 시나리오는 서비스 화면에서 제거하고, 가상 데이터·외부 미연결 안내는 유지했습니다.
- 공통 업무 공간 메뉴, 블루 계열 색상, 읽기 쉬운 글자와 키보드 포커스를 적용했습니다.
- 화면·계정 전환 시 확인창과 예약 작업을 정리하고, 늦게 완료된 대조 파일 읽기를 폐기합니다.
- 정산 확정·이체 파일 생성·결과 반영·실패 재처리 시 권한과 현재 상태를 다시 확인합니다. 같은 정산과 실패 건의 중복 파일 생성을 차단합니다.
- 확정·지급 정산은 계산 결과와 주문 상세를 보존합니다. 지급 준비에는 최신 계좌의 확인·보류 상태를 적용합니다. 주문의 수수료율은 수집 시 보존합니다.
- 운영자 주문 목록과 셀러 주문 목록의 엑셀은 현재 필터의 전체 결과를 내려받습니다. 화면의 페이지 표시 개수와는 구분합니다.
- 이체 실패·재처리 대기는 포털에서 지급 완료로 표시하지 않습니다. 다음 수집 시각은 마지막 수집 시각과 선택한 주기로 계산합니다.
- 최신 Node 회귀 검사 **29건 통과**. JavaScript 5개 구문 검사와 HTML 로컬 참조·중복 속성 검사를 통과했습니다.
- Chrome에서 첫 화면·운영자 메뉴 11개·포털 메뉴 8개·하위 화면 3개(총 23경로)를 확인했습니다. 360·390px 전 경로를 검사해 대시보드 알림 목록과 이체 카드의 가로 넘침을 보완했고, 발견 경로를 다시 검사했습니다. 태블릿 768px 주요 5화면도 가로 넘침 없이 표시되었습니다.
- 브라우저에서 수집 취소·수집 완료, 뒤로 이동 시 공구 등록창 정리, 담당자 전환 시 확인창 닫힘을 확인했습니다. 검수 사이트 URL 기준 브라우저 콘솔 오류는 없었습니다.

## 생성 이미지

내장 imagegen으로 새 이미지를 생성하고 WebP로 최적화했습니다. 실제 납품 상품이나 판매자의 촬영 사진을 뜻하지 않는 데모용 대표 이미지입니다.

| 파일 | 적용 위치 |
| --- | --- |
| `assets/images/commerce-studio.webp` | 첫 화면, 셀러 홈 |
| `assets/images/kitchen-collection.webp` | 그린데이 키친 브랜드 홈 |

생성 프롬프트:

### 커머스 스튜디오

Use case: photorealistic-natural. Asset type: wide editorial photograph for a Korean social-commerce operations platform. Primary request: a genuinely photographic, elegant small commerce studio scene with neatly packed unbranded kraft shipping boxes, a charcoal cast iron frying pan, minimalist skincare bottles, ceramic bowl with granola on a clean cool white worktable, shelves softly out of focus. No people, no hands. Natural side window light, subtle imperfections, tactile cardboard and real product materials, muted steel blue and warm wood accents, contemporary Korean lifestyle product styling, natural professional commercial photography, no illustration, no 3D render, no artificial glow, no floating objects, no text, no letters, no logos, no watermarks. Landscape composition, main objects in center/right, negative space on left for cropping, wide 3:2.

### 주방용품 컬렉션

Use case: product-mockup. Asset type: authentic commercial product photography for a Korean kitchenware brand portal. Primary request: black cast iron frying pan with long handle, five charcoal and sand silicone kitchen utensils arranged neatly on a cool white stone kitchen counter, small linen cloth and subtle plant in distant background. Real tactile iron grain, matte silicone surfaces, soft daylight and believable shadows, premium restrained product catalog photograph, photographed with DSLR 50mm lens, no people, no text, no logos, no illustration, no rendering, no glossy AI aesthetic. Landscape 3:2, objects centered and fully visible with breathing room.


## 추가 검토와 상품 사진 (2026-11-23)

- 침구·발매트·앰플·선크림·닭가슴살·그래놀라 대표 사진 6종을 내장 imagegen으로 생성해 WebP로 저장했습니다. 기존 주방 사진과 함께 통합 상품 8개와 셀러 공구 카드의 글자 썸네일을 사진으로 교체했습니다.
- 입력 오류 3건을 수정했습니다. 미등록 대상·잘못된 머리글·중복/누락 대상·빈 금액·소수 금액이 있는 대조 CSV는 기존 자료를 바꾸지 않고 거부합니다. 파일 크기·형식을 확인하고, 나중에 선택한 파일보다 늦게 끝난 이전 파일 읽기도 폐기합니다.
- 대조 양식은 업로드 형식과 같은 CSV로 내려받습니다. 첫 행은 `대상코드,대상명,지급액`이며, 양식의 전체 대상에 금액을 입력해야 합니다. 금액이 없으면 0을 입력합니다.
- 계좌번호는 하이픈을 제외한 숫자 8~20자리이며, 하이픈은 숫자 사이에서만 허용합니다. 판매가 0원·음수·소수와 잘못된 재고는 반영하지 않습니다.
- 몰별 규칙·정산 대조·송장 안내에 남아 있던 개발 일정과 제안 문구를 이용 안내로 정리했습니다. 상품 사진 프레임과 버튼 그림자·메뉴 가독성도 조정했습니다.
- 최신 회귀 검사 **35건 통과**. Chrome에서 운영자 메뉴 11개와 포털 메뉴 8개를 재검사했고, 23개 경로를 360·390px에서 각각 확인해 가로 넘침·누락 이미지·undefined/NaN 표시가 없었습니다. 잘못된 판매가와 계좌번호의 저장 차단·안내 문구도 브라우저에서 확인했습니다.
- CSV 입력 검증은 정상·오류 자료를 이용한 자동 시험으로 확인했습니다. 브라우저의 실제 파일 선택 검사는 도구 연결 지연으로 완료하지 못했습니다. 실제 외부 연동과 스룩페이·송장 임의 파일 파싱은 기존 데모 범위와 같습니다.

| 파일 | 대상 상품 |
| --- | --- |
| `assets/images/comforter.webp` | 극세사 차렵이불 |
| `assets/images/bath-mat.webp` | 규조토 발매트 |
| `assets/images/cica-serum.webp` | 시카 진정 앰플 |
| `assets/images/sunscreen.webp` | 선크림 세트 |
| `assets/images/chicken-meal.webp` | 닭가슴살 |
| `assets/images/granola.webp` | 그래놀라 |

생성 프롬프트 원문:

### comforter

Use case: product-mockup. Premium realistic catalog photograph of a neatly folded and lightly draped cream microfiber quilted comforter, queen size, visible small quilt stitching and soft textile texture on a low neutral gray bed in a sunlit Korean apartment bedroom. A simple pale wood bedside table softly out of focus. Natural window light, physically realistic fabric folds and slight imperfections, clean photographic DSLR look, no people, no illustration, no CGI, no text, no logo, no watermark. Single product is the cream comforter; centered square composition with room around product, restrained cool white and gray palette.

### bath-mat

Use case: product-mockup. Realistic professional catalog photograph of one large light gray diatomaceous earth bathroom mat, rectangular with rounded corners and understated engraved curved grooves, lying flat on cool pale gray bathroom tile next to the base of a white bathtub. Slightly textured matte mineral surface, folded white towel nearby but not covering product, soft daylight and convincing shadows, camera angle gently above product, centered square composition. True photography with tactile imperfections, no people, no CGI, no illustration, no text, no logos, no watermarks.

### cica-serum

Use case: product-mockup. True commercial skincare product photograph: two identical clear frosted glass 50ml serum ampoule dropper bottles with pale green transparent liquid and matte white dropper caps, representing a 1+1 cica calming serum set. Blank bottles with no writing, elegant on pale cool white stone, small fresh centella leaves nearby. Real glass reflections, fine condensation, natural soft window light, photographic imperfections, not 3D, not illustration, no watermark, no text, no brand. Centered square catalog composition, bottles fully visible with margin.

### sunscreen

Use case: product-mockup. Authentic commercial photograph of three matte white 50ml sunscreen squeeze tubes with simple pale blue caps, unbranded blank packaging, arranged upright on a cool white stone surface next to a folded light linen towel. Minimal modern Korean skincare catalog, natural daylight, realistic tube seams, subtle shadows and tiny surface texture, centered square framing, all three tubes visible with breathing room. No text, no logos, no watermark, no people, no illustration, no CGI.

### chicken-meal

Use case: product-mockup. Realistic editorial food catalog photo of sliced cooked chicken breast with a few roasted garlic cloves and subtle herbs on a small white ceramic plate, two transparent unbranded vacuum-packed chicken breast portions placed neatly beside it. Clean pale cool gray tabletop, fresh appetizing but ordinary real food, visible meat fibers and natural uneven edges, soft daylight, centered square composition. No text, no nutrition labels, no logos, no watermark, no humans, no CGI or illustration.

### granola

Use case: product-mockup. True professional food photography of golden oat granola with almonds and pumpkin seeds in a simple white ceramic bowl, a standing unbranded plain kraft zip pouch behind and a small wooden spoon next to bowl, a few scattered oat clusters on cool white stone tabletop. Natural window light, real crumb texture and imperfections, minimalist Korean food catalog aesthetic, centered square product composition with margin. No writing, no label, no logo, no watermark, no people, no illustration, no 3D render.


## 최종 보완 및 재검사 (2026-11-23)

- 음수 정산 잔액을 같은 셀러·브랜드의 다음 정산에서 차감합니다. 잔액이 남으면 계속 이월하고, 소진되면 추가 차감하지 않습니다. 개인 셀러의 원천징수는 이월 차감 후 금액에 적용합니다.
- 확정·지급 정산은 저장된 계산 결과를 유지합니다. 다음 정산은 확정 기록의 이월 잔액을 기준으로 계산하며, 과거 원본을 수정해도 확정 금액을 다시 쓰지 않습니다. 정산서와 정산 엑셀에 이전·다음 이월액을 구분해 제공합니다.
- 브랜드 주문의 이름·연락처·상세 주소는 발송 대기 목록에서만 제공합니다. 송장 등록·배송 중·완료·취소 목록은 이름과 상세 주소를 가리고 연락처를 표시하지 않습니다. 개인정보 안내 문구도 같은 기준으로 맞췄습니다.
- 브랜드 홈의 접근 권한 시험 링크는 접힌 ‘데모 접근 권한 확인’ 안으로 옮겼습니다. 프라이팬과 조리도구 사진 2종을 별도로 생성해 각 상품을 쉽게 구분하도록 했습니다.
- 회귀 검사 **41건 통과**. JavaScript 5개 구문 검사와 HTML 중복 ID·속성 및 로컬 파일 참조 검사를 통과했습니다. CSS 파일의 로컬 이미지 참조도 확인했습니다.
- Chrome에서 운영자 메뉴 11개와 포털 메뉴 8개를 재검사했습니다. 23개 경로를 360·390px에서 각각 확인해 가로 넘침과 undefined/NaN 표시가 없었습니다. 상품 사진 8개가 모두 로딩되었습니다.
- 실제 화면에서 발송 대기 주문의 송장을 저장한 뒤 ‘송장 등록·배송 중’ 목록에 이름·주소가 가려지는 것을 확인했습니다. 해당 목록 18건에 전체 휴대폰 번호가 표시되지 않았습니다. 검수 사이트 자체의 콘솔 오류는 없었으며, 브라우저 확장 프로그램 경고는 검사 대상에서 구분했습니다.
- CSV 업로드의 정상·오류 검증은 자동 시험으로 확인했습니다. 브라우저의 실제 파일 선택 검사는 이전에 기록한 도구 연결 지연으로 미확인입니다. 외부 판매 채널·은행과 연결되지 않는 로컬 데모 범위는 동일합니다.

추가 이미지: 내장 imagegen으로 신규 생성 후 800px WebP로 최적화했습니다. 기존 생성 원본은 보존했습니다.

| 파일 | 적용 위치 |
| --- | --- |
| `assets/images/cast-iron-pan.webp` | 무쇠 프라이팬 상품 썸네일·공구 카드 |
| `assets/images/silicone-tools.webp` | 실리콘 조리도구 상품 썸네일·공구 카드 |

### cast-iron-pan 생성 프롬프트

Use case: product-mockup. Single product e-commerce catalog photograph of one authentic black cast iron frying pan, 28 cm size, long solid handle angled to upper right, subtle grain texture and slight natural seasoning marks. Pan centered on pale cool gray stone countertop with empty space around its complete silhouette. Soft daylight from left and physically accurate contact shadow. Real professional product photography, no food, no utensils, no packaging, no people, no illustration, no 3D render, no text, no logo, no watermark. Square composition, gently elevated three-quarter angle.

### silicone-tools 생성 프롬프트

Use case: product-mockup. True professional catalog photograph of exactly five silicone kitchen utensils: a solid spatula, a slotted spatula, a ladle, a serving spoon and a pasta server, in coordinated sand beige and charcoal gray colors. Full utensils laid side by side with handles pointing toward lower edge on a clean cool pale gray stone tabletop. Matte silicone finish, physically realistic edges and contact shadows, subtle material imperfections. Soft window daylight, centered square composition with generous margins, all five tools fully visible. No frying pan, no packaging, no hands, no text, no logo, no watermark, no illustration, no CGI.


## 업무 흐름·지급 합계 추가 검토 (2026-11-23)

- 최신 위시켓 159677 공고를 로그인 상태에서 다시 확인하고, 핵심 과업 5개·상세 기능 7개 그룹과 제안서의 업무 흐름을 대조했습니다. 이 폴더의 제안서와 견적 조건은 변경하지 않았습니다.
- **일반 판매 정산:** 공구 외 일반 판매로 분류한 주문은 셀러 수수료 없이 브랜드 공급가만 정산합니다. 장부·배송 목록·브랜드 포털·다운로드에서도 같은 분류를 사용합니다. 당일 취소 제외와 이후 취소·반품 차감에 같은 기준을 적용합니다.
- 이전 버전에서 일반 판매 처리로 알림만 숨겼던 기록은 명시적 일반 판매 분류로 복원합니다. 확정 정산은 보존하며, 분류로 계산 대상이 바뀐 미확정 정산의 기존 검토·대조 승인은 해제합니다.
- **포털 지급 합계:** 전체 정산일 상태와 개별 이체 결과를 구분합니다. 보류·실패·재처리 중인 금액은 지급 완료 합계에 넣지 않으며, 미지급 정산액에 유지합니다. 성공 결과가 반영되면 완료액으로 옮기고 재처리 금액을 중복 합산하지 않습니다. 여러 일자의 보류 해제 파일도 각 항목의 원래 정산일로 구분합니다.
- 개별 이체 파일이 없는 기존 시연 이력은 저장된 지급 완료 상태를 사용합니다. 외부 은행의 실제 지급 결과를 조회하는 기능은 아닙니다.
- **시연 주문번호:** 한 번에 생성하는 여러 주문에 같은 번호가 붙던 문제를 수정했습니다. 시연용 순번을 저장하고, 채널·주문번호와 내부 ID의 기존 값 충돌을 확인합니다. 신규 생성분에 적용하며, 이미 저장된 과거 시연 번호를 임의로 바꾸지 않습니다. 이전 체험 데이터를 초기화하려면 화면의 ‘처음 상태로’를 사용합니다.
- 계좌 변경·정산 대조 안내를 자연스럽게 다듬었습니다. 배경은 밝은 회색, 상단은 화이트, 주요 버튼과 브랜드 헤더는 차분한 블루로 정리했습니다. 카드 그림자를 줄이고 지급 합계의 설명을 줄바꿈해 가독성을 높였습니다.
- **검사:** Node 회귀 검사 **50건 통과**. JavaScript 5개 구문 검사와 HTML 중복 ID·속성 및 HTML/CSS 로컬 파일 참조 검사를 통과했습니다.
- Chrome에서 운영자 메뉴 11개·포털 메뉴 8개를 직접 이동해 확인했습니다. 23경로를 360·390px에서 각각 검사했고, 활성 셀러 5명·브랜드 4곳의 홈도 두 폭에서 각각 확인했습니다. 확인한 화면에 가로 넘침·undefined/NaN·중복 ID는 없었습니다.
- 브라우저에서 일반 판매 분류 후 장부·브랜드 발송 목록에 표시되는 것을 확인했습니다. 이체 결과 반영 뒤 보류 9,980원이 완료 합계에 더해지지 않았고, 신규 수집 주문 3건의 번호가 서로 달랐습니다. 검수 사이트 자체의 콘솔 오류는 없었습니다.
- **CSV 실파일 선택 제한:** 이번에는 파일 선택 이벤트까지 확인했으나, 파일 지정 단계에서 Chrome 확장 프로그램의 “Allow access to file URLs” 권한이 필요하다는 오류로 중단됐습니다. 설정은 변경하지 않았습니다. 따라서 실제 브라우저 CSV 읽기는 미확인이며, 정상·오류 CSV 파싱은 자동 시험으로 확인했습니다. 앞선 ‘도구 연결 지연’ 기록보다 구체적으로 확인된 현재 제한입니다.

### 추가 생성 이미지

내장 imagegen으로 새 사진을 생성해 `assets/images/partner-dispatch.webp`에 저장했습니다. 1200×800px, WebP 83,700바이트이며 생성 원본은 보존했습니다. 그린데이 키친 외 브랜드 홈의 발송 준비 안내에 사용합니다. 기존 홈·상품 사진과 함께 사용하며, 실제 고객사 촬영 사진이나 판매 상품의 실사 자료를 뜻하지 않는 시연용 이미지입니다.

생성 프롬프트 원문:

Use case: photorealistic-natural. Asset type: restrained editorial photograph for the brand partner home of a Korean social-commerce operations service. A real small-business dispatch station: two plain kraft cardboard boxes, one open with tissue paper and a folded cream textile product, a few unbranded pale skincare tubes and a shipping tape dispenser on a pale stone worktable, clean blue-gray shelving softly out of focus behind. No people or hands. Authentic natural side window daylight, tactile cardboard fibers, minor real imperfections, convincing physical shadows, DSLR photograph, muted cool white, slate blue and warm kraft palette. Landscape 3:2 composition, products clearly visible near center with space around for responsive cropping. No text, no printed labels, no addresses, no brand logos, no diagrams, no illustration, no CGI, no floating objects, no watermark.


## 역할별 로그인과 서비스 화면 구성 (2026-11-23)

- 운영자·셀러·브랜드 로그인 화면을 각각 추가했습니다. 아이디·비밀번호, 비밀번호 보기, 입력 오류 안내, Enter 제출을 지원합니다.
- 로그인 폼 아래에 샘플 계정 11개를 표시합니다(운영자 2명·활성 셀러 5명·활성 브랜드 4곳). 계정을 선택하면 아이디와 비밀번호만 입력되며, 로그인 버튼 또는 Enter로 진입합니다. 공통 비밀번호는 `demo1234!`입니다.
- 비로그인 상태에서 업무 주소를 직접 열면 해당 역할의 로그인 화면으로 이동합니다. 같은 역할에 로그인하면 처음 요청했던 하위 주소로 복귀합니다. 다른 역할이나 계정의 데이터로 바로 전환하지 않습니다.
- 업무 화면에서는 로그인한 계정명·로그아웃과 해당 역할의 메뉴를 표시합니다. 기존 체험 계정 선택 목록과 즉시 권한 전환 버튼, 다른 계정 접근 시험 링크, 떠 있는 체험판·초기화 바를 제거했습니다. 운영자 메뉴와 로그아웃 영역은 분리해, 작은 화면에서도 로그아웃 버튼이 메뉴 하단에 남도록 했습니다.
- 초기화 기능은 로그인 화면의 ‘샘플 데이터 관리’ 안으로 옮겼습니다. 공공 첫 화면에는 실시간 업무 건수를 표시하지 않고, 역할별 로그인과 서비스 이용 안내를 제공합니다. 반복되는 병행 운영 배지는 상단에서 제거하고 대조 화면의 진행표를 유지했습니다.
- 로그인 계정 식별자만 탭의 sessionStorage에 저장합니다. 비밀번호를 업무 localStorage나 로그인 세션에 저장하지 않습니다. 이전 버전의 업무 저장소에 남아 있던 계정 선택 값으로 자동 로그인하지 않습니다.
- 로그아웃·계정 변경 시 확인창·예약 작업·파일 처리 상태와 포털 필터를 정리합니다. 보호된 작업과 정산서 다운로드는 현재 역할·계정에 맞는지 실행 직전에 확인합니다.
- **정적 프로토타입 범위:** 이 로그인은 가상 계정으로 화면과 업무 흐름을 확인하기 위한 기능입니다. 샘플 자격정보와 업무 데이터가 클라이언트에 있으므로 실제 비공개 데이터 보호나 운영 인증이 구현된 것은 아닙니다. 운영 서비스에서는 서버 인증, 비밀번호 해시, 서버 세션과 요청별 권한 검증이 필요합니다.
- **검사:** 기존 업무 회귀 검사 50건을 유지하고 로그인·권한·세션 검사 10건을 추가해 총 **60건 통과**했습니다. JavaScript 6개 구문 검사, HTML 중복 속성·ID 및 로컬 참조 8개 검사도 통과했습니다.
- Chrome에서 샘플 계정 11개를 모두 선택해 자동 입력·로그인·로그아웃을 확인했고, 로그인 후 메뉴 19개를 검사했습니다. 비밀번호 오류, Enter 로그인, 새로고침 후 탭 세션 복원, 비로그인·다른 역할의 주소 직접 접근 시 로그인 안내를 확인했습니다.
- 360·390px에서 로그인 3화면·업무 22경로·첫 화면을 각각 확인했습니다(총 52조합). 가로 넘침·undefined/NaN·중복 ID는 없었으며, 모바일 메뉴에서 로그아웃도 확인했습니다. 검수 사이트 자체의 콘솔 오류는 없었습니다.

## 공통 디자인 개선 (2026-11-23)

- 화이트·슬레이트 바탕에 코발트 블루를 포인트로 적용했습니다. 공통 시각 규칙은 `assets/theme.css`에 모아 기본 업무 구조와 구분하고, 첫 화면·로그인·운영자·셀러·브랜드 화면에 함께 적용합니다.
- 글자 크기·숫자 서체·카드 여백·입력 필드·버튼·표 머리글을 통일했습니다. 중요한 금액과 주요 작업을 먼저 볼 수 있도록 강조색의 사용을 줄이고, 보조 설명의 대비를 조정했습니다.
- 운영자 메뉴를 밝은 사이드바로 바꾸고 계정·로그아웃 영역을 분리했습니다. 대시보드는 핵심 수치 → 업무 바로가기 → 매출·확인 필요 → 진행 중 공구 순서로 정리했습니다. 공구 표는 넓게 제공해 좁은 PC 폭에서 과도하게 줄바꿈되던 부분을 개선했습니다.
- 셀러·브랜드 포털은 인사말·정산 잔액·판매 수치의 우선순위를 정리했습니다. 공구 카드는 표시 개수와 화면 너비에 맞춰 공간을 채우고, 금액 중간에서 줄이 바뀌지 않도록 했습니다. 기존 상품·서비스 사진을 유지했습니다.
- 로그인 화면은 배경·카드·역할 탭·샘플 계정을 정돈했습니다. 계정 선택 후 사용자가 로그인 버튼을 누르는 기존 방식과 실제 연동 여부 안내는 유지합니다.
- **검사:** 기존 회귀 검사 60건, JavaScript 6개 구문 검사, HTML 중복 ID·속성 및 로컬 참조 9개 검사를 통과했습니다. Chrome에서 공통 CSS 2개가 파싱되는 것을 확인했습니다.
- PC 1440px에서 운영자·포털의 19개 메뉴를 이동하고, 운영자 14경로와 포털 하위 화면을 확인했습니다. 1187px의 일반 브라우저 폭에서도 대시보드와 공구 표를 확인했습니다. 360·390px에서 로그인 3화면·업무 22경로·첫 화면을 각각 검사해 총 52조합에 가로 넘침·undefined/NaN·중복 ID가 없었습니다. 모바일 셀러 카드 2개의 내부 넘침과 사진 3개의 로딩도 확인했습니다.
- 이번 변경은 시각 체계와 화면 배치·표현 개선입니다. 정산·지급·권한·로그인 로직과 외부 미연동 범위는 기존과 같습니다. 전체 접근성 인증이나 실제 외부 연동 검사를 뜻하지 않습니다.


## 문구·HTML·CSS 최종 검토 (2026-11-23)

- 운영자·셀러·브랜드·로그인·첫 화면의 문구와 HTML 템플릿, 공통 CSS 두 파일을 다시 검토했습니다. ‘한곳에서’ 표기, 권한 안내 문장, 대조 전환 기준, 공지 제목과 정산 금액의 설명을 다듬었습니다. 셀러와 브랜드를 함께 집계하는 포털 수는 ‘계정’ 단위로 표시합니다.
- 수집 주기를 5·10·30분으로 변경해도 주문 화면 설명이 10분으로 남던 부분을 수정했습니다. 선택한 주기를 설명과 다음 수집 시각에 함께 사용하며, 기존 회귀 검사에 5분 표시 확인을 포함했습니다.
- 개인정보 안내를 실제 화면 동작에 맞췄습니다. 브랜드는 발송 대기 주문에서 배송 정보를 보고, 이후 상태에서는 이름·연락처·상세 주소가 가려진다는 기준입니다. 정적 데모의 계좌 저장을 실제 암호화 저장으로 설명하던 표현도 운영 적용 계획과 구분했습니다.
- 검색 필드가 부모 테두리를 넘던 높이 충돌(외곽 38px / 입력 42px)을 수정했습니다. 최종 외곽은 42px, 테두리 안쪽과 입력은 각각 40px입니다. 검색과 가격·재고 입력에 접근성 이름을 추가했습니다.
- 정산일 목록의 sticky 시작점을 상단 헤더 아래로 옮겼습니다(헤더 약 100px / 목록 시작 112px). 비활성 버튼에 hover 그림자가 다시 붙지 않도록 했고, ‘차이만 보기’의 숨김 입력을 키보드로 조작할 수 있도록 수정했습니다. 실제 Space 입력 후 전체 9행이 나타나는 것을 확인했습니다.
- 가격·재고 모달은 작은 화면에서 상품명이 한두 글자씩 줄바꿈되고 창이 가용 폭을 넘던 문제를 수정했습니다. 360px에서 모달이 좌우 8px 안에 배치되고, 표 내부만 좌우로 이동합니다. 키보드로 표에 접근할 수 있습니다. 채널 설명도 두 열로 정돈해 좁은 PC 화면의 과도한 줄바꿈을 줄였습니다.
- **검사:** 회귀 검사 60건 및 최종 JavaScript 구문 검사 6개 통과. HTML 중복 ID·속성·로컬 참조 9개, CSS 로컬 참조·괄호를 확인했고 Chrome에서 공통 CSS 두 파일이 파싱되는 것을 확인했습니다.
- 로그인 3화면·업무 22경로·첫 화면을 360·768·1440px에서 각각 확인했습니다(78조합). 가로 넘침·undefined/NaN·중복 ID·목록의 잘못된 직계 자식·중첩 링크/버튼은 없었습니다. 마지막 채널 배치 수정 후 주문·설정 2화면을 세 폭에서 추가 확인했습니다. 사이트 자체의 콘솔 경고·오류는 없었으며 확장 프로그램 메시지는 제외했습니다.
- 검수는 브라우저 내부 가상 데이터 기준입니다. 외부 판매 채널·은행·알림톡의 실제 호출, 실제 CSV 파일 선택 및 인쇄 결과는 이번 검수에 포함하지 않았습니다. 앞선 기능 검증과 외부 미연동 범위는 유지됩니다.


## 네이비·블루·바이올렛 디자인 개편 (2026-11-23)

- 더 화려한 인상을 요청한 내용에 맞춰 공통 `theme.css`를 개편했습니다. 깊은 네이비 메뉴·헤더와 밝은 업무 화면, 블루·바이올렛 그라데이션을 조합했습니다. 대시보드 상단·포털 인사말·핵심 지표·주요 버튼의 강조를 강화하고 카드·표·입력 필드의 체계는 유지합니다.
- 첫 화면은 네이비 배경, 그라데이션 타이틀, 사진 프레임과 밝은 역할별 카드로 구성했습니다. 로그인은 같은 배경 위에 밝은 입력 카드와 반투명 샘플 계정 카드를 배치했습니다. 기존 사진을 유지하며 새 이미지는 생성하지 않았습니다.
- 로고·버튼의 은은한 광원 효과, 상단의 원형 선 장식과 짧은 진입 효과를 추가했습니다. 장식은 포인터 입력을 가리지 않으며, 기존 `prefers-reduced-motion` 규칙으로 모션 최소화 설정을 따릅니다.
- 셀러·브랜드는 네이비 헤더와 역할별 그라데이션 상단, 정산 잔액의 반투명 카드로 통일했습니다. 모바일 금액은 단위가 따로 줄바꿈되지 않게 글자 크기를 조절했습니다. 상태별 경고·오류 색상과 중요한 미연동 안내는 유지합니다.
- `index.html`의 로컬 자산 버전을 `20261123-10`으로 올렸습니다. 업무 처리·로그인 로직은 변경하지 않았습니다.
- **검사:** 기존 회귀 검사 60건 통과. HTML 로컬 참조 9개·중복 ID/속성 및 CSS 괄호 검사 통과. Chrome에서 CSS 2개가 파싱되는 것을 확인했습니다. 사이트 자체의 콘솔 경고·오류는 없었습니다.
- 로그인 3화면·업무 22경로·첫 화면을 360·768·1440px에서 각각 확인했습니다(78조합). 가로 넘침·undefined/NaN·중복 ID가 없었습니다. 활성 셀러 5명·브랜드 4곳의 홈에서 360px 금액 카드의 내부 넘침도 없었습니다. 일반 브라우저 폭 902px에서도 대시보드의 가로 넘침이 없는 것을 확인하고 임시 뷰포트 설정을 해제했습니다.
- 외부 연동·운영 인증의 실제 구현 범위는 기존 정적 프로토타입과 동일합니다. 이번 변경은 시각 디자인 개편이며 외부 게시·배포는 진행하지 않았습니다.


## 화려한 테마 적용 후 최종 검수 (2026-11-23)

- 지급 보류 안내를 ‘확정분 · 지급 보류·처리 중 금액 포함’으로 명확히 했습니다. 브랜드 배송 내역의 개인정보 안내도 이름·상세 주소를 가리고 연락처는 표시하지 않는 실제 동작과 맞췄습니다. 첫 화면의 ‘소속 계정’ 표현은 ‘로그인한 계정’으로 다듬었습니다.
- 주요 그라데이션의 가장 밝은 기준색을 조정했습니다. 흰 글자와 시작색의 명암비는 약 4.09:1에서 5.34:1로 높였습니다. 차트 축 글자·정상 상태 설명·포털 보조 제목도 어둡게 조정하고 차트 두 번째 계열의 명도를 낮췄습니다. 이는 확인한 색상 보완이며 전체 접근성 인증을 뜻하지 않습니다.
- 순서별 아이콘 색상이 경고 상태 색상을 덮어쓰던 CSS 우선순위 충돌을 수정했습니다. 경고 업무는 모두 동일한 앰버 배경과 진한 경고색으로 표시되는 것을 브라우저에서 확인했습니다. 비활성 버튼의 hover 밝기 효과와 중복된 아이콘 표시·모바일 폭 선언도 정리했습니다.
- **정적 검사:** JavaScript 6개 구문·HTML 중복 ID/속성·로컬 참조 9개·CSS 두 파일의 괄호와 로컬 파일 참조 검사 통과. Chrome에서 기본 CSS와 테마 CSS가 파싱되는 것을 확인했습니다. 로컬 자산 버전은 `20261123-11`입니다.
- **동작 검사:** 기존 회귀 검사 60건 통과. 메뉴 19개를 직접 이동해 활성 메뉴와 화면 전환을 확인했습니다. 사이트 자체의 콘솔 경고·오류는 없었습니다.
- **반응형 검사:** 로그인 3화면·업무 22경로·첫 화면을 320·360·768·1024·1440px에서 각각 확인했습니다(130조합). 가로 넘침·undefined/NaN·금액 내부 잘림·중복 ID·잘못된 목록 직계 자식·중첩 링크/버튼은 발견되지 않았습니다. 임시 뷰포트 설정을 해제한 1187px 일반 브라우저 폭에서도 대시보드 가로 넘침이 없었습니다.
- 브라우저 내부 가상 데이터 기준의 최종 검수입니다. 실제 외부 채널·은행·알림톡 호출, 실제 CSV 파일 선택, 인쇄 결과는 이번 검사에 포함하지 않았습니다. 외부 게시·배포는 진행하지 않았습니다.


### 현재 버전 추가 재확인 (2026-11-23)

현재 `20261123-11` 버전을 다시 검사했습니다. 회귀 검사 60건, JavaScript 6개 구문, 로컬 참조 9개 검사를 통과했습니다. 테스트의 기존 가상 브라우저 환경으로 26개 화면 HTML을 추출해 태그 짝·중복 속성·중복 ID를 별도로 검사했으며 문제가 없었습니다. 공통 CSS 두 파일의 괄호·참조와 Chrome 파싱을 재확인했습니다. 320·1440px에서 26개 화면을 각각 확인한 52조합에 가로 넘침·금액 내부 잘림·undefined/NaN은 없었고 사이트 자체 콘솔 오류도 없었습니다. 문구·화면 구성에 추가 수정이 필요한 문제는 발견되지 않아 애플리케이션 소스는 유지했습니다. 실제 외부 연동·인쇄 검사는 포함하지 않았습니다.
