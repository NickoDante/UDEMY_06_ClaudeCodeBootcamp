(() => {
  'use strict';

  const STORAGE_KEY = 'futureMe.messages';
  const THEME_KEY = 'futureMe.theme';

  const QUOTES = [
    "The best time to plant a tree was 20 years ago. The second best time is now.",
    "Your future self is watching you right now through memories.",
    "What you do today can improve all your tomorrows.",
    "Small steps every day lead to big changes every year.",
    "Write it down. Future you will thank present you.",
    "Time will pass anyway — decide what you want it to carry.",
    "You are one decision away from a totally different life.",
    "Be the person your future self will be proud of.",
    "Growth is a quiet, daily thing. Trust the process.",
    "Every message in a bottle is really a message to yourself."
  ];

  // ---------- Element refs ----------
  const form = document.getElementById('messageForm');
  const nameInput = document.getElementById('nameInput');
  const messageInput = document.getElementById('messageInput');
  const dateInput = document.getElementById('dateInput');
  const charCount = document.getElementById('charCount');
  const formError = document.getElementById('formError');
  const messageList = document.getElementById('messageList');
  const emptyState = document.getElementById('emptyState');
  const capsuleCount = document.getElementById('capsuleCount');
  const quoteText = document.getElementById('quoteText');
  const themeToggle = document.getElementById('themeToggle');

  const revealModal = document.getElementById('revealModal');
  const revealMeta = document.getElementById('revealMeta');
  const revealBody = document.getElementById('revealBody');
  const modalClose = document.getElementById('modalClose');

  // ---------- State ----------
  let capsules = loadCapsules();

  // ---------- Init ----------
  initTheme();
  initDateMin();
  renderQuote();
  renderAll();

  setInterval(tick, 1000);
  setInterval(renderQuote, 12000);

  // ---------- Storage ----------
  function loadCapsules() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.warn('Could not read saved messages', e);
      return [];
    }
  }

  function saveCapsules() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capsules));
  }

  // ---------- Theme ----------
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    }
    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme')
        || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  // ---------- Quotes ----------
  function renderQuote() {
    const q = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    quoteText.style.animation = 'none';
    void quoteText.offsetWidth;
    quoteText.style.animation = 'fadeIn 0.8s ease';
    quoteText.textContent = `“${q}”`;
  }

  // ---------- Form ----------
  function initDateMin() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.min = toDateInputValue(tomorrow);
  }

  function toDateInputValue(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  messageInput.addEventListener('input', () => {
    charCount.textContent = messageInput.value.length;
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    formError.textContent = '';

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();
    const dateVal = dateInput.value;

    if (!name || !message || !dateVal) {
      formError.textContent = 'Please fill in every field before sealing your message.';
      return;
    }

    const unlockDate = new Date(`${dateVal}T00:00:00`);
    if (isNaN(unlockDate.getTime()) || unlockDate.getTime() <= Date.now()) {
      formError.textContent = 'Please choose a date in the future.';
      return;
    }

    const capsule = {
      id: crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name,
      message,
      createdAt: new Date().toISOString(),
      unlockAt: unlockDate.toISOString(),
      announced: false
    };

    capsules.push(capsule);
    saveCapsules();
    renderAll();

    form.reset();
    charCount.textContent = '0';
    initDateMin();
  });

  // ---------- Rendering ----------
  function renderAll() {
    capsules.sort((a, b) => new Date(a.unlockAt) - new Date(b.unlockAt));

    messageList.querySelectorAll('.capsule').forEach(el => el.remove());
    emptyState.hidden = capsules.length > 0;
    capsuleCount.textContent = capsules.length;

    capsules.forEach(c => messageList.appendChild(buildCapsuleCard(c)));
  }

  function buildCapsuleCard(c) {
    const card = document.createElement('article');
    card.className = 'capsule';
    card.dataset.id = c.id;

    const unlocked = isUnlocked(c);

    card.innerHTML = `
      <div class="capsule-header">
        <span class="capsule-name">${escapeHtml(c.name)}</span>
        <span class="capsule-status ${unlocked ? 'unlocked' : 'locked'}">${unlocked ? 'Unlocked' : 'Locked'}</span>
      </div>
      <span class="capsule-date">Reveals on ${formatDate(c.unlockAt)}</span>
      <span class="capsule-countdown" data-role="countdown"></span>
      <div class="progress-track">
        <div class="progress-fill" data-role="progress"></div>
      </div>
      <p class="capsule-message ${unlocked ? '' : 'blurred'}" data-role="message">${unlocked ? escapeHtml(c.message) : blurPlaceholder(c.message)}</p>
      <div class="capsule-actions">
        <button type="button" class="icon-btn" data-action="delete" aria-label="Delete message">🗑️ Delete</button>
      </div>
    `;

    card.querySelector('[data-action="delete"]').addEventListener('click', () => {
      capsules = capsules.filter(m => m.id !== c.id);
      saveCapsules();
      renderAll();
    });

    updateCapsuleCard(card, c);
    return card;
  }

  function blurPlaceholder(message) {
    return escapeHtml(message).replace(/[^\s]/g, '•');
  }

  function updateCapsuleCard(card, c) {
    const unlocked = isUnlocked(c);
    const countdownEl = card.querySelector('[data-role="countdown"]');
    const progressEl = card.querySelector('[data-role="progress"]');
    const statusEl = card.querySelector('.capsule-status');
    const messageEl = card.querySelector('[data-role="message"]');

    const now = Date.now();
    const created = new Date(c.createdAt).getTime();
    const unlockAt = new Date(c.unlockAt).getTime();
    const total = Math.max(unlockAt - created, 1);
    const elapsed = Math.min(Math.max(now - created, 0), total);
    const pct = Math.min(100, (elapsed / total) * 100);
    progressEl.style.width = `${pct}%`;

    if (unlocked) {
      statusEl.textContent = 'Unlocked';
      statusEl.classList.remove('locked');
      statusEl.classList.add('unlocked');
      countdownEl.textContent = 'Ready to read 🎉';
      messageEl.textContent = c.message;
      messageEl.classList.remove('blurred');
    } else {
      countdownEl.textContent = formatCountdown(unlockAt - now);
    }
  }

  function isUnlocked(c) {
    return Date.now() >= new Date(c.unlockAt).getTime();
  }

  function formatCountdown(ms) {
    if (ms <= 0) return 'Unlocking…';
    const s = Math.floor(ms / 1000);
    const days = Math.floor(s / 86400);
    const hours = Math.floor((s % 86400) / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;

    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ---------- Tick ----------
  function tick() {
    let changed = false;

    messageList.querySelectorAll('.capsule').forEach(card => {
      const c = capsules.find(m => m.id === card.dataset.id);
      if (!c) return;
      updateCapsuleCard(card, c);

      if (isUnlocked(c) && !c.announced) {
        c.announced = true;
        changed = true;
        card.classList.add('just-unlocked');
        showRevealModal(c);
      }
    });

    if (changed) saveCapsules();
  }

  // ---------- Reveal modal ----------
  function showRevealModal(c) {
    revealMeta.textContent = `${c.name} · sealed on ${formatDate(c.createdAt)}`;
    revealBody.textContent = c.message;
    revealModal.hidden = false;
  }

  function closeModal() {
    revealModal.hidden = true;
  }

  modalClose.addEventListener('click', closeModal);
  revealModal.addEventListener('click', (e) => {
    if (e.target === revealModal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !revealModal.hidden) closeModal();
  });
})();
