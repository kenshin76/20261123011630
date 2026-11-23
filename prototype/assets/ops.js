/* 공구온 OPS [프로토타입] — 운영자 콘솔 화면 */
(function () {
  'use strict';
  const D = window.DATA, U = APP.U, S = () => APP.get();
  const T = D.TODAY, Y = D.add(D.TODAY, -1);
  const on = (name, fn) => APP.on(name, fn, name === 'stmt-xls' ? 'statement' : name === 'print' ? 'authenticated' : 'ops');
  const pct = (r) => Math.round(r * 100) + '%';

  /* =====================================================================
     대시보드
     ===================================================================== */
  APP.route(/^\/ops\/?$/, () => {
    const s = S(), cy = APP.calc(Y), issues = APP.issues();
    const todayOrders = s.orders.filter((o) => o.paid === T);
    const waiting = s.orders.filter((o) => o.status === '발송 대기').length;
    const regd = s.orders.filter((o) => o.status === '송장 등록').length;
    const draft = Object.keys(s.settle).filter((d) => ['draft', 'reviewed'].includes(s.settle[d].st));
    const confirmed = Object.keys(s.settle).filter((d) => s.settle[d].st === 'confirmed');
    const payDue = confirmed.concat(draft).reduce((a, d) => a + APP.calc(d).pay, 0);
    const rc = APP.reconState();
    const days = D.range(D.add(T, -14), Y);
    const series = days.map((d) => { const os = s.orders.filter((o) => o.paid === d && !(o.cancelAt && o.cancelAt <= d)); return { label: U.md(d), title: U.day(d), parts: [{ name: '스마트스토어', cls: 'c1', v: os.filter((o) => o.ch === 'SS').reduce((a, o) => a + o.price * o.qty, 0) }, { name: '스룩페이', cls: 'c2', v: os.filter((o) => o.ch === 'SL').reduce((a, o) => a + o.price * o.qty, 0) }] }; });
    const pipe = [
      { ic: 'cart', t: '주문 수집', v: todayOrders.length + '건', d: '스마트스토어 ' + s.collect.SS.last + (s.collect.SS.ok ? ' 정상' : ' 실패'), warn: !s.collect.SL.uploads[T] || !s.collect.SS.ok, w: !s.collect.SL.uploads[T] ? '스룩페이 엑셀 대기' : '', to: '#/ops/orders' },
      { ic: 'truck', t: '송장 매칭', v: waiting + '건', d: '발송 대기 · 전송 대기 ' + regd, warn: false, to: '#/ops/ship' },
      { ic: 'calc', t: '일 정산', v: draft.length ? U.md(draft[0]) : '완료', d: draft.length ? U.SETTLE[s.settle[draft[0]].st] + ' 상태' : '대기 없음', warn: draft.length > 0, w: draft.length ? '검토·확정 필요' : '', to: '#/ops/settle' },
      { ic: 'bank', t: '이체 파일', v: confirmed.length ? U.md(confirmed[0]) : '없음', d: confirmed.length ? '확정 · 파일 생성 대기' : '대기 없음', warn: confirmed.length > 0, w: confirmed.length ? '파일 생성 필요' : '', to: '#/ops/payout' },
      { ic: 'scale', t: '엑셀 대조', v: rc.notLoaded ? '대기' : rc.open ? rc.open + '건' : '통과', d: U.md(rc.day) + ' 병행 대조', warn: rc.notLoaded || rc.open > 0, w: rc.notLoaded ? '엑셀 결과 업로드' : rc.open ? '원인 분류 필요' : '', to: '#/ops/recon' },
      { ic: 'users', t: '포털 공개', v: s.sellers.filter((x) => x.status === '활성').length + s.brands.filter((x) => x.status === '활성').length + '계정', d: '확정 정산만 공개', warn: false, to: '#/seller' }
    ];
    const live = s.groups.filter((g) => APP.groupState(g) === '진행 중');
    const body = `
      <section class="hero-strip">
        <div><span class="eyebrow">${U.ic('spark')}운영 대시보드</span><h2>오늘의 운영 현황</h2><p>주문과 정산을 살펴보고, 확인이 필요한 업무를 처리하세요.</p></div>
        <a class="btn white" href="#/ops/inbox">${U.ic('inbox')}확인할 업무 ${issues.length}건</a>
      </section>
      <div class="kpis">
        ${U.kpi('어제 매출 (' + U.md(Y) + ')', U.won(cy.sales) + '<small>원</small>', cy.count + '건 · 셀러 ' + cy.lines.filter((l) => l.kind === 'S').length + ' · 브랜드 ' + cy.lines.filter((l) => l.kind === 'B').length, '', 'cart')}
        ${U.kpi('오늘 수집 주문', todayOrders.length + '<small>건</small>', '스마트스토어 ' + todayOrders.filter((o) => o.ch === 'SS').length + ' · 스룩페이 ' + todayOrders.filter((o) => o.ch === 'SL').length, '', 'zap')}
        ${U.kpi('지급 예정 금액', U.won(payDue) + '<small>원</small>', '확정 ' + confirmed.length + '일 · 작성/검토 ' + draft.length + '일', 'violet', 'bank')}
        ${U.kpi('확인 필요', issues.length + '<small>건</small>', '긴급 ' + issues.filter((x) => x.lv === 'high').length + '건', issues.filter((x) => x.lv === 'high').length ? 'hot' : '', 'alert')}
      </div>
      <div class="pipe">${pipe.map((p, i) => `<a class="pipe-step ${p.warn ? 'warn' : 'ok'}" href="${p.to}"><div class="pipe-ic">${U.ic(p.ic)}</div><span>${p.t}</span><strong>${p.v}</strong><small>${p.d}</small>${p.w ? `<em>${U.ic('alert')}${p.w}</em>` : `<em class="okk">${U.ic('check')}정상</em>`}${i < pipe.length - 1 ? '<i class="flow"></i>' : ''}</a>`).join('')}</div>
      <div class="grid2 dashboard-insights">
        <section class="card"><header class="card-h"><div><h3>일별 매출</h3><p>최근 14일 · 결제일 기준 · 취소 제외</p></div></header>${U.bars('dash-chart', series, { legend: [{ name: '스마트스토어', cls: 'c1' }, { name: '스룩페이', cls: 'c2' }], every: 2, label: '최근 14일 채널별 매출' })}</section>
        <section class="card"><header class="card-h"><div><h3>확인 필요</h3><p>긴급한 순서</p></div><a class="link" href="#/ops/inbox">전체 ${issues.length}건 ${U.ic('chev')}</a></header>
          <ul class="mini-issues">${issues.sort((a, b) => lvl(a) - lvl(b)).slice(0, 5).map(issueMini).join('') || '<li>' + U.empty('확인할 업무가 없습니다') + '</li>'}</ul></section>
      </div>
      <div class="grid2 dashboard-secondary">
        <section class="card"><header class="card-h"><div><h3>진행 중 공구</h3><p>${live.length}개 공구 · 공구 단위 수수료율·공급가 고정</p></div><a class="link" href="#/ops/products?tab=group">공구 관리 ${U.ic('chev')}</a></header>
          <div class="tbl-wrap"><table class="tbl"><thead><tr><th>공구</th><th>채널</th><th>기간</th><th class="r">판매</th><th class="r">매출</th></tr></thead><tbody>
          ${live.map((g) => { const os = s.orders.filter((o) => o.gid === g.id && !o.cancelAt); const span = D.diff(g.to, g.from) + 1, done = D.diff(T, g.from) + 1; return `<tr><td><b>${U.esc(g.title)}</b><small class="sub">${APP.seller(g.sid).handle} · ${U.esc(APP.brand(APP.product(g.pid).bid).name)} · 수수료 ${pct(g.rate)}</small></td><td>${U.chDot(g.ch)}</td><td><div class="prog"><i style="width:${Math.min(100, (done / span) * 100)}%"></i></div><small class="sub">${U.md(g.from)}~${U.md(g.to)} · D-${D.diff(g.to, T)}</small></td><td class="r">${os.reduce((a, o) => a + o.qty, 0)}개</td><td class="r num">${U.won(os.reduce((a, o) => a + o.price * o.qty, 0))}</td></tr>`; }).join('')}
          </tbody></table></div></section>
        <section class="card"><header class="card-h"><div><h3>엑셀 병행 운영</h3><p>전환 기준: 8영업일 동안 설명되지 않는 차이 0원</p></div><a class="link" href="#/ops/recon">대조 ${U.ic('chev')}</a></header>${APP.tracker()}
          <div class="note">${U.ic('shield')}<div><b>지난달 정산 재계산 확인 완료</b><span>2027-01 · 248행 · 차이 7건 모두 원인 승인</span></div></div></section>
      </div>`;
    return APP.ops('', { title: '대시보드', sub: '오늘 해야 할 일과 자동화 진행 상태', body }) + APP.demoBar();
  });
  const lvl = (x) => ({ high: 0, mid: 1, low: 2 }[x.lv]);
  function issueMini(x) { return `<li class="lv-${x.lv}">${U.ic(x.ic)}<div><b>${U.esc(x.t)}</b><small>${U.esc(x.cat)}</small></div>${x.act ? `<button class="btn xs" data-act="${x.act}" data-arg="${x.arg}">${x.btn}</button>` : `<a class="btn xs line" href="${x.to}">${x.btn}</a>`}</li>`; }
  APP.tracker = () => {
    const s = S(), rc = APP.reconState();
    return `<ol class="tracker">${D.PARALLEL.map((d, i) => { let st = 'todo', lab = '예정'; if (s.recon[d] && s.recon[d].done) { st = 'done'; lab = '통과'; } else if (d === rc.day) { st = 'now'; lab = rc.notLoaded ? '엑셀 대기' : rc.open ? '차이 ' + rc.open : '통과 대기'; } else if (d === T) { st = 'next'; lab = '내일 대조'; } return `<li class="${st}"><i>${st === 'done' ? U.ic('check') : i + 1}</i><b>${U.md(d)}</b><small>${lab}</small></li>`; }).join('')}</ol>`;
  };

  /* =====================================================================
     확인 필요
     ===================================================================== */
  APP.route(/^\/ops\/inbox(?:\?f=(.*))?$/, (f) => {
    const all = APP.issues().sort((a, b) => lvl(a) - lvl(b)); f = f ? decodeURIComponent(f) : '전체';
    const cats = ['전체'].concat(Array.from(new Set(all.map((x) => x.cat))));
    const list = all.filter((x) => f === '전체' || x.cat === f);
    const body = `<div class="chips">${cats.map((c) => `<a class="chip ${c === f ? 'on' : ''}" href="#/ops/inbox${c === '전체' ? '' : '?f=' + encodeURIComponent(c)}">${c}<i>${c === '전체' ? all.length : all.filter((x) => x.cat === c).length}</i></a>`).join('')}</div>
      <div class="issue-list">${list.map((x) => `<article class="issue lv-${x.lv}"><div class="issue-ic">${U.ic(x.ic)}</div><div class="issue-b"><span class="issue-cat">${x.cat}${x.lv === 'high' ? '<em>긴급</em>' : ''}</span><h4>${U.esc(x.t)}</h4><p>${U.esc(x.d)}</p></div>${x.act ? `<button class="btn" data-act="${x.act}" data-arg="${x.arg}">${x.btn}${U.ic('arrow')}</button>` : `<a class="btn" href="${x.to}">${x.btn}${U.ic('arrow')}</a>`}</article>`).join('') || U.empty('현재 확인할 업무가 없습니다.', 'check')}</div>
      <p class="foot-note">${U.ic('shield')}자동화가 처리하지 못한 일만 모읍니다. 처리하면 목록에서 자동으로 사라지고 변경 이력에 남습니다.</p>`;
    return APP.ops('inbox', { title: '확인 필요', sub: '확인이 필요한 주문·배송·정산 업무', body }) + APP.demoBar();
  });

  /* =====================================================================
     주문 장부
     ===================================================================== */
  function nextCollection(last, cycle) {
    const parts = last.split(':').map(Number), minutes = parseInt(cycle || '10', 10);
    const total = (parts[0] * 60 + parts[1] + minutes) % 1440;
    return String(Math.floor(total / 60)).padStart(2, '0') + ':' + String(total % 60).padStart(2, '0');
  }
  const OF = { ch: '', st: '', range: '7', q: '', more: 1 };
  function orderList() { const s = S();
    let list = s.orders.slice().sort((a, b) => (b.paid + b.time).localeCompare(a.paid + a.time));
    if (OF.ch) list = list.filter((o) => o.ch === OF.ch);
    if (OF.st) list = list.filter((o) => o.status === OF.st);
    if (OF.range !== 'all') list = list.filter((o) => D.diff(T, o.paid) < Number(OF.range));
    if (OF.q) { const q = OF.q.toLowerCase(); list = list.filter((o) => (o.no + o.buyer.name + APP.product(o.pid).name + (o.sid ? APP.seller(o.sid).handle : '')).toLowerCase().includes(q)); }
    return list;
  }
  APP.route(/^\/ops\/orders$/, () => {
    const s = S();
    const list = orderList();
    const shown = list.slice(0, 30 * OF.more);
    const ss = s.collect.SS, sl = s.collect.SL;
    const recDays = [Y, D.add(T, -2), D.add(T, -3)];
    const body = `
      <div class="grid2 chs">
        <section class="card chan ${ss.ok ? '' : 'bad'}"><div class="chan-h">${U.chDot('SS')}<div><h3>스마트스토어</h3><p>커머스API · ${U.esc(s.cycle || '10분')} 간격 자동 수집</p></div>${U.st(ss.ok ? '정상' : '수집 실패', ss.ok ? 'green' : 'red')}</div>
          <dl class="chan-kv"><div><dt>마지막 수집</dt><dd>${ss.last}</dd></div><div><dt>다음 수집</dt><dd>${ss.ok ? nextCollection(ss.last, s.cycle) : '수동 재수집 필요'}</dd></div><div><dt>오늘 수집</dt><dd>${s.orders.filter((o) => o.paid === T && o.ch === 'SS').length}건</dd></div><div><dt>중복 방지 키</dt><dd>채널+상품주문번호</dd></div></dl>
          <div class="chan-a"><button class="btn" data-act="collect">${U.ic('refresh')}지금 수집</button></div></section>
        <section class="card chan"><div class="chan-h">${U.chDot('SL')}<div><h3>스룩페이</h3><p>API 협의 중 → <b>주문 엑셀 업로드</b> 방식</p></div>${U.st(sl.uploads[T] ? '오늘 업로드 완료' : '오늘 업로드 대기', sl.uploads[T] ? 'green' : 'amber')}</div>
          <dl class="chan-kv"><div><dt>마지막 업로드</dt><dd>${sl.last}</dd></div><div><dt>열 매핑</dt><dd>저장됨 (10개 열)</dd></div><div><dt>오늘 반영</dt><dd>${s.orders.filter((o) => o.paid === T && o.ch === 'SL').length}건</dd></div><div><dt>API 전환</dt><dd>엑셀 방식으로 운영 중</dd></div></dl>
          <div class="chan-a"><button class="btn" data-act="sl-upload">${U.ic('upload')}주문 엑셀 업로드</button></div></section>
      </div>
      <section class="card"><header class="card-h"><div><h3>채널 원본 ↔ 장부 일일 대사</h3><p>누락·중복을 매일 자동으로 확인합니다</p></div></header>
        <div class="recon-strip">${recDays.map((d) => ['SS', 'SL'].map((c) => { const n = s.orders.filter((o) => o.paid === d && o.ch === c).length; return `<div class="rs">${U.chDot(c)}<b>${U.md(d)}</b><span>원본 ${n} · 장부 ${n}</span>${U.st('일치', 'green')}</div>`; }).join('')).join('')}</div></section>
      <section class="card"><header class="card-h"><div><h3>통합 주문 장부</h3><p>${U.num(list.length)}건 · 모든 채널 주문이 한 장부에 모입니다</p></div><button class="btn sm line" data-act="orders-xls">${U.ic('download')}엑셀</button></header>
        <div class="filters">
          <select data-change="of" data-k="ch" aria-label="채널"><option value="">전체 채널</option><option value="SS" ${OF.ch === 'SS' ? 'selected' : ''}>스마트스토어</option><option value="SL" ${OF.ch === 'SL' ? 'selected' : ''}>스룩페이</option></select>
          <select data-change="of" data-k="st" aria-label="상태"><option value="">전체 상태</option>${['발송 대기', '송장 등록', '배송 중', '배송 완료', '취소', '반품 완료'].map((x) => `<option ${OF.st === x ? 'selected' : ''}>${x}</option>`).join('')}</select>
          <select data-change="of" data-k="range" aria-label="기간">${[['1', '오늘'], ['2', '최근 2일'], ['7', '최근 7일'], ['all', '전체']].map(([v, l]) => `<option value="${v}" ${OF.range === v ? 'selected' : ''}>${l}</option>`).join('')}</select>
          <label class="search">${U.ic('search')}<input data-change="of" data-k="q" value="${U.esc(OF.q)}" aria-label="주문 검색" placeholder="주문번호·구매자·상품·셀러 검색 후 Enter"></label>
        </div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>채널</th><th>주문번호</th><th>결제</th><th>공구 · 셀러</th><th>상품</th><th class="r">금액</th><th>상태</th><th>수집</th></tr></thead><tbody>
        ${shown.map((o) => `<tr class="${D.isAssigned(o) ? '' : 'hl'}"><td>${U.chDot(o.ch)}</td><td class="mono">${o.no}</td><td>${U.md(o.paid)} <small class="sub">${o.time}</small></td><td>${o.gid ? `<b>${APP.seller(o.sid).handle}</b><small class="sub">${U.esc(APP.group(o.gid).title)}</small>` : D.isGeneral(o) ? `<b>일반 판매</b><small class="sub">셀러 수수료 없음 · 브랜드 공급가 정산</small>` : `<button class="btn xs warn" data-act="link-order" data-arg="${o.id}">${U.ic('link')}공구 미연결</button>`}</td><td>${U.esc(APP.product(o.pid).name)} <small class="sub">× ${o.qty}</small></td><td class="r num">${U.won(o.price * o.qty)}</td><td>${U.st(o.status)}${o.cancelAt ? `<small class="sub">${U.md(o.cancelAt)} ${o.cancelType}</small>` : ''}</td><td><span class="src">${o.src}</span></td></tr>`).join('')}
        </tbody></table></div>${list.length > shown.length ? `<button class="btn line block" data-act="of-more">더 보기 (${U.num(list.length - shown.length)}건)</button>` : ''}</section>`;
    return APP.ops('orders', { title: '주문 장부', sub: '판매 채널별 주문과 수집 상태를 한곳에서 확인하세요', body }) + APP.demoBar();
  });
  on('of', (el) => { OF[el.dataset.k] = el.value; OF.more = 1; APP.render(); });
  on('of-more', () => { OF.more++; APP.render(); });
  on('orders-xls', () => { const s = S(); U.sheet('통합주문장부_' + T + '.xlsx', [['채널', '주문번호', '결제일', '결제시각', '공구', '셀러', '브랜드', '상품', '수량', '금액', '상태', '구매자']].concat(orderList().map((o) => [D.CH[o.ch].name, o.no, o.paid, o.time, o.gid ? APP.group(o.gid).title : D.isGeneral(o) ? '일반 판매' : '미연결', o.sid ? APP.seller(o.sid).handle : '', APP.brand(o.bid).name, APP.product(o.pid).name, o.qty, o.price * o.qty, o.status, U.maskName(o.buyer.name)])), '주문'); APP.toast('주문 장부를 내려받았습니다 (구매자명 가림)'); });

  function newOrder(g, time, src) {
    const s = S(), p = APP.product(g.pid);
    let n = Math.max(s.orders.length, Number.isSafeInteger(s.demoOrderSeq) ? s.demoOrderSeq : 0), no, id;
    do {
      n++;
      no = g.ch === 'SS' ? '20270204' + (1590000 + n) : 'SL-20270204-' + String(800 + n).padStart(4, '0');
      id = 'demo-' + g.ch + '-' + n;
    } while (s.orders.some((o) => (o.ch === g.ch && o.no === no) || o.id === id));
    s.demoOrderSeq = n;
    const names = ['윤서아', '임도윤', '장하율', '송지호', '권나은', '황민서', '오지안'];
    return { id, ch: g.ch, gid: g.id, pid: g.pid, sid: g.sid, bid: p.bid, no, qty: 1 + (n % 3 === 0 ? 1 : 0), settleRate: g.rate, price: p.price, supply: p.supply, paid: T, time, buyer: { name: names[n % names.length], phone: '010-' + (3000 + (n * 37) % 6000) + '-' + (1000 + (n * 91) % 8000), addr: '서울 마포구 양화로 ' + (10 + (n % 80)) }, status: '발송 대기', inv: null, cancelAt: null, cancelType: null, src };
  }
  on('collect', () => {
    const steps = ['토큰 확인 (전자서명 인증)', '변경된 주문 조회 (09:40 ~ 09:52)', '상품주문 상세 조회', '「채널+상품주문번호」 중복 제외', '취소·반품 상태 동기화', '통합 장부 반영'];
    const w = APP.modal({ title: '스마트스토어 주문 수집', sub: '커머스API 수집 과정을 체험용으로 재현합니다', body: `<ol class="run">${steps.map((t) => `<li>${U.ic('check')}<span>${t}</span></li>`).join('')}</ol><div class="run-res"></div>` });
    const lis = w.querySelectorAll('.run li'); let i = 0;
    const tick = () => {
      if (!document.getElementById('modal')) return;
      if (i > 0) lis[i - 1].className = 'done';
      if (i < lis.length) { lis[i].className = 'doing'; i++; APP.defer(tick, 380); return; }
      const s = S(); const gs = s.groups.filter((g) => g.ch === 'SS' && APP.groupState(g) === '진행 중');
      const before = s.orders.filter((o) => o.paid === T && o.ch === 'SS').length;
      const add = gs.slice(0, 3).map((g, k) => newOrder(g, '09:' + (44 + k * 3), 'API'));
      s.orders.push(...add); s.collect.SS = Object.assign(s.collect.SS, { ok: true, fails: 0, last: '09:52' });
      w.querySelector('.run-res').innerHTML = `<div class="res-grid"><div><span>조회</span><b>${before + add.length}</b></div><div class="g"><span>신규 반영</span><b>${add.length}</b></div><div><span>중복 제외</span><b>${before}</b></div><div><span>상태 변경</span><b>0</b></div></div><p class="hint">${U.ic('shield')}이미 장부에 있는 ${before}건은 같은 상품주문번호로 확인되어 다시 넣지 않았습니다.</p><div class="modal-actions"><button class="btn" data-act="close">확인</button></div>`;
      APP.log('스마트스토어 수동 수집 — 신규 ' + add.length + '건, 중복 제외 ' + before + '건', '김운영'); APP.save(); APP.render();
    };
    tick();
  });
  on('collect-fail', () => {
    const w = APP.modal({ title: '수집 실패 상황 재현', sub: '채널 응답 지연을 가정합니다 — 자동 재시도 후 운영자 알림', body: '<ol class="run fail"><li>1차 시도 — 응답 시간 초과</li><li>2차 재시도 (30초 후) — 응답 시간 초과</li><li>3차 재시도 (2분 후) — 응답 시간 초과</li><li>운영자 알림 · 「확인 필요」 등록</li></ol><div class="run-res"></div>' });
    const lis = w.querySelectorAll('.run li'); let i = 0;
    const tick = () => { if (!document.getElementById('modal')) return; if (i < lis.length) { lis[i].className = i === lis.length - 1 ? 'warn' : 'bad'; i++; APP.defer(tick, 420); return; } const s = S(); s.collect.SS.ok = false; s.collect.SS.fails = 3; APP.log('스마트스토어 수집 실패 — 자동 재시도 3회 소진, 운영자 알림', '시스템'); APP.save(); APP.render(); w.querySelector('.run-res').innerHTML = `<p class="hint warn">${U.ic('alert')}실패 구간(09:40~)은 기록되어 있어, 다음 수집 때 빠짐없이 다시 조회합니다. 「지금 수집」으로 복구해 보세요.</p><div class="modal-actions"><button class="btn" data-act="close">확인</button></div>`; };
    tick();
  });

  /* 스룩페이 주문 엑셀 업로드 (3단계) */
  on('sl-upload', () => slStep(1));
  function slRows() {
    const s = S(); const gs = s.groups.filter((g) => g.ch === 'SL' && APP.groupState(g) === '진행 중');
    const dup = s.orders.filter((o) => o.ch === 'SL' && o.paid === Y && !o.cancelAt && !o.story).slice(0, 3);
    const rows = [];
    gs.forEach((g, i) => { for (let k = 0; k < (i === 0 ? 3 : 2); k++) rows.push({ type: 'new', g, time: '0' + (6 + k) + ':' + (10 + i * 7 + k * 11) }); });
    dup.forEach((o) => rows.push({ type: 'dup', o }));
    const cx = s.orders.find((o) => o.ch === 'SL' && o.paid === Y && !o.cancelAt && !o.story && !dup.includes(o));
    if (cx) rows.push({ type: 'cancel', o: cx });
    rows.push({ type: 'err', no: 'SL-20270204-07?? ', msg: '결제금액 「32,OOO」 숫자 형식 오류 → 제외 후 원본 확인' });
    return rows;
  }
  function slStep(n, fname) {
    const steps = ['파일 선택', '열 매핑', '검증 리포트'];
    const head = `<ol class="stepper">${steps.map((t, i) => `<li class="${i + 1 < n ? 'done' : i + 1 === n ? 'on' : ''}"><i>${i + 1 < n ? U.ic('check') : i + 1}</i>${t}</li>`).join('')}</ol>`;
    if (n === 1) return APP.modal({ title: '스룩페이 주문 엑셀 업로드', sub: '판매자센터에서 내려받은 주문 파일을 그대로 올립니다', wide: true, body: head + `<label class="drop"><input type="file" accept=".xlsx,.xls,.csv" data-change="sl-file">${U.ic('upload')}<b>주문 엑셀 파일을 끌어 놓거나 선택</b><small>체험판은 파일 내용을 읽지 않고 아래 샘플 내용으로 검증합니다</small></label><button class="btn line block" data-act="sl-next" data-n="2" data-f="sluk_orders_20270204.xlsx">${U.ic('file')}샘플 파일로 진행 — sluk_orders_20270204.xlsx</button>` });
    if (n === 2) {
      const map = [['주문번호', '주문번호 (중복 키)'], ['결제일시', '결제일시'], ['상품명', '상품 (통합 상품 연결)'], ['옵션정보', '옵션'], ['수량', '수량'], ['결제금액', '금액'], ['수령인', '구매자'], ['수령인연락처', '연락처'], ['배송지', '주소'], ['주문상태', '상태 (취소·반품 동기화)']];
      return APP.modal({ title: '스룩페이 주문 엑셀 업로드', sub: U.esc(fname || ''), wide: true, body: head + `<div class="note">${U.ic('check')}<div><b>저장된 열 매핑을 적용했습니다</b><span>2027-01-23 최초 설정 · 파일 양식이 바뀌면 이 화면에서 다시 연결합니다</span></div></div><div class="tbl-wrap"><table class="tbl map"><thead><tr><th>파일의 열</th><th></th><th>장부 항목</th></tr></thead><tbody>${map.map(([a, b]) => `<tr><td><span class="code">${a}</span></td><td>${U.ic('arrow')}</td><td>${b}</td></tr>`).join('')}</tbody></table></div>`, foot: `<button class="btn line" data-act="sl-next" data-n="1">이전</button><button class="btn" data-act="sl-next" data-n="3" data-f="${U.esc(fname || '')}">검증 실행</button>` });
    }
    const rows = slRows(); APP.slPending = rows;
    const c = (t) => rows.filter((r) => r.type === t).length;
    return APP.modal({ title: '스룩페이 주문 엑셀 업로드', sub: '검증 결과를 확인한 뒤 장부에 반영합니다', wide: true, body: head + `<div class="res-grid"><div><span>전체 행</span><b>${rows.length}</b></div><div class="g"><span>신규</span><b>${c('new')}</b></div><div><span>중복 제외</span><b>${c('dup')}</b></div><div class="b"><span>상태 변경</span><b>${c('cancel')}</b></div><div class="r"><span>오류</span><b>${c('err')}</b></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>결과</th><th>주문번호</th><th>내용</th></tr></thead><tbody>${rows.map((r) => r.type === 'new' ? `<tr><td>${U.st('신규', 'green')}</td><td class="mono">자동 부여</td><td>${U.esc(APP.product(r.g.pid).name)} · ${APP.seller(r.g.sid).handle} 공구 · ${r.time}</td></tr>` : r.type === 'dup' ? `<tr><td>${U.st('중복', 'gray')}</td><td class="mono">${r.o.no}</td><td>이미 장부에 있음 (${U.md(r.o.paid)} 업로드분) — 다시 넣지 않음</td></tr>` : r.type === 'cancel' ? `<tr><td>${U.st('취소', 'blue')}</td><td class="mono">${r.o.no}</td><td>${U.md(r.o.paid)} 결제 → 오늘 취소 · 이미 계산된 정산은 오늘 정산의 조정 항목으로 차감</td></tr>` : `<tr class="hl"><td>${U.st('오류', 'red')}</td><td class="mono">${U.esc(r.no)}</td><td>${U.esc(r.msg)}</td></tr>`).join('')}</tbody></table></div>`, foot: `<button class="btn line" data-act="close">취소</button><button class="btn" data-act="sl-apply">장부 반영 (신규 ${c('new')} · 상태 변경 ${c('cancel')})</button>` });
  }
  on('sl-next', (el) => slStep(Number(el.dataset.n), el.dataset.f));
  on('sl-file', (el) => { const f = el.files && el.files[0]; slStep(2, f ? f.name + ' (샘플 내용으로 검증)' : ''); });
  on('sl-apply', () => {
    const s = S(), rows = APP.slPending || []; let n = 0, c = 0;
    rows.forEach((r) => { if (r.type === 'new') { s.orders.push(newOrder(r.g, r.time, '엑셀')); n++; } if (r.type === 'cancel') { r.o.cancelAt = T; r.o.cancelType = '취소'; r.o.status = '취소'; r.o.inv = null; c++; } });
    s.collect.SL.uploads[T] = true; s.collect.SL.last = '02-04 09:46';
    APP.close(); APP.toast('스룩페이 주문 ' + n + '건 반영, 취소 ' + c + '건 동기화');
    APP.commit('스룩페이 주문 엑셀 업로드 — 신규 ' + n + ', 중복 제외 ' + rows.filter((r) => r.type === 'dup').length + ', 취소 ' + c + ', 오류 1(제외)');
  });

  /* =====================================================================
     상품·공구
     ===================================================================== */
  const sel = new Set();
  APP.route(/^\/ops\/products(?:\?tab=(\w+))?$/, (tab) => {
    const s = S(); tab = tab || 'prod';
    const tabs = `<div class="tabs"><a href="#/ops/products" class="${tab === 'prod' ? 'on' : ''}">통합 상품</a><a href="#/ops/products?tab=group" class="${tab === 'group' ? 'on' : ''}">공구 일정·조건</a><a href="#/ops/products?tab=rule" class="${tab === 'rule' ? 'on' : ''}">몰별 변환 규칙</a></div>`;
    let body = '';
    if (tab === 'prod') {
      const mallCell = (p, c) => { const m = p.mall[c]; const cls = { '판매중': 'green', '미등록': 'gray', '업로드 대기': 'amber', '등록 오류': 'red', '등록 중': 'blue' }[m.st]; return `<div class="mall">${U.chDot(c)}${U.st(m.st, cls)}${m.no ? `<small class="mono">${m.no}</small>` : ''}${m.err ? `<small class="err">${U.esc(m.err)}</small>` : ''}</div>`; };
      body = tabs + `<section class="card"><header class="card-h"><div><h3>통합 상품 ${s.products.length}개</h3><p>옵션·가격·재고·이미지를 한곳에서 관리하고 몰별 규칙으로 변환해 등록합니다</p></div>
        <div class="bulk"><span>${sel.size}개 선택</span><button class="btn sm" data-act="reg-ss" ${sel.size ? '' : 'disabled'}>${U.chDot('SS')}API 등록</button><button class="btn sm line" data-act="reg-sl" ${sel.size ? '' : 'disabled'}>${U.chDot('SL')}업로드 엑셀 생성</button><button class="btn sm line" data-act="bulk-edit" ${sel.size ? '' : 'disabled'}>가격·재고 일괄 수정</button></div></header>
        <div class="tbl-wrap"><table class="tbl prod"><thead><tr><th><input type="checkbox" data-change="sel-all" ${sel.size === s.products.length ? 'checked' : ''} aria-label="전체 선택"></th><th>상품</th><th>브랜드</th><th class="r">판매가 / 공급가</th><th class="r">재고</th><th>고시정보</th><th>스마트스토어</th><th>스룩페이</th></tr></thead><tbody>
        ${s.products.map((p) => `<tr><td><input type="checkbox" data-change="sel" data-id="${p.id}" ${sel.has(p.id) ? 'checked' : ''} aria-label="선택"></td><td><div class="pcell">${U.thumb(p)}<div><b>${U.esc(p.name)}</b><small class="sub">${U.esc(p.opt)} · ${U.esc(p.cat)}</small></div></div></td><td>${U.esc(APP.brand(p.bid).name)}</td><td class="r num">${U.won(p.price)}<small class="sub">${U.won(p.supply)}</small></td><td class="r num">${U.num(p.stock)}</td><td>${p.notice ? U.st('완료', 'green') : `<button class="btn xs warn" data-act="fix-notice" data-id="${p.id}">보완 필요</button>`}</td><td>${mallCell(p, 'SS')}</td><td>${mallCell(p, 'SL')}${p.mall.SL.st === '업로드 대기' ? `<button class="btn xs line" data-act="sl-result" data-id="${p.id}">등록 결과 반영</button>` : ''}</td></tr>`).join('')}
        </tbody></table></div></section>
        <p class="foot-note">${U.ic('shield')}스룩페이 상품은 업로드 엑셀을 생성해 판매자센터에 등록한 뒤, 처리 결과를 확인해 연결하세요.</p>`;
    } else if (tab === 'group') {
      body = tabs + `<section class="card"><header class="card-h"><div><h3>공구 일정·조건</h3><p>셀러·브랜드·상품·기간·수수료율 — 정산의 기준이 되는 조건입니다</p></div><button class="btn sm" data-act="group-new">${U.ic('plus')}공구 등록</button></header>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>상태</th><th>공구</th><th>셀러</th><th>상품 · 브랜드</th><th>채널</th><th>기간</th><th class="r">셀러 수수료</th><th class="r">공급가</th><th class="r">판매</th></tr></thead><tbody>
        ${s.groups.map((g) => { const p = APP.product(g.pid), st = APP.groupState(g); const os = s.orders.filter((o) => o.gid === g.id && !o.cancelAt); return `<tr><td>${U.st(st, st === '진행 중' ? 'violet' : st === '예정' ? 'blue' : 'gray')}</td><td><b>${U.esc(g.title)}</b></td><td>${APP.seller(g.sid).handle}<small class="sub">${APP.seller(g.sid).type}</small></td><td>${U.esc(p.name)}<small class="sub">${U.esc(APP.brand(p.bid).name)}</small></td><td>${U.chDot(g.ch)}</td><td>${U.md(g.from)} ~ ${U.md(g.to)}</td><td class="r num">${pct(g.rate)}</td><td class="r num">${U.won(p.supply)}</td><td class="r">${os.reduce((a, o) => a + o.qty, 0)}개</td></tr>`; }).join('')}
        </tbody></table></div></section>
        <div class="note">${U.ic('lock')}<div><b>공구 조건은 공구 단위로 고정됩니다</b><span>수수료율·공급가를 바꾸면 이후 주문부터 적용되고, 이미 확정된 정산은 바뀌지 않습니다. 변경 내역은 이력에 남습니다.</span></div></div>`;
    } else {
      body = tabs + `<section class="card"><header class="card-h"><div><h3>몰별 변환 규칙</h3><p>통합 상품 정보를 채널 양식으로 바꾸는 규칙 — 코드가 아닌 데이터로 관리</p></div></header>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>통합 카테고리</th><th>${U.chDot('SS')} 스마트스토어 카테고리</th><th>${U.chDot('SL')} 스룩페이 카테고리</th><th>고시정보 템플릿</th></tr></thead><tbody>
        ${[['주방>프라이팬', '생활/건강 > 주방용품 > 프라이팬', '리빙 > 주방 > 조리기구', '주방용품'], ['주방>조리도구', '생활/건강 > 주방용품 > 조리도구', '리빙 > 주방 > 조리도구', '주방용품'], ['침구>이불', '가구/인테리어 > 침구단품 > 이불', '리빙 > 침구 > 이불', '침구류'], ['생활>욕실', '생활/건강 > 욕실용품 > 발매트', '리빙 > 욕실 > 매트', '기타 재화'], ['뷰티>앰플', '화장품/미용 > 스킨케어 > 에센스', '뷰티 > 스킨케어 > 앰플', '화장품'], ['식품>닭가슴살', '식품 > 축산물 > 닭가슴살', '푸드 > 건강식 > 닭가슴살', '가공식품']].map((r) => `<tr><td><span class="code">${r[0]}</span></td><td>${r[1]}</td><td>${r[2]}</td><td>${U.st(r[3], 'blue')}</td></tr>`).join('')}
        </tbody></table></div></section>
        <div class="grid2"><section class="card"><h3 class="h3">옵션 표기 규칙</h3><ul class="dots"><li>통합 옵션 「색상 / 크기」 → 스마트스토어 조합형 옵션</li><li>스룩페이는 단독형 옵션 열 「옵션명:값」 형식으로 변환</li><li>옵션별 재고는 통합 재고에서 채널별 할당량으로 나눠 반영</li></ul></section>
        <section class="card"><h3 class="h3">채널 적용 안내</h3><ul class="dots"><li>스마트스토어는 채널의 카테고리와 필수 고시정보에 맞춰 등록합니다.</li><li>스룩페이는 현재 제공되는 상품 업로드 양식을 사용합니다.</li><li>데모의 카테고리 경로는 실제 판매자 계정의 설정과 다를 수 있습니다.</li></ul></section></div>`;
    }
    return APP.ops('products', { title: '상품·공구', sub: '멀티몰 상품 등록과 공구 조건 관리', body }) + APP.demoBar();
  });
  on('sel', (el) => { el.checked ? sel.add(el.dataset.id) : sel.delete(el.dataset.id); APP.render(); });
  on('sel-all', (el) => { S().products.forEach((p) => (el.checked ? sel.add(p.id) : sel.delete(p.id))); APP.render(); });
  on('fix-notice', (el) => {
    const p = APP.product(el.dataset.id);
    APP.modal({ title: '상품정보제공고시 보완 — ' + p.name, sub: '「기타 재화」 템플릿의 필수 항목입니다', body: `<div class="form"><label>품명 및 모델명<input value="${U.esc(p.name)}"></label><label>제조국<input id="fn-c" placeholder="예: 대한민국"></label><label>제조자 / 수입자<input value="${U.esc(APP.brand(p.bid).name)}"></label><label>A/S 책임자와 전화번호<input value="${U.esc(APP.brand(p.bid).name)} 고객센터 1588-0000"></label></div>`, foot: '<button class="btn line" data-act="close">취소</button><button class="btn" data-act="fix-notice-save" data-id="' + p.id + '">저장</button>' });
  });
  on('fix-notice-save', (el) => { const v = (U.qs('#fn-c') || {}).value; if (!v || !v.trim()) return APP.toast('제조국을 입력해 주세요', 'warn'); const p = APP.product(el.dataset.id); p.notice = true; if (p.mall.SS.st === '등록 오류') { p.mall.SS = { st: '미등록' }; } APP.close(); APP.toast('고시정보를 보완했습니다. 다시 등록해 보세요'); APP.commit(p.name + ' 고시정보 보완 (제조국)'); });
  on('reg-ss', () => {
    const ps = Array.from(sel).map(APP.product); const ok = [], bad = [], skip = [];
    ps.forEach((p) => { if (p.mall.SS.st === '판매중') skip.push(p); else if (!p.notice) { p.mall.SS = { st: '등록 오류', err: '상품정보제공고시 「제조국」 누락' }; bad.push(p); } else { p.mall.SS = { st: '판매중', no: '98100' + (24000 + Math.floor(Math.random() * 900)) }; ok.push(p); } });
    APP.modal({ title: '스마트스토어 API 등록 결과', body: `<div class="res-grid"><div class="g"><span>등록 성공</span><b>${ok.length}</b></div><div class="r"><span>오류</span><b>${bad.length}</b></div><div><span>이미 판매 중</span><b>${skip.length}</b></div></div>${bad.length ? `<p class="hint warn">${U.ic('alert')}${bad.map((p) => U.esc(p.name)).join(', ')} — 고시정보 누락. 「보완 필요」를 눌러 채운 뒤 다시 등록하세요.</p>` : ''}${ok.length ? `<p class="hint">${U.ic('check')}${ok.map((p) => U.esc(p.name) + ' → 상품번호 ' + p.mall.SS.no).join('<br>')}</p>` : ''}`, foot: '<button class="btn" data-act="close">확인</button>' });
    sel.clear(); APP.commit('스마트스토어 상품 등록 — 성공 ' + ok.length + ', 오류 ' + bad.length);
  });
  on('reg-sl', () => {
    const ps = Array.from(sel).map(APP.product);
    U.sheet('스룩페이_상품업로드_' + T + '.xlsx', [['판매자상품코드', '카테고리', '상품명', '옵션(옵션명:값)', '판매가', '재고', '고시정보 유형', '브랜드']].concat(ps.map((p) => [p.id.toUpperCase(), p.cat.replace('>', ' > '), p.name, '옵션:' + p.opt, p.price, p.stock, p.notice ? '입력 완료' : '보완 필요', APP.brand(p.bid).name])), '상품');
    ps.forEach((p) => { if (p.mall.SL.st !== '판매중') p.mall.SL = { st: '업로드 대기' }; });
    sel.clear(); APP.toast('스룩페이 업로드용 엑셀을 만들었습니다 (예시 양식)'); APP.commit('스룩페이 상품 업로드 엑셀 생성 — ' + ps.length + '개');
  });
  on('sl-result', (el) => { const p = APP.product(el.dataset.id); p.mall.SL = { st: '판매중', no: 'SL-P-3' + (1000 + Math.floor(Math.random() * 8999)) }; APP.toast('등록 결과 파일에서 상품번호를 연결했습니다'); APP.commit(p.name + ' 스룩페이 상품번호 연결 ' + p.mall.SL.no); });
  on('bulk-edit', () => {
    const ps = Array.from(sel).map(APP.product);
    APP.modal({ title: '가격·재고 일괄 수정', sub: '스마트스토어는 API 전송 방식, 스룩페이는 수정 엑셀 업로드 방식입니다. 데모는 외부 전송을 실행하지 않습니다.', wide: true, body: `<div class="tbl-wrap" tabindex="0" aria-label="상품별 판매가와 재고 입력 표"><table class="tbl bulk-prices"><thead><tr><th>상품</th><th>판매가</th><th>재고</th></tr></thead><tbody>${ps.map((p) => `<tr><td>${U.esc(p.name)}</td><td><input class="in-num" data-bp="${p.id}" aria-label="${U.esc(p.name)} 판매가" value="${p.price}" inputmode="numeric"></td><td><input class="in-num" data-bs="${p.id}" aria-label="${U.esc(p.name)} 재고" value="${p.stock}" inputmode="numeric"></td></tr>`).join('')}</tbody></table></div><p class="hint">${U.ic('lock')}판매가를 바꿔도 진행 중 공구의 셀러 수수료율·공급가는 그대로입니다.</p>`, foot: '<button class="btn line" data-act="close">취소</button><button class="btn" data-act="bulk-save">저장 · 채널 반영</button>' });
  });
  on('bulk-save', () => {
    let bad = false, n = 0;
    U.qsa('[data-bp]').forEach((i) => { const v = i.value.replace(/,/g, ''); if (!/^\d{3,8}$/.test(v) || Number(v) < 100) bad = true; });
    U.qsa('[data-bs]').forEach((i) => { if (!/^\d{1,6}$/.test(i.value.replace(/,/g, ''))) bad = true; });
    if (bad) return APP.toast('판매가는 100~99,999,999원, 재고는 0~999,999개의 정수로 입력해 주세요', 'warn');
    U.qsa('[data-bp]').forEach((i) => { const p = APP.product(i.dataset.bp); const np = Number(i.value.replace(/,/g, '')), ns = Number(U.qs('[data-bs="' + p.id + '"]').value.replace(/,/g, '')); if (np !== p.price || ns !== p.stock) n++; p.price = np; p.stock = ns; });
    sel.clear(); APP.close(); APP.toast(n + '개 상품을 수정해 채널에 반영했습니다'); APP.commit('가격·재고 일괄 수정 ' + n + '개 — 스마트스토어 API 반영, 스룩페이 수정 엑셀 생성');
  });
  on('group-new', () => {
    const s = S();
    APP.modal({ title: '공구 등록', sub: '이 조건이 해당 공구 주문의 정산 기준이 됩니다', body: `<div class="form two">
      <label>셀러<select id="gn-s">${s.sellers.filter((x) => x.status === '활성').map((x) => `<option value="${x.id}">${x.handle} ${x.name}</option>`).join('')}</select></label>
      <label>상품<select id="gn-p">${s.products.map((p) => `<option value="${p.id}">${U.esc(p.name)} (${U.esc(APP.brand(p.bid).name)})</option>`).join('')}</select></label>
      <label>판매 채널<select id="gn-c"><option value="SS">스마트스토어</option><option value="SL">스룩페이</option></select></label>
      <label>셀러 수수료율 (%)<input id="gn-r" value="15" inputmode="decimal"></label>
      <label>시작일<input id="gn-f" type="date" value="${D.add(T, 3)}"></label><label>종료일<input id="gn-t" type="date" value="${D.add(T, 13)}"></label>
      <label class="full">공구명<input id="gn-n" placeholder="예: 봄맞이 침구 공구"></label></div>`, foot: '<button class="btn line" data-act="close">취소</button><button class="btn" data-act="group-save">등록</button>' });
  });
  on('group-save', () => {
    const v = (id) => (U.qs('#' + id) || {}).value || ''; const r = Number(v('gn-r'));
    if (!v('gn-n').trim()) return APP.toast('공구명을 입력해 주세요', 'warn');
    if (!(r > 0 && r <= 50)) return APP.toast('수수료율은 0보다 크고 50% 이하로 입력해 주세요', 'warn');
    if (!v('gn-f') || !v('gn-t') || v('gn-t') < v('gn-f')) return APP.toast('기간을 확인해 주세요', 'warn');
    const s = S(); const g = { id: 'g' + (s.groups.length + 1), sid: v('gn-s'), pid: v('gn-p'), ch: v('gn-c'), from: v('gn-f'), to: v('gn-t'), rate: Math.round(r * 10) / 1000, title: v('gn-n').trim().slice(0, 40) };
    s.groups.push(g); APP.close(); APP.toast('공구를 등록했습니다'); APP.commit('공구 등록 — ' + g.title + ' (수수료 ' + r + '%)');
  });

  /* =====================================================================
     배송·송장
     ===================================================================== */
  APP.route(/^\/ops\/ship$/, () => {
    const s = S();
    const wait = s.orders.filter((o) => o.status === '발송 대기' && D.isAssigned(o));
    const reg = s.orders.filter((o) => o.status === '송장 등록');
    const up = s.shipUpload;
    const byBrand = s.brands.filter((b) => b.status === '활성').map((b) => ({ b, os: wait.filter((o) => o.bid === b.id) })).filter((x) => x.os.length);
    const body = `
      <div class="kpis">${U.kpi('발송 대기', wait.length + '<small>건</small>', '2일 경과 ' + wait.filter((o) => D.diff(T, o.paid) >= 2).length + '건', wait.filter((o) => D.diff(T, o.paid) >= 2).length ? 'hot' : '', 'truck')}${U.kpi('송장 등록 · 전송 대기', reg.length + '<small>건</small>', '채널로 보내면 배송 중으로 변경', 'violet', 'upload')}${U.kpi('송장 불일치', (up ? up.rows.filter((r) => r.err && !r.done).length : 0) + '<small>건</small>', '업로드 파일 기준', '', 'alert')}${U.kpi('브랜드 직접 입력', s.orders.filter((o) => o.inv && o.inv.by === 'brand').length + '<small>건</small>', '브랜드 포털에서 입력', '', 'users')}</div>
      <div class="grid2">
        <section class="card"><header class="card-h"><div><h3>송장 엑셀 일괄 업로드</h3><p>주문번호·택배사·송장번호 — 형식 → 주문 존재 → 중복 → 상태 순서로 검증</p></div></header>
          ${up ? shipResult(up) : `<label class="drop"><input type="file" accept=".xlsx,.csv" data-change="ship-file">${U.ic('upload')}<b>송장 파일을 끌어 놓거나 선택</b><small>체험판은 발송 대기 주문으로 만든 샘플 내용으로 검증합니다</small></label><button class="btn line block" data-act="ship-sample">${U.ic('file')}샘플 송장 파일로 진행</button>`}
        </section>
        <section class="card"><header class="card-h"><div><h3>채널로 송장 전송</h3><p>매칭된 송장을 판매 채널에 보냅니다</p></div></header>
          <div class="send-box">${['SS', 'SL'].map((c) => { const n = reg.filter((o) => o.ch === c).length; return `<div class="send">${U.chDot(c)}<div><b>${D.CH[c].name}</b><small>${c === 'SS' ? 'API 발송 처리 — 배송 상태 자동 변경' : '송장 업로드 엑셀 생성 → 판매자센터 업로드'}</small></div><strong>${n}건</strong></div>`; }).join('')}</div>
          <button class="btn block" data-act="ship-send" ${reg.length ? '' : 'disabled'}>${U.ic('arrow')}송장 ${reg.length}건 채널 전송</button>
          <div class="sep"></div>
          <h4 class="h4">브랜드별 발송 대기</h4>
          <ul class="brand-wait">${byBrand.map((x) => `<li><b>${U.esc(x.b.name)}</b><span>${x.os.length}건 · 최장 ${Math.max(...x.os.map((o) => D.diff(T, o.paid)))}일</span></li>`).join('') || '<li>없음</li>'}</ul>
          <button class="btn line block" data-act="talk-invoice" ${byBrand.length ? '' : 'disabled'}>${U.ic('chat')}송장 입력 요청 알림톡 (${byBrand.length}개 브랜드)</button></section>
      </div>
      <section class="card"><header class="card-h"><div><h3>발송 대기 주문</h3><p>결제일 오래된 순</p></div></header><div class="tbl-wrap"><table class="tbl"><thead><tr><th>채널</th><th>주문번호</th><th>결제</th><th>브랜드</th><th>상품</th><th>경과</th></tr></thead><tbody>
      ${wait.sort((a, b) => a.paid.localeCompare(b.paid)).slice(0, 40).map((o) => { const age = D.diff(T, o.paid); return `<tr class="${age >= 2 ? 'hl' : ''}"><td>${U.chDot(o.ch)}</td><td class="mono">${o.no}</td><td>${U.md(o.paid)} ${o.time}</td><td>${U.esc(APP.brand(o.bid).name)}</td><td>${U.esc(APP.product(o.pid).name)} × ${o.qty}</td><td>${age ? age + '일' : '오늘'}</td></tr>`; }).join('')}</tbody></table></div></section>`;
    return APP.ops('ship', { title: '배송·송장', sub: '송장을 등록하고 주문을 확인한 뒤 채널로 전송하세요', body }) + APP.demoBar();
  });
  function shipResult(up) {
    const ok = up.rows.filter((r) => !r.err), bad = up.rows.filter((r) => r.err);
    return `<div class="res-grid"><div><span>전체 행</span><b>${up.rows.length}</b></div><div class="g"><span>매칭</span><b>${ok.length}</b></div><div class="r"><span>불일치</span><b>${bad.filter((r) => !r.done).length}</b></div></div>
      <div class="tbl-wrap"><table class="tbl"><thead><tr><th>줄</th><th>주문번호</th><th>송장</th><th>결과</th></tr></thead><tbody>${up.rows.map((r, i) => `<tr class="${r.err && !r.done ? 'hl' : ''}"><td>${i + 2}</td><td class="mono">${U.esc(r.no)}</td><td>${U.esc(r.carrier)}<small class="sub mono">${U.esc(r.inv)}</small></td><td>${r.err ? (r.done ? U.st(r.done, 'gray') : `<span class="err">${U.esc(r.err)}</span><div class="row-a">${r.fix ? `<button class="btn xs" data-act="ship-fix" data-i="${i}">${r.fix}</button>` : ''}<button class="btn xs line" data-act="ship-skip" data-i="${i}">제외</button></div>`) : up.applied ? U.st('반영', 'green') : U.st('매칭', 'green')}</td></tr>`).join('')}</tbody></table></div>
      <div class="row-btns">${up.applied ? '<button class="btn line" data-act="ship-clear">새 파일 올리기</button>' : `<button class="btn line" data-act="ship-clear">취소</button><button class="btn" data-act="ship-apply">매칭 ${ok.length}건 반영</button>`}</div>`;
  }
  on('ship-file', () => APP.acts['ship-sample']());
  on('ship-sample', () => {
    const s = S(); const wait = s.orders.filter((o) => o.status === '발송 대기' && D.isAssigned(o)).slice(0, 8);
    const rows = wait.map((o, i) => ({ no: o.no, carrier: D.CARRIERS[i % 5], inv: String(6120000000 + i * 7311), oid: o.id }));
    const shipped = s.orders.find((o) => o.status === '배송 중');
    rows.push({ no: '2027020315399', carrier: 'CJ대한통운', inv: '6120099001', err: '주문번호 없음 — 자릿수 확인 필요', fix: '주문 찾기' });
    if (rows[1]) rows.push({ no: rows[1].no, carrier: rows[1].carrier, inv: rows[1].inv, err: '같은 송장이 파일에 중복' });
    if (shipped) rows.push({ no: shipped.no, carrier: shipped.inv.carrier, inv: '6120099777', err: '이미 발송된 주문 — 송장 변경은 채널에서 확인' });
    const extra = s.orders.filter((o) => o.status === '발송 대기' && D.isAssigned(o))[8];
    if (extra) rows.push({ no: extra.no, carrier: 'CJ택배', inv: '6120099888', err: '택배사 이름 확인 필요 (CJ택배 → CJ대한통운?)', fix: 'CJ대한통운으로 수정' });
    s.shipUpload = { rows, applied: false }; APP.save(); APP.render();
  });
  on('ship-skip', (el) => { const r = S().shipUpload.rows[el.dataset.i]; r.done = '제외'; APP.save(); APP.render(); });
  on('ship-fix', (el) => {
    const s = S(), r = s.shipUpload.rows[el.dataset.i];
    if (r.fix.startsWith('CJ')) { const dup = s.shipUpload.rows.find((x) => x !== r && x.no === r.no && !x.err); if (dup) { r.done = '수정 → 중복이라 제외'; } else { r.carrier = 'CJ대한통운'; r.err = null; r.oid = s.orders.find((o) => o.no === r.no).id; } APP.save(); return APP.render(); }
    const cands = s.orders.filter((o) => o.status === '발송 대기' && D.isAssigned(o) && !s.shipUpload.rows.some((x) => x.oid === o.id)).slice(0, 4);
    APP.modal({ title: '주문 찾기 — ' + r.no, sub: '비슷한 주문번호의 발송 대기 주문입니다', body: `<div class="radio-list">${cands.map((o, i) => `<label class="radio"><input type="radio" name="sf" value="${o.id}" ${i === 0 ? 'checked' : ''}><div><b class="mono">${o.no}</b><small>${U.esc(APP.brand(o.bid).name)} · ${U.esc(APP.product(o.pid).name)} · ${U.md(o.paid)}</small></div></label>`).join('')}</div>`, foot: `<button class="btn line" data-act="close">취소</button><button class="btn" data-act="ship-fix-save" data-i="${el.dataset.i}">이 주문으로 연결</button>` });
  });
  on('ship-fix-save', (el) => { const s = S(), r = s.shipUpload.rows[el.dataset.i]; const id = (U.qs('input[name="sf"]:checked') || {}).value; if (!id) return; const o = APP.order(id); r.no = o.no; r.oid = o.id; r.err = null; APP.close(); APP.save(); APP.render(); });
  on('ship-clear', () => { S().shipUpload = null; APP.save(); APP.render(); });
  on('ship-apply', () => {
    const s = S(), up = s.shipUpload; let n = 0;
    up.rows.filter((r) => !r.err).forEach((r) => { const o = APP.order(r.oid); if (o && o.status === '발송 대기') { o.inv = { carrier: r.carrier, no: r.inv, sent: false }; o.status = '송장 등록'; n++; } });
    up.applied = true; APP.toast('송장 ' + n + '건을 주문에 연결했습니다'); APP.commit('송장 일괄 업로드 — 매칭 ' + n + '건, 불일치 ' + up.rows.filter((r) => r.err).length + '건');
  });
  on('ship-send', () => {
    const s = S(), reg = s.orders.filter((o) => o.status === '송장 등록');
    const sl = reg.filter((o) => o.ch === 'SL');
    if (sl.length) U.sheet('스룩페이_송장업로드_' + T + '.xlsx', [['주문번호', '택배사', '송장번호']].concat(sl.map((o) => [o.no, o.inv.carrier, o.inv.no])), '송장');
    reg.forEach((o) => { o.status = '배송 중'; o.inv.sent = true; });
    APP.toast('스마트스토어 ' + (reg.length - sl.length) + '건 API 전송' + (sl.length ? ', 스룩페이 ' + sl.length + '건 업로드 엑셀 생성' : ''));
    APP.commit('송장 채널 전송 — 스마트스토어 ' + (reg.length - sl.length) + ', 스룩페이 ' + sl.length);
  });
  on('talk-invoice', () => {
    const s = S(); const wait = s.orders.filter((o) => o.status === '발송 대기' && D.isAssigned(o));
    const bs = s.brands.filter((b) => wait.some((o) => o.bid === b.id));
    const b0 = bs[0];
    APP.modal({ title: '송장 입력 요청 알림톡', sub: '템플릿 INVOICE_REQ · 승인됨', body: `<div class="talk-prev"><div class="bubble"><b>알림톡 도착</b><pre>${U.esc(D.TALK.invoice.body.replace('#{브랜드}', b0.name).replace('#{건수}', wait.filter((o) => o.bid === b0.id).length))}</pre><span class="bbtn">포털에서 송장 입력</span></div></div><p class="hint">${U.ic('users')}받는 곳: ${bs.map((b) => U.esc(b.name) + ' ' + wait.filter((o) => o.bid === b.id).length + '건').join(', ')}</p>`, foot: '<button class="btn line" data-act="close">취소</button><button class="btn" data-act="talk-invoice-send">발송 (시뮬레이션)</button>' });
  });
  on('talk-invoice-send', () => { const s = S(); const wait = s.orders.filter((o) => o.status === '발송 대기' && D.isAssigned(o)); const bs = s.brands.filter((b) => wait.some((o) => o.bid === b.id)); s.talk.unshift({ at: APP.now(), to: bs.map((b) => b.name).join(', '), tpl: '송장 입력 요청', body: bs.map((b) => b.name + ' — 발송 대기 ' + wait.filter((o) => o.bid === b.id).length + '건').join('\n') }); APP.close(); APP.toast(bs.length + '개 브랜드에 알림톡을 보냈습니다 (시뮬레이션)'); APP.commit('송장 입력 요청 알림톡 ' + bs.length + '건'); });

  /* =====================================================================
     일 정산
     ===================================================================== */
  const stTab = { k: 'S' };
  APP.route(/^\/ops\/settle(?:\/([\d-]+))?$/, (day) => {
    const s = S(); const days = Object.keys(s.settle).sort().reverse();
    day = day && s.settle[day] ? day : days.find((d) => ['draft', 'reviewed'].includes(s.settle[d].st)) || days[0];
    const st = s.settle[day], c = APP.calc(day);
    const stepIx = { draft: 0, reviewed: 1, confirmed: 2, paid: 3 }[st.st];
    const steps = ['작성 (자동 계산)', '검토', '확정', '지급'];
    const lines = c.lines.filter((l) => l.kind === stTab.k);
    const isPar = D.PARALLEL.includes(day), rc = s.recon[day];
    let acts = '';
    if (st.st === 'draft') acts = `<button class="btn line" data-act="adj-new" data-day="${day}">${U.ic('plus')}수동 조정</button><button class="btn" data-act="st-review" data-day="${day}">${U.ic('check')}검토 완료</button>`;
    if (st.st === 'reviewed') acts = `<button class="btn line" data-act="st-back" data-day="${day}">검토 취소</button><button class="btn" data-act="st-confirm" data-day="${day}">${U.ic('lock')}정산 확정</button>`;
    if (st.st === 'confirmed') acts = `<a class="btn" href="#/ops/payout">${U.ic('bank')}이체 파일 만들기</a>`;
    const body = `
      <div class="settle">
        <aside class="days card">${days.length ? `<div class="days-h">정산일 <small>결제일 기준</small></div>` : ''}<a class="day off"><b>${U.md(T)} (${D.dow(T)})</b><span>오늘 — 내일 06:00 자동 계산</span></a>${days.slice(0, 15).map((d) => `<a href="#/ops/settle/${d}" class="day ${d === day ? 'on' : ''}"><b>${U.md(d)} (${D.dow(d)})</b>${U.st(U.SETTLE[s.settle[d].st], STC(s.settle[d].st))}<span class="num">${U.won(APP.calc(d).pay)}원</span></a>`).join('')}</aside>
        <div class="settle-main">
          <section class="card">
            <div class="settle-h"><div><span class="eyebrow">${U.ic('calc')}${U.day(day)} 정산 ${isPar ? '<em class="tag">병행 운영일</em>' : ''}</span><h2>${U.won(c.pay)}<small>원 · 정산 지급액</small></h2><p>${c.count}건 결제 · 셀러 ${c.lines.filter((l) => l.kind === 'S').length}명 · 브랜드 ${c.lines.filter((l) => l.kind === 'B').length}곳 ${st.by ? ' · 확정 ' + st.by + ' ' + st.at : ''}${st.rv ? ' · 검토 ' + st.rv : ''}</p></div><div class="acts">${acts}</div></div>
            <ol class="stepper wide">${steps.map((t, i) => `<li class="${i < stepIx ? 'done' : i === stepIx ? 'on' : ''}"><i>${i < stepIx ? U.ic('check') : i + 1}</i>${t}</li>`).join('')}</ol>
            ${isPar && st.st !== 'paid' && st.st !== 'confirmed' ? `<div class="note ${rc && rc.done ? '' : 'warn'}">${U.ic(rc && rc.done ? 'check' : 'scale')}<div><b>${rc && rc.done ? '엑셀 병행 대조 통과' : '엑셀 병행 대조를 통과해야 확정할 수 있습니다'}</b><span>${rc && rc.done ? '설명되지 않는 차이 0원' : '병행 운영 기간에는 기존 엑셀과 대조한 뒤 지급을 진행합니다.'} <a href="#/ops/recon">엑셀 대조 열기</a></span></div></div>` : ''}
          </section>
          <div class="kpis five">${U.kpi('매출', U.won(c.sales), '취소 제외', '', '')}${U.kpi('셀러 정산', U.won(c.seller), '수수료 · 조정 포함', '', '')}${U.kpi('브랜드 정산', U.won(c.brand), '공급가 · 조정 포함', '', '')}${U.kpi('원천징수', U.won(c.tax), '개인 셀러 3.3%', '', '')}${U.kpi('플랫폼 마진 (예상)', U.won(c.margin), '채널 수수료 별도', 'violet', '')}</div>
          <section class="card"><header class="card-h"><div class="tabs in"><a href="javascript:void 0" data-act="st-tab" data-k="S" class="${stTab.k === 'S' ? 'on' : ''}">셀러</a><a href="javascript:void 0" data-act="st-tab" data-k="B" class="${stTab.k === 'B' ? 'on' : ''}">브랜드</a></div><button class="btn sm line" data-act="st-xls" data-day="${day}">${U.ic('download')}정산 엑셀</button></header>
            <div class="tbl-wrap"><table class="tbl"><thead><tr><th>${stTab.k === 'S' ? '셀러' : '브랜드'}</th>${stTab.k === 'S' ? '<th>구분</th>' : ''}<th class="r">주문</th><th class="r">매출</th><th class="r">기본 정산</th><th class="r">조정</th>${stTab.k === 'S' ? '<th class="r">원천징수</th>' : ''}<th class="r">지급액</th><th>비고</th><th></th></tr></thead><tbody>
            ${lines.map((l) => { const held = l.who.account.changedAt && !l.who.account.verified; return `<tr><td><b>${l.kind === 'S' ? l.who.handle : U.esc(l.who.name)}</b><small class="sub">${l.kind === 'S' ? l.who.name : U.esc(l.who.cat)}</small></td>${l.kind === 'S' ? `<td>${U.st(l.who.type, l.who.type === '개인' ? 'gray' : 'blue')}</td>` : ''}<td class="r">${l.cnt}</td><td class="r num">${U.won(l.sales)}</td><td class="r num">${U.won(l.base)}</td><td class="r num ${l.adj < 0 ? 'neg' : ''}">${l.adj ? U.won(l.adj) : '—'}</td>${l.kind === 'S' ? `<td class="r num">${l.tax ? U.won(-l.tax) : '—'}</td>` : ''}<td class="r num strong">${U.won(l.pay)}</td><td>${l.carry ? U.st('이월 ' + U.won(l.carry), 'amber') : ''}${l.openingCarry ? U.st('이전 이월 반영', 'blue') : ''}${held ? U.st('지급 보류', 'red') : ''}${l.autoAdj.length ? U.st('정산 후 취소 ' + l.autoAdj.length, 'blue') : ''}${l.manAdj.length ? U.st('수동 조정', 'violet') : ''}</td><td><button class="btn xs line" data-act="stmt" data-day="${day}" data-key="${l.kind + l.id}">정산서</button></td></tr>`; }).join('')}
            </tbody></table></div></section>
          <div class="grid2">
            <details class="card rule"><summary>${U.ic('file')}정산 계산 기준</summary><ul class="dots">${Object.values(D.RULE).map((r) => `<li>${U.esc(r)}</li>`).join('')}</ul></details>
            <section class="card"><h3 class="h3">세금계산서 발행 대상 (2월 누적)</h3><p class="muted">사업자 셀러 수수료 · 브랜드 공급가 — 발행 방향과 세무 기준 확인 필요</p>${taxTable()}<button class="btn sm line" data-act="hometax">${U.ic('download')}홈택스 일괄 발행용 엑셀</button><p class="muted small">현재는 발행 대상 집계와 엑셀 다운로드를 제공합니다.</p></section>
          </div>
        </div>
      </div>`;
    return APP.ops('settle', { title: '일 정산', sub: '일 마감 자동 계산 → 검토 → 확정 → 지급 · 확정 후에는 조정 항목으로만 변경', body }) + APP.demoBar();
  });
  function STC(st) { return { draft: 'amber', reviewed: 'blue', confirmed: 'violet', paid: 'green' }[st]; }
  function taxTable() {
    const s = S(); const days = Object.keys(s.settle).filter((d) => d >= '2027-02-01' && ['confirmed', 'paid'].includes(s.settle[d].st));
    const acc = {}; days.forEach((d) => APP.calc(d).lines.forEach((l) => { if (l.kind === 'B' || l.who.type === '사업자') acc[l.kind + l.id] = (acc[l.kind + l.id] || 0) + l.gross; }));
    const rows = Object.entries(acc);
    return `<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>대상</th><th class="r">공급가액 합계</th></tr></thead><tbody>${rows.map(([k, v]) => `<tr><td>${U.esc(APP.payeeName(k))}</td><td class="r num">${U.won(v)}</td></tr>`).join('') || '<tr><td colspan="2">확정된 정산 없음</td></tr>'}</tbody></table></div>`;
  }
  on('hometax', () => {
    const s = S(); const days = Object.keys(s.settle).filter((d) => d >= '2027-02-01' && ['confirmed', 'paid'].includes(s.settle[d].st)); const acc = {};
    days.forEach((d) => APP.calc(d).lines.forEach((l) => { if (l.kind === 'B' || l.who.type === '사업자') acc[l.kind + l.id] = (acc[l.kind + l.id] || 0) + l.gross; }));
    U.sheet('세금계산서_발행대상_202702.xlsx', [['구분', '거래처', '공급가액', '비고']].concat(Object.entries(acc).map(([k, v]) => [k[0] === 'S' ? '셀러 수수료' : '브랜드 공급가', APP.payeeName(k), v, '예시 — 홈택스 일괄 발행 양식으로 변환 예정'])), '발행대상');
    APP.toast('발행 대상 엑셀을 내려받았습니다 (예시 양식)');
  });
  on('st-tab', (el) => { stTab.k = el.dataset.k; APP.render(); });
  on('st-xls', (el) => { const c = APP.calc(el.dataset.day); U.sheet('일정산_' + el.dataset.day + '.xlsx', [['구분', '대상', '주문', '매출', '기본 정산', '기타 조정', '이전 정산 이월', '원천징수', '지급액', '다음 정산 이월']].concat(c.lines.map((l) => [l.kind === 'S' ? '셀러' : '브랜드', APP.payeeName(l.kind + l.id), l.cnt, l.sales, l.base, l.adj - (l.openingCarry || 0), l.openingCarry || 0, l.tax, l.pay, l.carry])), '정산'); APP.toast('정산 엑셀을 내려받았습니다'); });
  on('st-review', (el) => { const s = S(), st = s.settle[el.dataset.day]; if (!['staff','confirm'].includes(s.session.ops) || !st || st.st !== 'draft') return APP.toast('작성 중인 정산만 검토할 수 있습니다', 'warn'); st.st = 'reviewed'; st.rv = APP.opsName(); APP.toast(U.md(el.dataset.day) + ' 정산 검토를 완료했습니다'); APP.commit(U.md(el.dataset.day) + ' 정산 검토 완료'); });
  on('st-back', (el) => { const s = S(), st = s.settle[el.dataset.day]; if (!['staff','confirm'].includes(s.session.ops) || !st || st.st !== 'reviewed') return APP.toast('검토 중인 정산만 되돌릴 수 있습니다', 'warn'); st.st = 'draft'; delete st.rv; APP.commit(U.md(el.dataset.day) + ' 정산 검토 취소'); });
  on('st-confirm', (el) => {
    const s = S(), day = el.dataset.day, st = s.settle[day], c = APP.calc(day);
    if (!st || st.st !== 'reviewed') return APP.toast('검토가 완료된 정산만 확정할 수 있습니다', 'warn');
    if (s.session.ops !== 'confirm') return APP.modal({ title: '확정 권한이 필요합니다', body: `<div class="perm">${U.ic('lock')}<p><b>${APP.opsName()}</b> 님은 정산을 작성·검토할 수 있습니다.<br>정산 확정은 <b>정산 확정 권한자</b>가 합니다.</p></div>`, foot: '<button class="btn line" data-act="close">닫기</button><a class="btn" href="#/login/ops">다른 계정으로 로그인</a>' });
    if (st.rv === APP.opsName()) return APP.toast('검토한 사람과 확정하는 사람이 달라야 합니다 — 「검토 취소」 후 김운영 님이 검토해 주세요', 'warn');
    if (D.PARALLEL.includes(day) && !(s.recon[day] && s.recon[day].done)) return APP.modal({ title: '엑셀 병행 대조가 남아 있습니다', body: `<div class="perm warn">${U.ic('scale')}<p>${U.day(day)}은 병행 운영일입니다.<br>기존 엑셀과 대조해 <b>설명되지 않는 차이가 0원</b>이 된 뒤에 확정할 수 있습니다.</p></div>`, foot: '<button class="btn line" data-act="close">닫기</button><button class="btn" data-act="go" data-to="#/ops/recon">엑셀 대조로 이동</button>' });
    const held = c.lines.filter((l) => l.who.account.changedAt && !l.who.account.verified);
    APP.modal({ title: U.day(day) + ' 정산 확정', sub: '확정 후에는 수정할 수 없고, 바뀌는 내용은 다음 정산의 조정 항목이 됩니다', body: `<ul class="check-list"><li class="ok">${U.ic('check')}검토 완료 — ${U.esc(st.rv)}</li><li class="ok">${U.ic('check')}확정자 ${APP.opsName()} (검토자와 다름)</li>${D.PARALLEL.includes(day) ? `<li class="ok">${U.ic('check')}엑셀 병행 대조 통과</li>` : ''}<li class="${held.length ? 'warn' : 'ok'}">${U.ic(held.length ? 'alert' : 'check')}${held.length ? '지급 보류 ' + held.length + '명 — 확정은 되지만 이체 파일에서 제외' : '지급 보류 없음'}</li></ul>
      <div class="sum-line"><span>지급 예정 합계</span><b>${U.won(c.pay)}원</b></div>
      <label class="chk"><input type="checkbox" id="cf-talk" checked> 셀러·브랜드에게 정산 확정 알림톡 발송 (${c.lines.length}명)</label>`, foot: `<button class="btn line" data-act="close">취소</button><button class="btn" data-act="st-confirm-do" data-day="${day}">${U.ic('lock')}확정</button>` });
  });
  on('st-confirm-do', (el) => {
    const s = S(), day = el.dataset.day, st = s.settle[day], c = APP.calc(day); const talk = (U.qs('#cf-talk') || {}).checked;
    if (s.session.ops !== 'confirm' || !st || st.st !== 'reviewed' || !st.rv || st.rv === APP.opsName()) return APP.toast('확정 권한과 검토 상태를 다시 확인해 주세요', 'warn');
    if (D.PARALLEL.includes(day) && !(s.recon[day] && s.recon[day].done)) return APP.toast('엑셀 대조를 먼저 완료해 주세요', 'warn');
    APP.freezeSettlement(day);
    st.st = 'confirmed'; st.by = APP.opsName(); st.at = APP.now();
    if (talk) { const l = c.lines[0]; s.talk.unshift({ at: APP.now(), to: '셀러·브랜드 ' + c.lines.length + '명', tpl: '정산 확정 안내', body: D.TALK.settle.body.replace('#{이름}', l.kind === 'S' ? l.who.name : l.who.name).replace('#{정산일}', day).replace('#{금액}', U.won(l.pay)).replace('#{지급일}', D.add(day, 2)) + '\n— 외 ' + (c.lines.length - 1) + '명 동일 템플릿' }); }
    APP.close(); APP.toast(U.md(day) + ' 정산을 확정했습니다' + (talk ? ' · 알림톡 발송' : ''));
    APP.commit(U.md(day) + ' 정산 확정 (' + U.won(c.pay) + '원)' + (talk ? ' · 정산 확정 알림톡 ' + c.lines.length + '건' : ''));
  });
  on('adj-new', (el) => {
    const day = el.dataset.day, c = APP.calc(day);
    APP.modal({ title: '수동 조정 추가 — ' + U.day(day), sub: '사유와 입력자가 기록되고, 정산서에 조정 항목으로 표시됩니다', body: `<div class="form"><label>대상<select id="aj-k">${c.lines.map((l) => `<option value="${l.kind + l.id}">${l.kind === 'S' ? '셀러 ' + l.who.handle : '브랜드 ' + U.esc(l.who.name)}</option>`).join('')}</select></label><label>조정 금액 (차감은 -)<input id="aj-a" placeholder="예: -5000" inputmode="numeric"></label><label>사유<select id="aj-r"><option>배송비 셀러 부담분 차감</option><option>프로모션 지원금 지급</option><option>정산 이의 신청 반영</option><option>기타</option></select></label><label>메모<input id="aj-m" maxlength="60" placeholder="근거를 남겨 주세요"></label></div>`, foot: `<button class="btn line" data-act="close">취소</button><button class="btn" data-act="adj-save" data-day="${day}">추가</button>` });
  });
  on('adj-save', (el) => {
    const st = S().settle[el.dataset.day]; if (!['staff','confirm'].includes(S().session.ops) || !st || st.st !== 'draft') return APP.toast('작성 중인 정산에만 조정 항목을 추가할 수 있습니다', 'warn');
    const v = (id) => (U.qs('#' + id) || {}).value || ''; const a = v('aj-a').replace(/[,\s원]/g, '');
    if (!/^-?\d{1,7}$/.test(a) || Number(a) === 0) return APP.toast('조정 금액을 숫자로 입력해 주세요 (예: -5000)', 'warn');
    if (!v('aj-m').trim()) return APP.toast('근거 메모를 남겨 주세요', 'warn');
    const k = v('aj-k'), reason = v('aj-r'); if (!APP.calc(el.dataset.day).lines.some((l) => l.kind + l.id === k)) return APP.toast('정산 대상을 다시 확인해 주세요', 'warn');
    if (S().recon[el.dataset.day]) { S().recon[el.dataset.day].done = false; S().recon[el.dataset.day].causes = {}; }
    S().manual.push({ day: el.dataset.day, kind: k[0], id: k.slice(1), amt: Number(a), reason: v('aj-r'), memo: v('aj-m').trim(), by: APP.opsName(), at: APP.now() });
    APP.close(); APP.toast('조정 항목을 추가했습니다'); APP.commit(U.md(el.dataset.day) + ' 수동 조정 ' + APP.payeeName(k) + ' ' + U.won(Number(a)) + '원 — ' + reason);
  });

  /* 정산서 (운영자·포털 공용) */
  APP.statement = (day, key, portal) => {
    if (!APP.canReadStatement(day, key)) return APP.toast('현재 계정으로 열람할 수 없는 정산서입니다', 'warn');
    const s = S(), c = APP.calc(day), l = c.lines.find((x) => x.kind + x.id === key); if (!l) return;
    const os = APP.statementOrders(day, l);
    const isS = l.kind === 'S';
    const body = `<div class="stmt" id="stmt"><div class="stmt-h">${APP.logo()}<div><b>공구온 정산서</b><span>${U.day(day)} · ${isS ? '셀러' : '브랜드'} 정산</span></div><div class="stmt-st">${U.st(U.SETTLE[s.settle[day].st], STC(s.settle[day].st))}</div></div>
      <div class="kv"><span>받는 분</span><b>${isS ? l.who.handle + ' ' + l.who.name + ' (' + l.who.type + ')' : U.esc(l.who.name)}</b><span>지급 계좌</span><b>${U.esc(l.who.account.bank)} ${U.maskAcct(l.who.account.no)} · ${U.esc(l.who.account.holder)}</b><span>정산 기준</span><b>결제일 ${day} · 취소 제외</b></div>
      <div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>주문번호</th><th>상품</th><th class="r">수량</th><th class="r">판매가</th><th class="r">${isS ? '수수료' : '공급가'}</th></tr></thead><tbody>${os.map((o) => { const rate = isS ? (Number.isFinite(o.settleRate) ? o.settleRate : APP.group(o.gid).rate) : 0; return `<tr><td class="mono">${o.no}</td><td>${U.esc(APP.product(o.pid).name)}</td><td class="r">${o.qty}</td><td class="r num">${U.won(o.price * o.qty)}</td><td class="r num">${isS ? U.won(o.price * o.qty * rate) + ' <small>(' + pct(rate) + ')</small>' : U.won(o.supply * o.qty)}</td></tr>`; }).join('')}
      ${l.autoAdj.map((a) => `<tr class="adj"><td class="mono">${a.no}</td><td>${a.type} 차감 (결제 ${U.md(a.paid)})</td><td></td><td></td><td class="r num neg">${U.won(a.amt)}</td></tr>`).join('')}
      ${l.openingCarry ? `<tr class="adj"><td>이전 정산 이월</td><td>${l.carryFrom ? U.md(l.carryFrom) + ' 정산의 미차감 잔액' : '이전 정산의 미차감 잔액'}</td><td></td><td></td><td class="r num neg">${U.won(l.openingCarry)}</td></tr>` : ''}
      ${l.manAdj.map((a) => `<tr class="adj"><td>수동 조정</td><td>${U.esc(a.reason)} — ${U.esc(a.memo)}</td><td></td><td></td><td class="r num ${a.amt < 0 ? 'neg' : ''}">${U.won(a.amt)}</td></tr>`).join('')}</tbody></table></div>
      <dl class="stmt-sum"><div><dt>기본 정산</dt><dd>${U.won(l.base)}원</dd></div><div><dt>${l.openingCarry ? '조정 (이월 포함)' : '조정'}</dt><dd>${U.won(l.adj)}원</dd></div>${isS && l.tax ? `<div><dt>소득세 3%</dt><dd>${U.won(-l.it)}원</dd></div><div><dt>지방소득세 0.3%</dt><dd>${U.won(-l.lt)}원</dd></div>` : ''}<div class="tot"><dt>지급액</dt><dd>${U.won(l.pay)}원</dd></div>${l.carry ? `<div><dt>다음 정산 이월</dt><dd>${U.won(l.carry)}원</dd></div>` : ''}</dl>
      <p class="muted small">가상 데이터로 만든 데모 정산서입니다. 원천징수 적용 대상과 계산 기준은 실제 운영 정책에 따라 확인이 필요합니다.</p></div>`;
    APP.modal({ title: '정산서', wide: true, body, foot: `<button class="btn line" data-act="stmt-xls" data-day="${day}" data-key="${key}">${U.ic('download')}엑셀</button><button class="btn" data-act="print">${U.ic('printer')}인쇄 · PDF 저장</button>` });
  };
  on('stmt', (el) => APP.statement(el.dataset.day, el.dataset.key));
  on('print', () => { document.body.classList.add('printing'); window.print(); setTimeout(() => document.body.classList.remove('printing'), 500); });
  on('stmt-xls', (el) => { const c = APP.calc(el.dataset.day), l = c.lines.find((x) => x.kind + x.id === el.dataset.key); U.sheet('정산서_' + el.dataset.day + '_' + APP.payeeName(el.dataset.key).replace(/[@\s]/g, '') + '.xlsx', [['주문번호', '상품', '수량', '판매가', l.kind === 'S' ? '수수료' : '공급가']].concat(APP.statementOrders(el.dataset.day, l).map((o) => [o.no, APP.product(o.pid).name, o.qty, o.price * o.qty, l.kind === 'S' ? Math.round(o.price * o.qty * (Number.isFinite(o.settleRate) ? o.settleRate : APP.group(o.gid).rate)) : o.supply * o.qty])).concat([[], ['기본 정산', '', '', '', l.base], ['기타 조정', '', '', '', l.adj - (l.openingCarry || 0)], ['이전 정산 이월', '', '', '', l.openingCarry || 0], ['원천징수', '', '', '', -l.tax], ['지급액', '', '', '', l.pay], ['다음 정산 이월', '', '', '', l.carry]]), '정산서'); });

  /* =====================================================================
     지급·이체
     ===================================================================== */
  const paySel = new Set();
  APP.route(/^\/ops\/payout$/, () => {
    const s = S();
    const ready = Object.keys(s.settle).filter((d) => s.settle[d].st === 'confirmed' && !s.batches.some((b) => b.days.includes(d)));
    if (!paySel.size) ready.forEach((d) => paySel.add(d));
    const pick = ready.filter((d) => paySel.has(d));
    const prev = previewItems(pick);
    const releasable = s.batches.flatMap((b) => (b.held || []).filter((h) => !h.paid && APP.payee(h.key).account.verified).map((h) => Object.assign({ b }, h)));
    const body = `
      <section class="card"><header class="card-h"><div><h3>대량이체 파일 만들기</h3><p>확정된 정산 → 기업은행 대량이체 파일 → 은행 업로드 → 결과 반영</p></div></header>
        ${ready.length ? `<div class="chips">${ready.map((d) => `<label class="chip ${paySel.has(d) ? 'on' : ''}"><input type="checkbox" data-change="pay-day" data-d="${d}" ${paySel.has(d) ? 'checked' : ''}>${U.day(d)} 확정분</label>`).join('')}</div>
        <div class="tbl-wrap"><table class="tbl"><thead><tr><th>받는 분</th><th>은행</th><th>계좌</th><th>예금주</th><th class="r">이체 금액</th><th>상태</th></tr></thead><tbody>${prev.map((i) => `<tr class="${i.state !== 'ok' ? 'muted-row' : ''}"><td><b>${U.esc(i.name)}</b></td><td>${U.esc(i.bank)}</td><td class="mono">${U.maskAcct(i.no)}</td><td>${U.esc(i.holder)}</td><td class="r num strong">${U.won(i.amt)}</td><td>${i.state === 'ok' ? U.st('이체 대상', 'green') : i.state === 'hold' ? U.st('지급 보류 · 계좌 변경 재확인', 'red') : U.st('0원 · 이월', 'amber')}</td></tr>`).join('')}</tbody></table></div>
        <div class="sum-bar"><div><span>이체 대상</span><b>${prev.filter((i) => i.state === 'ok').length}명</b></div><div><span>보류</span><b>${prev.filter((i) => i.state === 'hold').length}명</b></div><div class="big"><span>이체 합계</span><b>${U.won(prev.filter((i) => i.state === 'ok').reduce((a, i) => a + i.amt, 0))}원</b></div><button class="btn" data-act="batch-make" ${pick.length ? '' : 'disabled'}>${U.ic('download')}이체 파일 생성</button></div>` : U.empty('이체 파일을 생성할 확정 정산이 없습니다. 일 정산에서 확정해 주세요.', 'calc')}
        ${releasable.length ? `<div class="note">${U.ic('lock')}<div><b>보류가 해제된 지급 ${releasable.length}건</b><span>${releasable.map((h) => U.esc(h.name) + ' ' + U.won(h.amt) + '원').join(', ')}</span></div><button class="btn sm" data-act="batch-held">보류 건 이체 파일 생성</button></div>` : ''}
      </section>
      <section class="card"><header class="card-h"><div><h3>이체 파일 처리 현황</h3><p>파일 생성·다운로드·결과 반영이 모두 이력으로 남습니다</p></div></header>
        <div class="batches">${s.batches.slice().reverse().map(batchCard).join('')}</div></section>
      <div class="note">${U.ic('file')}<div><b>파일 양식</b><span>데모 파일은 예시 양식입니다. 실제 이체에 사용하지 마세요. 이체 실행과 결과 확인은 은행에서 진행합니다.</span></div></div>`;
    return APP.ops('payout', { title: '지급·이체', sub: '대량이체 파일 생성 → 은행 업로드 → 결과 반영 → 실패 건 재처리', body }) + APP.demoBar();
  });
  function previewItems(days) {
    const acc = {};
    days.forEach((d) => APP.calc(d).lines.forEach((l) => { const k = l.kind + l.id; acc[k] = acc[k] || { key: k, name: APP.payeeName(k), amt: 0, who: l.who }; acc[k].amt += l.pay; }));
    return Object.values(acc).map((i) => Object.assign(i, { bank: i.who.account.bank, no: i.who.account.no, holder: i.who.account.holder, state: i.amt <= 0 ? 'zero' : !i.who.account.verified ? 'hold' : 'ok' }));
  }
  function batchCard(b) {
    const fail = b.items.filter((i) => i.res === '실패'), total = b.items.reduce((a, i) => a + i.amt, 0);
    const flow = ['파일 생성', '은행 업로드', '결과 반영']; const ix = { created: 0, uploaded: 1, done: 2 }[b.st];
    return `<article class="batch ${b.st}"><div class="batch-h"><div><b class="mono">${b.id}</b><span>${b.days.map(U.md).join(', ')} 정산분${b.retryOf ? ' · 재처리' : ''}${b.heldOf ? ' · 보류 해제분' : ''} · ${b.at} ${U.esc(b.by)}</span></div><strong>${U.won(total)}원<small>${b.items.length}건</small></strong></div>
      <ol class="mini-flow">${flow.map((t, i) => `<li class="${i < ix || b.st === 'done' ? 'done' : i === ix ? 'on' : ''}">${t}</li>`).join('')}</ol>
      ${b.st === 'done' ? `<div class="batch-res">${U.st('성공 ' + b.items.filter((i) => i.res === '성공').length, 'green')}${fail.length ? U.st('실패 ' + fail.length, 'red') : ''}${(b.held || []).length ? U.st('보류 ' + b.held.length, 'amber') : ''}</div>` : ''}
      ${fail.map((i) => `<div class="fail-row">${U.ic('alert')}<div><b>${U.esc(i.name)} · ${U.won(i.amt)}원</b><small>${U.esc(i.reason)}${i.retried ? ' → 재처리 ' + i.retried : ''}</small></div>${i.retried ? U.st('재처리됨', 'gray') : `<button class="btn xs" data-act="batch-retry" data-b="${b.id}" data-k="${i.key}">재처리</button>`}</div>`).join('')}
      <div class="batch-a">${b.st !== 'done' ? `<button class="btn xs line" data-act="batch-dl" data-b="${b.id}">${U.ic('download')}파일 다시 받기</button>` : ''}${b.st === 'created' ? `<button class="btn xs" data-act="batch-up" data-b="${b.id}">은행 업로드 완료 표시</button>` : ''}${b.st === 'uploaded' ? `<button class="btn xs" data-act="batch-result" data-b="${b.id}">${U.ic('upload')}이체 결과 파일 반영</button>` : ''}</div></article>`;
  }
  on('pay-day', (el) => { el.checked ? paySel.add(el.dataset.d) : paySel.delete(el.dataset.d); if (!paySel.size) paySel.add('__none'); APP.render(); });
  function needConfirm() { if (S().session.ops === 'confirm') return true; APP.modal({ title: '이체 파일 생성 권한', body: `<div class="perm">${U.ic('lock')}<p>이체 파일은 <b>정산 확정 권한자</b>만 만들 수 있습니다.<br>생성·다운로드는 모두 이력에 남습니다.</p></div>`, foot: '<button class="btn line" data-act="close">닫기</button><a class="btn" href="#/login/ops">다른 계정으로 로그인</a>' }); return false; }
  function fileOf(b) { return [['순번', '입금은행', '입금계좌번호', '예금주', '이체금액', '받는분 통장표시', '내 통장표시']].concat(b.items.map((i, n) => [n + 1, i.bank, i.no, i.holder, i.amt, '공구온정산' + b.days[0].slice(5).replace('-', ''), i.name.replace('@', '').slice(0, 10)])); }
  on('batch-make', () => {
    if (!needConfirm()) return;
    const s = S(); const ready = Object.keys(s.settle).filter((d) => s.settle[d].st === 'confirmed' && paySel.has(d) && !s.batches.some((b) => b.days.includes(d)));
    const prev = previewItems(ready);
    if (!ready.length || !prev.some((i) => i.state === 'ok')) return APP.toast('파일로 만들 지급 대상이 없습니다', 'warn');
    const b = { id: 'TR-' + T.replace(/-/g, '').slice(2) + '-' + (s.batches.length + 1), days: ready, at: APP.now().slice(6), by: APP.opsName(), st: 'created', items: prev.filter((i) => i.state === 'ok').map((i) => ({ key: i.key, name: i.name, amt: i.amt, bank: i.bank, no: i.no, holder: i.holder, res: null })), held: prev.filter((i) => i.state === 'hold').map((i) => ({ key: i.key, name: i.name, amt: i.amt })) };
    s.batches.push(b); paySel.clear();
    U.sheet('IBK_대량이체_' + b.id + '.xlsx', fileOf(b), '대량이체');
    APP.toast('대량이체 파일을 만들었습니다 — 은행에 업로드해 주세요'); APP.commit('대량이체 파일 생성 ' + b.id + ' (' + b.items.length + '건, ' + U.won(b.items.reduce((a, i) => a + i.amt, 0)) + '원, 보류 ' + b.held.length + ')');
  });
  on('batch-held', () => {
    if (!needConfirm()) return;
    const s = S(); const items = [];
    s.batches.forEach((b) => (b.held || []).forEach((h) => { const w = APP.payee(h.key); if (!h.paid && h.amt > 0 && w.account.verified) { h.paid = true; items.push({ key: h.key, name: h.name, amt: h.amt, bank: w.account.bank, no: w.account.no, holder: w.account.holder, res: null, from: b.days }); } }));
    if (!items.length) return APP.toast('보류 해제된 지급 대상이 없습니다', 'warn');
    const b = { id: 'TR-' + T.replace(/-/g, '').slice(2) + '-H' + (s.batches.length + 1), days: Array.from(new Set(items.flatMap((i) => i.from))), at: APP.now().slice(6), by: APP.opsName(), st: 'created', items, held: [], heldOf: true };
    s.batches.push(b); U.sheet('IBK_대량이체_' + b.id + '.xlsx', fileOf(b), '대량이체'); APP.commit('보류 해제분 이체 파일 생성 ' + b.id);
  });
  on('batch-dl', (el) => { if (!needConfirm()) return; const b = S().batches.find((x) => x.id === el.dataset.b); U.sheet('IBK_대량이체_' + b.id + '.xlsx', fileOf(b), '대량이체'); APP.log('이체 파일 재다운로드 ' + b.id); APP.save(); APP.toast('파일을 다시 받았습니다 (이력 기록)'); });
  on('batch-up', (el) => { if (!needConfirm()) return; const b = S().batches.find((x) => x.id === el.dataset.b); if (!b || b.st !== 'created') return APP.toast('파일 상태가 변경되었습니다', 'warn'); b.st = 'uploaded'; APP.commit('은행 업로드 완료 표시 ' + b.id); });
  on('batch-result', (el) => {
    if (!needConfirm()) return;
    const s = S(), b = s.batches.find((x) => x.id === el.dataset.b);
    if (!b || b.st !== 'uploaded') return APP.toast('은행 업로드 상태를 먼저 확인해 주세요', 'warn');
    const target = !b.retryOf && !b.heldOf ? b.items.find((i) => i.key === 'Bb3') || b.items[b.items.length - 1] : null;
    b.items.forEach((i) => { i.res = i === target ? '실패' : '성공'; if (i === target) i.reason = '예금주 불일치 (은행 조회: 포레스트랩 주식회사)'; });
    b.st = 'done'; if (!b.retryOf && !b.heldOf) b.days.forEach((d) => (s.settle[d].st = 'paid'));
    APP.modal({ title: '이체 결과 반영 — ' + b.id, sub: '은행에서 내려받은 결과 파일을 반영했습니다 (샘플)', body: `<div class="res-grid"><div class="g"><span>성공</span><b>${b.items.filter((i) => i.res === '성공').length}</b></div><div class="r"><span>실패</span><b>${b.items.filter((i) => i.res === '실패').length}</b></div></div>${target ? `<p class="hint warn">${U.ic('alert')}${U.esc(target.name)} — ${U.esc(target.reason)}. 예금주를 확인한 뒤 「재처리」로 다시 이체 파일을 만듭니다.</p>` : `<p class="hint">${U.ic('check')}모든 이체가 성공했습니다.</p>`}`, foot: '<button class="btn" data-act="close">확인</button>' });
    APP.commit('이체 결과 반영 ' + b.id + ' — 성공 ' + b.items.filter((i) => i.res === '성공').length + ', 실패 ' + b.items.filter((i) => i.res === '실패').length);
  });
  on('batch-retry', (el) => {
    const b = S().batches.find((x) => x.id === el.dataset.b), i = b && b.items.find((x) => x.key === el.dataset.k);
    if (!b || b.st !== 'done' || !i || i.res !== '실패' || i.retried) return APP.toast('재처리 가능한 실패 건이 아닙니다', 'warn');
    APP.modal({ title: '실패 건 재처리 — ' + i.name, sub: i.reason, body: `<div class="form"><label>은행<input value="${U.esc(i.bank)}" disabled></label><label>계좌번호<input value="${U.esc(U.maskAcct(i.no))}" disabled></label><label>확인된 예금주<input id="rt-h" value="포레스트랩 주식회사"></label></div><p class="hint">${U.ic('shield')}브랜드 담당자에게 확인한 예금주로 수정하면 계좌 정보 변경 이력이 남고, 재처리 파일이 만들어집니다.</p>`, foot: `<button class="btn line" data-act="close">취소</button><button class="btn" data-act="batch-retry-do" data-b="${b.id}" data-k="${i.key}">재처리 파일 생성</button>` });
  });
  on('batch-retry-do', (el) => {
    if (!needConfirm()) return;
    const s = S(), b = s.batches.find((x) => x.id === el.dataset.b), i = b && b.items.find((x) => x.key === el.dataset.k); const h = ((U.qs('#rt-h') || {}).value || '').trim();
    if (!h) return APP.toast('예금주를 입력해 주세요', 'warn');
    if (!b || b.st !== 'done' || !i || i.res !== '실패' || i.retried) return APP.toast('재처리 가능한 실패 건이 아닙니다', 'warn');
    const w = APP.payee(i.key);
    if (!w || !w.account.verified || w.account.no !== i.no || w.account.bank !== i.bank) return APP.toast('최신 계좌 확인 후 재처리해 주세요', 'warn');
    w.account.holder = h;
    const nb = { id: b.id + '-R' + (s.batches.length + 1), days: b.days, at: APP.now().slice(6), by: APP.opsName(), st: 'created', items: [{ key: i.key, name: i.name, amt: i.amt, bank: i.bank, no: i.no, holder: h, res: null }], held: [], retryOf: b.id };
    i.retried = nb.id; s.batches.push(nb); APP.close(); U.sheet('IBK_대량이체_' + nb.id + '.xlsx', fileOf(nb), '대량이체');
    APP.toast('재처리 파일을 만들었습니다'); APP.commit(i.name + ' 예금주 수정 → 재처리 파일 ' + nb.id);
  });

  /* =====================================================================
     엑셀 대조 ★
     ===================================================================== */
  const rf = { onlyDiff: true };
  APP.route(/^\/ops\/recon$/, () => {
    const s = S(), rc = APP.reconState(), day = rc.day;
    const stepIx = rc.notLoaded ? 0 : rc.open ? 2 : s.recon[day].done ? 4 : 3;
    const steps = ['기존 엑셀 결과 올리기', '자동 대조', '원인 분류·승인', '일자 통과'];
    const rows = rc.rows || [];
    const shown = rf.onlyDiff ? rows.filter((r) => r.diff !== 0) : rows;
    const total = rows.reduce((a, r) => a + Math.abs(r.diff), 0);
    const explained = rows.filter((r) => r.diff && r.cause).reduce((a, r) => a + Math.abs(r.diff), 0);
    const gaugeP = total ? explained / total : rc.notLoaded ? 0 : 1;
    const fe = rows.filter((r) => r.cause === '엑셀 수식 오류');
    const body = `
      <section class="recon-hero">
        <div class="rh-l"><span class="eyebrow">${U.ic('scale')}전환 기준</span><h2>병행 8영업일 동안<br><em>설명되지 않는 차이 0원</em></h2><p>같은 원천 주문으로 시스템과 기존 엑셀을 매일 대조합니다. 차이의 원인을 확인한 후 지급을 진행합니다.</p>${APP.tracker()}</div>
        <div class="rh-r"><div class="gauge" style="--p:${Math.round(gaugeP * 100)}"><div><small>${U.md(day)} 설명되지 않는 차이</small><strong>${rc.notLoaded ? '—' : U.won(rc.openAmt) + '원'}</strong><span>${rc.notLoaded ? '엑셀 결과를 올려 주세요' : rc.open ? rc.open + '건 원인 분류 필요' : '0원 · 통과 가능'}</span></div></div></div>
      </section>
      <div class="grid3">
        <div class="mini-card"><span>지난달 정산 재계산</span><b>2027-01 · 248행</b><div class="bar-stack"><i style="flex:4" class="c1" title="반올림 4"></i><i style="flex:2" class="c2" title="엑셀 수식 오류 2"></i><i style="flex:1" class="c3" title="누락 주문 1"></i></div><small>차이 7건 → 원인 승인 7 · 미설명 0</small></div>
        <div class="mini-card"><span>${U.md('2027-02-01')} 병행 대조</span><b>${U.esc(s.recon['2027-02-01'].note)}</b><small>통과 · 정산 확정·지급 완료</small></div>
        <div class="mini-card"><span>${U.md('2027-02-02')} 병행 대조</span><b>${U.esc(s.recon['2027-02-02'].note)}</b><small>통과 · 정산 확정</small></div>
      </div>
      <section class="card">
        <header class="card-h"><div><h3>${U.day(day)} 정산 대조</h3><p>셀러·브랜드 단위 지급액 — 시스템 계산 vs 기존 엑셀</p></div>${rc.notLoaded ? '' : `<label class="switch"><input type="checkbox" data-change="rf-diff" ${rf.onlyDiff ? 'checked' : ''}><span></span>차이만 보기</label>`}</header>
        <ol class="stepper wide">${steps.map((t, i) => `<li class="${i < stepIx ? 'done' : i === stepIx ? 'on' : ''}"><i>${i < stepIx ? U.ic('check') : i + 1}</i>${t}</li>`).join('')}</ol>
        ${rc.notLoaded ? `<div class="upload-2"><label class="drop"><input type="file" accept=".csv" data-change="rc-file">${U.ic('upload')}<b>${U.md(day)} 기존 정산 엑셀(CSV) 올리기</b><small>열: 대상코드, 대상명, 지급액 · 양식을 받아 값을 채워 올릴 수도 있습니다</small></label><div class="up-side"><button class="btn block" data-act="rc-sample">${U.ic('file')}샘플 엑셀 결과로 대조</button><button class="btn line block" data-act="rc-tpl">${U.ic('download')}대조 양식 내려받기</button><p class="muted small">샘플에는 실제 병행 운영에서 자주 나오는 차이 유형(반올림·누락 주문·수식 오류·취소 시점)을 넣었습니다.</p></div></div>` : `
        <div class="tbl-wrap"><table class="tbl recon"><thead><tr><th>대상</th><th class="r">시스템</th><th class="r">기존 엑셀</th><th class="r">차이</th><th>원인</th><th>상태</th></tr></thead><tbody>
        ${shown.map((r) => `<tr class="${r.diff && !r.cause ? 'open' : ''}"><td><b>${U.esc(r.name)}</b><small class="sub">${r.kind === 'S' ? '셀러' : '브랜드'}</small></td><td class="r num">${U.won(r.sys)}</td><td class="r num">${U.won(r.xl)}</td><td class="r num ${r.diff ? 'diff' : ''}">${r.diff ? (r.diff > 0 ? '+' : '') + U.won(r.diff) : '0'}</td>
          <td>${r.diff ? (r.cause ? `<b>${U.esc(r.cause)}</b>${(s.recon[day].memo || {})[r.key] ? `<small class="sub">${U.esc(s.recon[day].memo[r.key])}</small>` : ''}` : `<div class="cause"><select data-key="${r.key}" aria-label="원인">${['<option value="">원인 선택</option>'].concat(D.CAUSES.map((c) => `<option ${r.hint === c ? 'selected' : ''}>${c}</option>`)).join('')}</select>${r.hint ? `<span class="hintchip">${U.ic('spark')}자동 추정</span>` : ''}<button class="btn xs line" data-act="rc-why" data-key="${r.key}">근거</button><button class="btn xs" data-act="rc-ok" data-key="${r.key}">승인</button></div>`) : '—'}</td>
          <td>${r.diff ? (r.cause ? U.st('원인 승인', 'blue') : U.st('미설명', 'red')) : U.st('일치', 'green')}</td></tr>`).join('')}
        </tbody></table></div>
        <div class="sum-bar"><div><span>대조 대상</span><b>${rows.length}명</b></div><div><span>일치</span><b>${rows.filter((r) => !r.diff).length}</b></div><div><span>원인 승인</span><b>${rows.filter((r) => r.diff && r.cause).length}</b></div><div class="big ${rc.open ? 'bad' : ''}"><span>설명되지 않는 차이</span><b>${U.won(rc.openAmt)}원</b></div>
          ${s.recon[day].done ? `<span class="pill green big">${U.ic('check')}통과 처리됨</span>` : `<button class="btn" data-act="rc-pass" ${rc.open ? 'disabled' : ''}>${U.ic('check')}${U.md(day)} 대조 통과</button>`}</div>
        ${fe.length ? `<div class="note warn">${U.ic('alert')}<div><b>과거 지급 영향 검토 필요</b><span>${fe.map((r) => U.esc(r.name)).join(', ')} — 엑셀 수식 오류로 판정되었습니다. 엑셀 기준으로 지급한 과거 분이 있다면 차액(${fe.map((r) => U.won(-r.diff) + '원').join(', ')}) 정산 여부를 결정해 주세요.</span></div></div>` : ''}`}
      </section>
      <p class="foot-note">${U.ic('shield')}대조 화면은 병행 운영 후에도 남겨 두어, 정산 규칙을 바꿀 때마다 같은 방식으로 재검증할 수 있습니다.</p>`;
    return APP.ops('recon', { title: '엑셀 정산 대조', sub: '기존 정산과 시스템 계산 결과의 차이를 확인하세요', body }) + APP.demoBar();
  });
  on('rf-diff', (el) => { rf.onlyDiff = el.checked; APP.render(); });
  on('rc-sample', () => {
    const s = S(), day = '2027-02-03'; s.recon[day] = { loaded: true, causes: {}, memo: {}, file: 'settle_20270203_엑셀결과.xlsx' };
    const w = APP.modal({ title: '자동 대조 중', body: `<ol class="run"><li>${U.ic('check')}<span>엑셀 결과 읽기 — 대상 ${APP.reconRows(day).length}행</span></li><li>${U.ic('check')}<span>시스템 정산과 대상 코드로 연결</span></li><li>${U.ic('check')}<span>지급액 비교 · 차이 계산</span></li><li>${U.ic('check')}<span>원천 주문 목록 대조 → 누락 주문 추정</span></li><li>${U.ic('check')}<span>10원 이하 차이 → 반올림 후보 표시</span></li></ol>` });
    const lis = w.querySelectorAll('li'); let i = 0;
    const tick = () => { if (!document.getElementById('modal')) return; if (i > 0) lis[i - 1].className = 'done'; if (i < lis.length) { lis[i].className = 'doing'; i++; APP.defer(tick, 330); return; } APP.defer(() => { APP.close(); APP.toast('대조 완료 — 차이 항목의 원인을 확인해 주세요', 'info'); APP.commit('병행 대조 02-03 — 기존 엑셀 결과 업로드·자동 대조'); }, 250); };
    tick();
  });
  on('rc-tpl', () => { const c = APP.calc('2027-02-03'); U.dl('대조양식_20270203.csv', U.csv([['대상코드', '대상명', '지급액']].concat(c.lines.map((l) => [l.kind + l.id, APP.payeeName(l.kind + l.id), ''])))); APP.toast('대조 양식을 내려받았습니다 — 기존 엑셀 값을 채워 CSV로 올려 주세요'); });
  let reconReadSequence = 0;
  on('rc-file', (el) => {
    const f = el.files && el.files[0]; if (!f) return;
    const sequence = ++reconReadSequence;
    if (!/\.csv$/i.test(f.name) || f.size > 2 * 1024 * 1024) return APP.toast('2MB 이하의 CSV 파일을 선택해 주세요', 'warn');
    const rd = new FileReader(), token = APP.workToken();
    rd.onload = () => {
      if (!APP.isCurrentWork(token) || sequence !== reconReadSequence) return;
      try {
        const rows = U.parseCsv(String(rd.result));
        if (rows.length < 2 || rows.length > 10001 || rows[0].length !== 3 || rows[0].join(',') !== '대상코드,대상명,지급액') throw new Error('첫 행은 대상코드, 대상명, 지급액 순서여야 하며 데이터 행이 필요합니다.');
        const map = {}, expected = APP.calc('2027-02-03').lines.map((l) => l.kind + l.id);
        rows.slice(1).forEach((r, index) => {
          const line = index + 2, key = r[0], who = /^[SB][sb]\d+$/.test(key) ? APP.payee(key) : null;
          if (r.length !== 3 || !who) throw new Error(line + '행: 등록되지 않은 대상코드이거나 열 수가 다릅니다.');
          if (Object.prototype.hasOwnProperty.call(map, key)) throw new Error(line + '행: 대상코드가 중복되었습니다.');
          const name = r[1].replace(/^'/, '');
          if (![who.name, who.handle].filter(Boolean).includes(name)) throw new Error(line + '행: 대상명과 대상코드가 일치하지 않습니다.');
          const value = r[2].replace(/원$/, '').trim();
          if (!/^-?(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value)) throw new Error(line + '행: 지급액을 원 단위 정수로 입력해 주세요.');
          const amount = Number(value.replace(/,/g, ''));
          if (!Number.isSafeInteger(amount)) throw new Error(line + '행: 지급액의 숫자 범위를 확인해 주세요.');
          map[key] = amount;
        });
        if (expected.some((key) => !Object.prototype.hasOwnProperty.call(map, key))) throw new Error('대조 양식에 있는 정산 대상이 누락되었습니다. 금액이 없으면 0을 입력해 주세요.');
        S().recon['2027-02-03'] = { loaded: true, causes: {}, memo: {}, custom: map, file: f.name };
        APP.toast(Object.keys(map).length + '개 행을 대조했습니다'); APP.commit('병행 대조 02-03 — 업로드 파일 ' + f.name.slice(0, 40));
      } catch (e) { APP.toast('파일을 반영하지 않았습니다 — ' + e.message, 'warn'); }
    };
    rd.onerror = () => { if (APP.isCurrentWork(token) && sequence === reconReadSequence) APP.toast('파일을 읽지 못했습니다. 다시 선택해 주세요', 'warn'); };
    rd.readAsText(f, 'utf-8');
  });
  /* 업로드한 CSV 값 우선 */
  const baseExcel = D.excelFor;
  D.excelFor = function (S0, day, calc) { const st = S0.recon[day]; if (st && st.custom) return Object.entries(st.custom).map(([key, amt]) => ({ key, amt })); return baseExcel(S0, day, calc); };
  on('rc-ok', (el) => {
    const s = S(), day = '2027-02-03', k = el.dataset.key; const sel = U.qs('select[data-key="' + k + '"]'); const v = sel && sel.value;
    if (!v) return APP.toast('원인을 선택해 주세요', 'warn');
    if (v === '기타 (메모)') { const m = prompt('원인 메모를 입력해 주세요 (승인 근거로 남습니다)'); if (!m || !m.trim()) return; s.recon[day].memo[k] = m.trim().slice(0, 80); }
    s.recon[day].causes[k] = v; APP.toast(APP.payeeName(k) + ' — ' + v + ' 승인'); APP.commit('병행 대조 02-03 ' + APP.payeeName(k) + ' 차이 원인 승인: ' + v);
  });
  on('rc-why', (el) => {
    const s = S(), day = '2027-02-03', k = el.dataset.key, c = APP.calc(day), l = c.lines.find((x) => x.kind + x.id === k); const r = APP.reconRows(day).find((x) => x.key === k);
    const ev = [];
    const miss = s.orders.find((o) => o.story === 'excelMissing'); const can = s.orders.find((o) => o.story === 'cancelAfter');
    if (miss && (k === 'S' + miss.sid || k === 'B' + miss.bid)) ev.push(`<li><b>엑셀 원천 주문 목록에 없는 주문</b> ${miss.no} · ${U.md(miss.paid)} ${miss.time} 결제 · ${U.esc(APP.product(miss.pid).name)} — 스룩페이 주문 파일을 23:52 이전에 내려받아 빠진 것으로 보입니다.</li>`);
    if (can && (k === 'S' + can.sid || k === 'B' + can.bid)) ev.push(`<li><b>정산 후 취소</b> ${can.no} · ${U.md(can.paid)} 결제 → ${U.md(can.cancelAt)} 취소 — 시스템은 취소일(02-03) 정산에서 차감, 기존 엑셀은 02-02에 반영했습니다.</li>`);
    if (k === 'Ss5') ev.push(`<li><b>수수료율 차이</b> 공구 조건 12% (태호 셰프 조리도구) — 엑셀 수식은 15%를 참조하고 있습니다.</li>`);
    if (r && Math.abs(r.diff) <= 10 && r.diff) ev.push(`<li><b>반올림 위치 차이</b> 시스템은 정산 건 최종값에서 1회 반올림, 엑셀은 주문 줄마다 반올림해 ${U.won(Math.abs(r.diff))}원 차이가 납니다.</li>`);
    if (!ev.length) ev.push('<li>자동으로 찾은 근거가 없습니다. 원인을 확인해 메모와 함께 승인해 주세요.</li>');
    APP.modal({ title: '차이 근거 — ' + APP.payeeName(k), sub: '시스템 ' + U.won(r.sys) + '원 · 엑셀 ' + U.won(r.xl) + '원 · 차이 ' + U.won(r.diff) + '원', wide: true, body: `<ul class="evidence">${ev.join('')}</ul>${l ? `<div class="kv"><span>포함 주문</span><b>${l.cnt}건 · 매출 ${U.won(l.sales)}원</b><span>기본 정산</span><b>${U.won(l.base)}원</b><span>조정</span><b>${U.won(l.adj)}원</b><span>원천징수</span><b>${U.won(l.tax)}원</b></div>` : ''}`, foot: `<button class="btn line" data-act="stmt" data-day="${day}" data-key="${k}">정산서 보기</button><button class="btn" data-act="close">닫기</button>` });
  });
  on('rc-pass', () => { const s = S(); const day = '2027-02-03'; if (!s.recon[day] || !s.recon[day].loaded || APP.reconState().open) return; s.recon[day].done = true; const n = Object.keys(s.recon[day].causes).length; s.recon[day].note = '차이 ' + n + '건 원인 승인'; APP.toast(U.md(day) + ' 병행 대조 통과 — 정산 확정이 가능합니다'); APP.commit('병행 대조 02-03 통과 (설명되지 않는 차이 0원)'); });

  /* =====================================================================
     셀러·브랜드
     ===================================================================== */
  const mTab = { k: 'S' };
  APP.route(/^\/ops\/members$/, () => {
    const s = S(); const list = mTab.k === 'S' ? s.sellers : s.brands;
    const body = `<div class="tabs"><a href="javascript:void 0" data-act="m-tab" data-k="S" class="${mTab.k === 'S' ? 'on' : ''}">셀러 ${s.sellers.length}</a><a href="javascript:void 0" data-act="m-tab" data-k="B" class="${mTab.k === 'B' ? 'on' : ''}">브랜드 ${s.brands.length}</a></div>
      <section class="card"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>${mTab.k === 'S' ? '셀러' : '브랜드'}</th><th>상태</th><th>${mTab.k === 'S' ? '구분 · 팔로워' : '카테고리 · 배송'}</th><th>정산 계좌</th><th></th></tr></thead><tbody>
      ${list.map((w) => { const a = w.account; const acct = a.changedAt && !a.verified ? U.st('변경 · 지급 보류', 'red') : a.verified ? U.st('확인 완료', 'green') : U.st('확인 전', 'amber'); return `<tr><td><b>${w.handle ? w.handle : U.esc(w.name)}</b><small class="sub">${w.handle ? w.name + (w.biz ? ' · ' + U.esc(w.biz) : '') : '담당 ' + U.esc(w.manager)}</small></td><td>${U.st(w.status, w.status === '활성' ? 'green' : w.status === '승인 대기' ? 'amber' : 'gray')}</td><td>${w.handle ? w.type + ' · ' + w.follower : U.esc(w.cat) + ' · ' + U.esc(w.ship)}</td><td>${U.esc(a.bank)} <span class="mono">${U.maskAcct(a.no)}</span> ${acct}</td><td class="r">${w.status === '승인 대기' ? `<button class="btn xs" data-act="m-join" data-k="${mTab.k}${w.id}">가입 심사</button>` : !a.verified ? `<button class="btn xs" data-act="m-acct" data-k="${mTab.k}${w.id}">계좌 확인</button>` : ''} ${w.status === '활성' ? `<a class="btn xs line" href="#/login/${mTab.k === 'S' ? 'seller' : 'brand'}">포털 로그인</a>` : ''}</td></tr>`; }).join('')}
      </tbody></table></div></section>
      <div class="note">${U.ic('shield')}<div><b>계좌 변경 보호</b><span>셀러·브랜드가 계좌를 바꾸면 자동으로 지급이 보류되고, 운영자가 통장 사본·예금주를 확인해야 이체 파일에 다시 포함됩니다.</span></div></div>`;
    return APP.ops('members', { title: '셀러·브랜드', sub: '가입 신청 → 운영자 승인 · 정산 계좌 등록과 예금주 확인', body }) + APP.demoBar();
  });
  on('m-tab', (el) => { mTab.k = el.dataset.k; APP.render(); });
  on('m-acct', (el) => {
    const w = APP.payee(el.dataset.k), a = w.account;
    APP.modal({ title: '정산 계좌 확인 — ' + (w.handle || w.name), sub: a.changedAt ? '변경 요청 ' + a.changedAt + (a.prev ? ' · 이전 ' + a.prev : '') : '신규 등록 계좌', body: `<div class="acct-box"><div class="bankbook">${U.ic('file')}<b>통장 사본.jpg</b><small>가상 첨부 · 예금주 ${U.esc(a.holder)}</small></div><div class="kv"><span>은행</span><b>${U.esc(a.bank)}</b><span>계좌번호</span><b class="mono">${U.esc(a.no)}</b><span>등록 예금주</span><b>${U.esc(a.holder)}</b><span>사업자 상호</span><b>${U.esc(w.biz || w.name)}</b></div></div><label class="chk"><input type="checkbox" id="ac-ok"> 통장 사본의 예금주·계좌번호가 등록 정보와 같음을 확인했습니다</label><p class="muted small">등록된 통장 사본과 예금주·계좌번호를 대조한 후 지급 보류를 해제해 주세요.</p>`, foot: `<button class="btn line" data-act="close">취소</button><button class="btn" data-act="m-acct-ok" data-k="${el.dataset.k}">확인 완료 · 보류 해제</button>` });
  });
  on('m-acct-ok', (el) => { if (!(U.qs('#ac-ok') || {}).checked) return APP.toast('확인 항목에 체크해 주세요', 'warn'); const w = APP.payee(el.dataset.k); w.account.verified = true; APP.close(); APP.toast('계좌를 확인했습니다 — 지급 보류 해제'); APP.commit((w.handle || w.name) + ' 정산 계좌 확인 · 지급 보류 해제'); });
  on('m-join', (el) => {
    const w = APP.payee(el.dataset.k);
    APP.modal({ title: '가입 심사 — ' + (w.handle ? w.handle + ' ' + w.name : w.name), body: `<div class="kv">${w.handle ? `<span>채널</span><b>인스타그램 ${w.handle} · 팔로워 ${w.follower}</b><span>분야</span><b>${U.esc(w.cat)}</b><span>구분</span><b>${w.type} (원천징수 대상)</b>` : `<span>카테고리</span><b>${U.esc(w.cat)}</b><span>담당자</span><b>${U.esc(w.manager)}</b><span>배송</span><b>${U.esc(w.ship)}</b>`}<span>정산 계좌</span><b>${U.esc(w.account.bank)} ${U.maskAcct(w.account.no)}</b></div><label class="form"><span>보완 요청·반려 사유</span><input id="jn-r" maxlength="80" placeholder="반려·보완 시 입력"></label>`, foot: `<button class="btn line" data-act="m-join-do" data-k="${el.dataset.k}" data-v="반려">반려</button><button class="btn line" data-act="m-join-do" data-k="${el.dataset.k}" data-v="보완 요청">보완 요청</button><button class="btn" data-act="m-join-do" data-k="${el.dataset.k}" data-v="승인">승인</button>` });
  });
  on('m-join-do', (el) => {
    const w = APP.payee(el.dataset.k), v = el.dataset.v, r = ((U.qs('#jn-r') || {}).value || '').trim();
    if (v !== '승인' && !r) return APP.toast('사유를 입력해 주세요', 'warn');
    w.status = v === '승인' ? '활성' : v === '반려' ? '반려' : '보완 요청';
    if (v === '승인') S().talk.unshift({ at: APP.now(), to: w.handle || w.name, tpl: '가입 승인 안내', body: '템플릿 JOIN_OK 심사 중 — 승인 전까지 발송 보류 후 자동 발송 대기열에 등록 (시뮬레이션)' });
    APP.close(); APP.toast((w.handle || w.name) + ' ' + v); APP.commit((w.handle || w.name) + ' 가입 ' + v + (r ? ' — ' + r : ''));
  });

  /* =====================================================================
     변경 이력 · 연동 설정
     ===================================================================== */
  const lq = { q: '' };
  APP.route(/^\/ops\/log$/, () => {
    const s = S(); const list = s.log.filter((l) => !lq.q || (l.who + l.what).includes(lq.q));
    const body = `<section class="card"><div class="filters"><label class="search">${U.ic('search')}<input data-change="lq" value="${U.esc(lq.q)}" aria-label="변경 이력 검색" placeholder="담당자·내용 검색 후 Enter"></label></div>
      <ol class="timeline">${list.map((l) => `<li><time>${U.esc(l.at)}</time><b>${U.esc(l.who)}</b><p>${U.esc(l.what)}</p></li>`).join('') || '<li><p>검색 결과가 없습니다</p></li>'}</ol></section>`;
    return APP.ops('log', { title: '변경 이력', sub: '정산·이체·권한·계좌 변경을 모두 기록합니다 (수정·삭제 불가)', body }) + APP.demoBar();
  });
  on('lq', (el) => { lq.q = el.value.trim(); APP.render(); });
  APP.route(/^\/ops\/settings$/, () => {
    const s = S();
    const body = `<div class="grid2">
      <section class="card chan"><div class="chan-h">${U.chDot('SS')}<div><h3>스마트스토어 커머스API</h3><p>발주사 명의 애플리케이션</p></div>${U.st('연결됨', 'green')}</div>
        <dl class="chan-kv"><div><dt>권한</dt><dd>주문 조회 · 발송 처리 · 상품 등록</dd></div><div><dt>인증</dt><dd>전자서명 토큰 · 자동 갱신</dd></div><div><dt>호출 서버</dt><dd>고정 IP 1개</dd></div><div><dt>API 키</dt><dd>${U.ic('lock')}암호화 보관 · 화면 비표시</dd></div></dl></section>
      <section class="card chan"><div class="chan-h">${U.chDot('SL')}<div><h3>스룩페이</h3><p>API 협의 중</p></div>${U.st('엑셀 방식', 'amber')}</div>
        <dl class="chan-kv"><div><dt>주문</dt><dd>주문 엑셀 업로드 · 열 매핑 저장</dd></div><div><dt>상품</dt><dd>업로드 엑셀 자동 생성</dd></div><div><dt>송장</dt><dd>송장 업로드 엑셀 생성</dd></div><div><dt>API 전환</dt><dd>어댑터 추가 · 데이터 유지</dd></div></dl></section>
      <section class="card"><h3 class="h3">수집 주기</h3><div class="seg">${['5분', '10분', '30분'].map((v) => `<button class="${(s.cycle || '10분') === v ? 'on' : ''}" data-act="cycle" data-v="${v}">${v}</button>`).join('')}</div><p class="muted small">데모에서는 수집 주기를 선택해 볼 수 있습니다. 실제 자동 수집은 실행되지 않습니다.</p></section>
      <section class="card"><h3 class="h3">개인정보 보호</h3><ul class="dots"><li>셀러 화면: 구매자 이름·연락처·상세 주소 가림</li><li>브랜드 화면: 발송 대기 주문만 배송 정보 열람</li><li>송장 등록·배송 중·완료·취소 주문의 구매자 이름·연락처·상세 주소 가림</li><li>계좌번호는 화면에서 일부 가림 · 운영 시 암호화 저장 적용</li></ul></section>
      <section class="card"><h3 class="h3">카카오 알림톡 템플릿</h3><ul class="tpl">${Object.values(D.TALK).map((t) => `<li><div><b>${t.name}</b><small class="mono">${t.code}</small></div>${U.st(t.st, t.st === '승인' ? 'green' : 'amber')}</li>`).join('')}</ul><p class="muted small">등록된 발신 프로필과 승인된 템플릿으로 안내합니다. 현재 데모는 실제 발송하지 않습니다.</p></section>
      <section class="card"><h3 class="h3">은행 · 세금계산서</h3><ul class="dots"><li>기업은행 대량이체 — 파일 방식 (양식은 은행 문서로 확정)</li><li>펌뱅킹 API 직접 이체 — 연결되지 않음</li><li>전자세금계산서 — 발행 대상 집계·홈택스용 엑셀 다운로드</li></ul></section>
    </div>`;
    return APP.ops('settings', { title: '연동·설정', sub: '판매 채널·은행·알림톡·개인정보 설정', body }) + APP.demoBar();
  });
  on('cycle', (el) => { S().cycle = el.dataset.v; APP.toast('수집 주기를 ' + el.dataset.v + '로 바꿨습니다'); APP.commit('수집 주기 변경 → ' + el.dataset.v); });
})();
