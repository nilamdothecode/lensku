/* ══════════════════════════
   LENSKУ — MAIN.JS
══════════════════════════ */

// ── AUTO YEAR FOOTER ──
document.getElementById('footerCopy').textContent =
  '© ' + new Date().getFullYear() + ' LensKu · Klang / Shah Alam / Subang';

// ── NAV SCROLL SHADOW ──
window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 20);
});

// ── HAMBURGER ──
const hamBtn = document.getElementById('hamBtn');
const mobileMenu = document.getElementById('mobileMenu');
hamBtn.addEventListener('click', () => {
  hamBtn.classList.toggle('open');
  mobileMenu.classList.toggle('open');
});
function closeMob() {
  hamBtn.classList.remove('open');
  mobileMenu.classList.remove('open');
}

// ── HERO LOAD ANIMATION ──
window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('heroLeft').classList.add('loaded');
  }, 80);
});

// ── SCROLL POP-UP ──
const popEls = document.querySelectorAll('.pop');
const popObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      popObs.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
popEls.forEach(el => popObs.observe(el));

// ── COUNTER ──
const counters = document.querySelectorAll('.counter');
const cObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = parseInt(el.dataset.target);
    let v = 0;
    const step = target / 55;
    const t = setInterval(() => {
      v += step;
      if (v >= target) { el.textContent = target + '+'; clearInterval(t); }
      else { el.textContent = Math.floor(v) + '+'; }
    }, 18);
    cObs.unobserve(el);
  });
}, { threshold: 0.5 });
counters.forEach(c => cObs.observe(c));

// ══════════════════════════════════════════
// GOOGLE SHEETS INTEGRATION
// Letak URL Sheet kau kat bawah ni
// ══════════════════════════════════════════
const SHEET_URL = 'PASTE_YOUR_SHEET_URL_HERE';

// Data kamera — update nama, harga, emoji ikut unit kau
const cameras = {
  'canon-r50':   { emoji: '📷', name: 'Canon EOS R50',    price: 'RM ?? / hari', booked: [] },
  'sony-a6400':  { emoji: '📸', name: 'Sony Alpha A6400', price: 'RM ?? / hari', booked: [] }
};

const months = ['Januari','Februari','Mac','April','Mei','Jun','Julai','Ogos','September','Oktober','November','Disember'];
let activeCam = null;
let modalDate = new Date();
let sheetLoaded = false;

// Fetch & parse Google Sheet CSV
// Format Sheet: Column A = camera_id, Column B = tarikh (YYYY-MM-DD)
async function loadSheet() {
  if (SHEET_URL === 'PASTE_YOUR_SHEET_URL_HERE') {
    // Demo mode — data contoh
    cameras['canon-r50'].booked  = [3, 7, 8, 14, 15, 20];
    cameras['sony-a6400'].booked = [1, 2, 10, 11];
    sheetLoaded = true;
    return;
  }
  try {
    const res = await fetch(SHEET_URL);
    const csv = await res.text();
    Object.keys(cameras).forEach(k => cameras[k].booked = []);
    const rows = csv.trim().split('\n').slice(1); // skip header
    rows.forEach(row => {
      const cols = row.replace(/"/g, '').split(',');
      const camId = cols[0]?.trim().toLowerCase();
      const dateStr = cols[1]?.trim();
      if (!camId || !dateStr) return;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return;
      const key = Object.keys(cameras).find(k => k === camId);
      if (key) {
        cameras[key].booked.push({ y: d.getFullYear(), m: d.getMonth(), d: d.getDate() });
      }
    });
    sheetLoaded = true;
  } catch (err) {
    console.warn('Sheet fetch gagal, guna demo data.', err);
    cameras['canon-r50'].booked  = [3, 7, 8, 14, 15, 20];
    cameras['sony-a6400'].booked = [1, 2, 10, 11];
    sheetLoaded = true;
  }
}

function isBooked(camId, y, m, d) {
  const list = cameras[camId]?.booked || [];
  return list.some(b => {
    if (typeof b === 'number') return b === d; // demo mode
    return b.y === y && b.m === m && b.d === d;
  });
}

// ── MODAL ──
function openModal(id) {
  activeCam = id;
  const cam = cameras[id];
  document.getElementById('modalEmoji').textContent = cam.emoji;
  document.getElementById('modalName').textContent  = cam.name;
  document.getElementById('modalPrice').textContent = cam.price;
  document.getElementById('modalWaBtn').href =
    `https://wa.me/601XXXXXXXX?text=Hi%20LensKu!%20Nak%20tanya%20availability%20untuk%20${encodeURIComponent(cam.name)}`;
  modalDate = new Date();
  renderCal();
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target.id === 'modalOverlay') closeModal();
}

function changeModalMonth(dir) {
  modalDate.setMonth(modalDate.getMonth() + dir);
  renderCal();
}

function renderCal() {
  const y = modalDate.getFullYear();
  const m = modalDate.getMonth();
  document.getElementById('modalMonthLabel').textContent = months[m] + ' ' + y;

  const firstDay = new Date(y, m, 1).getDay();
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const today = new Date();
  const grid = document.getElementById('modalCalGrid');
  grid.innerHTML = '';

  if (!sheetLoaded) {
    const msg = document.createElement('div');
    msg.style.cssText = 'grid-column:span 7;text-align:center;padding:1.5rem;color:var(--text-muted);font-size:0.85rem;';
    msg.textContent = 'Memuatkan availability…';
    grid.appendChild(msg);
    return;
  }

  for (let i = 0; i < firstDay; i++) {
    const el = document.createElement('div');
    el.className = 'c-day empty';
    grid.appendChild(el);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const el = document.createElement('div');
    const isPast  = new Date(y, m, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isToday = d === today.getDate() && m === today.getMonth() && y === today.getFullYear();
    const booked  = isBooked(activeCam, y, m, d);
    el.textContent = d;

    if (isPast)        { el.className = 'c-day past'; }
    else if (booked)   { el.className = 'c-day unavail'; }
    else {
      el.className = 'c-day avail' + (isToday ? ' today' : '');
      el.addEventListener('click', () => {
        const cam = cameras[activeCam];
        window.open(
          `https://wa.me/601XXXXXXXX?text=Hi%20LensKu!%20Nak%20sewa%20${encodeURIComponent(cam.name)}%20pada%20${d}%20${encodeURIComponent(months[m])}%20${y}.`,
          '_blank'
        );
      });
    }
    grid.appendChild(el);
  }
}

// ── REVIEW SLIDER ──
(function () {
  const track = document.getElementById('sliderTrack');
  const dotsWrap = document.getElementById('sliderDots');
  if (!track) return;

  const cards = track.querySelectorAll('.review-card');
  const total = cards.length;
  let current = 0;

  function visibleCount() {
    if (window.innerWidth <= 540) return 1;
    if (window.innerWidth <= 860) return 2;
    return 3;
  }

  function buildDots() {
    dotsWrap.innerHTML = '';
    const pages = total - visibleCount() + 1;
    for (let i = 0; i < pages; i++) {
      const d = document.createElement('button');
      d.className = 'slider-dot' + (i === current ? ' active' : '');
      d.addEventListener('click', () => goTo(i));
      dotsWrap.appendChild(d);
    }
  }

  function goTo(idx) {
    const pages = total - visibleCount() + 1;
    current = Math.max(0, Math.min(idx, pages - 1));
    const card = cards[0];
    const gap = 24;
    const offset = current * (card.offsetWidth + gap);
    track.style.transform = `translateX(-${offset}px)`;
    dotsWrap.querySelectorAll('.slider-dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  window.slideMove = function (dir) { goTo(current + dir); };

  // Swipe support
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = startX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) slideMove(diff > 0 ? 1 : -1);
  });

  buildDots();
  window.addEventListener('resize', () => { buildDots(); goTo(current); });
})();

// ── ESC TO CLOSE MODAL ──
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── LOAD SHEET ──
loadSheet();
