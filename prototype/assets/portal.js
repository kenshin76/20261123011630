/* 공구온 [프로토타입] — 셀러·브랜드 셀프 포털
   포털은 로그인한 셀러·브랜드 자신의 주문·정산만 보여 줍니다. 구매자 개인정보는 역할에 맞게 가립니다. */
(function () {
  'use strict';
  const D = window.DATA, U = APP.U, S = () => APP.get();
  const T = D.TODAY;
  const pct = (r) => Math.round(r * 100) + '%';

  function who(kind) {
    const user = APP.currentUser(), list = kind === 'seller' ? S().sellers : S().brands;
    return user && user.role === kind ? list.find(x => x.id === user.id && x.status === '활성') : null;
  }
  const on = (name, fn) => APP.on(name, fn, name.startsWith('b-') || name === 'bt' ? 'brand' : name === 'sf' || name === 'sel-xls' ? 'seller' : 'portal');
  function shell(kind, key, me, body) {
    const s = S();
    const tabs = kind === 'seller' ? [['', '홈'], ['orders', '주문'], ['settle', '정산'], ['me', '내 정보']] : [['', '홈'], ['orders', '주문·송장'], ['settle', '정산'], ['me', '내 정보']];
    return `<div class="portal p-${kind}">
      <header class="ptop"><div class="pin">
        <a class="brand" href="#/">${APP.logo()}<span>공구온<em>${kind === 'seller' ? '셀러' : '브랜드'}</em></span></a>
        <nav class="ptabs">${tabs.map(([k, l]) => `<a href="#/${kind}${k ? '/' + k : ''}" class="${key === k ? 'on' : ''}">${l}</a>`).join('')}</nav>
        <div class="pme"><div class="account-name"><b>${U.esc(me.name)}</b><small>${kind === 'seller' ? U.esc(me.handle) : U.esc(me.manager) + ' 담당자'}</small></div><button class="btn sm line" data-act="logout">${U.ic('logout')}로그아웃</button></div>
      </div></header>
      ${APP.workspaceNav(kind)}<main class="pwrap">${body}</main></div>` + APP.demoBar();
  }

  // Resolve each payee's result independently of the overall settlement status.
  APP.portalPayment = (day, key, amount) => {
    const s = S(), w = APP.payee(key);
    const root = s.batches.find((b) => !b.retryOf && !b.heldOf && b.days.includes(day) && (b.items.some((i) => i.key === key) || (b.held || []).some((h) => h.key === key)));
    let state;
    if (amount <= 0) state = 'zero';
    else if (!root) state = s.settle[day].st === 'paid' ? 'paid' : !w.account.verified ? 'hold' : 'due';
    else {
      let item = root.items.find((i) => i.key === key);
      if (!item) {
        const held = (root.held || []).find((h) => h.key === key);
        item = held && held.paid ? s.batches.flatMap((b) => b.heldOf ? b.items.filter((i) => i.key === key && (i.from || b.days).includes(day)) : []).at(-1) : null;
        if (!item) state = 'hold';
      }
      const seen = new Set();
      while (item && item.retried && !seen.has(item.retried)) {
        seen.add(item.retried);
        const retry = s.batches.find((b) => b.id === item.retried);
        const next = retry && retry.items.find((i) => i.key === key && (i.from || retry.days).includes(day));
        if (!next) break;
        item = next;
      }
      if (item) state = item.res === '성공' ? 'paid' : item.res === '실패' ? 'failed' : 'processing';
    }
    return { state, paid: state === 'paid' ? amount : 0, due: state === 'paid' ? 0 : amount };
  };
  const mineDays = (key) => Object.keys(S().settle).sort().reverse().filter((d) => ['confirmed', 'paid'].includes(S().settle[d].st)).map((d) => ({ d, l: APP.calc(d).lines.find((x) => x.kind + x.id === key) })).filter((x) => x.l).map((x) => Object.assign(x, {payment: APP.portalPayment(x.d, key, x.l.pay)}));
  const payState = (d, w) => {
    const key = (w.handle ? 'S' : 'B') + w.id;
    const l = APP.calc(d).lines.find((x) => x.kind + x.id === key);
    const state = APP.portalPayment(d, key, l ? l.pay : 0).state;
    const labels = {paid:['지급 완료','green'],hold:['지급 보류','red'],failed:['이체 실패','red'],processing:['지급 처리 중','blue'],due:['지급 예정','violet'],zero:['지급액 없음','gray']};
    return U.st(...labels[state]);
  };

  function deny(kind, me, what) {
    APP.log('권한 없는 접근 차단 — ' + what, (kind === 'seller' ? me.handle : me.name)); APP.save();
    return shell(kind, '', me, `<section class="deny card">${U.ic('lock')}<h2>접근 권한이 없습니다</h2><p>다른 ${kind === 'seller' ? '셀러' : '브랜드'}의 주문·정산은 볼 수 없습니다.<br>현재 계정에 허용된 자료만 확인하실 수 있습니다.</p><code>403 · ${U.esc(what)}</code><p class="muted small">이 접근 시도는 운영자 콘솔의 변경 이력에 기록되었습니다.</p><a class="btn" href="#/${kind}">내 홈으로</a></section>`);
  }

  /* ---------------- 셀러 ---------------- */
  APP.route(/^\/seller(?:\?as=(\w+))?$/, (as) => {
    const s = S(), me = who('seller', as), key = 'S' + me.id;
    const gs = s.groups.filter((g) => g.sid === me.id);
    const mine = s.orders.filter((o) => o.sid === me.id);
    const live = mine.filter((o) => !o.cancelAt);
    const days = mineDays(key);
    const due = days.reduce((a, x) => a + x.payment.due, 0);
    const paid = days.filter((x) => x.d >= '2027-02-01').reduce((a, x) => a + x.payment.paid, 0);
    const range = D.range(D.add(T, -10), D.add(T, -1));
    const series = range.map((d) => ({ label: U.md(d), title: U.day(d), parts: [{ name: '매출', cls: 'c1', v: live.filter((o) => o.paid === d).reduce((a, o) => a + o.price * o.qty, 0) }] }));
    const other = s.sellers.find((x) => x.id !== me.id && x.status === '활성');
    const body = `
      <section class="phero"><div><span class="eyebrow">${U.ic('spark')}${me.cat} · 팔로워 ${me.follower}</span><h1>${U.esc(me.name)} 님, 반가워요.</h1><p>진행 중인 공구와 정산 내역을 한눈에 확인하세요.</p></div>
        <div class="phero-num"><small>미지급 정산액</small><strong>${U.won(due)}원</strong><span>확정분 · 지급 보류·처리 중 금액 포함</span><span>2월 지급 완료 ${U.won(paid)}원</span></div></section>
      <div class="kpis">${U.kpi('2월 공구 매출', U.won(live.filter((o) => o.paid >= '2027-02-01').reduce((a, o) => a + o.price * o.qty, 0)) + '<small>원</small>', '취소 제외', '', 'cart')}${U.kpi('진행 중 공구', gs.filter((g) => APP.groupState(g) === '진행 중').length + '<small>개</small>', '예정 ' + gs.filter((g) => APP.groupState(g) === '예정').length, 'violet', 'tag')}${U.kpi('2월 판매 수량', live.filter((o) => o.paid >= '2027-02-01').reduce((a, o) => a + o.qty, 0) + '<small>개</small>', '', '', 'box')}${U.kpi('구분', me.type, me.type === '개인' ? '원천징수 3.3% 적용' : '세금계산서 발행 대상', '', 'file')}</div>
      <section class="portal-story"><img src="assets/images/commerce-studio.webp" alt="공동구매 상품과 배송 준비 공간" width="1536" height="1024" loading="lazy"><div><span class="eyebrow">MY CAMPAIGNS</span><h2>좋은 상품을 소개하는 일에 집중하세요.</h2><p>공구별 판매 현황과 정산은 이곳에서 확인할 수 있습니다.</p></div></section><h3 class="sec-t">내 공구</h3>
      <div class="gcards">${gs.map((g) => { const p = APP.product(g.pid), os = live.filter((o) => o.gid === g.id), st = APP.groupState(g); const span = D.diff(g.to, g.from) + 1, done = Math.max(0, Math.min(span, D.diff(T, g.from) + 1)); const sales = os.reduce((a, o) => a + o.price * o.qty, 0); return `<article class="gcard ${st === '진행 중' ? 'live' : ''}"><div class="gc-top">${U.thumb(p)}<div><b>${U.esc(g.title)}</b><small>${U.esc(p.name)} · ${U.esc(APP.brand(p.bid).name)}</small></div>${U.st(st, st === '진행 중' ? 'violet' : st === '예정' ? 'blue' : 'gray')}</div><div class="prog"><i style="width:${(done / span) * 100}%"></i></div><div class="gc-meta"><span>${U.md(g.from)} ~ ${U.md(g.to)}</span><span>${U.chDot(g.ch)} ${D.CH[g.ch].name}</span></div><dl class="gc-num"><div><dt>판매</dt><dd>${os.reduce((a, o) => a + o.qty, 0)}개</dd></div><div><dt>매출</dt><dd>${U.won(sales)}</dd></div><div><dt>수수료 ${pct(g.rate)}</dt><dd>${U.won(sales * g.rate)}</dd></div></dl></article>`; }).join('')}</div>
      <div class="grid2">
        <section class="card"><header class="card-h"><div><h3>최근 10일 매출</h3><p>결제일 기준 · 취소 제외</p></div></header>${U.bars('sel-chart', series, { label: '최근 10일 매출', every: 2 })}</section>
        <section class="card"><header class="card-h"><div><h3>최근 정산</h3><p>확정된 정산만 공개됩니다</p></div><a class="link" href="#/seller/settle">전체 ${U.ic('chev')}</a></header>
          <ul class="plist">${days.slice(0, 5).map((x) => `<li><div><b>${U.day(x.d)}</b><small>${x.l.cnt}건 · 매출 ${U.won(x.l.sales)}원</small></div><strong>${U.won(x.l.pay)}원</strong>${payState(x.d, me)}</li>`).join('') || '<li>확정된 정산이 없습니다</li>'}</ul></section>
      </div>
      <section class="card sec-card"><div>${U.ic('shield')}<div><b>내 데이터만 보입니다</b><span>현재 계정의 주문·정산만 표시하며, 구매자 개인정보는 가려서 제공합니다.</span></div></div></section>`;
    return shell('seller', '', me, body);
  });

  const sf = { g: '' };
  APP.route(/^\/seller\/orders$/, () => {
    const s = S(), me = who('seller'); const gs = s.groups.filter((g) => g.sid === me.id);
    let list = s.orders.filter((o) => o.sid === me.id).sort((a, b) => (b.paid + b.time).localeCompare(a.paid + a.time));
    if (sf.g) list = list.filter((o) => o.gid === sf.g);
    const body = `<section class="card"><header class="card-h"><div><h3>내 공구 주문</h3><p>${list.length}건 · 구매자 정보는 가려서 표시합니다</p></div><button class="btn sm line" data-act="sel-xls">${U.ic('download')}엑셀</button></header>
      <div class="filters"><select data-change="sf" aria-label="공구"><option value="">전체 공구</option>${gs.map((g) => `<option value="${g.id}" ${sf.g === g.id ? 'selected' : ''}>${U.esc(g.title)}</option>`).join('')}</select></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>주문번호</th><th>결제</th><th>상품</th><th class="r">금액</th><th>구매자</th><th>연락처</th><th>지역</th><th>상태</th></tr></thead><tbody>
      ${list.slice(0, 60).map((o) => `<tr><td class="mono">${U.chDot(o.ch)} ${o.no}</td><td>${U.md(o.paid)} ${o.time}</td><td>${U.esc(APP.product(o.pid).name)} × ${o.qty}</td><td class="r num">${U.won(o.price * o.qty)}</td><td>${U.esc(U.maskName(o.buyer.name))}</td><td class="mono">${U.esc(U.maskPhone(o.buyer.phone))}</td><td>${U.esc(U.maskAddr(o.buyer.addr))}</td><td>${U.st(o.status)}</td></tr>`).join('')}
      </tbody></table></div></section>`;
    return shell('seller', 'orders', me, body);
  });
  on('sf', (el) => { sf.g = el.value; APP.render(); });
  on('sel-xls', () => { const s = S(), me = who('seller'); U.sheet('내공구주문_' + T + '.xlsx', [['주문번호', '결제일', '공구', '상품', '수량', '금액', '구매자', '상태']].concat(s.orders.filter((o) => o.sid === me.id && (!sf.g || o.gid === sf.g)).map((o) => [o.no, o.paid, APP.group(o.gid).title, APP.product(o.pid).name, o.qty, o.price * o.qty, U.maskName(o.buyer.name), o.status])), '주문'); APP.toast('주문 엑셀을 내려받았습니다 (구매자 정보 가림)'); });

  function settleList(kind, me) {
    const key = (kind === 'seller' ? 'S' : 'B') + me.id, days = mineDays(key);
    const pend = Object.keys(S().settle).filter((d) => ['draft', 'reviewed'].includes(S().settle[d].st));
    return `<section class="card"><header class="card-h"><div><h3>정산 내역</h3><p>${days.length}일 · 결제일 기준 일 정산</p></div></header>
      ${pend.length ? `<div class="note">${U.ic('calc')}<div><b>${pend.map(U.md).join(', ')} 정산은 검토 중입니다</b><span>운영자가 확정하면 알림톡으로 안내드리고 이곳에 공개됩니다.</span></div></div>` : ''}
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>정산일</th><th class="r">주문</th><th class="r">매출</th><th class="r">${kind === 'seller' ? '수수료' : '공급가 합계'}</th><th class="r">조정</th>${kind === 'seller' ? '<th class="r">원천징수</th>' : ''}<th class="r">지급액</th><th>상태</th><th></th></tr></thead><tbody>
      ${days.map((x) => `<tr><td>${U.day(x.d)}</td><td class="r">${x.l.cnt}</td><td class="r num">${U.won(x.l.sales)}</td><td class="r num">${U.won(x.l.base)}</td><td class="r num ${x.l.adj < 0 ? 'neg' : ''}">${x.l.adj ? U.won(x.l.adj) : '—'}</td>${kind === 'seller' ? `<td class="r num">${x.l.tax ? U.won(-x.l.tax) : '—'}</td>` : ''}<td class="r num strong">${U.won(x.l.pay)}</td><td>${payState(x.d, me)}</td><td><a class="btn xs line" href="#/${kind}/settle/${x.d}/${key}">정산서</a></td></tr>`).join('')}
      </tbody></table></div></section>`;
  }
  function settleRoute(kind) {
    return (day, key) => {
      const me = who(kind), mine = (kind === 'seller' ? 'S' : 'B') + me.id;
      if (key && key !== mine) return deny(kind, me, '/' + kind + '/settle/' + day + '/' + key);
      if (key && day && S().settle[day] && ['confirmed', 'paid'].includes(S().settle[day].st)) APP.after.push(() => APP.statement(day, key, true));
      return shell(kind, 'settle', me, settleList(kind, me));
    };
  }
  APP.route(/^\/seller\/settle(?:\/([\d-]+)\/(\w+))?$/, settleRoute('seller'));
  APP.route(/^\/brand\/settle(?:\/([\d-]+)\/(\w+))?$/, settleRoute('brand'));

  function meRoute(kind) {
    return () => {
      const me = who(kind), a = me.account;
      const body = `<div class="grid2"><section class="card"><h3 class="h3">기본 정보</h3><div class="kv">${kind === 'seller' ? `<span>계정</span><b>${me.handle}</b><span>이름</span><b>${me.name}</b><span>구분</span><b>${me.type}${me.biz ? ' · ' + U.esc(me.biz) : ''}</b><span>분야</span><b>${U.esc(me.cat)}</b>` : `<span>브랜드</span><b>${U.esc(me.name)}</b><span>담당자</span><b>${U.esc(me.manager)}</b><span>카테고리</span><b>${U.esc(me.cat)}</b><span>배송</span><b>${U.esc(me.ship)}</b>`}</div></section>
        <section class="card"><h3 class="h3">정산 계좌</h3><div class="kv"><span>은행</span><b>${U.esc(a.bank)}</b><span>계좌번호</span><b class="mono">${U.maskAcct(a.no)}</b><span>예금주</span><b>${U.esc(a.holder)}</b><span>상태</span><b>${a.changedAt && !a.verified ? U.st('변경 확인 중 · 지급 보류', 'red') : a.verified ? U.st('확인 완료', 'green') : U.st('확인 전', 'amber')}</b></div>
          <button class="btn line" data-act="acct-change" data-kind="${kind}">${U.ic('bank')}계좌 변경 요청</button><p class="muted small">계좌를 변경하면 통장 사본과 예금주를 확인한 후 지급을 재개합니다. 확인 전까지 정산금은 보류됩니다.</p></section></div>`;
      return shell(kind, 'me', me, body);
    };
  }
  APP.route(/^\/seller\/me$/, meRoute('seller'));
  APP.route(/^\/brand\/me$/, meRoute('brand'));
  on('acct-change', (el) => {
    if (el.dataset.kind !== APP.currentUser().role) return APP.toast('현재 계정의 계좌만 변경할 수 있습니다', 'warn');
    APP.modal({ title: '정산 계좌 변경 요청', body: `<div class="form"><label>은행<select id="ac-b">${['IBK기업', '국민', '신한', '우리', '하나', '농협', '카카오뱅크', '토스뱅크'].map((b) => `<option>${b}</option>`).join('')}</select></label><label>계좌번호<input id="ac-n" inputmode="numeric" maxlength="30" placeholder="숫자와 - 만 입력"></label><label>예금주<input id="ac-h"></label><label>통장 사본<input type="file" accept="image/*,.pdf"><small class="muted">체험판은 파일을 저장하지 않습니다</small></label></div>`, foot: `<button class="btn line" data-act="close">취소</button><button class="btn" data-act="acct-change-do" data-kind="${el.dataset.kind}">변경 요청</button>` });
  });
  on('acct-change-do', (el) => {
    if (el.dataset.kind !== APP.currentUser().role) return APP.toast('현재 계정의 계좌만 변경할 수 있습니다', 'warn');
    const kind = el.dataset.kind, me = who(kind), n = ((U.qs('#ac-n') || {}).value || '').trim(), h = ((U.qs('#ac-h') || {}).value || '').trim();
    if (!/^\d+(?:-\d+)*$/.test(n) || !/^\d{8,20}$/.test(n.replace(/-/g, ''))) return APP.toast('계좌번호는 숫자 8~20자리로 입력하고, 하이픈은 숫자 사이에만 넣어 주세요', 'warn'); if (!h) return APP.toast('예금주를 입력해 주세요', 'warn');
    me.account = { bank: U.qs('#ac-b').value, no: n, holder: h.slice(0, 30), verified: false, changedAt: T, prev: me.account.bank + ' ' + U.maskAcct(me.account.no) };
    APP.close(); APP.toast('변경 요청을 접수했습니다 — 운영자 확인 전까지 지급 보류', 'info');
    APP.commit('정산 계좌 변경 요청 → 지급 보류 자동 설정', kind === 'seller' ? me.handle : me.name);
  });

  /* ---------------- 브랜드 ---------------- */
  APP.route(/^\/brand(?:\?as=(\w+))?$/, (as) => {
    const s = S(), me = who('brand', as), key = 'B' + me.id;
    const mine = s.orders.filter((o) => o.bid === me.id && D.isAssigned(o));
    const wait = mine.filter((o) => o.status === '발송 대기');
    const gs = s.groups.filter((g) => APP.product(g.pid).bid === me.id);
    const days = mineDays(key);
    const due = days.reduce((a, x) => a + x.payment.due, 0);
    const maxQ = Math.max(1, ...gs.map((g) => mine.filter((o) => o.gid === g.id && !o.cancelAt).reduce((a, o) => a + o.qty, 0)));
    const other = s.brands.find((x) => x.id !== me.id && x.status === '활성');
    const body = `
      <section class="phero brand"><div><span class="eyebrow">${U.ic('store')}${U.esc(me.cat)} · ${U.esc(me.ship)}</span><h1>${U.esc(me.name)} 파트너 센터</h1><p>공구 판매 현황과 발송·정산을 한곳에서 확인하세요.</p></div>
        <div class="phero-num"><small>미지급 정산액</small><strong>${U.won(due)}원</strong><span>확정분 · 지급 보류·처리 중 금액 포함</span></div></section>
      ${me.id === 'b1' ? `<section class="portal-story kitchen"><img src="assets/images/kitchen-collection.webp" alt="무쇠 프라이팬과 실리콘 조리도구 컬렉션" width="1536" height="1024" loading="lazy"><div><span class="eyebrow">GREEN DAY KITCHEN</span><h2>상품에서 배송까지, 매끄럽게.</h2><p>오늘의 주문과 발송할 상품을 한눈에 확인하세요.</p></div></section>` : `<section class="portal-story dispatch"><img src="assets/images/partner-dispatch.webp" alt="상품과 포장재가 준비된 발송 작업대" width="1200" height="800" loading="lazy"><div><span class="eyebrow">오늘의 발송 준비</span><h2>주문 확인부터 송장 등록까지.</h2><p>발송할 상품과 처리할 주문을 이곳에서 확인하세요.</p></div></section>`}${wait.length ? `<a class="alert-bar" href="#/brand/orders">${U.ic('truck')}<div><b>발송 대기 ${wait.length}건</b><span>송장 저장 후 운영자가 채널 전송을 진행합니다 · 2일 경과 ${wait.filter((o) => D.diff(T, o.paid) >= 2).length}건</span></div><span class="btn sm white">송장 입력 ${U.ic('arrow')}</span></a>` : ''}
      <div class="kpis">${U.kpi('진행 중 공구', gs.filter((g) => APP.groupState(g) === '진행 중').length + '<small>개</small>', '', 'violet', 'tag')}${U.kpi('발송 대기', wait.length + '<small>건</small>', '', wait.length ? 'hot' : '', 'truck')}${U.kpi('2월 판매 수량', mine.filter((o) => !o.cancelAt && o.paid >= '2027-02-01').reduce((a, o) => a + o.qty, 0) + '<small>개</small>', '', '', 'box')}${U.kpi('2월 공급가 합계', U.won(mine.filter((o) => !o.cancelAt && o.paid >= '2027-02-01').reduce((a, o) => a + o.supply * o.qty, 0)) + '<small>원</small>', '', '', 'bank')}</div>
      <div class="grid2">
        <section class="card"><header class="card-h"><div><h3>공구별 판매 수량</h3><p>취소 제외 누적</p></div></header>
          <ul class="hbars">${gs.map((g) => { const q = mine.filter((o) => o.gid === g.id && !o.cancelAt).reduce((a, o) => a + o.qty, 0); return `<li><div class="hb-l"><b>${U.esc(g.title)}</b><small>${APP.seller(g.sid).handle} · ${U.md(g.from)}~${U.md(g.to)} · ${APP.groupState(g)}</small></div><div class="hb"><i style="width:${(q / maxQ) * 100}%"></i></div><span class="num">${q}개</span></li>`; }).join('')}</ul></section>
        <section class="card"><header class="card-h"><div><h3>최근 정산</h3><p>공급가 기준 · 확정분</p></div><a class="link" href="#/brand/settle">전체 ${U.ic('chev')}</a></header>
          <ul class="plist">${days.slice(0, 5).map((x) => `<li><div><b>${U.day(x.d)}</b><small>${x.l.cnt}건${x.l.adj ? ' · 조정 ' + U.won(x.l.adj) : ''}</small></div><strong>${U.won(x.l.pay)}원</strong>${payState(x.d, me)}</li>`).join('') || '<li>확정된 정산이 없습니다</li>'}</ul></section>
      </div>
      <div class="grid2">
        <section class="card preview"><span class="tag">파트너 알림</span><h3 class="h3">공지사항</h3><ul class="plist"><li><div><b>[공지] 설 연휴 배송 안내</b><small>02-03 · 운영팀</small></div></li><li><div><b>[공지] 2월 정산 일정</b><small>02-01 · 운영팀</small></div></li></ul></section>
        <section class="card sec-card"><div>${U.ic('shield')}<div><b>배송 정보는 발송할 때만</b><span>구매자 주소·연락처는 발송 대기 주문에서만 보이고, 송장 등록 후에는 가려집니다.</span></div></div></section>
      </div>`;
    return shell('brand', '', me, body);
  });

  const bt = { k: 'wait' };
  APP.resetPortalView = () => { sf.g = ''; bt.k = 'wait'; };
  APP.route(/^\/brand\/orders$/, () => {
    const s = S(), me = who('brand'); const mine = s.orders.filter((o) => o.bid === me.id && D.isAssigned(o)).sort((a, b) => (a.paid + a.time).localeCompare(b.paid + b.time));
    const wait = mine.filter((o) => o.status === '발송 대기'), moving = mine.filter((o) => ['송장 등록', '배송 중'].includes(o.status)).reverse(), done = mine.filter((o) => ['배송 완료', '취소', '반품 완료'].includes(o.status)).reverse();
    const tabs = `<div class="tabs"><a href="javascript:void 0" data-act="bt" data-k="wait" class="${bt.k === 'wait' ? 'on' : ''}">발송 대기 ${wait.length}</a><a href="javascript:void 0" data-act="bt" data-k="moving" class="${bt.k === 'moving' ? 'on' : ''}">송장 등록·배송 중 ${moving.length}</a><a href="javascript:void 0" data-act="bt" data-k="done" class="${bt.k === 'done' ? 'on' : ''}">완료·취소 ${done.length}</a></div>`;
    let body;
    if (bt.k === 'wait') body = tabs + `<section class="card"><header class="card-h"><div><h3>송장 입력</h3><p>발송에 필요한 배송 정보만 표시합니다 · 저장한 송장은 운영자의 채널 전송 대상에 포함됩니다</p></div><button class="btn sm line" data-act="b-xls">${U.ic('download')}발송 목록 엑셀</button></header>
      <div class="inv-list">${wait.map((o) => { const age = D.diff(T, o.paid); return `<article class="inv ${age >= 2 ? 'late' : ''}"><div class="inv-o"><span class="mono">${U.chDot(o.ch)} ${o.no}</span><b>${U.esc(APP.product(o.pid).name)} × ${o.qty}</b><small>${U.md(o.paid)} ${o.time} 결제${age >= 2 ? ' · <em>' + age + '일 경과</em>' : ''}</small></div><div class="inv-b"><b>${U.esc(o.buyer.name)}</b><small class="mono">${o.buyer.phone}</small><small>${U.esc(o.buyer.addr)}</small></div><div class="inv-f"><select id="c-${o.id}" aria-label="택배사">${D.CARRIERS.map((c) => `<option>${c}</option>`).join('')}</select><input id="n-${o.id}" placeholder="송장번호" inputmode="numeric" aria-label="송장번호"><button class="btn sm" data-act="b-inv" data-id="${o.id}">저장</button></div></article>`; }).join('') || U.empty('발송 대기 주문이 없습니다', 'check')}</div></section>`;
    else body = tabs + `<section class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>주문번호</th><th>결제</th><th>상품</th><th>구매자</th><th>배송지</th><th>송장</th><th>상태</th></tr></thead><tbody>
      ${(bt.k === 'moving' ? moving : done).slice(0, 60).map((o) => `<tr><td class="mono">${U.chDot(o.ch)} ${o.no}</td><td>${U.md(o.paid)}</td><td>${U.esc(APP.product(o.pid).name)} × ${o.qty}</td><td>${U.esc(U.maskName(o.buyer.name))}</td><td>${U.esc(U.maskAddr(o.buyer.addr))}</td><td>${o.inv ? U.esc(o.inv.carrier) + ' <small class="mono">' + o.inv.no + '</small>' : '—'}</td><td>${U.st(o.status)}</td></tr>`).join('')}
      </tbody></table></div><p class="muted small">${U.ic('lock')}송장 등록 이후 주문은 이름·상세 주소를 가리고, 연락처는 표시하지 않습니다.</p></section>`;
    return shell('brand', 'orders', me, body);
  });
  on('bt', (el) => { bt.k = el.dataset.k; APP.render(); });
  on('b-inv', (el) => {
    const o = APP.order(el.dataset.id), me = who('brand'); if (!o || o.bid !== me.id) return APP.toast('권한이 없는 주문입니다', 'warn');
    const n = (U.qs('#n-' + o.id).value || '').replace(/\D/g, '');
    if (n.length < 10 || n.length > 14) return APP.toast('송장번호는 숫자 10~14자리입니다', 'warn');
    if (S().orders.some((x) => x.inv && x.inv.no === n)) return APP.toast('이미 등록된 송장번호입니다', 'warn');
    o.inv = { carrier: U.qs('#c-' + o.id).value, no: n, sent: false, by: 'brand' }; o.status = '송장 등록';
    APP.toast('송장을 저장했습니다 — 채널 전송 대기'); APP.commit('브랜드 포털 송장 입력 ' + o.no, me.name);
  });
  on('b-xls', () => { const me = who('brand'); U.sheet('발송목록_' + me.name + '_' + T + '.xlsx', [['주문번호', '결제일', '상품', '수량', '받는분', '연락처', '주소', '택배사', '송장번호']].concat(S().orders.filter((o) => o.bid === me.id && o.status === '발송 대기' && D.isAssigned(o)).map((o) => [o.no, o.paid, APP.product(o.pid).name, o.qty, o.buyer.name, o.buyer.phone, o.buyer.addr, '', ''])), '발송'); APP.log('발송 목록 엑셀 다운로드 (배송 정보 포함)', me.name); APP.save(); APP.toast('발송 목록을 내려받았습니다 (다운로드 이력 기록)'); });

  /* 다른 셀러·브랜드 주문 주소 직접 접근 */
  APP.route(/^\/(seller|brand)\/x\/(.+)$/, (kind, what) => deny(kind, who(kind), '/' + kind + '/x/' + what));
})();
