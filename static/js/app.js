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

/* ── Plan Trip Form ────────────────────────────────────────── */

/**
 * Read from-date and to-date inputs and return the number of trip days.
 * Returns 1 as a safe minimum if the dates are missing or invalid.
 */
function getDaysFromDates() {
  const fromVal = document.getElementById('from-date')?.value;
  const toVal   = document.getElementById('to-date')?.value;
  if (!fromVal || !toVal) return 1;
  const from = new Date(fromVal);
  const to   = new Date(toVal);
  const diff = Math.round((to - from) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 1;
}

async function planTrip(e) {
  if (e) e.preventDefault();

  const cityId       = document.getElementById('city-select')?.value;
  const budget       = document.getElementById('budget-select')?.value || 'Standard';
  const travelStyle  = document.getElementById('style-select')?.value  || 'chill';
  const interests    = [...document.querySelectorAll('.interest-check:checked')].map(cb => cb.value);
  const userBudget   = parseInt(document.getElementById('user-budget-input')?.value || '0', 10) || 0;
  const selectedPlaces = Array.isArray(_selectedDests) ? [..._selectedDests] : [];

  // ── Compute days from date range ──
  const fromDate = document.getElementById('from-date')?.value;
  const toDate   = document.getElementById('to-date')?.value;
  const days     = getDaysFromDates();

  if (!cityId) {
    showToast('Please select a destination first.', 'warning');
    return;
  }
  if (!fromDate || !toDate || days <= 0) {
    showToast('Please pick valid travel dates (From → To).', 'warning');
    return;
  }

  closeModal('plan-modal');
  showLoader('Crafting your AI itinerary…');

  try {
    const res = await fetch('/api/generate_itinerary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        city_id: cityId,
        interests,
        budget,
        days: String(days),          // backend still expects a string
        user_budget: userBudget,
        selected_places: selectedPlaces,
        travel_style: travelStyle,
      })
    });
    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    // Store dates in opts so result page can display them
    sessionStorage.setItem('tih_result', JSON.stringify({
      data,
      opts: { days, budget, user_budget: userBudget, from_date: fromDate, to_date: toDate, travel_style: travelStyle }
    }));
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
  if (select) {
    select.value = cityId;
    select.dispatchEvent(new Event('change'));
  }
  openModal('plan-modal');
}

/* ── Destination Selector ────────────────────────────────── */
let _destPlaces    = [];  // all places for the selected city
let _selectedDests = [];  // names the user has ticked

/** Fetch places for cityId and render destination chips. */
async function loadCityDestinations(cityId) {
  const selectorEl = document.getElementById('dest-selector');
  const hintEl     = document.getElementById('dest-selector-hint');
  if (!selectorEl) return;
  if (!cityId) {
    selectorEl.style.display = 'none';
    _destPlaces = []; _selectedDests = [];
    return;
  }
  try {
    const res  = await fetch('/api/city/' + cityId);
    const city = await res.json();
    _destPlaces    = city.places || [];
    _selectedDests = [];
    selectorEl.style.display = 'block';
    if (hintEl) hintEl.textContent =
      `${_destPlaces.length} places available — pick your favourites`;
    // Reset filter tab to "All"
    document.querySelectorAll('.dest-filter-btn')
            .forEach(b => b.classList.remove('dest-filter-btn--active'));
    document.querySelector('.dest-filter-btn[data-filter="all"]')
            ?.classList.add('dest-filter-btn--active');
    renderDestinationChips(_destPlaces);
    updateDestSelectedBar();
  } catch (err) {
    console.error('Failed to load city destinations', err);
  }
}

/** Render the place-chip grid from a places array. */
function renderDestinationChips(places) {
  const gridEl = document.getElementById('dest-chips-grid');
  if (!gridEl) return;
  const TIME_ICON = { Morning: '🌅', Afternoon: '☀️', Evening: '🌆', Night: '🌙', Any: '☀️' };
  function badgeClass(label) {
    if (!label) return '';
    const l = label.toLowerCase();
    if (l.includes('visited') || l.includes('must'))  return 'dest-badge--red';
    if (l.includes('sunset') || l.includes('night'))  return 'dest-badge--purple';
    if (l.includes('hidden') || l.includes('gem'))    return 'dest-badge--teal';
    if (l.includes('morning') || l.includes('food'))  return 'dest-badge--amber';
    return 'dest-badge--blue';
  }
  gridEl.innerHTML = places.map(p => {
    const isSelected = _selectedDests.includes(p.name);
    const icon  = TIME_ICON[p.time_slot] || '☀️';
    const badge = p.best_for
      ? `<span class="dest-badge ${badgeClass(p.best_for)}">${p.best_for}</span>`
      : '';
    return `
      <label
        class="dest-chip${isSelected ? ' dest-chip--selected' : ''}"
        data-name="${p.name}"
        data-time="${(p.time_slot || 'any').toLowerCase()}"
        data-crowd="${(p.crowd_level || 'medium').toLowerCase()}"
        data-popularity="${p.popularity || 3}">
        <input type="checkbox" class="dest-check" value="${p.name}"
               ${isSelected ? 'checked' : ''} onchange="toggleDest(this)" />
        <div class="dest-chip-body">
          <div class="dest-chip-top">
            <span class="dest-chip-name">${p.name}</span>
            ${badge}
          </div>
          <div class="dest-chip-meta">
            <span class="tag">${p.category}</span>
            <span class="dest-chip-time">${icon} ${p.time_slot || 'Any'}</span>
            ${p.cost ? `<span class="place-cost">${p.cost}</span>` : ''}
          </div>
        </div>
      </label>`;
  }).join('');
}

/** Toggle a destination selection. */
function toggleDest(checkbox) {
  const name = checkbox.value;
  const chip = checkbox.closest('.dest-chip');
  if (checkbox.checked) {
    if (!_selectedDests.includes(name)) _selectedDests.push(name);
    chip?.classList.add('dest-chip--selected');
  } else {
    _selectedDests = _selectedDests.filter(n => n !== name);
    chip?.classList.remove('dest-chip--selected');
  }
  updateDestSelectedBar();
}

/** Filter visible chips by tab. */
function filterDestChips(filter, btn) {
  document.querySelectorAll('.dest-filter-btn')
          .forEach(b => b.classList.remove('dest-filter-btn--active'));
  btn.classList.add('dest-filter-btn--active');
  document.querySelectorAll('.dest-chip').forEach(chip => {
    const time       = chip.dataset.time || '';
    const crowd      = chip.dataset.crowd || '';
    const popularity = parseInt(chip.dataset.popularity || '3', 10);
    let show = true;
    if      (filter === 'morning')   show = time === 'morning';
    else if (filter === 'evening')   show = time === 'evening' || time === 'night';
    else if (filter === 'low-crowd') show = crowd === 'low';
    else if (filter === 'popular')   show = popularity >= 4;
    chip.style.display = show ? '' : 'none';
  });
}

/** Clear all destination selections. */
function clearDestSelection() {
  _selectedDests = [];
  document.querySelectorAll('.dest-check').forEach(cb => cb.checked = false);
  document.querySelectorAll('.dest-chip').forEach(chip => chip.classList.remove('dest-chip--selected'));
  updateDestSelectedBar();
}

/** Update the selected-count bar. */
function updateDestSelectedBar() {
  const barEl  = document.getElementById('dest-selected-bar');
  const textEl = document.getElementById('dest-selected-text');
  if (!barEl) return;
  const n = _selectedDests.length;
  if (n > 0) {
    barEl.style.display = 'flex';
    if (textEl) textEl.textContent = `${n} destination${n !== 1 ? 's' : ''} selected — AI will optimize order`;
  } else {
    barEl.style.display = 'none';
  }
}

/* ── Live Budget Hint ──────────────────────────────────────── */
function updateBudgetHint() {
  const citySelect   = document.getElementById('city-select');
  const daysSelect   = document.getElementById('days-select');
  const suggestionEl = document.getElementById('budget-suggestion');
  const suggTextEl   = document.getElementById('budget-suggestion-text');
  const statusEl     = document.getElementById('budget-status');
  const budgetEl     = document.getElementById('user-budget-input');
  const budgetWrap   = document.querySelector('.budget-input-wrap');
  const recEl        = document.getElementById('min-recommendation');
  const recValEl     = document.getElementById('min-rec-value');

  if (!citySelect || !suggestionEl) return;

  const selectedOpt = citySelect.options[citySelect.selectedIndex];
  const cityName    = selectedOpt?.text || '';
  const minPerDay   = parseInt(selectedOpt?.dataset?.minBudget || '0', 10);
  
  // Calculate days from dates instead of a static select
  const days        = getDaysFromDates();
  const minTotal    = minPerDay * days;
  const userBudget  = parseInt(budgetEl?.value || '0', 10) || 0;

  // Hide suggestion if no valid city selected or no budget data
  if (!citySelect.value || minPerDay === 0) {
    suggestionEl.style.display = 'none';
    if (recEl) recEl.style.display = 'none';
    if (statusEl) { statusEl.style.display = 'none'; }
    return;
  }

  // Update recommendation badge
  if (recEl && recValEl) {
    recEl.style.display = 'flex';
    recValEl.textContent = minTotal.toLocaleString('en-IN');
  }

  // Show the plain-English suggestion sentence
  suggestionEl.style.display = 'flex';
  if (suggTextEl) {
    suggTextEl.innerHTML =
      `You need at least <strong>₹${minTotal.toLocaleString('en-IN')}</strong> ` +
      `to plan your trip in <strong>${cityName}</strong> ` +
      `for <strong>${days} day${days !== 1 ? 's' : ''}</strong> comfortably. ` +
      `<span class="budget-hint-breakdown-inline">(₹${minPerDay.toLocaleString('en-IN')}/day)</span>`;
  }

  // Status chip — only visible when user has typed a budget amount
  if (statusEl) {
    if (userBudget > 0) {
      statusEl.style.display = 'flex';
      if (userBudget >= minTotal) {
        const surplus = userBudget - minTotal;
        statusEl.className = 'budget-status budget-status--ok';
        statusEl.innerHTML = `✅ Looks good! &nbsp;·&nbsp; <strong>₹${surplus.toLocaleString('en-IN')} to spare</strong>`;
        budgetWrap?.classList.remove('budget-input-wrap--warn');
        budgetWrap?.classList.add('budget-input-wrap--ok');
      } else {
        const short = minTotal - userBudget;
        statusEl.className = 'budget-status budget-status--warn';
        statusEl.innerHTML = `⚠️ Budget may be tight &nbsp;·&nbsp; consider <strong>₹${short.toLocaleString('en-IN')} more</strong>`;
        budgetWrap?.classList.remove('budget-input-wrap--ok');
        budgetWrap?.classList.add('budget-input-wrap--warn');
      }
    } else {
      statusEl.style.display = 'none';
      budgetWrap?.classList.remove('budget-input-wrap--ok', 'budget-input-wrap--warn');
    }
  }
}

/* ── Budget Analysis Banner on Result Page ─────────────────── */
function renderBudgetAnalysis(analysis, opts) {
  if (!analysis) return;
  const sidebar = document.querySelector('.result-sidebar');
  if (!sidebar) return;

  const userBud = analysis.user_budget || opts?.user_budget || 0;
  if (userBud <= 0) return; // user didn't enter a budget — skip

  const ok       = analysis.sufficient;
  const minTotal = analysis.min_total;
  const surplus  = userBud - minTotal;
  const shortfall = analysis.shortfall || 0;

  const card = document.createElement('div');
  card.className = 'sidebar-card sidebar-card--budget-analysis';
  card.innerHTML = `
    <h3 class="sidebar-card-title">💰 Budget Check</h3>
    <div class="budget-analysis-row">
      <span class="ba-label">Your Budget</span>
      <span class="ba-value">₹${userBud.toLocaleString('en-IN')}</span>
    </div>
    <div class="budget-analysis-row">
      <span class="ba-label">Minimum Needed</span>
      <span class="ba-value">₹${minTotal.toLocaleString('en-IN')}</span>
    </div>
    <div class="budget-analysis-row">
      <span class="ba-label">₹${analysis.min_per_day.toLocaleString('en-IN')} &times; ${analysis.days} days</span>
    </div>
    <div class="ba-status ${ok ? 'ba-status--ok' : 'ba-status--warn'}">
      ${ok
        ? `✅ Comfortable budget &nbsp;&mdash;&nbsp; <strong>₹${surplus.toLocaleString('en-IN')} to spare</strong>`
        : `⚠️ Budget may be tight &nbsp;&mdash;&nbsp; consider <strong>₹${shortfall.toLocaleString('en-IN')} more</strong>`
      }
    </div>
  `;

  // Insert before the back-actions div
  const backActions = sidebar.querySelector('.result-back-actions');
  if (backActions) sidebar.insertBefore(card, backActions);
  else sidebar.appendChild(card);
}

/* ── Render Result Page ─────────────────────────────────────── */
function initResultPage() {
  const itineraryEl = document.getElementById('itinerary-days');
  if (!itineraryEl) return;
  const stored = sessionStorage.getItem('tih_result');
  if (!stored) { hideLoader(); return; }
  const { data, opts } = JSON.parse(stored);
  const days = parseInt(opts?.days || 3);
  const travelStyle = opts?.travel_style || data.ai_insights?.travel_style || 'chill';

  // Hero
  const titleEl = document.getElementById('result-city-name');
  if (titleEl) titleEl.textContent = 'Your Smart Plan for ' + (data.name || 'Your City');
  const taglineEl = document.getElementById('result-tagline');
  if (taglineEl) taglineEl.textContent = data.tagline || 'Personalized by TourInHand AI.';
  const mapImg = document.getElementById('result-map-img');
  if (mapImg && data.hero_image) { mapImg.src = data.hero_image; }
  const tagDays = document.getElementById('result-tag-days');
  if (tagDays) {
    if (opts?.from_date && opts?.to_date) {
      const fmt = d => new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
      tagDays.textContent = `📅 ${fmt(opts.from_date)} – ${fmt(opts.to_date)} · ${days} Days`;
    } else { tagDays.textContent = '📅 ' + days + ' Days'; }
  }

  // Travel Style Badge
  const STYLE_META = {
    backpacking: { label: '🎒 Backpacking', bg: '#fef3c7', color: '#92400e' },
    chill:       { label: '🌿 Chill',       bg: '#d1fae5', color: '#065f46' },
    adventure:   { label: '⛰️ Adventure',   bg: '#fee2e2', color: '#991b1b' },
    foodie:      { label: '🍛 Foodie',      bg: '#fce7f3', color: '#9d174d' },
  };
  const sm = STYLE_META[travelStyle] || STYLE_META.chill;
  ['style-badge', 'style-chip'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = sm.label;
    el.style.background = sm.bg;
    el.style.color = sm.color;
    el.classList.remove('hidden');
  });

  // Weather Widget
  const ww = document.getElementById('weather-widget');
  if (ww) {
    const wm = {
      indore:   { icon:'🌤️', temp:'34°C', cond:'Partly Cloudy' },
      udaipur:  { icon:'☀️',  temp:'38°C', cond:'Clear & Sunny' },
      jaipur:   { icon:'🌬️', temp:'36°C', cond:'Warm & Breezy' },
      dehradun: { icon:'⛅',  temp:'22°C', cond:'Mild & Pleasant' },
      goa:      { icon:'🌊',  temp:'29°C', cond:'Humid & Breezy' },
    };
    const w = wm[data.id?.toLowerCase()] || { icon:'🌤️', temp:'30°C', cond:'Pleasant' };
    document.getElementById('weather-icon').textContent = w.icon;
    document.getElementById('weather-temp').textContent = w.temp;
    document.getElementById('weather-cond').textContent = w.cond;
    ww.classList.remove('hidden');
    ww.style.display = 'flex';
  }

  // AI Insights
  if (data.ai_insights) {
    const ai = data.ai_insights;
    // Summary
    const sBox = document.getElementById('ai-summary-box');
    const sTxt = document.getElementById('ai-summary-text');
    if (sBox && sTxt && ai.summary) { sBox.classList.remove('hidden'); sBox.style.display = 'block'; sTxt.textContent = ai.summary; }
    // Safety Alerts
    const aBlock = document.getElementById('safety-alert-block');
    if (aBlock && ai.safety_alerts?.length) {
      aBlock.classList.remove('hidden'); aBlock.style.display = 'flex';
      aBlock.innerHTML = `<p style="font-size:0.68rem;font-weight:900;color:#6366f1;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:8px;">Live Safety Alerts</p>
        ${ai.safety_alerts.map(a => `
        <div style="display:flex;align-items:center;gap:8px;padding:9px 12px;background:rgba(239,68,68,0.06);border-radius:10px;border:1px solid rgba(239,68,68,0.15);">
          <span class="material-symbols-outlined" style="font-size:0.9rem;color:#ef4444;flex-shrink:0;">warning</span>
          <span style="font-size:0.76rem;font-weight:600;color:#374151;">${a}</span>
        </div>`).join('')}`;
    }
    // Risk Badge
    const rWrap = document.getElementById('risk-badge-wrap');
    const rBadge = document.getElementById('risk-badge');
    const rLbl = document.getElementById('risk-label');
    if (rWrap && rBadge && rLbl && ai.risk_level) {
      rWrap.classList.remove('hidden');
      rLbl.textContent = ai.risk_level;
      const rc = { High:{bg:'#fef2f2',c:'#dc2626',b:'#fecaca'}, Moderate:{bg:'#fffbeb',c:'#d97706',b:'#fde68a'}, Safe:{bg:'#f0fdf4',c:'#16a34a',b:'#bbf7d0'} }[ai.risk_level] || {bg:'#f0fdf4',c:'#16a34a',b:'#bbf7d0'};
      Object.assign(rBadge.style, { background: rc.bg, color: rc.c, borderColor: rc.b });
    }
    // Eco Score
    if (ai.eco_score !== undefined) {
      const sc = ai.eco_score, circ = 2 * Math.PI * 32;
      const ecoCard = document.getElementById('eco-card');
      if (ecoCard) { ecoCard.classList.remove('hidden'); ecoCard.style.display = 'block'; }
      const ecoArc = document.getElementById('eco-arc');
      if (ecoArc) setTimeout(() => { ecoArc.style.strokeDashoffset = circ - (sc / 100) * circ; }, 300);
      const eNum = document.getElementById('eco-score-num'); if (eNum) eNum.textContent = sc;
      const eLbl = document.getElementById('eco-label'); if (eLbl) eLbl.textContent = sc >= 80 ? 'Excellent 🌱' : sc >= 60 ? 'Good 🌿' : 'Fair 🍂';
      const eHnt = document.getElementById('eco-hint'); if (eHnt) eHnt.textContent = sc >= 85 ? 'Ride-sharing boosts your score!' : 'Choose walking routes to improve';
      const eBar = document.getElementById('eco-bar'); if (eBar) setTimeout(() => { eBar.style.width = sc + '%'; }, 300);
      const eBLbl = document.getElementById('label-eco'); if (eBLbl) eBLbl.textContent = sc + '%';
      if (travelStyle === 'backpacking') document.getElementById('eco-ride-row')?.classList.remove('hidden');
    }
    // Safety bar
    const ss = data.safety_score ?? 80;
    const sBar = document.getElementById('safety-bar'); if (sBar) setTimeout(() => { sBar.style.width = ss + '%'; }, 300);
    const sLbl = document.getElementById('label-safety'); if (sLbl) sLbl.textContent = ss + '%';
  }
  // Efficiency bar
  const eff = Math.min(100, Math.round((data.places?.length || 0) / Math.max(days, 1) * 30));
  const eBar = document.getElementById('efficiency-bar'); if (eBar) setTimeout(() => { eBar.style.width = eff + '%'; }, 300);
  const eLbl = document.getElementById('label-efficiency'); if (eLbl) eLbl.textContent = eff + '%';

  // Crowd Insights
  const places = data.places || [];
  const cCard = document.getElementById('crowd-card'), cList = document.getElementById('crowd-list');
  if (cCard && cList && places.length) {
    cCard.classList.remove('hidden'); cCard.style.display = 'block';
    const CC = {Low:'#10b981',Medium:'#f59e0b',High:'#ef4444'};
    const CL = {Low:'Low Crowd',Medium:'Moderate',High:'Peak Hours'};
    const CT = {Low:'Best anytime',Medium:'Visit before 11 AM or after 4 PM',High:'Arrive before 9 AM to avoid crowds'};
    cList.innerHTML = places.slice(0, 5).map(p => {
      const cl = p.crowd_level || 'Medium', col = CC[cl] || '#f59e0b';
      return `<div style="display:flex;align-items:flex-start;gap:11px;padding:11px 13px;background:#f8fafc;border-radius:14px;border:1px solid #f1f5f9;">
        <div style="width:9px;height:9px;border-radius:50%;background:${col};flex-shrink:0;margin-top:5px;"></div>
        <div style="flex:1;"><p style="font-size:0.8rem;font-weight:700;color:#0f172a;margin:0 0 1px;">${p.name}</p>
        <p style="font-size:0.7rem;color:#64748b;margin:0;font-weight:600;">${CL[cl]} · ${p.time_slot || 'Any'}</p>
        <p style="font-size:0.67rem;color:${col};margin:2px 0 0;font-weight:700;">${CT[cl]}</p></div>
        <span style="font-size:0.6rem;font-weight:900;background:${col}18;color:${col};padding:2px 8px;border-radius:99px;border:1px solid ${col}28;">${cl}</span></div>`;
    }).join('');
  }

  // Timeline
  const dayBudgets = data.day_budgets || [];
  if (places.length > 0) {
    const emSt = document.getElementById('result-empty-state');
    if (emSt) emSt.remove();          // instantly remove empty state
    itineraryEl.innerHTML = '';
    const perDay = Math.ceil(places.length / days) || 1;
    const CAT_CLR = {Heritage:'#6366f1',Nature:'#10b981',Food:'#f59e0b',Adventure:'#ef4444',Beach:'#06b6d4',Shopping:'#ec4899',Culture:'#8b5cf6',Spiritual:'#f97316'};
    let g = 0;

    for (let d = 0; d < days; d++) {
      const dp = places.slice(d * perDay, (d + 1) * perDay);
      if (dp.length === 0 && d > 0) continue;
      const db = dayBudgets[d] || 0;

      // Day header
      const div = document.createElement('div');
      div.style.cssText = 'display:flex;align-items:center;gap:14px;margin:28px 0 20px;';
      div.innerHTML = `<div style="width:36px;height:36px;border-radius:12px;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:0.9rem;flex-shrink:0;box-shadow:0 6px 18px rgba(0,0,0,0.2);">${d+1}</div>
        <div><h4 style="font-weight:900;font-size:1rem;color:#0f172a;margin:0;">Day ${d+1} — ${data.name||''}</h4>
        ${db > 0 ? `<div style="font-size:0.68rem;font-weight:700;color:#94a3b8;letter-spacing:0.06em;text-transform:uppercase;margin-top:2px;">Target ₹${db.toLocaleString('en-IN')}</div>` : ''}</div>`;
      itineraryEl.appendChild(div);

      dp.forEach((p, idx) => {
        const ac = CAT_CLR[p.category] || '#0053cc';
        const isLast = idx === dp.length - 1 && d === days - 1;
        const costStr = (p.cost || 'Free').replace(/[^\x20-\x7E₹]/g, '').trim();
        const cl = p.crowd_level || 'Medium';
        const crowdC = {Low:'#10b981',Medium:'#f59e0b',High:'#ef4444'};

        // ── Time-of-day color coding ──────────────────────────────
        const startTime = p.start_time || '';
        const endTime   = p.end_time   || '';
        let dotColor = ac;  // default to category color
        if (startTime) {
          const hourMatch = startTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
          if (hourMatch) {
            let h = parseInt(hourMatch[1]);
            const sfx = hourMatch[3].toUpperCase();
            if (sfx === 'PM' && h !== 12) h += 12;
            if (sfx === 'AM' && h === 12) h = 0;
            if (h < 12)       dotColor = '#facc15';  // Morning  — yellow
            else if (h < 17)  dotColor = '#fb923c';  // Afternoon — orange
            else               dotColor = '#a855f7';  // Evening/Night — purple
          }
        }

        const timeRow = (startTime && endTime) ? `
          <span style="display:flex;align-items:center;gap:3px;font-size:0.72rem;font-weight:800;color:#4f46e5;">
            <span class="material-symbols-outlined" style="font-size:0.9rem;">schedule</span>
            ${startTime} – ${endTime}
          </span>` : '';

        const ent = document.createElement('div');
        ent.id = 'timeline-entry-' + g;
        ent.setAttribute('data-place-name', p.name);
        ent.style.cssText = 'position:relative;padding-left:50px;padding-bottom:26px;animation:fadeUp 0.35s ease both;';
        ent.style.animationDelay = (g * 0.07) + 's';
        ent.innerHTML = `
          <div style="position:absolute;left:16px;top:34px;bottom:0;width:2px;background:#f1f5f9;z-index:0;${isLast?'display:none':''}"></div>
          <div style="position:absolute;left:8px;top:5px;width:18px;height:18px;border-radius:50%;background:#fff;border:3.5px solid ${dotColor};z-index:10;box-shadow:0 0 0 5px #fff;transition:border-color 0.4s;"></div>
          <div style="display:flex;gap:14px;background:#fff;border-radius:22px;padding:13px 15px;border:1.5px solid #f1f5f9;transition:border-color 0.2s,box-shadow 0.2s;cursor:default;"
               onmouseover="this.style.borderColor='${ac}40';this.style.boxShadow='0 8px 24px rgba(0,0,0,0.07)'"
               onmouseout="this.style.borderColor='#f1f5f9';this.style.boxShadow='none'">
            ${p.image_url ? `<div style="width:88px;height:88px;border-radius:15px;overflow:hidden;flex-shrink:0;"><img src="${p.image_url}" alt="${p.name}" style="width:100%;height:100%;object-fit:cover;"/></div>` : ''}
            <div style="flex:1;min-width:0;">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;margin-bottom:6px;">
                <h4 style="font-weight:800;font-size:0.93rem;color:#0f172a;margin:0;flex:1;">${p.name}</h4>
                <span style="font-size:0.6rem;font-weight:900;background:${ac}15;color:${ac};padding:3px 9px;border-radius:99px;border:1px solid ${ac}30;flex-shrink:0;white-space:nowrap;">${p.category||'Visit'}</span>
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:8px;align-items:center;">
                ${timeRow}
                <span style="display:flex;align-items:center;gap:3px;font-size:0.7rem;font-weight:600;color:#64748b;"><span class="material-symbols-outlined" style="font-size:0.85rem;color:#94a3b8;">payments</span>${costStr}</span>
                <span style="display:flex;align-items:center;gap:3px;font-size:0.7rem;font-weight:600;color:#64748b;"><span class="material-symbols-outlined" style="font-size:0.85rem;color:#94a3b8;">timer</span>${p.duration||'1–2 hrs'}</span>
                <span style="display:flex;align-items:center;gap:3px;font-size:0.7rem;font-weight:700;color:${crowdC[cl]||'#f59e0b'};"><span class="material-symbols-outlined" style="font-size:0.85rem;">groups</span>${cl} crowd</span>
              </div>
            </div>
          </div>`;
        itineraryEl.appendChild(ent);
        g++;
      });

      if (dp.length === 0) {
        const fr = document.createElement('div');
        fr.style.cssText = 'position:relative;padding-left:50px;padding-bottom:26px;';
        fr.innerHTML = `<div style="position:absolute;left:8px;top:5px;width:18px;height:18px;border-radius:50%;background:#fff;border:3px solid #cbd5e1;z-index:10;box-shadow:0 0 0 5px #fff;"></div>
          <div style="padding:18px;background:#f8fafc;border-radius:22px;border:1.5px dashed #e2e8f0;text-align:center;color:#94a3b8;font-size:0.83rem;font-weight:600;">🌟 Free day — explore at your own pace!</div>`;
        itineraryEl.appendChild(fr);
      }
    }
  }

  // Local Tips
  const tipsEl = document.getElementById('local-tips');
  if (tipsEl && data.local_tips?.length) {
    const icons = ['💡','🌟','🛡️','🚌','🍛','📸'];
    tipsEl.innerHTML = data.local_tips.map((t, i) => `
      <div style="display:flex;gap:11px;background:#f8fafc;padding:13px 15px;border-radius:16px;border:1px solid #f1f5f9;transition:all 0.2s;"
           onmouseover="this.style.background='#fff';this.style.borderColor='#6366f1'"
           onmouseout="this.style.background='#f8fafc';this.style.borderColor='#f1f5f9'">
        <span style="font-size:1rem;flex-shrink:0;line-height:1.7;">${icons[i%icons.length]}</span>
        <div><p style="font-size:0.77rem;font-weight:700;color:#0f172a;margin:0 0 2px;">Pro Tip #${i+1}</p>
        <p style="font-size:0.72rem;color:#64748b;margin:0;line-height:1.5;">${t}</p></div>
      </div>`).join('');
  }

  // Ride Sharing
  const rPanel = document.getElementById('ride-share-panel');
  if (rPanel && (travelStyle === 'backpacking' || travelStyle === 'chill')) {
    fetch('/api/share_ride_matches').then(r => r.json()).then(matches => {
      if (!matches?.length) return;
      const rList = document.getElementById('ride-matches-list');
      if (!rList) return;
      rList.innerHTML = matches.map(m => `
        <div style="background:#f8fafc;border-radius:20px;padding:18px;border:1.5px solid #f1f5f9;display:flex;flex-direction:column;gap:10px;transition:all 0.2s;"
             onmouseover="this.style.borderColor='#10b981';this.style.background='#fff'"
             onmouseout="this.style.borderColor='#f1f5f9';this.style.background='#f8fafc'">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#a78bfa,#38bdf8);display:flex;align-items:center;justify-content:center;font-size:1rem;font-weight:900;color:#fff;">${m.name[0]}</div>
              <div><p style="font-weight:800;font-size:0.85rem;color:#0f172a;margin:0;">${m.name}</p>
              <p style="font-size:0.68rem;color:#64748b;margin:0;">${m.verified ? '✅ Verified' : 'Unverified'}</p></div>
            </div>
            <span style="font-size:0.88rem;font-weight:900;color:#059669;background:#d1fae5;padding:4px 12px;border-radius:99px;">${m.match_pct}% Match</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            <div style="background:#eff6ff;border-radius:12px;padding:10px;text-align:center;">
              <p style="font-size:0.62rem;font-weight:700;color:#3b82f6;text-transform:uppercase;margin:0 0 2px;">Split Cost</p>
              <p style="font-size:0.95rem;font-weight:900;color:#1d4ed8;margin:0;">₹${m.split_cost}</p>
            </div>
            <div style="background:#f0fdf4;border-radius:12px;padding:10px;text-align:center;">
              <p style="font-size:0.62rem;font-weight:700;color:#10b981;text-transform:uppercase;margin:0 0 2px;">CO₂ Saved</p>
              <p style="font-size:0.95rem;font-weight:900;color:#065f46;margin:0;">${m.co2_saved}</p>
            </div>
          </div>
          <button style="width:100%;background:#0f172a;color:#fff;border:none;border-radius:14px;padding:10px;font-weight:900;font-size:0.78rem;cursor:pointer;letter-spacing:0.04em;transition:background 0.2s;"
                  onmouseover="this.style.background='#1e3a8a'" onmouseout="this.style.background='#0f172a'"
                  onclick="showToast('Ride request sent to ${m.name.split(' ')[0]}! 🚗', 'success')">Request Ride</button>
        </div>`).join('');
      rPanel.classList.remove('hidden');
      rPanel.style.display = 'block';
    }).catch(() => {});
  }

  renderCityInsightNote(data, opts);
  renderBestVisitTimes(data);
  renderBudgetAnalysis(data.budget_analysis, opts);
  hideLoader();
}

/* ── AI Live Re-sync (Time-Shift) ──────────────────────────────── */
async function reEvaluateSchedule() {
  const input = document.getElementById('resync-input')?.value?.trim();
  if (!input) { showToast('Describe what happened (e.g. "Spent 1 hour extra at Rajwada")', 'warning'); return; }

  const stored = sessionStorage.getItem('tih_result');
  if (!stored) return;
  const parsed = JSON.parse(stored);
  const places = parsed.data?.places || [];
  if (!places.length) { showToast('No itinerary loaded.', 'error'); return; }

  const btn = document.getElementById('resync-btn');
  if (btn) { btn.textContent = 'Syncing…'; btn.disabled = true; }

  try {
    const res = await fetch('/api/re_evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ places, user_input: input, trip_days: parsed.opts?.days || 3 })
    });
    const result = await res.json();

    if (result.places?.length) {
      // Patch places in session
      parsed.data.places = result.places;
      sessionStorage.setItem('tih_result', JSON.stringify(parsed));

      // Live-update each card's time display without full reload
      result.places.forEach(p => {
        const entries = document.querySelectorAll('[data-place-name]');
        entries.forEach(el => {
          if (el.getAttribute('data-place-name') === p.name) {
            const timeSpan = el.querySelector('.tl-time-range');
            if (timeSpan && p.start_time && p.end_time) {
              timeSpan.textContent = `${p.start_time} – ${p.end_time}`;
              timeSpan.style.animation = 'flashYellow 0.6s ease';
            }
          }
        });
      });

      // Show warnings
      const warnBox = document.getElementById('resync-warnings');
      if (warnBox) {
        if (result.warnings?.length) {
          warnBox.classList.remove('hidden');
          warnBox.innerHTML = result.warnings.map(w =>
            `<div style="display:flex;gap:8px;align-items:center;padding:10px 14px;background:#fff7ed;border-radius:12px;border:1px solid #fed7aa;">
              <span class="material-symbols-outlined" style="color:#ea580c;font-size:1rem;">warning</span>
              <span style="font-size:0.75rem;font-weight:700;color:#9a3412;">${w.message}</span>
            </div>`
          ).join('');
        } else {
          warnBox.classList.add('hidden');
        }
      }

      const msg = result.delay_applied_mins
        ? `⏱️ ${result.message} Refreshing cards…`
        : result.message || 'Schedule re-evaluated.';
      showToast(msg, result.warnings?.length ? 'warning' : 'success');

      // Soft re-render after brief delay to show updated times
      setTimeout(() => initResultPage(), 800);
    }
  } catch (err) {
    console.error('Re-evaluate error:', err);
    showToast('Could not re-sync. Please try again.', 'error');
  } finally {
    if (btn) { btn.textContent = 'Sync'; btn.disabled = false; }
    const inp = document.getElementById('resync-input');
    if (inp) inp.value = '';
  }
}

/* ── City Insight Note ──────────────────────────────────────── */
/**
 * Injects a banner inside the canvas area (above the day cards) telling
 * the user how many days are needed to cover all famous sites, and the
 * best season to visit the city.
 */
function renderCityInsightNote(data, opts) {
  // Remove any previous note
  document.getElementById('city-insight-note')?.remove();

  const recommended = data.recommended_days;
  const cityName    = data.name || 'this city';
  const bestTime    = data.best_time || 'October to March';
  const userDays    = parseInt(opts?.days || 0, 10);

  if (!recommended) return;

  const isEnough = userDays >= recommended;
  const noteEl   = document.createElement('div');
  noteEl.id      = 'city-insight-note';

  // Styling inline so it works in both CSS contexts (Tailwind + vanilla)
  noteEl.style.cssText = `
    display: flex; align-items: flex-start; gap: 14px;
    padding: 16px 20px; border-radius: 14px; margin-bottom: 20px;
    background: ${isEnough ? 'rgba(23,106,33,0.06)' : 'rgba(149,68,0,0.06)'};
    border: 1.5px solid ${isEnough ? 'rgba(23,106,33,0.18)' : 'rgba(149,68,0,0.18)'};
  `;

  const icon   = isEnough ? '✅' : '💡';
  const suffix = isEnough
    ? `Your trip covers all the highlights!`
    : `You've planned <strong>${userDays} day${userDays !== 1 ? 's' : ''}</strong> — consider adding more to explore fully.`;

  noteEl.innerHTML = `
    <div style="font-size:1.5rem; flex-shrink:0; line-height:1">${icon}</div>
    <div>
      <div style="font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:0.92rem; margin-bottom:4px; color:#2c2f32">
        ${cityName} has <strong>${recommended} must-visit day${recommended !== 1 ? 's' : ''}</strong> worth of famous sites.
      </div>
      <div style="font-size:0.82rem; color:#595c5e; line-height:1.5">
        ${suffix}
        &nbsp;·&nbsp; 🗓 <strong>Best time to visit:</strong> ${bestTime}
      </div>
    </div>
  `;

  // Insert at the top of the itinerary-days container (before first day card)
  const itinEl = document.getElementById('itinerary-days');
  if (itinEl) itinEl.insertAdjacentElement('beforebegin', noteEl);
}

/* ── Best Visit Times Sidebar Card ─────────────────────────── */
/**
 * Injects a "Best Time to Visit Places" card into the sidebar,
 * above the Smart Insights card.  Shows each time-slot and the
 * names of places that belong to it.
 */
function renderBestVisitTimes(data) {
  document.getElementById('best-visit-times-card')?.remove();

  const times    = data.best_visit_times;
  const bestTime = data.best_time;
  if (!times?.length && !bestTime) return;

  const card = document.createElement('div');
  card.id    = 'best-visit-times-card';

  // Card styling matching the rest of the sidebar
  card.style.cssText = `
    background:#fff; border-radius:1.5rem; padding:20px;
    box-shadow:0 8px 24px -8px rgba(44,47,50,0.10);
    border:1px solid rgba(171,173,176,0.12); margin-bottom:0;
  `;

  // Slot rows
  const slotRows = (times || []).map(({ slot, icon, places }) => `
    <div style="margin-bottom:10px;">
      <div style="display:flex; align-items:center; gap:6px; font-weight:700; font-size:0.8rem; color:#2c2f32; margin-bottom:3px;">
        <span>${icon}</span> ${slot}
      </div>
      <div style="font-size:0.75rem; color:#595c5e; line-height:1.6; padding-left:20px;">
        ${places.join(' &middot; ')}
      </div>
    </div>
  `).join('');

  card.innerHTML = `
    <h4 style="font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:0.87rem; color:#2c2f32; margin-bottom:12px;">
      🕐 Best Time to Visit Places
    </h4>
    ${slotRows}
    ${bestTime ? `
      <div style="margin-top:12px; padding:10px 14px; background:#f0fdf4; border-radius:10px; border:1px solid rgba(23,106,33,0.15);">
        <span style="font-size:0.75rem; font-weight:700; color:#176a21;">
          📅 Best Season: <span style="font-weight:500">${bestTime}</span>
        </span>
      </div>` : ''}
  `;

  // Insert at the dedicated sidebar anchor (before Smart Insights card)
  const anchor = document.getElementById('best-visit-anchor');
  if (anchor) {
    anchor.replaceWith(card);
  } else {
    // Last-resort: prepend to sidebar
    const sidebar = document.getElementById('result-sidebar');
    if (sidebar) sidebar.insertBefore(card, sidebar.firstChild);
  }
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

/* ── DOM Ready ────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  highlightNav();
  initNavbarScroll();
  initResultPage();

  const planForm = document.getElementById('plan-form');
  if (planForm) planForm.addEventListener('submit', planTrip);

  // City change: triggers budget hint + destination chip loading
  const citySelect  = document.getElementById('city-select');
  const daysSelect  = document.getElementById('days-select');
  const budgetInput = document.getElementById('user-budget-input');
  if (citySelect) {
    citySelect.addEventListener('change', () => {
      updateBudgetHint();
      loadCityDestinations(citySelect.value);
    });
  }
  if (daysSelect)  daysSelect.addEventListener('change', updateBudgetHint);
  if (budgetInput) budgetInput.addEventListener('input', updateBudgetHint);
});

console.log('[TourInHand v2] app.js loaded ✈️');