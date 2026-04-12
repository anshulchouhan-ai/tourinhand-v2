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
      })
    });
    if (!res.ok) throw new Error('API error ' + res.status);
    const data = await res.json();
    // Store dates in opts so result page can display them
    sessionStorage.setItem('tih_result', JSON.stringify({
      data,
      opts: { days, budget, user_budget: userBudget, from_date: fromDate, to_date: toDate }
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

  if (!citySelect || !daysSelect || !suggestionEl) return;

  const selectedOpt = citySelect.options[citySelect.selectedIndex];
  const cityName    = selectedOpt?.text || '';
  const minPerDay   = parseInt(selectedOpt?.dataset?.minBudget || '0', 10);
  const days        = parseInt(daysSelect.value || '3', 10);
  const minTotal    = minPerDay * days;
  const userBudget  = parseInt(budgetEl?.value || '0', 10) || 0;

  // Hide suggestion if no valid city selected or no budget data
  if (!citySelect.value || minPerDay === 0) {
    suggestionEl.style.display = 'none';
    if (statusEl) { statusEl.style.display = 'none'; }
    return;
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

  // City hero image — update map card thumbnail + hero banner
  const mapImg = document.getElementById('result-map-img');
  if (mapImg && data.hero_image) {
    mapImg.src = data.hero_image;
    mapImg.alt = (data.name || 'City') + ' — hero photo';
  }

  const tagDays = document.getElementById('result-tag-days');
  if (tagDays) {
    if (opts?.from_date && opts?.to_date) {
      const fmt = d => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      tagDays.textContent = `📅 ${fmt(opts.from_date)} – ${fmt(opts.to_date)} · ${days} Days`;
    } else {
      tagDays.textContent = '📅 ' + days + ' Days';
    }
  }

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
  if (budgetEl) {
    // per_day_budget is the new dynamic field from the backend
    // Falls back to total/days, then to static city budget string
    if (data.per_day_budget > 0) {
      budgetEl.textContent = `₹${data.per_day_budget.toLocaleString('en-IN')} / day`;
      // update the parent label to say it's per day
      const label = budgetEl.closest('.result-summary-card')?.querySelector('.result-summary-label');
      if (label) label.textContent = 'Est. Budget';
    } else {
      const fallback = data.budget_analysis?.user_budget || data.budget || '–';
      budgetEl.textContent = typeof fallback === 'number'
        ? `₹${fallback.toLocaleString('en-IN')}`
        : fallback;
    }
  }

  // Budget warning banner (injected below the summary row if budget is tight)
  const existingWarn = document.getElementById('budget-warning-banner');
  if (existingWarn) existingWarn.remove();
  if (data.budget_warning) {
    const warnBanner = document.createElement('div');
    warnBanner.id = 'budget-warning-banner';
    warnBanner.className = 'budget-status budget-status--warn';
    warnBanner.style.cssText = 'margin: 0 0 16px; border-radius: 10px;';
    const short = (data.budget_analysis?.shortfall || 0);
    warnBanner.innerHTML = `⚠️ Your total budget is <strong>₹${short.toLocaleString('en-IN')} below</strong> the comfortable minimum for this trip. Consider adding more or reducing days.`;
    const summaryRow = document.querySelector('.result-summary-row');
    summaryRow?.insertAdjacentElement('afterend', warnBanner);
  }

  // Insight bars
  const effBar = document.getElementById('efficiency-bar');
  if (effBar) effBar.style.width = Math.min(100, (data.safety_score ?? 78)) + '%';

  const ecoBar = document.getElementById('eco-bar');
  if (ecoBar) ecoBar.style.width = Math.min(100, (data.eco_score ?? 60)) + '%';

  const safeBar = document.getElementById('safety-bar');
  if (safeBar) safeBar.style.width = Math.min(100, (data.safety_score ?? 82)) + '%';

  // Build itinerary
  const places = data.places || [];
  const dayBudgets = data.day_budgets || [];
  const itineraryEl = document.getElementById('itinerary-days');
  const emptyState = document.getElementById('result-empty-state');
  const countBadge = document.getElementById('result-place-count');

  if (places.length > 0 && itineraryEl) {
    if (emptyState) emptyState.style.display = 'none';
    if (countBadge) countBadge.textContent = places.length + ' places';

    // Keep only the lane-line div, clear everything else
    const laneLine = itineraryEl.querySelector('.timeline-lane-line');
    itineraryEl.innerHTML = '';
    if (laneLine) itineraryEl.appendChild(laneLine);

    const perDay = Math.ceil(places.length / days) || 1;
    const TIME_EMOJI_TL = { Morning: '🌅', Afternoon: '☀️', Evening: '🌆', Night: '🌙' };
    const CAT_ICON = {
      'Heritage': '🏛️', 'Nature': '🌿', 'Food': '🍲', 'Adventure': '⛰️',
      'Spiritual': '🕌', 'Shopping': '🛍️', 'Beach': '🏖️', 'Art': '🎨',
      'Sightseeing': '📸', 'Museum': '🏛️', 'Nightlife': '🌃'
    };

    let globalIdx = 0;
    for (let d = 0; d < days; d++) {
      const dayPlaces = places.slice(d * perDay, (d + 1) * perDay);
      if (dayPlaces.length === 0 && d > 0) continue;

      const dayBudget = dayBudgets[d] || 0;

      // ── Day divider (filled blue dot + label) ──
      const divider = document.createElement('div');
      divider.className = 'tl-day-divider';
      divider.innerHTML = `
        <div class="tl-day-divider-dot">
          <span style="color:#fff;font-size:0.7rem;font-weight:900">${d + 1}</span>
        </div>
        <div class="tl-day-divider-label">
          Day ${d + 1} — ${data.name}
          ${dayBudget > 0 ? `<span style="font-weight:500;color:#595c5e;margin-left:8px;text-transform:none;font-size:0.72rem">Budget: ₹${dayBudget.toLocaleString('en-IN')}</span>` : ''}
        </div>`;
      itineraryEl.appendChild(divider);

      // ── One timeline entry per place ──
      dayPlaces.forEach((p, idx) => {
        const isFirst = (idx === 0 && d === 0);
        const timeIcon = TIME_EMOJI_TL[p.time_slot] || '🕐';
        const catIcon = CAT_ICON[p.category] || '📍';
        const timeSlotClass = p.time_slot ? `place-time-slot--${p.time_slot.toLowerCase()}` : '';

        const entry = document.createElement('div');
        entry.className = 'timeline-entry';
        entry.style.animationDelay = (globalIdx * 0.06) + 's';

        entry.innerHTML = `
          <div class="timeline-dot ${isFirst ? '' : 'timeline-dot--plain'}">
            ${isFirst ? '<div class="timeline-dot-pulse"></div>' : ''}
          </div>
          <div class="tl-card" style="border-radius:1.5rem; overflow:hidden; border:1px solid #f1f5f9; background:#fff; box-shadow:0 10px 15px -3px rgba(0,0,0,0.04);">
            ${p.image_url ? `
            <div style="position:relative; overflow:hidden; height:180px;">
              <img
                src="${p.image_url}"
                alt="${p.name}"
                style="width:100%; height:100%; object-fit:cover; display:block; transition:transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);"
                onmouseover="this.style.transform='scale(1.08)'"
                onmouseout="this.style.transform='scale(1)'"
              />
              <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 50%);"></div>
              <span style="position:absolute; bottom:12px; left:16px; background:rgba(0, 83, 204, 0.9); color:#fff; font-size:0.65rem; font-weight:800; padding:4px 12px; border-radius:9999px; text-transform:uppercase; letter-spacing:0.08em; backdrop-filter:blur(4px);">${p.category || 'Sightseeing'}</span>
            </div>` : ''}
            <div class="tl-card-content" style="padding:20px 24px;">
              <h4 class="tl-card-title" style="font-family:'Satoshi', sans-serif; font-weight:800; font-size:1.25rem; color:#0f172a; margin-bottom:16px; letter-spacing:-0.01em;">${p.name}</h4>
              <div class="tl-chip-row" style="display:flex; flex-wrap:wrap; gap:10px; align-items:center;">
                ${p.time_slot ? `<span class="tl-chip" style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:14px; background:#f8fafc; font-size:0.75rem; font-weight:700; color:#475569; border:1px solid #f1f5f9;">
                  <span class="material-symbols-outlined" style="font-size:1.1rem; color:#64748b;">schedule</span> ${p.time_slot}</span>` : ''}
                ${p.cost ? `<span class="tl-chip" style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:14px; background:#f0fdf4; font-size:0.75rem; font-weight:700; color:#166534; border:1px solid #dcfce7;">
                  <span class="material-symbols-outlined" style="font-size:1.1rem; color:#166534;">payments</span> ${p.cost.replace(/Ã¢â€šÂ¹/g, '₹')}</span>` : ''}
                ${p.duration ? `<span class="tl-chip" style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:14px; background:#f8fafc; font-size:0.75rem; font-weight:700; color:#475569; border:1px solid #f1f5f9;">
                  <span class="material-symbols-outlined" style="font-size:1.1rem; color:#64748b;">timer</span> ${p.duration}</span>` : ''}
                ${p.crowd_level ? `<span class="tl-chip" style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:14px; background:#f8fafc; font-size:0.75rem; font-weight:700; color:#475569; border:1px solid #f1f5f9;">
                  <span class="material-symbols-outlined" style="font-size:1.1rem; color:#64748b;">groups</span> ${p.crowd_level}</span>` : ''}
                ${p.map_url 
                  ? `<a href="${p.map_url}" target="_blank" class="tl-map-link" style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:14px; background:#eff6ff; font-size:0.75rem; font-weight:700; color:#0053cc; border:1px solid #dbeafe; text-decoration:none; margin-left:auto; transition:all 0.2s;">
                       <span class="material-symbols-outlined" style="font-size:1.1rem;">map</span> Directions
                     </a>`
                  : ''}
              </div>
            </div>
          </div>`;
        itineraryEl.appendChild(entry);
        globalIdx++;
      });

      if (dayPlaces.length === 0) {
        const freeDay = document.createElement('div');
        freeDay.className = 'timeline-entry';
        freeDay.innerHTML = `
          <div class="timeline-dot timeline-dot--plain"></div>
          <div class="tl-card">
            <div class="tl-card-body" style="text-align:center;color:#abadb0;padding:20px;">
              Free day — explore at your own pace! 🌟
            </div>
          </div>`;
        itineraryEl.appendChild(freeDay);
      }
    }
  }

  // Local tips
  const tipsEl = document.getElementById('local-tips');
  if (tipsEl && data.local_tips?.length) {
    tipsEl.innerHTML = data.local_tips.map(t =>
      `<div class="tip-item"><span class="tip-icon">💡</span><span>${t}</span></div>`
    ).join('');
  }

  // Recommended days note + best visit times (new)
  renderCityInsightNote(data, opts);
  renderBestVisitTimes(data);

  // Budget analysis card in sidebar
  renderBudgetAnalysis(data.budget_analysis, opts);

  hideLoader();
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