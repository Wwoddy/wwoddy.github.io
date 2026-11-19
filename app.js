/* ============================================================
   РЕЕСТР ИГРОКОВ: меняй только этот блок
   status: 'verified' | 'blacklist' | 'pending'
   ВНИМАНИЕ: это ДЕМО-данные. Замени на реальные записи перед публикацией.
   ============================================================ */
const PLAYERS = [
  { nick: 'Demo_Player_1', uid: '100000001', status: 'verified',  note: 'Сделок: 12' },
  { nick: 'Demo_Player_2', uid: '100000002', status: 'verified',  note: 'Сделок: 7' },
  { nick: 'Demo_Player_3', uid: '100000003', status: 'blacklist', note: 'Пример записи чёрного списка' },
  { nick: 'Demo_Player_4', uid: '100000004', status: 'pending',   note: 'На проверке' },
  { nick: 'Demo_Player_5', uid: '100000005', status: 'verified',  note: 'Сделок: 31' },
];
/* ============================================================ */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isCoarse = matchMedia('(pointer: coarse)').matches;

$('#year').textContent = new Date().getFullYear();

/* ---------- Заставка: логотип падает в чёрную дыру, затем появляется сайт ---------- */
function scramble(el) {
  const final = el.textContent, chars = 'WwoDdYXZ#01<>/';
  let f = 0; const total = 20;
  (function step() {
    let out = '';
    for (let i = 0; i < final.length; i++) out += i < (f / total) * final.length ? final[i] : chars[(Math.random() * chars.length) | 0];
    el.textContent = out;
    if (++f <= total) setTimeout(step, 50); else el.textContent = final;
  })();
}
function ready() {
  if (document.documentElement.classList.contains('ready')) return;
  document.documentElement.classList.add('ready');
  const n = $('.name');
  if (n && !reduceMotion) setTimeout(() => scramble(n), 350);
}
(function intro() {
  const el = $('#intro');
  let seen = false;
  try { seen = sessionStorage.getItem('wwoddy-intro') === '1'; } catch (e) {}
  if (!el || reduceMotion || seen) { if (el) el.remove(); ready(); return; }
  try { sessionStorage.setItem('wwoddy-intro', '1'); } catch (e) {}
  setTimeout(() => el.classList.add('go'), 1350);
  setTimeout(ready, 1750);
  setTimeout(() => el.remove(), 2600);
  setTimeout(ready, 4000); // страховка
})();

/* ---------- Курсор-свечение и «магнитные» кнопки (только мышь) ---------- */
if (matchMedia('(hover:hover) and (pointer:fine)').matches && !reduceMotion) {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.append(glow);
  addEventListener('pointermove', e => { glow.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; }, { passive: true });
  // Имя наклоняется за курсором, как объёмная надпись
  const nameEl = $('.hero h1');
  if (nameEl) {
    addEventListener('pointermove', e => {
      if (scrollY > innerHeight * .8) return;
      const px = e.clientX / innerWidth - .5, py = e.clientY / innerHeight - .5;
      nameEl.style.transform = `perspective(900px) rotateY(${(px * 10).toFixed(2)}deg) rotateX(${(-py * 7).toFixed(2)}deg)`;
    }, { passive: true });
  }
  $$('.btn').forEach(b => {
    b.addEventListener('pointermove', e => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .12}px,${(e.clientY - r.top - r.height / 2) * .22}px)`;
    });
    b.addEventListener('pointerleave', () => { b.style.transform = ''; });
  });
}

/* ---------- Чат-пример: сообщения появляются по очереди ---------- */
const chat = $('#chat');
if (chat) {
  const msgs = $$('.msg', chat);
  if (reduceMotion) msgs.forEach(m => m.classList.add('show'));
  else new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting) return;
    o.disconnect();
    msgs.forEach((m, i) => setTimeout(() => m.classList.add('show'), 500 + i * 1050));
  }, { threshold: 0.35 }).observe(chat);
}

/* ---------- Меню ---------- */
const burger = $('#burger'), menu = $('#menu'), nav = $('#nav');
function setMenu(open) {
  menu.classList.toggle('open', open);
  burger.setAttribute('aria-expanded', open);
  document.body.style.overflow = open ? 'hidden' : '';
}
burger.addEventListener('click', () => setMenu(!menu.classList.contains('open')));
$$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

/* ---------- Скролл: шапка, полоса прогресса, нижняя панель ---------- */
const dock = $('#dock'), bar = $('#progress');
function onScroll() {
  const y = scrollY, max = document.documentElement.scrollHeight - innerHeight;
  nav.classList.toggle('solid', y > 30);
  dock.classList.toggle('show', y > innerHeight * 0.6);
  bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
}
addEventListener('scroll', onScroll, { passive: true });
onScroll();

/* ---------- Появление блоков ---------- */
$$('.grid3, .steps, .faq, .tags').forEach(group =>
  $$('.reveal', group).forEach((el, i) => el.style.setProperty('--d', i * 0.09 + 's')));
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
$$('.reveal').forEach(el => io.observe(el));

/* ---------- 3D-наклон карточек ---------- */
if (!reduceMotion) {
  $$('.tilt').forEach(card => {
    const max = isCoarse ? 7 : 10;
    function move(e) {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * max}deg) rotateY(${(x - 0.5) * max}deg)`;
      card.style.setProperty('--mx', x * 100 + '%');
      card.style.setProperty('--my', y * 100 + '%');
      card.classList.add('active');
    }
    function reset() { card.style.transform = ''; card.classList.remove('active'); }
    card.addEventListener('pointermove', move);
    card.addEventListener('pointerleave', reset);
    card.addEventListener('pointerup', reset);
    card.addEventListener('pointercancel', reset);
  });
}

/* ---------- Реестр игроков ---------- */
const listEl = $('#list'), emptyEl = $('#empty'), qEl = $('#q');
const LABEL = { verified: '✓ Проверен', blacklist: '✕ Чёрный список', pending: '… На проверке' };
let filter = 'all';

function renderList() {
  const q = qEl.value.trim().toLowerCase();
  const rows = PLAYERS.filter(p =>
    (filter === 'all' || p.status === filter) &&
    (!q || p.nick.toLowerCase().includes(q) || p.uid.includes(q)));
  listEl.replaceChildren(...rows.map((p, i) => {
    const li = document.createElement('li');
    li.className = 'player ' + p.status;
    li.style.animationDelay = i * 0.05 + 's';
    const av = document.createElement('div'); av.className = 'avatar'; av.textContent = p.nick[0].toUpperCase();
    const info = document.createElement('div'); info.className = 'pinfo';
    const b = document.createElement('b'); b.textContent = p.nick;
    const s = document.createElement('small'); s.textContent = 'UID ' + p.uid + ' · ' + p.note;
    info.append(b, s);
    const st = document.createElement('span'); st.className = 'status-tag ' + p.status; st.textContent = LABEL[p.status];
    li.append(av, info, st);
    return li;
  }));
  emptyEl.hidden = rows.length > 0;
}
qEl.addEventListener('input', renderList);
$$('.chip').forEach(c => c.addEventListener('click', () => {
  filter = c.dataset.f;
  $$('.chip').forEach(x => { const on = x === c; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); });
  renderList();
}));
renderList();
