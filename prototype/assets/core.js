/* 공구온 OPS [프로토타입] — 상태·라우터·공통 UI
   브라우저 안에서만 동작하는 체험판입니다. 실제 판매 채널·은행·알림톡·국세청과 연결되지 않습니다. */
(function () {
  'use strict';
  const D = window.DATA;
  const KEY = 'gongguon.proto.v1';
  const APP = (window.APP = { routes: [], acts: {}, actionScopes: {}, after: [] });
  const U = (APP.U = {});

  /* ---------- 유틸 ---------- */
  U.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  U.won = (n) => { n = Math.round(n || 0); return (n < 0 ? '−' : '') + Math.abs(n).toLocaleString('ko-KR'); };
  U.num = (n) => (n || 0).toLocaleString('ko-KR');
  U.md = (s) => Number(s.slice(5, 7)) + '/' + Number(s.slice(8, 10));
  U.day = (s) => s + ' (' + D.dow(s) + ')';
  U.qs = (s, el) => (el || document).querySelector(s);
  U.qsa = (s, el) => Array.from((el || document).querySelectorAll(s));
  U.maskName = (n) => (n.length <= 2 ? n[0] + '*' : n[0] + '*'.repeat(n.length - 2) + n[n.length - 1]);
  U.maskPhone = (p) => p.replace(/-(\d{4})-/, '-****-');
  U.maskAddr = (a) => a.split(' ').slice(0, 2).join(' ') + ' ***';
  U.maskAcct = (a) => a.replace(/\d(?=[\d-]{4})/g, (d, i) => (i < 3 ? d : '*'));
  U.csv = (rows) => '﻿' + rows.map((r) => r.map((c) => { c = String(c == null ? '' : c); if (/^[=+\-@\t\r]/.test(c) && !/^-?\d/.test(c)) c = "'" + c; return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(',')).join('\n');
  U.dl = (name, text, type) => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'text/csv;charset=utf-8' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 400); };
  U.sheet = (name, rows, title) => {
    try { if (window.XLSX) { const ws = XLSX.utils.aoa_to_sheet(rows); const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, (title || 'Sheet1').slice(0, 30)); XLSX.writeFile(wb, name); return; } } catch (e) { /* CSV로 대체 */ }
    U.dl(name.replace(/\.xlsx$/, '.csv'), U.csv(rows));
  };
  U.parseCsv = (text) => text.replace(/^﻿/, '').split(/\r?\n/).filter((l) => l.trim()).map((l) => { const out = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '"' && l[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; } else if (c === '"') q = true; else if (c === ',') { out.push(cur); cur = ''; } else cur += c; } out.push(cur); return out.map((x) => x.trim()); });

  /* ---------- 아이콘 ---------- */
  const P = {
    grid: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
    cart: '<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',
    box: '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/>',
    truck: '<path d="M1 3h15v13H1z"/><path d="M16 8h4l3 3v5h-7z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
    calc: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    bank: '<path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/>',
    scale: '<path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1zM2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1zM7 21h10M12 3v18M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    history: '<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    refresh: '<path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/>',
    chev: '<path d="m9 18 6-6-6-6"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    spark: '<path d="M12 3l1.9 5.8L20 10.7l-6.1 1.9L12 18.4l-1.9-5.8L4 10.7l6.1-1.9z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
    menu: '<path d="M3 12h18M3 6h18M3 18h18"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    zap: '<path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/>',
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    tag: '<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><path d="M7 7h.01"/>',
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    printer: '<path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    pause: '<rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/>',
    store: '<path d="M3 9l1.5-5h15L21 9M3 9v11h18V9M3 9h18M9 20v-6h6v6"/>'
  };
  U.ic = (n, cls) => `<svg class="ic ${cls || ''}" viewBox="0 0 24 24" aria-hidden="true">${P[n] || ''}</svg>`;

  /* ---------- 상태 ---------- */
  let S = null;
  APP.get = () => S;
  function seed() {
    const b = D.base();
    const s = Object.assign(b, {
      orders: D.seedOrders(b), manual: [], settle: {}, batches: [], recon: {}, log: [], talk: [], acks: {},
      collect: { SS: { last: '09:40', ok: true, fails: 0, today: 0 }, SL: { last: '02-03 18:05', ok: true, uploads: { '2027-02-03': true } } },
      shipUpload: null, session: { ops: null, seller: null, brand: null }, ver: 1
    });
    for (const d of D.range(D.FIRST, D.add(D.TODAY, -1))) s.settle[d] = { st: d <= '2027-02-01' ? 'paid' : d === '2027-02-02' ? 'confirmed' : 'draft' };
    s.settle['2027-02-02'].by = '이정산'; s.settle['2027-02-02'].at = '02-03 10:12';
    ['2027-01-30', '2027-01-31', '2027-02-01'].forEach((d, i) => {
      const c = D.calc(s, d);
      s.batches.push({ id: 'TR-' + d.replace(/-/g, '').slice(2), days: [d], at: D.add(d, 1).slice(5) + ' 11:0' + i, by: '이정산', st: 'done', items: c.lines.filter((l) => l.pay > 0).map((l) => ({ key: l.kind + l.id, name: l.kind === 'S' ? l.who.handle : l.who.name, amt: l.pay, bank: l.who.account.bank, no: l.who.account.no, holder: l.who.account.holder, res: '성공' })) });
    });
    s.recon['2027-02-01'] = { done: true, note: '셀러 5 · 브랜드 4 전 항목 일치' };
    s.recon['2027-02-02'] = { done: true, note: '차이 2건 원인 승인 (반올림 방식 1, 엑셀 수식 오류 1)' };
    s.log = [
      { at: '02-04 09:40', who: '시스템', what: '스마트스토어 주문 자동 수집 — 신규 ' + s.orders.filter((o) => o.paid === D.TODAY && o.ch === 'SS').length + '건' },
      { at: '02-04 06:00', who: '시스템', what: '02-03 일 정산 자동 계산 (작성)' },
      { at: '02-03 17:22', who: '최유나(@mom.picks)', what: '정산 계좌 정보 조회' },
      { at: '02-03 15:48', who: '이하나(@fit.hana)', what: '정산 계좌 변경 요청 → 지급 보류 자동 설정' },
      { at: '02-03 11:05', who: '이정산', what: '02-01 정산분 이체 결과 반영 (전체 성공)' },
      { at: '02-03 10:12', who: '이정산', what: '02-02 정산 확정' },
      { at: '02-03 09:58', who: '김운영', what: '02-02 정산 검토 완료' },
      { at: '02-03 09:31', who: '김운영', what: '병행 운영 02-02 엑셀 대조 — 차이 2건 원인 승인' }
    ];
    s.talk = [{ at: '02-03 10:12', to: '셀러·브랜드 9명', tpl: '정산 확정 안내', body: '02-02 정산 확정 안내 일괄 발송 (시뮬레이션)' }];
    return s;
  }
  function load() { try { const t = localStorage.getItem(KEY); if (t) { const v = JSON.parse(t); if (v && v.ver === 1) return v; } } catch (e) { /* 저장소 사용 불가 */ } return seed(); }
  APP.save = () => { try { localStorage.setItem(KEY, JSON.stringify(Object.assign({}, S, {session:{ops:null,seller:null,brand:null}}))); } catch (e) { /* 무시 */ } };
  APP.reset = () => { APP.close(); try { localStorage.removeItem(KEY); } catch (e) {} S = prepare(seed()); if (APP.clearAuth) APP.clearAuth(); APP.save(); };
  function prepare(state) {
    // Earlier demo versions marked general sales only by acknowledging the issue.
    state.orders.forEach((o) => { if (!o.gid && state.acks && state.acks['unl-' + o.id]) { o.saleType = 'general'; o.sid = null; o.settleRate = 0; } });
    state.orders.forEach((o) => { const g = state.groups.find((x) => x.id === o.gid); if (g && !Number.isFinite(o.settleRate)) o.settleRate = g.rate; });
    Object.keys(state.settle).sort().forEach((day) => { const st = state.settle[day]; if (['confirmed','paid'].includes(st.st) && !st.snapshot) st.snapshot = capture(state, day); });
    return state;
  }
  function capture(state, day) {
    const result = JSON.parse(JSON.stringify(D.calc(state, day)));
    result.orderRows = state.orders.filter((o) => result.lines.some((l) => l.orders.includes(o.id))).map((o) => JSON.parse(JSON.stringify(o)));
    return result;
  }
  APP.freezeSettlement = (day) => { S.settle[day].snapshot = capture(S, day); };
  APP.init = () => { S = prepare(load()); S.session = {ops:null,seller:null,brand:null}; if (APP.restoreAuth) APP.restoreAuth(); APP.save(); };
  APP.now = () => '02-04 ' + D.NOW;
  APP.log = (what, who) => { S.log.unshift({ at: APP.now(), who: who || APP.opsName(), what }); };
  APP.commit = (what, who) => { if (what) APP.log(what, who); APP.save(); APP.render(); };

  /* ---------- 조회 도우미 ---------- */
  APP.seller = (id) => S.sellers.find((x) => x.id === id);
  APP.brand = (id) => S.brands.find((x) => x.id === id);
  APP.product = (id) => S.products.find((x) => x.id === id);
  APP.group = (id) => S.groups.find((x) => x.id === id);
  APP.order = (id) => S.orders.find((x) => x.id === id);
  APP.payee = (key) => (key[0] === 'S' ? APP.seller(key.slice(1)) : APP.brand(key.slice(1)));
  APP.payeeName = (key) => { const w = APP.payee(key); if (!w) return '확인 필요 (' + key + ')'; return key[0] === 'S' ? w.handle : w.name; };
  APP.opsName = () => (S.session.ops === 'confirm' ? '이정산' : '김운영');
  APP.groupState = (g) => (D.TODAY < g.from ? '예정' : D.TODAY > g.to ? '종료' : '진행 중');
  APP.calc = (day) => {
    const st = S.settle[day];
    if (!st || !st.snapshot || !['confirmed','paid'].includes(st.st)) return D.calc(S, day);
    const c = JSON.parse(JSON.stringify(st.snapshot));
    // Amounts are frozen; payout checks must use the latest account verification.
    c.lines.forEach((l) => { const w = l.kind === 'S' ? APP.seller(l.id) : APP.brand(l.id); if (w) l.who.account = w.account; });
    return c;
  };
  APP.statementOrders = (day, line) => { const st = S.settle[day]; return line.orders.map((id) => st && st.snapshot ? st.snapshot.orderRows.find((o) => o.id === id) : APP.order(id)).filter(Boolean); };

  /* ---------- 라우터 ---------- */
  APP.route = (re, fn) => APP.routes.push({ re, fn });
  APP.go = (h) => { if (location.hash === h) APP.render(); else location.hash = h; };
  APP.render = () => {
    let h = (location.hash || '#/').slice(1) || '/';
    const role = APP.routeRole && APP.routeRole(h);
    if (role && !APP.canAccess(role)) {
      APP.loginTarget(role, h); h = '/login/' + role; location.hash = '#' + h;
    }
    const r = APP.routes.find((x) => x.re.test(h)) || APP.routes.find((x) => x.re.test('/'));
    const identity = JSON.stringify(S.session);
    if (APP.lastHash !== h || (APP.lastIdentity && APP.lastIdentity !== identity)) {
      APP.close(); APP.slPending = null;
    }
    APP.after = [];
    const m = h.match(r.re) || [h];
    const html = r.fn.apply(null, m.slice(1));
    APP.lastIdentity = JSON.stringify(S.session);
    const app = document.getElementById('app');
    app.innerHTML = html;
    APP.after.forEach((f) => f());
    const y = APP.keepScroll ? window.scrollY : 0; APP.keepScroll = false;
    if (APP.lastHash !== h) window.scrollTo(0, 0); else window.scrollTo(0, y);
    APP.lastHash = h;
    document.body.classList.remove('nav-open');
  };

  /* ---------- 이벤트 위임 ---------- */
  APP.on = (name, fn, scope) => { APP.actionScopes[name] = scope; APP.acts[name] = (el, ev) => {
    if (scope && !APP.canAct(scope, (el || {}).dataset || {})) {
      APP.close(); APP.toast('현재 계정으로 이용할 수 없는 작업입니다. 로그인 정보를 확인해 주세요', 'warn');
      return;
    }
    return fn(el, ev);
  }; };
  document.addEventListener('click', (ev) => {
    const el = ev.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = APP.acts[el.dataset.act];
    if (fn) { ev.preventDefault(); APP.keepScroll = true; fn(el, ev); }
  });
  document.addEventListener('change', (ev) => {
    const el = ev.target.closest('[data-change]');
    if (el && APP.acts[el.dataset.change]) { APP.keepScroll = true; APP.acts[el.dataset.change](el, ev); }
  });
  document.addEventListener('submit', (ev) => {
    const el = ev.target.closest('[data-submit]');
    if (el && APP.acts[el.dataset.submit]) { ev.preventDefault(); APP.acts[el.dataset.submit](el, ev); }
  });
  document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') APP.close(); });

  /* ---------- 토스트·모달 ---------- */
  APP.toast = (msg, kind) => {
    const box = document.getElementById('toasts'); if (!box) return;
    const t = document.createElement('div'); t.className = 'toast ' + (kind || 'ok');
    t.innerHTML = U.ic(kind === 'warn' ? 'alert' : kind === 'info' ? 'bell' : 'check') + '<span>' + U.esc(msg) + '</span>';
    box.appendChild(t); setTimeout(() => t.classList.add('out'), 3200); setTimeout(() => t.remove(), 3700);
  };
  APP.modal = (o) => {
    APP.close();
    const w = document.createElement('div'); w.id = 'modal'; w.className = 'modal-wrap';
    w.innerHTML = `<div class="modal ${o.wide ? 'wide' : ''}" role="dialog" aria-modal="true" aria-label="${U.esc(o.title)}">
      <header><div><h3>${U.esc(o.title)}</h3>${o.sub ? `<p>${o.sub}</p>` : ''}</div><button class="icon-btn" data-act="close" aria-label="닫기">${U.ic('x')}</button></header>
      <div class="modal-body">${o.body}</div>${o.foot ? `<footer>${o.foot}</footer>` : ''}</div>`;
    w.addEventListener('mousedown', (e) => { if (e.target === w) APP.close(); });
    document.body.appendChild(w); document.body.classList.add('modal-open');
    if (o.after) o.after(w);
    return w;
  };
  let workEpoch = 0;
  const pendingWork = new Set();
  APP.workToken = () => workEpoch;
  APP.isCurrentWork = (token) => token === workEpoch;
  APP.defer = (fn, ms) => { const token = workEpoch; const id = setTimeout(() => { pendingWork.delete(id); if (token === workEpoch) fn(); }, ms); pendingWork.add(id); return id; };
  APP.close = () => { workEpoch++; pendingWork.forEach(clearTimeout); pendingWork.clear(); const m = document.getElementById('modal'); if (m) m.remove(); document.body.classList.remove('modal-open'); };

  APP.on('close', () => APP.close());
  APP.on('go', (el) => { APP.close(); APP.go(el.dataset.to); });

  /* ---------- 공통 조각 ---------- */
  const STC = { '발송 대기': 'amber', '송장 등록': 'blue', '배송 중': 'violet', '배송 완료': 'green', '취소': 'gray', '반품 완료': 'gray', draft: 'amber', reviewed: 'blue', confirmed: 'violet', paid: 'green' };
  U.st = (t, cls) => `<span class="pill ${cls || STC[t] || 'gray'}">${U.esc(t)}</span>`;
  U.SETTLE = { draft: '작성', reviewed: '검토 완료', confirmed: '확정', paid: '지급 완료' };
  U.ch = (c) => `<span class="ch ch-${c}" title="${D.CH[c].name}">${D.CH[c].short}</span><span class="ch-name">${D.CH[c].name}</span>`;
  U.chDot = (c) => `<span class="ch ch-${c}" title="${D.CH[c].name}">${D.CH[c].short}</span>`;
  U.empty = (t, ic) => `<div class="empty">${U.ic(ic || 'check')}<p>${t}</p></div>`;
  U.kpi = (label, value, sub, tone, icon) => `<div class="kpi ${tone || ''}"><div class="kpi-top"><span>${label}</span>${icon ? U.ic(icon) : ''}</div><strong>${value}</strong>${sub ? `<em>${sub}</em>` : ''}</div>`;
  const PRODUCT_PHOTOS = { pan: 'cast-iron-pan', tool: 'silicone-tools', bed: 'comforter', mat: 'bath-mat', amp: 'cica-serum', sun: 'sunscreen', chk: 'chicken-meal', gra: 'granola' };
  U.thumb = (p) => PRODUCT_PHOTOS[p.img] ? `<span class="thumb photo-thumb t-${p.img}" aria-hidden="true"><img src="assets/images/${PRODUCT_PHOTOS[p.img]}.webp" alt="" width="96" height="96" loading="lazy"></span>` : `<span class="thumb" aria-hidden="true">${U.esc(p.name.slice(0, 1))}</span>`;

  /* 막대 차트 (일별 매출 · 채널 누적) — 단일 축, 둥근 끝, 호버 툴팁 */
  U.bars = (id, series, opt) => {
    opt = opt || {};
    const W = 640, H = 200, pl = 44, pr = 8, pt = 12, pb = 26;
    const max = Math.max(1, ...series.map((s) => s.parts.reduce((a, p) => a + p.v, 0)));
    const step = niceStep(max), top = Math.ceil(max / step) * step;
    const bw = (W - pl - pr) / series.length, barW = Math.min(26, bw * 0.56);
    const y = (v) => pt + (H - pt - pb) * (1 - v / top);
    let g = '';
    for (let v = 0; v <= top; v += step) g += `<line x1="${pl}" x2="${W - pr}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pl - 6}" y="${y(v) + 4}" class="ax" text-anchor="end">${v >= 10000 ? Math.round(v / 10000) + '만' : v}</text>`;
    let b = '';
    series.forEach((s, i) => {
      const x = pl + bw * i + (bw - barW) / 2; let acc = 0;
      s.parts.forEach((p, j) => {
        if (!p.v) return; const y0 = y(acc), y1 = y(acc + p.v); acc += p.v;
        const last = j === s.parts.length - 1 || s.parts.slice(j + 1).every((q) => !q.v);
        const h = Math.max(1, y0 - y1 - (last ? 0 : 2));
        b += last ? `<path class="bar ${p.cls}" d="M${x},${y0} V${y1 + 4} Q${x},${y1} ${x + 4},${y1} H${x + barW - 4} Q${x + barW},${y1} ${x + barW},${y1 + 4} V${y0} Z" transform="translate(0,${0})"/>` : `<rect class="bar ${p.cls}" x="${x}" y="${y0 - h}" width="${barW}" height="${h}"/>`;
      });
      if (i % (opt.every || 1) === 0 || i === series.length - 1) b += `<text x="${x + barW / 2}" y="${H - 8}" class="ax" text-anchor="middle">${s.label}</text>`;
      b += `<rect class="hit" x="${pl + bw * i}" y="${pt}" width="${bw}" height="${H - pt - pb}" data-i="${i}"/>`;
    });
    APP.after.push(() => {
      const root = document.getElementById(id); if (!root) return; const tip = root.querySelector('.tip');
      root.querySelectorAll('.hit').forEach((h) => {
        h.addEventListener('mouseenter', () => { const s = series[h.dataset.i]; tip.innerHTML = `<b>${s.title || s.label}</b>` + s.parts.map((p) => `<div><i class="sw ${p.cls}"></i>${p.name}<span>${U.won(p.v)}원</span></div>`).join('') + (s.parts.length > 1 ? `<div class="tot">합계<span>${U.won(s.parts.reduce((a, p) => a + p.v, 0))}원</span></div>` : ''); tip.style.display = 'block'; const r = root.getBoundingClientRect(), hr = h.getBoundingClientRect(); let left = hr.left - r.left + hr.width / 2; left = Math.min(Math.max(left, 90), r.width - 90); tip.style.left = left + 'px'; h.classList.add('on'); });
        h.addEventListener('mouseleave', () => { tip.style.display = 'none'; h.classList.remove('on'); });
      });
    });
    const legend = opt.legend ? `<div class="legend">${opt.legend.map((l) => `<span><i class="sw ${l.cls}"></i>${l.name}</span>`).join('')}</div>` : '';
    return `<div class="chart" id="${id}">${legend}<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" role="img" aria-label="${U.esc(opt.label || '차트')}">${g}${b}</svg><div class="tip"></div></div>`;
  };
  function niceStep(max) { const raw = max / 4, mag = Math.pow(10, Math.floor(Math.log10(raw))); const n = raw / mag; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag; }

  /* ---------- 셸: 운영자 콘솔 ---------- */
  APP.nav = () => [
    { g: '운영', items: [['', 'grid', '대시보드'], ['inbox', 'inbox', '확인 필요', APP.issues().length]] },
    { g: '업무 자동화', items: [['orders', 'cart', '주문 장부'], ['products', 'box', '상품·공구'], ['ship', 'truck', '배송·송장'], ['settle', 'calc', '일 정산'], ['payout', 'bank', '지급·이체'], ['recon', 'scale', '엑셀 대조']] },
    { g: '관리', items: [['members', 'users', '셀러·브랜드'], ['log', 'history', '변경 이력'], ['settings', 'settings', '연동·설정']] }
  ];
  APP.workspaceNav = (active) => active ? '' : `<nav class="workspace-nav" aria-label="업무 공간">${[['ops','grid','운영자 콘솔'],['seller','users','셀러 포털'],['brand','store','브랜드 포털']].map(([k,ic,label]) => `<a href="#/login/${k}">${U.ic(ic)}<span>${label}</span></a>`).join('')}</nav>`;
  APP.ops = (key, o) => {
    const nav = APP.nav().map((sec) => `<div class="nav-g"><span>${sec.g}</span>${sec.items.map(([k, ic, label, badge]) => `<a href="#/ops${k ? '/' + k : ''}" class="${key === k ? 'on' : ''}">${U.ic(ic)}<b>${label}</b>${badge ? `<i class="${badge === '★' ? 'star' : ''}">${badge}</i>` : ''}</a>`).join('')}</div>`).join('');
    const who = S.session.ops === 'confirm' ? { n: '이정산', r: '정산 책임자', a: '이' } : { n: '김운영', r: '운영 담당', a: '김' };
    return `<div class="ops">
      <aside class="side">
        <a class="brand" href="#/">${APP.logo()}<span>공구온<em>OPS</em></span></a>
        <nav>${nav}</nav>
        <div class="me"><span class="av">${who.a}</span><div><b>${who.n}</b><small>${who.r}</small></div><button class="icon-btn ghost" data-act="logout" title="로그아웃" aria-label="로그아웃">${U.ic('logout')}</button></div>
      </aside>
      <div class="main">
        <header class="top">
          <button class="icon-btn mob" data-act="nav" aria-label="메뉴">${U.ic('menu')}</button>
          <div class="ttl"><h1>${o.title}</h1>${o.sub ? `<p>${o.sub}</p>` : ''}</div>
          <div class="top-r">
            <span class="today">${U.ic('zap')}${U.md(D.TODAY)} (${D.dow(D.TODAY)}) ${D.NOW}</span>
            <button class="icon-btn" data-act="talk-log" title="알림톡 발송 이력" aria-label="알림톡 발송 이력">${U.ic('chat')}</button>
            <a class="btn sm line" href="#/">서비스 홈</a>
          </div>
        </header>
        ${o.actions ? `<div class="page-act">${o.actions}</div>` : ''}
        <main class="content">${o.body}</main>
      </div>
      <div class="scrim" data-act="nav"></div>
    </div>`;
  };
  APP.on('nav', () => document.body.classList.toggle('nav-open'));
  APP.on('talk-log', () => {
    APP.modal({ title: '카카오 알림톡 발송 이력', sub: '체험판에서는 실제로 발송하지 않고 기록만 남깁니다.', wide: true, body: S.talk.length ? `<div class="talk-list">${S.talk.map((t) => `<div class="talk"><div class="talk-h"><b>${U.esc(t.tpl)}</b><span>${U.esc(t.at)} · ${U.esc(t.to)}</span></div><pre>${U.esc(t.body)}</pre></div>`).join('')}</div>` : U.empty('발송 이력이 없습니다', 'chat') });
  }, 'ops');

  APP.logo = () => '<svg class="logo" viewBox="0 0 40 40" aria-hidden="true"><rect width="40" height="40" rx="12" fill="#315fdb"/><circle cx="15" cy="20" r="7" fill="none" stroke="#fff" stroke-width="3.2"/><circle cx="25" cy="20" r="7" fill="none" stroke="#fff" stroke-width="3.2" opacity=".75"/></svg>';

  /* ---------- 확인 필요 목록 ---------- */
  APP.issues = () => {
    const out = [], ack = S.acks;
    if (!S.collect.SL.uploads[D.TODAY]) out.push({ id: 'sl-up', lv: 'high', ic: 'upload', cat: '주문 수집', t: '스룩페이 오늘 주문 엑셀 미업로드', d: '일 마감 전에 판매자센터 주문 엑셀을 올려 주세요. (API 협의 전 엑셀 방식)', to: '#/ops/orders', btn: '업로드' });
    if (!S.collect.SS.ok) out.push({ id: 'ss-fail', lv: 'high', ic: 'alert', cat: '주문 수집', t: '스마트스토어 수집 실패 — 자동 재시도 3회 소진', d: '연동 상태를 확인하고 수동 재수집하세요.', to: '#/ops/orders', btn: '재수집' });
    S.orders.filter((o) => !D.isAssigned(o) && !o.cancelAt).forEach((o) => out.push({ id: 'unl-' + o.id, lv: 'high', ic: 'link', cat: '공구 연결', t: '공구 미연결 주문 ' + o.no, d: APP.product(o.pid).name + ' · 공구를 연결하거나 일반 판매로 분류해 주세요.', act: 'link-order', arg: o.id, btn: '공구 연결' }));
    const late = S.orders.filter((o) => o.status === '발송 대기' && D.diff(D.TODAY, o.paid) >= 2);
    if (late.length) out.push({ id: 'late', lv: 'mid', ic: 'truck', cat: '배송', t: '발송 지연 ' + late.length + '건 (결제 후 2일 경과)', d: '브랜드에 송장 입력 요청 알림톡을 보낼 수 있습니다.', to: '#/ops/ship', btn: '송장 관리' });
    if (S.shipUpload && S.shipUpload.rows.some((r) => r.err && !r.done)) out.push({ id: 'inv-mis', lv: 'mid', ic: 'truck', cat: '배송', t: '송장 불일치 ' + S.shipUpload.rows.filter((r) => r.err && !r.done).length + '건', d: '업로드한 송장 파일에서 매칭되지 않은 줄입니다.', to: '#/ops/ship', btn: '검토' });
    const draft = Object.keys(S.settle).filter((d) => S.settle[d].st === 'draft' || S.settle[d].st === 'reviewed');
    draft.forEach((d) => { const c = APP.calc(d); const adj = c.lines.filter((l) => l.autoAdj.length).length; out.push({ id: 'st-' + d, lv: 'mid', ic: 'calc', cat: '일 정산', t: U.md(d) + ' 정산 ' + (S.settle[d].st === 'draft' ? '검토 대기' : '확정 대기'), d: c.lines.length + '명 · ' + U.won(c.pay) + '원' + (adj ? ' · 정산 후 취소 차감 ' + adj + '건 포함' : ''), to: '#/ops/settle/' + d, btn: '열기' }); });
    S.sellers.concat(S.brands).filter((w) => w.status === '활성' && w.account.changedAt && !w.account.verified).forEach((w) => out.push({ id: 'acct-' + w.id, lv: 'high', ic: 'lock', cat: '지급', t: (w.handle || w.name) + ' 계좌 변경 — 지급 보류 중', d: '변경일 ' + w.account.changedAt + ' · 통장 사본과 예금주를 확인한 뒤 보류를 해제합니다.', to: '#/ops/members', btn: '계좌 확인' }));
    const conf = Object.keys(S.settle).filter((d) => S.settle[d].st === 'confirmed' && !S.batches.some((b) => b.days.includes(d) && b.st !== 'void'));
    conf.forEach((d) => out.push({ id: 'pay-' + d, lv: 'mid', ic: 'bank', cat: '지급', t: U.md(d) + ' 확정 정산 — 이체 파일 생성 대기', d: '확정된 정산으로 대량이체 파일을 만들 수 있습니다.', to: '#/ops/payout', btn: '이체 파일' }));
    S.batches.forEach((b) => b.items.filter((i) => i.res === '실패' && !i.retried).forEach((i) => out.push({ id: 'fail-' + b.id + i.key, lv: 'high', ic: 'alert', cat: '지급', t: '이체 실패 — ' + i.name, d: b.id + ' · ' + (i.reason || '') + ' · ' + U.won(i.amt) + '원', to: '#/ops/payout', btn: '재처리' })));
    const rc = APP.reconState(); if (rc && rc.open > 0) out.push({ id: 'recon', lv: 'high', ic: 'scale', cat: '엑셀 대조', t: '병행 대조 ' + U.md(rc.day) + ' — 설명되지 않는 차이 ' + rc.open + '건', d: '차이 합계 ' + U.won(rc.openAmt) + '원 · 원인을 분류하고 승인해야 전환 기준을 충족합니다.', to: '#/ops/recon', btn: '대조' });
    S.sellers.concat(S.brands).filter((w) => w.status === '승인 대기').forEach((w) => out.push({ id: 'join-' + w.id, lv: 'low', ic: 'users', cat: '회원', t: '가입 승인 대기 — ' + (w.handle ? w.handle + ' ' + w.name : w.name), d: (w.handle ? '셀러' : '브랜드') + ' 가입 신청 · ' + (w.joined || '02-03'), to: '#/ops/members', btn: '심사' }));
    S.products.forEach((p) => Object.keys(p.mall).forEach((c) => { if (p.mall[c].st === '등록 오류') out.push({ id: 'reg-' + p.id + c, lv: 'low', ic: 'box', cat: '상품 등록', t: D.CH[c].name + ' 등록 오류 — ' + p.name, d: p.mall[c].err, to: '#/ops/products', btn: '수정' }); }));
    return out.filter((x) => !ack[x.id]);
  };

  /* 병행 대조 상태 (02-03) */
  APP.reconState = () => {
    const day = '2027-02-03';
    if (!S.recon[day] || !S.recon[day].loaded) return { day, open: 0, openAmt: 0, notLoaded: true };
    const rows = APP.reconRows(day);
    const open = rows.filter((r) => r.diff !== 0 && !r.cause);
    return { day, rows, open: open.length, openAmt: open.reduce((a, r) => a + Math.abs(r.diff), 0), done: S.recon[day].done };
  };
  APP.reconRows = (day) => {
    const c = APP.calc(day); const ex = D.excelFor(S, day, c); const st = S.recon[day] || {};
    const keys = Array.from(new Set(c.lines.map((l) => l.kind + l.id).concat(ex.map((e) => e.key))));
    return keys.map((k) => {
      const l = c.lines.find((x) => x.kind + x.id === k); const e = ex.find((x) => x.key === k);
      const sys = l ? l.net : 0, xl = e ? e.amt : 0, diff = sys - xl;
      let hint = null;
      if (diff && Math.abs(diff) <= 10) hint = '반올림 방식 차이';
      const miss = S.orders.find((o) => o.story === 'excelMissing');
      if (diff && miss && (k === 'S' + miss.sid || k === 'B' + miss.bid)) hint = '엑셀 누락 주문';
      return { key: k, name: APP.payeeName(k), kind: k[0], sys, xl, diff, hint, cause: (st.causes || {})[k] || null };
    }).sort((a, b) => (Math.abs(b.diff) > 0) - (Math.abs(a.diff) > 0) || a.key.localeCompare(b.key));
  };

  /* ---------- 공구 연결 처리 (확인 필요 → 공구 지정) ---------- */
  APP.on('link-order', (el) => {
    const o = APP.order(el.dataset.arg); const cands = S.groups.filter((g) => g.pid === o.pid);
    APP.modal({ title: '공구 연결 — ' + o.no, sub: '정산 대상 공구를 지정하면 셀러 수수료·브랜드 공급가가 연결됩니다.', body: `<div class="kv"><span>상품</span><b>${U.esc(APP.product(o.pid).name)}</b><span>결제</span><b>${U.md(o.paid)} ${o.time} · ${U.won(o.price * o.qty)}원</b><span>유입</span><b>스마트스토어 일반 상품 페이지 (공구 링크 파라미터 없음)</b></div>
      <div class="radio-list">${cands.map((g, i) => `<label class="radio"><input type="radio" name="lg" value="${g.id}" ${i === 0 ? 'checked' : ''}><div><b>${U.esc(g.title)}</b><small>${APP.seller(g.sid).handle} · ${U.md(g.from)}~${U.md(g.to)} · 수수료 ${Math.round(g.rate * 100)}% · ${APP.groupState(g)}</small></div></label>`).join('')}
      <label class="radio"><input type="radio" name="lg" value="none"><div><b>공구 외 일반 판매로 처리</b><small>셀러 수수료 없이 브랜드 공급가만 정산</small></div></label></div>`,
      foot: '<button class="btn line" data-act="close">취소</button><button class="btn" data-act="link-save" data-o="' + o.id + '">연결 저장</button>' });
  }, 'ops');
  APP.on('link-save', (el) => {
    const o = APP.order(el.dataset.o); const v = (U.qs('input[name="lg"]:checked') || {}).value;
    if (!o || D.isAssigned(o)) return APP.toast('이미 분류된 주문입니다. 목록을 다시 확인해 주세요', 'warn');
    if (S.settle[o.paid] && ['confirmed', 'paid'].includes(S.settle[o.paid].st)) return APP.toast('확정된 정산은 다음 정산의 조정 항목으로 반영해 주세요', 'warn');
    const invalidate = () => {
      const st = S.settle[o.paid], rc = S.recon[o.paid];
      if (st && st.st === 'reviewed') { st.st = 'draft'; delete st.rv; }
      if (rc) { rc.done = false; rc.causes = {}; }
    };
    if (v === 'none') { invalidate(); o.saleType = 'general'; o.sid = null; o.settleRate = 0; S.acks['unl-' + o.id] = true; APP.close(); APP.toast('일반 판매로 분류했습니다 — 브랜드 공급가 정산에 반영됩니다'); return APP.commit('주문 ' + o.no + ' 공구 외 일반 판매로 분류 — 브랜드 공급가 정산 포함'); }
    const g = APP.group(v); if (!g || g.pid !== o.pid) return APP.toast('상품에 맞는 공구를 선택해 주세요', 'warn');
    invalidate(); o.gid = g.id; o.sid = g.sid; o.settleRate = g.rate; APP.close(); APP.toast('공구에 연결했습니다 — ' + g.title);
    APP.commit('주문 ' + o.no + ' → ' + g.title + ' 공구 연결');
  }, 'ops');

  /* ---------- 체험 도구 ---------- */
  APP.demoBar = () => '';
  APP.on('demo-reset', () => { if (confirm('체험 데이터를 처음 상태로 되돌릴까요?')) { APP.reset(); APP.toast('처음 상태로 되돌렸습니다', 'info'); APP.go('#/'); } });
})();
