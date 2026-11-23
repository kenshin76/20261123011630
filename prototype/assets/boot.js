/* 공구온 [프로토타입] — 첫 화면과 시작 */
(function () {
  'use strict';
  const D = window.DATA, U = APP.U;

  APP.route(/^\/?$/, () => {
    const user = APP.currentUser();
    const actions = [
      ['cart', '주문 장부', '채널별 주문을 한곳에서 확인하세요.', '#/ops/orders'],
      ['box', '상품·공구', '상품 정보와 공구 일정을 관리하세요.', '#/ops/products'],
      ['truck', '배송·송장', '발송할 주문과 송장을 확인하세요.', '#/ops/ship'],
      ['calc', '일 정산', '계산 내역을 검토하고 확정하세요.', '#/ops/settle'],
      ['bank', '지급·이체', '이체 파일과 지급 결과를 관리하세요.', '#/ops/payout'],
      ['scale', '엑셀 대조', '기존 정산과 차이가 있는지 확인하세요.', '#/ops/recon']
    ];
    return `<div class="hub">
      <header class="hnav"><a class="brand" href="#/" aria-label="공구온 홈">${APP.logo()}<span>공구온</span></a><a class="hub-main" href="../index.html" title="제안서 메인 화면으로 이동"><svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>메인으로</a>${APP.workspaceNav('')}</header>
      <main>
        <section class="hhero">
          <div class="hh-l"><span class="eyebrow">공동구매 운영을 더 간결하게</span>
            <h1>주문부터 정산까지,<br><em>공구온에서 한 번에.</em></h1>
            <p>흩어진 주문을 모으고, 배송과 정산을 연결하세요.<br>운영자·셀러·브랜드가 필요한 정보를 함께 확인합니다.</p>
            <div class="hh-cta"><a class="btn big" href="${user ? '#/' + user.role : '#/login/ops'}">${U.ic('grid')}${user ? '내 업무로 이동' : '운영자 로그인'}</a></div>
            <div class="home-capabilities"><span>${U.ic('cart')}주문 통합 관리</span><span>${U.ic('truck')}배송·송장 연결</span><span>${U.ic('calc')}파트너 정산</span></div>
          </div>
          <figure class="home-photo"><img src="assets/images/commerce-studio.webp" alt="주방·뷰티 상품과 배송 상자가 준비된 커머스 스튜디오" width="1536" height="1024" fetchpriority="high"><figcaption>${U.ic('box')}판매의 시작부터 파트너 정산까지</figcaption></figure>
        </section>
        <section class="hsec"><div class="hsec-h"><span class="eyebrow">MY WORKSPACE</span><h2>나에게 맞는 업무 공간</h2><p>필요한 정보와 업무를 역할에 맞게 확인하세요.</p></div>
          <div class="workspace-cards">
            <a class="workspace-card" href="#/ops"><span class="r-ic">${U.ic('grid')}</span><h3>운영자 콘솔</h3><p>주문·배송·정산을 관리하고<br>확인할 업무를 처리하세요.</p><span class="workspace-link">운영자 로그인</span></a>
            <a class="workspace-card" href="#/seller"><span class="r-ic">${U.ic('users')}</span><h3>셀러 포털</h3><p>내 공구의 판매 현황과<br>확정된 정산 내역을 확인하세요.</p><span class="workspace-link">셀러 로그인</span></a>
            <a class="workspace-card" href="#/brand"><span class="r-ic">${U.ic('store')}</span><h3>브랜드 포털</h3><p>발송할 주문을 확인하고<br>송장과 공급가 정산을 관리하세요.</p><span class="workspace-link">브랜드 로그인</span></a>
          </div>
        </section>
        ${user && user.role === 'ops' ? `<section class="hsec quick-section"><div class="hsec-h"><span class="eyebrow">QUICK ACCESS</span><h2>자주 사용하는 업무</h2></div><div class="quick-grid">${actions.map(([ic,t,d,to]) => `<a class="quick-card" href="${to}"><span>${U.ic(ic)}</span><div><h3>${t}</h3><p>${d}</p></div>${U.ic('chev')}</a>`).join('')}</div></section>` : ''}
      </main>
      <footer class="hfoot"><a class="brand" href="#/">${APP.logo()}<span>공구온</span></a><p>주문과 파트너를 연결하는 공동구매 운영 공간</p><small>로그인한 계정의 주문과 정산 내역을 확인할 수 있습니다.</small></footer>
    </div>`;
  });

  function start() {
    APP.init();
    window.addEventListener('hashchange', APP.render);
    APP.render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
