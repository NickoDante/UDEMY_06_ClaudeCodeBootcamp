const grid = document.getElementById('color-grid');
const noResults = document.getElementById('no-results');
const searchInput = document.getElementById('search-input');
const themeToggle = document.getElementById('theme-toggle');
const toast = document.getElementById('toast');
const recentSection = document.getElementById('recent-section');
const recentList = document.getElementById('recent-list');

let allColors = [];
let toastTimer = null;

function contrastColor(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1c1e26' : '#ffffff';
}

function renderGrid(colorsToRender) {
  grid.innerHTML = '';
  noResults.hidden = colorsToRender.length > 0;

  colorsToRender.forEach((color) => {
    const card = document.createElement('div');
    card.className = 'color-card';
    card.style.backgroundColor = color.hex;
    card.style.color = contrastColor(color.hex);

    card.innerHTML = `
      <div class="color-name">${color.name}</div>
      <div class="color-meta">${color.hex}</div>
      <div class="color-meta">${color.rgb}</div>
      <div class="color-meta">${color.hsl}</div>
    `;

    card.addEventListener('click', () => handleCardClick(color));
    grid.appendChild(card);
  });
}

function renderRecent(entries) {
  if (!entries || entries.length === 0) {
    recentSection.hidden = true;
    return;
  }
  recentSection.hidden = false;
  recentList.innerHTML = '';
  entries.forEach((entry) => {
    const swatch = document.createElement('div');
    swatch.className = 'recent-swatch';
    swatch.style.backgroundColor = entry.hex;
    swatch.dataset.name = entry.name;
    swatch.title = `${entry.name} (${entry.hex})`;
    swatch.addEventListener('click', () => handleCardClick(entry));
    recentList.appendChild(swatch);
  });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2500);
}

async function handleCardClick(color) {
  document.body.style.backgroundColor = color.hex;

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(color.hex);
    } catch (err) {
      /* clipboard permission denied; toast still confirms intent */
    }
  }

  showToast('Copied HEX to clipboard!');

  try {
    const res = await fetch('/api/colors/click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(color),
    });
    const data = await res.json();
    renderRecent(data.recent);
  } catch (err) {
    console.error('Failed to log color click', err);
  }
}

function filterColors(query) {
  const q = query.trim().toLowerCase();
  if (!q) return allColors;
  return allColors.filter(
    (c) => c.name.toLowerCase().includes(q) || c.hex.toLowerCase().includes(q)
  );
}

searchInput.addEventListener('input', (e) => {
  renderGrid(filterColors(e.target.value));
});

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('theme', theme);
}

themeToggle.addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  applyTheme(current === 'dark' ? 'light' : 'dark');
});

(function initTheme() {
  const saved = localStorage.getItem('theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(saved || (prefersDark ? 'dark' : 'light'));
})();

async function init() {
  const [colorsRes, recentRes] = await Promise.all([
    fetch('/api/colors'),
    fetch('/api/colors/recent'),
  ]);
  allColors = await colorsRes.json();
  const recent = await recentRes.json();

  renderGrid(allColors);
  renderRecent(recent);
}

init();
