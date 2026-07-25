(function () {
  const KEYS = { TASKS: 'tm_tasks', SETTINGS: 'tm_settings', POMODORO: 'tm_pomodoro' };
  const CATS = { work: 'Работа', study: 'Учёба', rest: 'Отдых', sport: 'Спорт' };
  const PRIO = { low: 'Низкий', medium: 'Средний', high: 'Высокий' };

  function load(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

  function esc(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
  function $(s) { return document.querySelector(s); }
  function $$(s) { return document.querySelectorAll(s); }
  function $id(id) { return document.getElementById(id); }

  function toast(msg, type) {
    const old = $('.toast');
    if (old) old.remove();
    const el = document.createElement('div');
    el.className = 'toast toast--' + (type || 'default');
    el.textContent = msg;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('toast--show'));
    setTimeout(() => { el.classList.remove('toast--show'); setTimeout(() => el.remove(), 300); }, 3000);
  }

  function icons() { if (typeof lucide !== 'undefined') lucide.createIcons(); }

  function fmtDate(d) {
    return d.toLocaleDateString('ru-RU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
  function fmtTime(d) {
    return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  function page() {
    const p = location.pathname.split('/').pop() || 'index.html';
    return p === '' ? 'index.html' : p;
  }

  function injectLayout() {
    const cur = page();
    const pages = [
      { href: 'index.html', label: 'Главная' },
      { href: 'todo.html', label: 'Задачи' },
      { href: 'calculator.html', label: 'Калькулятор' },
      { href: 'pomodoro.html', label: 'Pomodoro' },
      { href: 'recommendations.html', label: 'Рекомендации' },
      { href: 'contact.html', label: 'Контакты' }
    ];
    const nav = pages.map(p => '<a href="' + p.href + '" class="nav__link' + (p.href === cur ? ' nav__link--active' : '') + '">' + p.label + '</a>').join('');
    const hdr = $id('header');
    if (hdr) hdr.outerHTML =
      '<header class="header"><div class="header__inner">' +
      '<a href="index.html" class="logo">TimeManager.</a>' +
      '<button class="burger" aria-label="Меню"><span class="burger__line"></span><span class="burger__line"></span><span class="burger__line"></span></button>' +
      '<nav class="nav">' + nav + '</nav></div></header>';
    const ftr = $id('footer');
    if (ftr) ftr.outerHTML =
      '<footer class="footer"><div class="footer__inner">' +
      '<p class="footer__text">&copy; 2026 TimeManager</p>' +
      '<div class="footer__links"><a href="index.html">Главная</a><a href="todo.html">Задачи</a><a href="contact.html">Контакты</a></div>' +
      '</div></footer>';
  }

  function initNav() {
    const burger = $('.burger'), nav = $('.nav');
    if (burger && nav) {
      burger.addEventListener('click', () => {
        burger.classList.toggle('burger--open');
        nav.classList.toggle('nav--open');
      });
      $$('.nav__link').forEach(l => l.addEventListener('click', () => {
        burger.classList.remove('burger--open');
        nav.classList.remove('nav--open');
      }));
    }
  }

  function initFadeIn() {
    const els = $$('.fade-in');
    if (!els.length) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('fade-in--visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    els.forEach(el => obs.observe(el));
  }

  function initClock() {
    const dateEl = $id('currentDate'), timeEl = $id('currentTime'), greetEl = $id('greeting');
    if (!dateEl && !timeEl) return;
    function tick() {
      const now = new Date();
      const s = load(KEYS.SETTINGS, {});
      if (dateEl) dateEl.textContent = fmtDate(now);
      if (timeEl) timeEl.textContent = fmtTime(now);
      if (greetEl) {
        const h = now.getHours();
        let g = 'Добрый вечер';
        if (h >= 5 && h < 12) g = 'Доброе утро';
        else if (h >= 12 && h < 18) g = 'Добрый день';
        greetEl.textContent = g + (s.userName ? ', ' + s.userName : '') + '!';
      }
    }
    tick();
    setInterval(tick, 1000);
  }

  function initSettings() {
    const form = $id('settingsForm'), preview = $id('settingsPreview');
    if (!form) return;
    const methods = { pomodoro: 'Pomodoro', eisenhower: 'Матрица Эйзенхауэра', pareto: 'Правило 80/20' };
    const def = { userName: '', dailyGoal: 8, preferredMethod: 'pomodoro', notifications: true };
    const s = load(KEYS.SETTINGS, def);
    const uN = form.querySelector('#userName'), dG = form.querySelector('#dailyGoal'),
          pM = form.querySelector('#preferredMethod'), nt = form.querySelector('#notifications');
    if (uN) uN.value = s.userName || '';
    if (dG) dG.value = s.dailyGoal || 8;
    if (pM) pM.value = s.preferredMethod || 'pomodoro';
    if (nt) nt.checked = s.notifications !== false;

    function collect() {
      return {
        userName: (uN?.value || '').trim(),
        dailyGoal: parseInt(dG?.value, 10) || 8,
        preferredMethod: pM?.value || 'pomodoro',
        notifications: nt?.checked ?? true
      };
    }
    function upd(s) {
      if (!preview) return;
      const n = s.userName || 'Гость';
      preview.innerHTML = 'Привет, <strong>' + esc(n) + '</strong>! Цель — <strong>' + s.dailyGoal + ' ч.</strong>, метод — <strong>' + (methods[s.preferredMethod] || 'Pomodoro') + '</strong>. ' + (s.notifications ? 'Уведомления вкл.' : 'Уведомления выкл.');
    }
    upd(s);
    form.querySelectorAll('input, select').forEach(i => i.addEventListener('input', () => upd(collect())));
    form.addEventListener('submit', e => { e.preventDefault(); const ns = collect(); save(KEYS.SETTINGS, ns); upd(ns); toast('Настройки сохранены', 'success'); });
  }

  function initPrinciples() {
    $$('.principle-card').forEach(card => {
      card.addEventListener('click', () => {
        const was = card.classList.contains('principle-card--expanded');
        $$('.principle-card').forEach(c => c.classList.remove('principle-card--expanded'));
        if (!was) card.classList.add('principle-card--expanded');
      });
    });
  }

  function initTodo() {
    let tasks = load(KEYS.TASKS, []), editId = null;
    const form = $id('todoForm'), list = $id('taskList'), doneList = $id('completedList');
    const tabA = $id('tabActive'), tabC = $id('tabCompleted');
    const panA = $id('activePanel'), panC = $id('completedPanel');
    const sT = $id('statTotal'), sA = $id('statActive'), sD = $id('statDone');
    if (!form) return;

    function stats() {
      const t = tasks.length, d = tasks.filter(x => x.completed).length;
      if (sT) sT.textContent = t;
      if (sA) sA.textContent = t - d;
      if (sD) sD.textContent = d;
    }

    function fmtDl(dl) {
      return new Date(dl).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    }

    function mkItem(t) {
      const el = document.createElement('article');
      el.className = 'todo-item' + (t.completed ? ' todo-item--completed' : '') + (!t.completed && t.deadline && new Date(t.deadline) < new Date() ? ' todo-item--overdue' : '');
      const dlH = t.deadline ? '<span class="todo-item__deadline"><i data-lucide="clock"></i> ' + fmtDl(t.deadline) + '</span>' : '';
      el.innerHTML =
        '<div class="todo-item__content"><h3 class="todo-item__title">' + esc(t.title) + '</h3>' +
        '<div class="todo-item__meta"><span class="badge badge--' + t.category + '">' + (CATS[t.category] || t.category) + '</span>' +
        '<span class="badge badge--' + t.priority + '">' + (PRIO[t.priority] || t.priority) + '</span>' + dlH + '</div></div>' +
        '<div class="todo-item__actions">' +
        (!t.completed ? '<button class="btn btn--ghost btn--sm" data-a="done" title="Готово"><i data-lucide="check"></i></button><button class="btn btn--ghost btn--sm" data-a="edit" title="Редактировать"><i data-lucide="pencil"></i></button>' : '') +
        '<button class="btn btn--ghost btn--sm" data-a="del" title="Удалить"><i data-lucide="trash-2"></i></button></div>';
      el.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => action(t.id, b.dataset.a)));
      return el;
    }

    function render() {
      [list, doneList].forEach(c => { if (c) c.innerHTML = ''; });
      const active = tasks.filter(x => !x.completed), done = tasks.filter(x => x.completed);
      [{ c: list, arr: active, empty: 'Список пуст' }, { c: doneList, arr: done, empty: 'Нет выполненных' }].forEach(({ c, arr, empty }) => {
        if (!c) return;
        if (!arr.length) { c.innerHTML = '<div class="empty-state"><i data-lucide="clipboard-list"></i><p>' + empty + '</p></div>'; }
        else arr.forEach(t => c.appendChild(mkItem(t)));
      });
      icons();
    }

    function action(id, a) {
      const i = tasks.findIndex(x => x.id === id);
      if (i === -1) return;
      if (a === 'done') { tasks[i].completed = true; tasks[i].completedAt = new Date().toISOString(); toast('Выполнено', 'success'); }
      else if (a === 'del') { tasks.splice(i, 1); toast('Удалено', 'success'); if (editId === id) cancelEdit(); }
      else if (a === 'edit') { startEdit(tasks[i]); return; }
      save(KEYS.TASKS, tasks); render(); stats();
    }

    function startEdit(t) {
      editId = t.id;
      $id('taskTitle').value = t.title;
      $id('taskCategory').value = t.category;
      $id('taskPriority').value = t.priority;
      $id('taskDeadline').value = t.deadline || '';
      const btn = form.querySelector('[type="submit"]');
      btn.textContent = 'Сохранить'; btn.classList.remove('btn--primary'); btn.classList.add('btn--success');
      let cb = form.querySelector('#cancelEdit');
      if (!cb) { cb = document.createElement('button'); cb.type = 'button'; cb.id = 'cancelEdit'; cb.className = 'btn btn--secondary'; cb.textContent = 'Отмена'; cb.addEventListener('click', cancelEdit); form.querySelector('.btn-group').appendChild(cb); }
      form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    function cancelEdit() {
      editId = null; form.reset();
      const btn = form.querySelector('[type="submit"]');
      btn.textContent = 'Добавить'; btn.classList.add('btn--primary'); btn.classList.remove('btn--success');
      form.querySelector('#cancelEdit')?.remove();
    }

    tabA?.addEventListener('click', () => { tabA.classList.add('tab--active'); tabC?.classList.remove('tab--active'); panA?.classList.remove('sr-only'); panC?.classList.add('sr-only'); });
    tabC?.addEventListener('click', () => { tabC.classList.add('tab--active'); tabA?.classList.remove('tab--active'); panC?.classList.remove('sr-only'); panA?.classList.add('sr-only'); });

    form.addEventListener('submit', e => {
      e.preventDefault();
      const title = ($id('taskTitle')?.value || '').trim();
      if (!title) { toast('Введите название', 'error'); return; }
      const cat = $id('taskCategory')?.value, pri = $id('taskPriority')?.value, dl = $id('taskDeadline')?.value;
      if (editId) {
        const i = tasks.findIndex(x => x.id === editId);
        if (i !== -1) tasks[i] = { ...tasks[i], title, category: cat, priority: pri, deadline: dl };
        toast('Обновлено', 'success'); cancelEdit();
      } else {
        tasks.unshift({ id: Date.now().toString(), title, category: cat, priority: pri, deadline: dl || null, completed: false, createdAt: new Date().toISOString() });
        toast('Добавлено', 'success');
      }
      save(KEYS.TASKS, tasks); render(); stats(); form.reset();
    });

    render(); stats();
  }

  function initCalculator() {
    const canvas = $id('productivityChart'), form = $id('calculatorForm'), res = $id('calculatorResult');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const COLORS = { work: '#4a6741', study: '#c4a35a', rest: '#5e8c51', ent: '#b8956a' };
    const NAMES = { work: 'Работа', study: 'Учёба', rest: 'Отдых', ent: 'Развлечения' };

    function resize() {
      const s = Math.min(canvas.parentElement.clientWidth - 32, 300);
      canvas.width = s; canvas.height = s;
    }

    function empty() {
      resize();
      const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 20;
      ctx.clearRect(0, 0, w, h);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(168,160,142,0.12)'; ctx.lineWidth = 20; ctx.stroke();
      ctx.fillStyle = '#7d7768'; ctx.font = '13px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.fillText('Введите данные', cx, cy);
    }

    function draw(d) {
      resize();
      const w = canvas.width, h = canvas.height, cx = w / 2, cy = h / 2, r = Math.min(w, h) / 2 - 20;
      ctx.clearRect(0, 0, w, h);
      const segs = [{ v: d.work, c: COLORS.work }, { v: d.study, c: COLORS.study }, { v: d.rest, c: COLORS.rest }, { v: d.ent, c: COLORS.ent }].filter(s => s.v > 0);
      let a = -Math.PI / 2;
      segs.forEach(s => { const sa = (s.v / d.total) * Math.PI * 2; ctx.beginPath(); ctx.arc(cx, cy, r, a, a + sa); ctx.strokeStyle = s.c; ctx.lineWidth = 20; ctx.lineCap = 'butt'; ctx.stroke(); a += sa; });
      const pct = Math.round((d.work + d.study) / d.total * 100);
      ctx.fillStyle = '#e8e2d6'; ctx.font = '600 24px Inter,sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pct + '%', cx, cy - 6);
      ctx.fillStyle = '#7d7768'; ctx.font = '11px Inter,sans-serif'; ctx.fillText('продуктивно', cx, cy + 14);
    }

    function legend(d) {
      const el = $id('chartLegend');
      if (!el) return;
      el.innerHTML = ['work', 'study', 'rest', 'ent'].map(k => {
        const h = d[k], p = d.total > 0 ? Math.round(h / d.total * 100) : 0;
        return '<div class="legend-item"><span class="legend-item__dot" style="background:' + COLORS[k] + '"></span><span>' + NAMES[k] + ': ' + h + ' ч. (' + p + '%)</span></div>';
      }).join('');
    }

    empty();
    window.addEventListener('resize', () => { if (canvas.dataset.filled) { /* redraw handled by form */ } else empty(); });

    form?.addEventListener('submit', e => {
      e.preventDefault();
      const w = parseFloat($id('hoursWork')?.value) || 0, st = parseFloat($id('hoursStudy')?.value) || 0,
            r = parseFloat($id('hoursRest')?.value) || 0, en = parseFloat($id('hoursEntertainment')?.value) || 0;
      const t = w + st + r + en;
      if (t === 0) { res.innerHTML = '<p class="calculator-result__text">Введите хотя бы одно значение.</p>'; empty(); return; }
      const d = { work: w, study: st, rest: r, ent: en, total: t };
      canvas.dataset.filled = '1';
      draw(d); legend(d);
      const pp = Math.round((w + st) / t * 100), up = Math.round((r + en) / t * 100);
      let msg = '';
      if (pp >= 70) msg = 'Отлично! Время распределено эффективно.';
      else if (pp >= 50) msg = 'Хороший баланс, но можно улучшить.';
      else if (pp >= 30) msg = 'Стоит пересмотреть распределение времени.';
      else msg = 'Низкая продуктивность. Составьте план дня.';
      res.innerHTML =
        '<h3 class="calculator-result__title">Результаты</h3>' +
        '<div class="calculator-result__percentages"><div class="percentage-block"><div class="percentage-block__value percentage-block__value--productive">' + pp + '%</div><div class="percentage-block__label">Продуктивно</div></div>' +
        '<div class="percentage-block"><div class="percentage-block__value percentage-block__value--unproductive">' + up + '%</div><div class="percentage-block__label">Непродуктивно</div></div></div>' +
        '<div class="progress-bar" style="margin-bottom:0.75rem"><div class="progress-bar__fill progress-bar__fill--productive" style="width:' + pp + '%"></div></div>' +
        '<p class="calculator-result__text"><strong>Работа:</strong> ' + w + ' ч. · <strong>Учёба:</strong> ' + st + ' ч. · <strong>Отдых:</strong> ' + r + ' ч. · <strong>Развлечения:</strong> ' + en + ' ч.<br><strong>Всего:</strong> ' + t + ' ч.<br><br>' + msg + '</p>';
    });
  }

  function initPomodoro() {
    const main = $('.pomodoro-page'), timeD = $id('pomodoroTime'), modeD = $id('pomodoroMode'),
          prog = $id('timerProgress'), btnS = $id('pomodoroStart'), btnP = $id('pomodoroPause'),
          btnR = $id('pomodoroReset'), wIn = $id('workMinutes'), bIn = $id('breakMinutes'),
          sesD = $id('sessionsCount'), labD = $id('timerLabel');
    if (!timeD) return;

    const saved = load(KEYS.POMODORO, {});
    let wM = saved.workMinutes || 25, bM = saved.breakMinutes || 5, ses = saved.sessionsCompleted || 0;
    let total = wM * 60, remain = total, running = false, work = true, iv = null, audioCtx = null;

    if (wIn) wIn.value = wM;
    if (bIn) bIn.value = bM;
    if (sesD) sesD.textContent = ses;

    function sv() { save(KEYS.POMODORO, { workMinutes: wM, breakMinutes: bM, sessionsCompleted: ses }); }

    function disp() {
      const m = Math.floor(remain / 60), s = remain % 60;
      timeD.textContent = String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
    }

    function progU() {
      if (!prog) return;
      const c = 2 * Math.PI * 130, off = c * (1 - remain / total);
      prog.style.strokeDasharray = c;
      prog.style.strokeDashoffset = off;
    }

    function modeUI() {
      if (modeD) modeD.textContent = work ? 'Работа' : 'Отдых';
      if (labD) labD.textContent = work ? 'Сфокусируйтесь на задаче' : 'Отдохните';
      if (main) { main.classList.toggle('pomodoro-page--work', work); main.classList.toggle('pomodoro-page--break', !work); }
      document.title = (work ? 'Работа' : 'Отдых') + ' — Pomodoro';
    }

    function beep() {
      try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.connect(g); g.connect(audioCtx.destination);
        o.frequency.value = work ? 880 : 660; o.type = 'sine';
        g.gain.setValueAtTime(0.25, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        o.start(audioCtx.currentTime); o.stop(audioCtx.currentTime + 0.4);
      } catch {}
    }

    function done() {
      pause();
      beep();
      if (work) { ses++; if (sesD) sesD.textContent = ses; sv(); toast('Сессия завершена! Отдыхайте.', 'success'); }
      else toast('Перерыв окончен!', 'success');
      work = !work;
      total = (work ? wM : bM) * 60; remain = total;
      modeUI(); disp(); progU();
    }

    function start() {
      if (running) return; running = true;
      if (btnS) btnS.disabled = true;
      if (btnP) btnP.disabled = false;
      iv = setInterval(() => { remain--; if (remain <= 0) { done(); return; } disp(); progU(); }, 1000);
    }

    function pause() {
      if (!running) return; running = false;
      clearInterval(iv); iv = null;
      if (btnS) btnS.disabled = false;
      if (btnP) btnP.disabled = true;
    }

    btnS?.addEventListener('click', start);
    btnP?.addEventListener('click', pause);
    btnR?.addEventListener('click', () => { pause(); work = true; total = wM * 60; remain = total; disp(); progU(); modeUI(); });
    wIn?.addEventListener('change', () => { if (running) return; wM = parseInt(wIn.value, 10) || 25; total = (work ? wM : bM) * 60; remain = total; sv(); disp(); progU(); });
    bIn?.addEventListener('change', () => { if (running) return; bM = parseInt(bIn.value, 10) || 5; total = (work ? wM : bM) * 60; remain = total; sv(); disp(); progU(); });

    disp(); progU(); modeUI();
  }

  async function initRecommendations() {
    let quotes = [], qi = 0;
    const fallback = [
      { text: 'Время — самый ценный ресурс.', author: 'Теофраст' },
      { text: 'Не откладывай на завтра то, что можешь сделать сегодня.', author: 'Б. Франклин' },
      { text: 'Дисциплина — мост между целями и достижениями.', author: 'Дж. Рон' }
    ];
    try {
      const r = await fetch('./data/quotes.json');
      if (r.ok) quotes = await r.json();
      if (!quotes.length) quotes = fallback;
    } catch { quotes = fallback; }

    function show(i) {
      const q = quotes[i]; if (!q) return;
      const t = $id('quoteText'), a = $id('quoteAuthor');
      if (t) { t.style.opacity = '0'; setTimeout(() => { t.textContent = '«' + q.text + '»'; t.style.transition = 'opacity 0.3s'; t.style.opacity = '1'; }, 150); }
      if (a) a.textContent = '— ' + q.author;
    }
    show(0);
    $id('refreshQuote')?.addEventListener('click', () => { qi = (qi + 1) % quotes.length; show(qi); });
  }

  function initContact() {
    const form = $id('contactForm');
    if (!form) return;
    const nI = form.querySelector('#contactName'), eI = form.querySelector('#contactEmail'), mI = form.querySelector('#contactMessage');

    function setF(inp, errId, ok, msg) {
      inp.classList.toggle('form-input--error', !ok);
      inp.classList.toggle('form-input--valid', ok && inp.value.trim() !== '');
      const e = $id(errId); if (e) e.textContent = msg;
    }

    function vN() { const v = (nI?.value || '').trim(); const ok = v.length >= 2; setF(nI, 'nameError', ok, ok ? '' : 'Минимум 2 символа'); return ok; }
    function vE() { const v = (eI?.value || '').trim(); if (!v) { setF(eI, 'emailError', false, 'Обязательное поле'); return false; } const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); setF(eI, 'emailError', ok, ok ? '' : 'Некорректный email'); return ok; }
    function vM() { const v = (mI?.value || '').trim(); const ok = v.length >= 10; setF(mI, 'messageError', ok, ok ? '' : 'Минимум 10 символов'); return ok; }

    nI?.addEventListener('input', vN);
    eI?.addEventListener('input', vE);
    mI?.addEventListener('input', vM);

    form.addEventListener('submit', e => {
      e.preventDefault();
      if (!vN() | !vE() | !vM()) { toast('Исправьте ошибки', 'error'); return; }
      form.parentElement.innerHTML = '<div class="form-success fade-in fade-in--visible"><i data-lucide="check-circle"></i><h3>Спасибо!</h3><p>Мы получили ваше сообщение.</p></div>';
      icons();
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    injectLayout();
    initNav();
    icons();
    initFadeIn();

    const p = page();
    if (p === 'index.html') { initClock(); initSettings(); initPrinciples(); }
    else if (p === 'todo.html') initTodo();
    else if (p === 'calculator.html') initCalculator();
    else if (p === 'pomodoro.html') initPomodoro();
    else if (p === 'recommendations.html') initRecommendations();
    else if (p === 'contact.html') initContact();
  });
})();
