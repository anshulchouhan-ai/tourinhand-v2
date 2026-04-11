/**
 * TourInHand v2 — app.js
 * Lightweight behavior layer — no frameworks
 */

/* ── Toast Notifications ───────────────────────────────────── */
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<span>${icons[type] || '🔔'}</span><span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'all 0.25s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(8px)';
    setTimeout(() => toast.remove(), 250);
  }, 3800);
}

/* ── Loader ─────────────────────────────────────────────────── */
function showLoader(text = 'Loading…') {
  const el = document.getElementById('loader-overlay');
  if (!el) return;
  const t = el.querySelector('.loader-text');
  if (t) t.textContent = text;
  el.classList.add('active');
}
function hideLoader() {
  const el = document.getElementById('loader-overlay');
  if (el) el.classList.remove('active');
}

/* ── Modal ──────────────────────────────────────────────────── */
function openModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(id) {
  const m = document.getElementById(id);
  if (!m) return;
  m.classList.remove('open');
  document.body.style.overflow = '';
}
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('open');
    document.body.style.overflow = '';
  }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => {
      m.classList.remove('open');
      document.body.style.overflow = '';
    });
    hideEmergency();
  }
});

/* ── Emergency ──────────────────────────────────────────────── */
function showEmergency() {
  const el = document.getElementById('emergency-overlay');
  if (el) el.style.display = 'flex';
}
function hideEmergency() {
  const el = document.getElementById('emergency-overlay');
  if (el) el.style.display = 'none';
}

/* ── Mobile Menu ────────────────────────────────────────────── */
function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('open');
}

/* ── Plan Trip Form ─────────────────────────────────────────── */
async function planTrip(e) {
  if (e) e.preventDefault();

  const cityId = document.getElementById('city-select')?.value;
  const days = document.getElementById('days-select')?.value || '3';
  const budget = document.getElementById('budget-select')?.value || 'Standard';
  const interests = [...document.querySelectorAll('.interest-check:checked')].map(cb => cb.value);

  if (!cityId) {
    showToast('Please select a destination first.', 'warning');
    return;
  }

  closeModal('plan-modal');
  showLoader('Crafting your AI itinerary…');

  try {
    const res = await fetch('/api/generate_itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ city_id: cityId, interests, budget, days })
    });
    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    sessionStorage.setItem('tih_result', JSON.stringify({ data, opts: { days, budget } }));
    window.location.href = '/result-view';
  } catch (err) {
    console.error(err);
    hideLoader();
    showToast('Could not generate itinerary. Please try again.', 'error');
  }
}

/* ── Quick Plan (pre-select city and open modal) ─────────────── */
function quickPlan(cityId) {
  const select = document.getElementById('city-select');
  if (select) select.value = cityId;
  openModal('plan-modal');
}

/* ── Render Result Page ─────────────────────────────────────── */
function initResultPage() {
  const container = document.getElementById('result-root');
  if (!container) return;

  const stored = sessionStorage.getItem('tih_result');

  if (!stored) {
    // No data — leave fallback empty state visible
    hideLoader();
    return;
  }

  const { data, opts } = JSON.parse(stored);
  const days = parseInt(opts?.days || 3);

  // Hero
  const titleEl = document.getElementById('result-city-name');
  if (titleEl) titleEl.textContent = 'Your Smart Plan for ' + (data.name || 'Your City');

  const taglineEl = document.getElementById('result-tagline');
  if (taglineEl) taglineEl.textContent = data.tagline || '';

  const tagDays = document.getElementById('result-tag-days');
  if (tagDays) tagDays.textContent = '📅 ' + days + ' Days';

  const tagBudget = document.getElementById('result-tag-budget');
  if (tagBudget) tagBudget.textContent = '💰 ' + (opts?.budget || 'Standard');

  // Summary cards
  const destEl = document.getElementById('summary-destination');
  if (destEl) destEl.textContent = (data.name || '–') + ', ' + (data.state || '');

  const safeEl = document.getElementById('hl-safety');
  if (safeEl) safeEl.textContent = (data.safety_score ?? '–') + '/100';

  const ecoEl = document.getElementById('hl-eco');
  if (ecoEl) ecoEl.textContent = (data.eco_score ?? '–') + '/100';

  const budgetEl = document.getElementById('hl-budget');
  if (budgetEl) budgetEl.textContent = data.budget ?? '–';

  // Insight bars
  const effBar = document.getElementById('efficiency-bar');
  if (effBar) effBar.style.width = Math.min(100, (data.safety_score ?? 78)) + '%';

  const ecoBar = document.getElementById('eco-bar');
  if (ecoBar) ecoBar.style.width = Math.min(100, (data.eco_score ?? 60)) + '%';

  const safeBar = document.getElementById('safety-bar');
  if (safeBar) safeBar.style.width = Math.min(100, (data.safety_score ?? 82)) + '%';

  // Build itinerary
  const places = data.places || [];
  const itineraryEl = document.getElementById('itinerary-days');
  const emptyState = document.getElementById('result-empty-state');
  const countBadge = document.getElementById('result-place-count');

  if (places.length > 0 && itineraryEl) {
    if (emptyState) emptyState.style.display = 'none';
    if (countBadge) countBadge.textContent = places.length + ' places';

    itineraryEl.innerHTML = '';
    const perDay = Math.ceil(places.length / days) || 1;

    for (let d = 0; d < days; d++) {
      const dayPlaces = places.slice(d * perDay, (d + 1) * perDay);
      if (dayPlaces.length === 0 && d > 0) continue;

      const card = document.createElement('div');
      card.className = 'day-card';
      card.style.animationDelay = (d * 0.08) + 's';

      card.innerHTML = `
        <div class="day-card-header">
          <div class="day-number">${d + 1}</div>
          <div>
            <div class="day-title">Day ${d + 1} — ${data.name}</div>
            <div class="day-sub">${dayPlaces.length} place${dayPlaces.length !== 1 ? 's' : ''} to explore</div>
          </div>
        </div>
        <div class="place-list">
          ${dayPlaces.map(p => `
            <div class="place-item">
              <img class="place-img" src="${p.image_url || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=120&q=60'}" alt="${p.name}" loading="lazy"/>
              <div class="place-info">
                <div class="place-name">${p.name}</div>
                <div class="place-category-row">
                  <span class="tag">${p.category}</span>
                  ${p.cost ? `<span class="place-cost">${p.cost}</span>` : ''}
                  ${p.duration ? `<span class="place-duration">⏱ ${p.duration}</span>` : ''}
                </div>
              </div>
              ${p.lat && p.lon ? `<a class="place-map-link" href="https://www.google.com/maps?q=${p.lat},${p.lon}" target="_blank" rel="noopener">📍 Map</a>` : ''}
            </div>`).join('')}
          ${dayPlaces.length === 0 ? `<div style="padding:20px;text-align:center;color:var(--text-muted)">Free day — explore at your own pace! 🌟</div>` : ''}
        </div>`;
      itineraryEl.appendChild(card);
    }
  }

  // Local tips
  const tipsEl = document.getElementById('local-tips');
  if (tipsEl && data.local_tips?.length) {
    tipsEl.innerHTML = data.local_tips.map(t =>
      `<div class="tip-item"><span class="tip-icon">💡</span><span>${t}</span></div>`
    ).join('');
  }

  hideLoader();
}

/* ── Save Trip ──────────────────────────────────────────────── */
async function saveTrip(data) {
  showLoader('Saving your trip…');
  try {
    const res = await fetch('/api/saved_trips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'demo_user',
        city_id: data.id,
        itinerary_data: data
      })
    });
    const json = await res.json();
    hideLoader();
    if (json.status === 'success') {
      showToast('Trip saved successfully! 🎉', 'success');
    } else {
      showToast('Could not save trip.', 'error');
    }
  } catch {
    hideLoader();
    showToast('Save failed. Please try again.', 'error');
  }
}

/* ── Share ──────────────────────────────────────────────────── */
function shareRide() {
  const url = window.location.href;
  if (navigator.share) {
    navigator.share({ title: 'My TourInHand Trip', text: 'Check out my travel plan!', url });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
    showToast('Link copied to clipboard!', 'info');
  } else {
    showToast('Share: ' + url, 'info');
  }
}

/* ── Scroll-based navbar shadow ─────────────────────────────── */
function initNavbarScroll() {
  const nav = document.getElementById('main-navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.style.boxShadow = window.scrollY > 10
      ? '0 4px 24px rgba(0,0,0,0.08)'
      : '';
  }, { passive: true });
}

/* ── Active nav highlight ───────────────────────────────────── */
function highlightNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-link').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (href !== '/' && path.startsWith(href))) {
      a.classList.add('nav-link--active');
    }
  });
}

/* ── DOM Ready ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  highlightNav();
  initNavbarScroll();
  initResultPage();

  const planForm = document.getElementById('plan-form');
  if (planForm) planForm.addEventListener('submit', planTrip);
});

console.log('[TourInHand v2] app.js loaded ✈️');