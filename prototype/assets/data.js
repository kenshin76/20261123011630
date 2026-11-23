/* 공구온 OPS [프로토타입] — 가상 데이터와 정산 규칙
   모든 셀러·브랜드·구매자·주문·금액은 시연용 가상 데이터입니다.
   정산 규칙(결제일 기준 일 마감, 원천징수 단수 처리 등)은 G1에서 확정할 내용을 보여 주는 예시입니다. */
(function () {
  'use strict';
  const D = (window.DATA = {});
  D.TODAY = '2027-02-04';
  D.NOW = '09:40';
  D.FIRST = '2027-01-21';
  D.PARALLEL = ['2027-02-01', '2027-02-02', '2027-02-03', '2027-02-04', '2027-02-05', '2027-02-10', '2027-02-11', '2027-02-12'];

  /* ---------- 날짜 ---------- */
  D.add = (s, n) => { const t = new Date(s + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + n); return t.toISOString().slice(0, 10); };
  D.diff = (a, b) => Math.round((new Date(a + 'T00:00:00Z') - new Date(b + 'T00:00:00Z')) / 86400000);
  D.dow = (s) => '일월화수목금토'[new Date(s + 'T00:00:00Z').getUTCDay()];
  D.range = (a, b) => { const r = []; for (let d = a; d <= b; d = D.add(d, 1)) r.push(d); return r; };

  D.CH = {
    SS: { id: 'SS', name: '스마트스토어', short: 'N', mode: 'API', color: 'ss' },
    SL: { id: 'SL', name: '스룩페이', short: 'S', mode: '엑셀 업로드', color: 'sl' }
  };
  D.CARRIERS = ['CJ대한통운', '롯데택배', '한진택배', '우체국택배', '로젠택배'];

  D.base = () => ({
    sellers: [
      { id: 's1', handle: '@daily.min', name: '김민지', type: '개인', follower: '18.4만', cat: '리빙·뷰티', status: '활성', joined: '2026-12-02', account: { bank: 'IBK기업', no: '010-1234-5678-01', holder: '김민지', verified: true } },
      { id: 's2', handle: '@homecafe_jiyu', name: '박지유', type: '개인', follower: '9.2만', cat: '식품·홈카페', status: '활성', joined: '2026-12-02', account: { bank: '국민', no: '123401-04-567890', holder: '박지유', verified: true } },
      { id: 's3', handle: '@fit.hana', name: '이하나', type: '사업자', biz: '하나핏 스튜디오', follower: '24.1만', cat: '헬스·식단', status: '활성', joined: '2026-12-03', account: { bank: '신한', no: '110-555-778899', holder: '하나핏 스튜디오', verified: false, changedAt: '2027-02-03', prev: '신한 110-222-***' } },
      { id: 's4', handle: '@mom.picks', name: '최유나', type: '개인', follower: '31.6만', cat: '육아·리빙', status: '활성', joined: '2026-12-05', account: { bank: '우리', no: '1002-345-678901', holder: '최유나', verified: true } },
      { id: 's5', handle: '@gourmet.tae', name: '정태호', type: '사업자', biz: '태호푸드랩', follower: '12.8만', cat: '쿠킹', status: '활성', joined: '2026-12-10', account: { bank: 'IBK기업', no: '210-987654-01-011', holder: '태호푸드랩', verified: true } },
      { id: 's6', handle: '@plant.room', name: '한소희', type: '개인', follower: '6.3만', cat: '플랜테리어', status: '승인 대기', joined: '2027-02-03', account: { bank: '카카오뱅크', no: '3333-12-3456789', holder: '한소희', verified: false } }
    ],
    brands: [
      { id: 'b1', name: '그린데이 키친', cat: '주방용품', ship: '브랜드 직배송', status: '활성', manager: '오세린', account: { bank: 'IBK기업', no: '301-112233-04-015', holder: '(주)그린데이', verified: true } },
      { id: 'b2', name: '모아리빙', cat: '침구·생활', ship: '브랜드 직배송', status: '활성', manager: '강도윤', account: { bank: '하나', no: '357-910112-34507', holder: '모아리빙(주)', verified: true } },
      { id: 'b3', name: '포레스트랩', cat: '스킨케어', ship: '브랜드 직배송', status: '활성', manager: '윤채아', account: { bank: 'IBK기업', no: '045-778899-01-022', holder: '(주)포레스트랩', verified: true } },
      { id: 'b4', name: '바른한끼', cat: '간편식', ship: '브랜드 직배송', status: '활성', manager: '서준혁', account: { bank: '농협', no: '301-0123-4567-81', holder: '바른한끼 주식회사', verified: true } },
      { id: 'b5', name: '루미홈', cat: '조명·소품', ship: '브랜드 직배송', status: '승인 대기', manager: '문가온', account: { bank: '국민', no: '004-21-0456-789', holder: '루미홈', verified: false } }
    ],
    products: [
      { id: 'p1', bid: 'b1', name: '무쇠 프라이팬 28cm', opt: '28cm / 인덕션 겸용', price: 39900, supply: 24000, stock: 420, cat: '주방>프라이팬', notice: true, img: 'pan', mall: { SS: { st: '판매중', no: '9810022451' }, SL: { st: '미등록' } } },
      { id: 'p2', bid: 'b1', name: '실리콘 조리도구 5종', opt: '샌드베이지 / 차콜', price: 29900, supply: 17500, stock: 610, cat: '주방>조리도구', notice: true, img: 'tool', mall: { SS: { st: '판매중', no: '9810022890' }, SL: { st: '미등록' } } },
      { id: 'p3', bid: 'b2', name: '극세사 차렵이불 Q', opt: '퀸 / 크림·그레이', price: 59000, supply: 36000, stock: 180, cat: '침구>이불', notice: true, img: 'bed', mall: { SS: { st: '판매중', no: '9810019312' }, SL: { st: '미등록' } } },
      { id: 'p4', bid: 'b2', name: '규조토 발매트', opt: '라지 / 3컬러', price: 19900, supply: 11000, stock: 900, cat: '생활>욕실', notice: false, img: 'mat', mall: { SS: { st: '등록 오류', err: '상품정보제공고시 「제조국」 누락' }, SL: { st: '업로드 대기' } } },
      { id: 'p5', bid: 'b3', name: '시카 진정 앰플 50ml', opt: '50ml 1+1', price: 32000, supply: 15500, stock: 1500, cat: '뷰티>앰플', notice: true, img: 'amp', mall: { SS: { st: '미등록' }, SL: { st: '판매중', no: 'SL-P-30551' } } },
      { id: 'p6', bid: 'b3', name: '데일리 선크림 2+1', opt: '50ml × 3', price: 45000, supply: 24000, stock: 820, cat: '뷰티>선케어', notice: true, img: 'sun', mall: { SS: { st: '미등록' }, SL: { st: '판매중', no: 'SL-P-30612' } } },
      { id: 'p7', bid: 'b4', name: '저당 닭가슴살 30팩', opt: '오리지널·갈릭 혼합', price: 49900, supply: 33000, stock: 300, cat: '식품>닭가슴살', notice: true, img: 'chk', mall: { SS: { st: '판매중', no: '9810020177' }, SL: { st: '미등록' } } },
      { id: 'p8', bid: 'b4', name: '고단백 그래놀라 1kg', opt: '1kg 지퍼백', price: 21900, supply: 12800, stock: 760, cat: '식품>시리얼', notice: true, img: 'gra', mall: { SS: { st: '미등록' }, SL: { st: '판매중', no: 'SL-P-30477' } } }
    ],
    groups: [
      { id: 'g1', sid: 's1', pid: 'p1', ch: 'SS', from: '2027-01-21', to: '2027-02-06', rate: 0.15, title: '민지네 무쇠팬 공구' },
      { id: 'g2', sid: 's2', pid: 'p8', ch: 'SL', from: '2027-01-23', to: '2027-02-08', rate: 0.12, title: '홈카페 그래놀라 공구' },
      { id: 'g3', sid: 's3', pid: 'p7', ch: 'SS', from: '2027-01-21', to: '2027-02-03', rate: 0.10, title: '하나핏 식단 닭가슴살' },
      { id: 'g4', sid: 's4', pid: 'p3', ch: 'SS', from: '2027-01-26', to: '2027-02-09', rate: 0.18, title: '육아맘 차렵이불 공구' },
      { id: 'g5', sid: 's1', pid: 'p5', ch: 'SL', from: '2027-01-28', to: '2027-02-11', rate: 0.20, title: '민지 진정 앰플 공구' },
      { id: 'g6', sid: 's5', pid: 'p2', ch: 'SS', from: '2027-02-01', to: '2027-02-14', rate: 0.12, title: '태호 셰프 조리도구' },
      { id: 'g7', sid: 's4', pid: 'p6', ch: 'SL', from: '2027-01-30', to: '2027-02-12', rate: 0.18, title: '유나 선크림 공구' },
      { id: 'g8', sid: 's2', pid: 'p4', ch: 'SS', from: '2027-02-06', to: '2027-02-16', rate: 0.15, title: '욕실 발매트 공구 (예정)' }
    ]
  });

  /* ---------- 가상 주문 생성 ---------- */
  function rng(seed) { return function () { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const SUR = '김이박최정강조윤장임한오서신권황안송류전홍'.split('');
  const GIV = ['서연', '민준', '지우', '하윤', '도현', '수아', '예준', '지민', '서진', '하은', '시우', '유진', '채원', '현우', '다인', '태윤', '소율', '건우', '나연', '주원'];
  const ADDR = ['서울 마포구 월드컵북로 12길 8', '서울 송파구 올림픽로 35가길 10', '경기 성남시 분당구 정자일로 95', '인천 연수구 송도과학로 32', '부산 해운대구 센텀중앙로 79', '경기 고양시 일산동구 중앙로 1275', '대전 유성구 대학로 99', '서울 강서구 마곡중앙로 161', '경기 수원시 영통구 광교중앙로 140', '광주 서구 상무중앙로 61', '대구 수성구 동대구로 260', '경기 용인시 수지구 포은대로 435'];
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  D.seedOrders = function (base) {
    const r = rng(20270214), orders = [];
    const prodMap = Object.fromEntries(base.products.map((p) => [p.id, p]));
    let ssSeq = 1530000, slSeq = 1;
    for (const day of D.range(D.FIRST, D.TODAY)) {
      const age = D.diff(D.TODAY, day);
      for (const g of base.groups) {
        if (day < g.from || day > g.to) continue;
        let n = 1 + Math.floor(r() * 8);
        if (day === D.TODAY) n = Math.max(1, Math.floor(n / 3));
        for (let i = 0; i < n; i++) {
          const p = prodMap[g.pid];
          const q = r() < 0.72 ? 1 : r() < 0.85 ? 2 : 3;
          const hh = day === D.TODAY ? 6 + Math.floor(r() * 3) : 8 + Math.floor(r() * 14);
          const o = {
            id: 'o' + (orders.length + 1), ch: g.ch, gid: g.id, pid: g.pid, sid: g.sid, bid: p.bid,
            no: g.ch === 'SS' ? '2027' + day.slice(5, 7) + day.slice(8, 10) + String(ssSeq++) : 'SL-' + day.replace(/-/g, '') + '-' + String(slSeq++).padStart(4, '0'),
            qty: q, price: p.price, supply: p.supply, paid: day, time: String(hh).padStart(2, '0') + ':' + String(Math.floor(r() * 60)).padStart(2, '0'),
            buyer: { name: pick(r, SUR) + pick(r, GIV), phone: '010-' + (2000 + Math.floor(r() * 7999)) + '-' + (1000 + Math.floor(r() * 8999)), addr: pick(r, ADDR) },
            status: '발송 대기', inv: null, cancelAt: null, cancelType: null, src: g.ch === 'SS' ? 'API' : '엑셀'
          };
          if (age >= 5) o.status = '배송 완료';
          else if (age >= 3) o.status = '배송 중';
          else if (age >= 1) o.status = r() < 0.55 ? '배송 중' : '발송 대기';
          if (o.status !== '발송 대기') o.inv = { carrier: pick(r, D.CARRIERS), no: String(5000000000 + Math.floor(r() * 899999999)), sent: true };
          const cx = r();
          if (cx < 0.05 && age >= 1) { o.cancelType = '취소'; o.cancelAt = r() < 0.5 ? day : D.add(day, 1 + Math.floor(r() * 2)); if (o.cancelAt > D.add(D.TODAY, -1)) o.cancelAt = day; o.status = '취소'; o.inv = null; }
          else if (cx < 0.08 && o.status === '배송 완료') { const rt = D.add(day, 5 + Math.floor(r() * 3)); if (rt < D.TODAY) { o.cancelType = '반품'; o.cancelAt = rt; o.status = '반품 완료'; } }
          orders.push(o);
        }
      }
    }
    /* 시나리오 고정 ① 02-02 결제 → 02-03 취소 (정산 후 취소 차감, 엑셀은 02-02에 반영) */
    const c = orders.find((o) => o.gid === 'g4' && o.paid === '2027-02-02' && !o.cancelAt);
    if (c) { c.cancelAt = '2027-02-03'; c.cancelType = '취소'; c.status = '취소'; c.inv = null; c.story = 'cancelAfter'; }
    /* ② 02-03 스룩페이 주문 1건 — 기존 엑셀에 누락 (늦게 내려받은 주문 파일) */
    const m = orders.find((o) => o.gid === 'g2' && o.paid === '2027-02-03' && !o.cancelAt);
    if (m) { m.story = 'excelMissing'; m.time = '23:52'; }
    /* ③ 공구 미연결 주문 — 셀러 공구 링크가 아닌 일반 상품 페이지에서 구매 */
    orders.push({ id: 'o' + (orders.length + 1), ch: 'SS', gid: null, pid: 'p1', sid: null, bid: 'b1', no: '20270204' + ssSeq++, qty: 1, price: 39900, supply: 24000, paid: D.TODAY, time: '07:12', buyer: { name: '정하린', phone: '010-4821-7730', addr: ADDR[0] }, status: '발송 대기', inv: null, cancelAt: null, cancelType: null, src: 'API', story: 'unlinked' });
    return orders;
  };

  /* ---------- 정산 규칙 (예시) ---------- */
  D.RULE = {
    basis: '결제일 기준 · 매일 24:00 마감 · 다음 날 오전 자동 계산',
    seller: '셀러 정산액 = Σ(판매가 × 수량 × 공구 수수료율) → 정산 건 최종값에서 원 단위 반올림 1회',
    brand: '브랜드 정산액 = Σ(공구 공급가 × 수량)',
    cancel: '결제 당일 취소는 제외, 정산일 이후 취소·반품은 취소일 정산의 「조정 항목」으로 차감',
    tax: '개인 셀러 원천징수 3.3% = 소득세 3%(10원 미만 절사) + 지방소득세 소득세의 10%(10원 미만 절사)',
    neg: '조정 후 음수이면 지급 0원, 다음 정산으로 이월'
  };
  D.tax = (gross) => { if (gross <= 0) return { it: 0, lt: 0 }; const it = Math.floor((gross * 0.03) / 10) * 10; const lt = Math.floor((it * 0.1) / 10) * 10; return { it, lt }; };
  D.isGeneral = (o) => !o.gid && o.saleType === 'general';
  D.isAssigned = (o) => !!o.gid || D.isGeneral(o);

  /* 정산 계산: day 기준. orders/groups/sellers/manual 는 상태에서 전달 */
  function calcDay(S, day, incoming) {
    const g = Object.fromEntries(S.groups.map((x) => [x.id, x]));
    const lines = {};
    const line = (kind, id) => (lines[kind + id] = lines[kind + id] || { kind, id, sales: 0, cnt: 0, baseX: 0, adjX: 0, manual: 0, autoAdj: [], manAdj: [], orders: [] });
    Object.entries(incoming || {}).forEach(([key, value]) => {
      const kind = key[0], id = key.slice(1);
      const who = kind === 'S' ? S.sellers.find((w) => w.id === id) : S.brands.find((w) => w.id === id);
      if (who && value.amount < 0) { const l = line(kind, id); l.openingCarry = value.amount; l.carryFrom = value.from; }
    });
    let sales = 0, count = 0;
    for (const o of S.orders) {
      if (!D.isAssigned(o)) continue;
      const general = D.isGeneral(o);
      const rate = general ? 0 : Number.isFinite(o.settleRate) ? o.settleRate : g[o.gid].rate, amt = o.price * o.qty;
      if (o.paid === day && !(o.cancelAt && o.cancelAt <= day)) {
        const ls = general ? null : line('S', o.sid), lb = line('B', o.bid);
        if (ls) { ls.sales += amt; ls.cnt++; ls.baseX += amt * rate; ls.orders.push(o.id); }
        lb.sales += amt; lb.cnt++; lb.baseX += o.supply * o.qty; lb.orders.push(o.id);
        sales += amt; count++;
      }
      if (o.cancelAt === day && o.paid < day) {
        const ls = general ? null : line('S', o.sid), lb = line('B', o.bid);
        if (ls) ls.adjX -= amt * rate;
        lb.adjX -= o.supply * o.qty;
        const a = { order: o.id, no: o.no, type: o.cancelType, paid: o.paid };
        if (ls) ls.autoAdj.push(Object.assign({ amt: -Math.round(amt * rate) }, a));
        lb.autoAdj.push(Object.assign({ amt: -o.supply * o.qty }, a));
      }
    }
    for (const m of S.manual.filter((x) => x.day === day)) { const l = line(m.kind, m.id); l.manual += m.amt; l.manAdj.push(m); }
    const out = Object.values(lines).map((l) => {
      const who = l.kind === 'S' ? S.sellers.find((s) => s.id === l.id) : S.brands.find((b) => b.id === l.id);
      const base = Math.round(l.baseX);
      const gross = Math.round(l.baseX + l.adjX) + l.manual + (l.openingCarry || 0);
      const t = l.kind === 'S' && who.type === '개인' ? D.tax(gross) : { it: 0, lt: 0 };
      const net = gross - t.it - t.lt;
      return Object.assign(l, { who, base, adj: gross - base, gross, it: t.it, lt: t.lt, tax: t.it + t.lt, net, pay: Math.max(0, net), carry: net < 0 ? net : 0 });
    });
    out.sort((a, b) => (a.kind === b.kind ? a.id.localeCompare(b.id) : a.kind === 'S' ? -1 : 1));
    const sum = (k, f) => out.filter((l) => !f || l.kind === f).reduce((s, l) => s + l[k], 0);
    return { day, lines: out, sales, count, seller: sum('gross', 'S'), brand: sum('gross', 'B'), tax: sum('tax', 'S'), pay: sum('pay'), margin: sales - sum('base', 'S') - sum('base', 'B') };
  };

  // Advance balances only across prior settlement dates. Frozen records remain authoritative.
  D.calc = function (S, day) {
    const dates = Array.from(new Set([day].concat(Object.keys(S.settle || {}), S.manual.map((m) => m.day), S.orders.flatMap((o) => [o.paid, o.cancelAt]).filter(Boolean)))).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && d <= day).sort();
    let incoming = {};
    for (const date of dates) {
      const st = S.settle && S.settle[date];
      const frozen = date < day && st && ['confirmed', 'paid'].includes(st.st) && st.snapshot;
      const result = frozen || calcDay(S, date, incoming);
      if (date === day) return result;
      const next = Object.assign({}, incoming);
      result.lines.forEach((l) => {
        const key = l.kind + l.id;
        if (l.carry < 0) next[key] = { amount: l.carry, from: date };
        else delete next[key];
      });
      incoming = next;
    }
    return calcDay(S, day, incoming);
  };

  /* 기존 엑셀 결과(병행 운영 대조용 가상 자료) — 02-03 은 원인 분류가 필요한 차이를 포함 */
  D.excelFor = function (S, day, calc) {
    const rows = calc.lines.map((l) => ({ key: l.kind + l.id, amt: l.net }));
    const get = (k) => rows.find((r) => r.key === k) || (rows.push({ key: k, amt: 0 }), rows[rows.length - 1]);
    if (day === '2027-02-03') {
      get('Ss1').amt += 3; /* 줄마다 반올림 */
      const s5 = calc.lines.find((l) => l.key === 'Ss5' || (l.kind === 'S' && l.id === 's5'));
      if (s5) get('Ss5').amt = Math.round(s5.sales * 0.15); /* 수수료율 12% 대신 15% 적용 (사업자: 원천징수 없음) */
      const c = S.orders.find((o) => o.story === 'cancelAfter');
      if (c) { const rate = S.groups.find((x) => x.id === c.gid).rate; const sAmt = Math.round(c.price * c.qty * rate); const sl = calc.lines.find((l) => l.kind === 'S' && l.id === c.sid); const t = sl ? D.tax(sl.gross + sAmt) : { it: 0, lt: 0 }; if (sl) get('S' + c.sid).amt = sl.gross + sAmt - t.it - t.lt; get('B' + c.bid).amt += c.supply * c.qty; }
      const m = S.orders.find((o) => o.story === 'excelMissing');
      if (m) { const rate = S.groups.find((x) => x.id === m.gid).rate; const sl = calc.lines.find((l) => l.kind === 'S' && l.id === m.sid); if (sl) { const g2 = Math.round(sl.baseX + sl.adjX - m.price * m.qty * rate) + sl.manual + (sl.openingCarry || 0); const t = D.tax(g2); get('S' + m.sid).amt = g2 - t.it - t.lt; } get('B' + m.bid).amt -= m.supply * m.qty; }
    }
    return rows;
  };

  D.CAUSES = ['반올림 방식 차이', '엑셀 누락 주문', '엑셀 수식 오류', '취소 차감 시점 차이', '공구 조건 변경 반영', '기타 (메모)'];

  D.TALK = {
    settle: { code: 'SETTLE_DONE', name: '정산 확정 안내', st: '승인', body: '[공구온] #{이름}님, #{정산일} 정산이 확정되었습니다.\n지급 예정 금액: #{금액}원\n지급 예정일: #{지급일}\n정산서는 포털에서 확인하실 수 있습니다.' },
    invoice: { code: 'INVOICE_REQ', name: '송장 입력 요청', st: '승인', body: '[공구온] #{브랜드}님, 발송 대기 주문 #{건수}건의 송장 입력을 요청드립니다.\n포털 > 송장 입력에서 등록해 주세요.' },
    join: { code: 'JOIN_OK', name: '가입 승인 안내', st: '심사 중', body: '[공구온] #{이름}님의 파트너 가입이 승인되었습니다. 포털에 로그인해 정산 계좌를 확인해 주세요.' }
  };
})();
