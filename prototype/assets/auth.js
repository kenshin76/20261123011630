/* 정적 프로토타입의 역할별 로그인 UI. 실제 운영 인증은 서버에서 구현해야 합니다. */
(function () {
  'use strict';
  const U = APP.U, STORE = 'gongguon.login.v1', PASSWORD = 'demo1234!';
  let principal = null;
  const targets = {};
  const roles = {
    ops: {label:'운영자 콘솔', title:'운영자 로그인', icon:'grid', desc:'주문과 배송을 확인하고 정산 업무를 이어가세요.'},
    seller: {label:'셀러 포털', title:'셀러 로그인', icon:'users', desc:'내 공구의 판매 현황과 정산 내역을 확인하세요.'},
    brand: {label:'브랜드 포털', title:'브랜드 로그인', icon:'store', desc:'발송할 주문과 공급가 정산을 한곳에서 관리하세요.'}
  };
  const brandIds = {b1:'greenday',b2:'moaliving',b3:'forestlab',b4:'bareunmeal',b5:'lumihome'};
  APP.sampleAccounts = (role) => {
    if (role === 'ops') return [
      {role,id:'staff',username:'ops.manager',name:'김운영',detail:'운영 담당 · 주문·배송·정산 검토'},
      {role,id:'confirm',username:'ops.finance',name:'이정산',detail:'정산 책임자 · 정산 확정·이체 관리'}
    ];
    const list = role === 'seller' ? APP.get().sellers : role === 'brand' ? APP.get().brands : [];
    return list.filter(x => x.status === '활성').map(x => ({role,id:x.id,username:role === 'seller' ? x.handle.replace(/^@/,'') : brandIds[x.id] || x.id,name:role === 'seller' ? x.name : x.name,detail:role === 'seller' ? x.handle + ' · ' + x.cat : x.cat + ' · ' + x.ship}));
  };
  APP.routeRole = (path) => { const m = path.match(/^\/(ops|seller|brand)(?:\/|\?|$)/); return m && m[1]; };
  APP.currentUser = () => {
    if (!principal || !roles[principal.role]) return null;
    return APP.sampleAccounts(principal.role).find(x => x.id === principal.id) || null;
  };
  APP.canAccess = (role) => { const user = APP.currentUser(); return !!user && user.role === role && APP.get().session[role] === user.id; };
  APP.canReadStatement = (day, key) => {
    const user = APP.currentUser();
    if (!user || !APP.canAccess(user.role)) return false;
    if (user.role === 'ops') return true;
    const st = APP.get().settle[day];
    return key === (user.role === 'seller' ? 'S' : 'B') + user.id && !!st && ['confirmed','paid'].includes(st.st);
  };
  APP.canAct = (scope, data) => scope === 'statement' ? APP.canReadStatement(data.day, data.key) : scope === 'authenticated' ? !!APP.currentUser() : scope === 'portal' ? APP.canAccess('seller') || APP.canAccess('brand') : APP.canAccess(scope);
  APP.loginTarget = (role, path) => { if (APP.routeRole(path) === role && !/[\r\n]/.test(path)) targets[role] = path; };
  APP.clearAuth = (keepTarget) => {
    APP.close(); APP.slPending = null; principal = null;
    if (!keepTarget) Object.keys(targets).forEach(key => delete targets[key]);
    if (APP.resetPortalView) APP.resetPortalView();
    APP.get().session = {ops:null,seller:null,brand:null};
    try { window.sessionStorage.removeItem(STORE); } catch (e) { /* 세션 저장소 사용 불가 */ }
  };
  APP.restoreAuth = () => {
    principal = null;
    try {
      const saved = JSON.parse(window.sessionStorage.getItem(STORE) || 'null');
      if (saved && roles[saved.role] && APP.sampleAccounts(saved.role).some(x => x.id === saved.id)) {
        principal = {role:saved.role,id:saved.id}; APP.get().session[saved.role] = saved.id;
      }
    } catch (e) { /* 유효하지 않은 세션은 복원하지 않음 */ }
  };
  APP.signIn = (role, username, password) => {
    const account = roles[role] && APP.sampleAccounts(role).find(x => x.username === String(username).trim());
    if (!account || password !== PASSWORD) return {ok:false,message:'아이디 또는 비밀번호를 확인해 주세요.'};
    APP.clearAuth(true); principal = {role,id:account.id}; APP.get().session[role] = account.id;
    try { window.sessionStorage.setItem(STORE, JSON.stringify(principal)); } catch (e) { /* 현재 화면에서 이용 가능 */ }
    APP.save(); return {ok:true,user:account};
  };
  APP.on('sample-pick', (el) => {
    const role = el.dataset.role, account = APP.sampleAccounts(role).find(x => x.id === el.dataset.id);
    if (!account) return;
    U.qs('#login-id').value = account.username; U.qs('#login-password').value = PASSWORD;
    const error = U.qs('#login-error'); if (error) {error.textContent = ''; error.hidden = true;}
    U.qsa('[data-act="sample-pick"]').forEach(x => { const selected = x.dataset.id === account.id; x.classList.toggle('selected', selected); x.setAttribute('aria-pressed', String(selected)); });
    const notice = U.qs('#sample-selection'); if (notice) notice.textContent = account.name + ' 계정을 선택했습니다. 로그인 버튼을 눌러 주세요.';
    const submit = U.qs('.auth-submit'); if (submit) submit.focus();
  });
  APP.on('login-submit', (el) => {
    const role = el.dataset.role, username = (U.qs('#login-id').value || '').trim(), password = U.qs('#login-password').value;
    const result = APP.signIn(role, username, password);
    const error = U.qs('#login-error');
    if (!result.ok) {error.textContent = result.message; error.hidden = false; return;}
    const next = targets[role]; delete targets[role];
    APP.go('#' + (APP.routeRole(next || '') === role ? next : '/' + role));
    APP.toast(result.user.name + ' 님, 환영합니다');
  });
  APP.on('logout', () => {
    const role = (APP.currentUser() || {}).role || 'ops';
    APP.clearAuth(); APP.save(); APP.go('#/login/' + role); APP.toast('로그아웃했습니다', 'info');
  });
  APP.on('password-toggle', () => {
    const input = U.qs('#login-password'), show = input.type === 'password'; input.type = show ? 'text' : 'password';
    const button = U.qs('[data-act="password-toggle"]'); button.setAttribute('aria-label', show ? '비밀번호 숨기기' : '비밀번호 보기'); button.setAttribute('aria-pressed', String(show));
  });
  APP.route(/^\/login\/(ops|seller|brand)$/, (role) => {
    const config = roles[role], accounts = APP.sampleAccounts(role);
    return `<div class="auth-page">
      <header class="auth-top"><a class="brand" href="#/" aria-label="공구온 홈">${APP.logo()}<span>공구온</span></a><a class="auth-home" href="#/">서비스 홈</a></header>
      <main class="auth-main"><section class="auth-card" aria-labelledby="login-title">
        <div class="auth-intro"><span class="auth-mark">${U.ic(config.icon)}</span><h1 id="login-title">${config.title}</h1><p>${config.desc}</p></div>
        <nav class="auth-roles" aria-label="로그인 유형">${Object.entries(roles).map(([key,c]) => `<a href="#/login/${key}" class="${key === role ? 'on' : ''}" ${key === role ? 'aria-current="page"' : ''}>${c.label}</a>`).join('')}</nav>
        <form class="auth-form" data-submit="login-submit" data-role="${role}">
          <label for="login-id">아이디</label><input id="login-id" name="username" autocomplete="username" placeholder="아이디를 입력해 주세요" required spellcheck="false" autocapitalize="none">
          <label for="login-password">비밀번호</label><div class="password-field"><input id="login-password" type="password" name="password" autocomplete="current-password" placeholder="비밀번호를 입력해 주세요" required><button type="button" class="icon-btn" data-act="password-toggle" aria-label="비밀번호 보기" aria-pressed="false">${U.ic('eye')}</button></div>
          <p id="login-error" class="auth-error" role="alert" hidden></p>
          <button type="submit" class="btn auth-submit">로그인</button>
        </form>
      </section>
      <section class="sample-section" aria-labelledby="sample-title"><div class="sample-heading"><h2 id="sample-title">샘플 계정</h2><span>선택하면 로그인 정보가 입력됩니다</span></div>
        <div class="sample-accounts">${accounts.map(a => `<button type="button" class="sample-account" data-act="sample-pick" data-role="${role}" data-id="${a.id}" aria-pressed="false"><span class="sample-avatar">${U.esc(a.name.slice(0,1))}</span><span><b>${U.esc(a.name)}</b><small>${U.esc(a.detail)}</small><code>${U.esc(a.username)}</code></span>${U.ic('check')}</button>`).join('')}</div>
        <p id="sample-selection" class="sample-selection" aria-live="polite">계정을 선택한 후 로그인 버튼을 눌러 주세요.</p><p class="sample-password">공통 비밀번호 <code>${PASSWORD}</code></p>
      </section>
      <footer class="auth-foot"><p>샘플 계정은 가상 데이터로 이용합니다. 판매 채널·은행과 연결되지 않습니다.</p><details><summary>샘플 데이터 관리</summary><p>현재 브라우저에 저장된 업무 데이터를 초기화합니다.</p><button class="btn sm line" data-act="demo-reset">샘플 데이터 초기화</button></details></footer></main>
    </div>`;
  });
})();
