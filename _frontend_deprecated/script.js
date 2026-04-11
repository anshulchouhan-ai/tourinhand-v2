/**
 * TourInHand SPA Logic
 */

const API_BASE = 'http://127.0.0.1:8000';

document.addEventListener('DOMContentLoaded', () => {
    let guestId = localStorage.getItem('tourinhand_guest_id');
    if (!guestId) {
        guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('tourinhand_guest_id', guestId);
    }

    let currentCityData = null;

    // DOM References
    const landingView = document.getElementById('landingView');
    const cityView = document.getElementById('cityView');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const citiesGrid = document.getElementById('citiesGrid');

    // Planner Refs
    const btnGuestStart = document.getElementById('btnGuestStart');
    const btnShowCities = document.getElementById('btnShowCities');
    const plannerView = document.getElementById('plannerView');
    const btnCancelPlan = document.getElementById('btnCancelPlan');
    const plannerForm = document.getElementById('plannerForm');
    const planCity = document.getElementById('planCity');

    // Header & Sidebar actions
    const btnBack = document.getElementById('btnBack');
    const navHome = document.getElementById('navHome');
    const btnSaveTrip = document.getElementById('btnSaveTrip');
    const toast = document.getElementById('toast');

    // Init - Load cities
    fetchCities();

    async function fetchCities() {
        console.log(`[API Start] Fetching cities from: ${API_BASE}/api/cities`);
        try {
            const res = await fetch(`${API_BASE}/api/cities`);
            if (!res.ok) {
                console.error(`[API Error] Failed to fetch cities. Status: ${res.status}`);
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const cities = await res.json();
            console.log(`[API Success] Loaded ${cities.length} cities successfully.`, cities);

            if (citiesGrid) {
                citiesGrid.innerHTML = '';
            }

            if (planCity) {
                planCity.innerHTML = '<option value="">Select a city</option>';
            }

            cities.forEach(city => {
                // City cards
                if (citiesGrid) {
                    const card = document.createElement('div');
                    card.className =
                        "group relative rounded-3xl overflow-hidden cursor-pointer shadow-xl hover:shadow-indigo-500/20 transition-all duration-500 hover:-translate-y-2 border border-white/10 bg-slate-800";

                    card.innerHTML = `
                        <div class="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent z-10 transition-opacity group-hover:opacity-80"></div>
                        <img src="${city.hero_image}" alt="${city.name}" class="w-full h-80 object-cover transition-transform duration-700 group-hover:scale-110">
                        <div class="absolute bottom-0 left-0 w-full p-6 z-20">
                            <h3 class="text-3xl font-bold text-white mb-1 group-hover:text-indigo-300 transition-colors">${city.name}</h3>
                            <p class="text-slate-300 text-sm font-medium drop-shadow-md">${city.tagline}</p>
                        </div>
                    `;

                    card.addEventListener('click', () => loadCity(city.id));
                    citiesGrid.appendChild(card);
                }

                // Planner dropdown
                if (planCity) {
                    const opt = document.createElement('option');
                    opt.value = city.id;
                    opt.textContent = city.name;
                    planCity.appendChild(opt);
                }
            });
        } catch (error) {
            console.error('Error loading cities:', error);

            if (citiesGrid) {
                citiesGrid.innerHTML = `
                    <div class="text-red-400 text-lg font-semibold p-6">
                        Failed to load cities. Make sure backend is operating on ${API_BASE}
                    </div>
                `;
            }

            if (planCity) {
                planCity.innerHTML = '<option value="">Failed to load cities</option>';
            }
        }
    }

    async function loadCity(cityId) {
        if (!cityId) return;

        // Trigger Loading Screen
        if (loadingOverlay) {
            loadingOverlay.classList.remove('opacity-0', 'pointer-events-none');
            loadingOverlay.classList.add('opacity-100');
        }

        try {
            console.log(`[API Start] Fetching city details for: ${cityId}`);
            // Simulate Network Delay for SPA experience
            await new Promise(resolve => setTimeout(resolve, 1500));

            const res = await fetch(`${API_BASE}/api/city/${cityId}`);
            if (!res.ok) {
                console.error(`[API Error] Failed to fetch city ${cityId}. Status: ${res.status}`);
                throw new Error(`HTTP error! Status: ${res.status}`);
            }

            const cityData = await res.json();
            console.log(`[API Success] Loaded city details:`, cityData);
            currentCityData = cityData;
            renderCityDashboard(cityData);

            // Transition View
            if (loadingOverlay) {
                loadingOverlay.classList.remove('opacity-100');
                loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
            }

            if (landingView) landingView.classList.add('hidden');
            if (plannerView) plannerView.classList.add('hidden');
            if (cityView) cityView.classList.remove('hidden');

            window.scrollTo(0, 0);
            if (typeof lucide !== 'undefined') lucide.createIcons();
        } catch (error) {
            console.error('Error loading city:', error);

            if (loadingOverlay) {
                loadingOverlay.classList.remove('opacity-100');
                loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
            }

            alert('City data load nahi hua. Backend check kar bhai.');
        }
    }

    function renderCityDashboard(city) {
        const cityHero = document.getElementById('cityHero');
        const cityName = document.getElementById('cityName');
        const cityTagline = document.getElementById('cityTagline');

        if (cityHero) cityHero.style.backgroundImage = `url('${city.hero_image}')`;
        if (cityName) cityName.textContent = city.name;
        if (cityTagline) cityTagline.textContent = city.description || city.tagline || '';

        // Dynamics - Safety Score Color Coding
        const safetyValueObj = document.getElementById('safetyScoreValue');
        const safetyStringObj = document.getElementById('safetyScoreString');

        if (safetyValueObj) {
            safetyValueObj.textContent = city.safety_score ?? 'N/A';
            safetyValueObj.className = "text-4xl font-extrabold transition-colors duration-500";

            if ((city.safety_score ?? 0) > 80) {
                safetyValueObj.classList.add('text-green-400');
                if (safetyStringObj) {
                    safetyStringObj.textContent = "High Assurance • Protected Zone";
                    safetyStringObj.className = "mt-2 text-sm font-medium text-green-500/80";
                }
            } else {
                safetyValueObj.classList.add('text-amber-400');
                if (safetyStringObj) {
                    safetyStringObj.textContent = "Moderate Assurance • Standard Alertness";
                    safetyStringObj.className = "mt-2 text-sm font-medium text-amber-500/80";
                }
            }
        }

        // Eco Score
        const ecoScoreValue = document.getElementById('ecoScoreValue');
        if (ecoScoreValue) ecoScoreValue.textContent = city.eco_score ?? 'N/A';

        // Logistics
        const logisticsBudget = document.getElementById('logisticsBudget');
        const logisticsTime = document.getElementById('logisticsTime');

        if (logisticsBudget) logisticsBudget.textContent = city.budget ?? 'N/A';
        if (logisticsTime) logisticsTime.textContent = city.best_time ?? 'N/A';

        // Hidden Gem Tip
        const hiddenGemText = document.getElementById('hiddenGemText');
        if (hiddenGemText && city.local_tips && city.local_tips.length > 0) {
            hiddenGemText.textContent =
                city.local_tips[Math.floor(Math.random() * city.local_tips.length)];
        }

        // Places Rendering
        const placesGrid = document.getElementById('placesGrid');
        if (!placesGrid) return;

        placesGrid.innerHTML = '';

        (city.places || []).forEach(place => {
            const el = document.createElement('div');
            el.className =
                "bg-white/5 backdrop-blur-md rounded-2xl overflow-hidden border border-white/10 group hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer";

            // Link to maps directly attached to element
            el.addEventListener('click', () => {
                window.open(
                    `https://www.google.com/maps/search/?api=1&query=${place.lat},${place.lon}`,
                    '_blank'
                );
            });

            el.innerHTML = `
                <div class="relative h-48 overflow-hidden">
                    <img src="${place.image_url}" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="${place.name}">
                    <div class="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs px-3 py-1.5 rounded-full font-semibold tracking-wider uppercase border border-white/10">
                        ${place.category}
                    </div>
                </div>
                <div class="p-5">
                    <h4 class="text-xl font-bold text-white mb-2 group-hover:text-indigo-400 transition-colors">${place.name}</h4>
                    <p class="text-slate-400 text-sm mb-4 flex items-center gap-2">
                        <i data-lucide="map-pin" class="w-4 h-4"></i> View on Google Maps
                    </p>
                </div>
            `;

            placesGrid.appendChild(el);
        });
    }

    // Navigation back logic
    const goHome = () => {
        if (cityView) cityView.classList.add('hidden');
        if (plannerView) plannerView.classList.add('hidden');
        if (landingView) landingView.classList.remove('hidden');
    };

    if (btnBack) btnBack.addEventListener('click', goHome);

    if (navHome) {
        navHome.addEventListener('click', (e) => {
            e.preventDefault();
            goHome();
        });
    }

    // MVP Additions
    if (btnGuestStart) {
        btnGuestStart.addEventListener('click', () => {
            if (landingView) landingView.classList.add('hidden');
            if (plannerView) plannerView.classList.remove('hidden');
        });
    }

    if (btnShowCities) {
        btnShowCities.addEventListener('click', () => {
            if (citiesGrid) citiesGrid.classList.toggle('hidden');
        });
    }

    if (btnCancelPlan) {
        btnCancelPlan.addEventListener('click', () => {
            if (plannerView) plannerView.classList.add('hidden');
            if (landingView) landingView.classList.remove('hidden');
        });
    }

    if (plannerForm) {
        plannerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            if (loadingOverlay) {
                loadingOverlay.classList.remove('opacity-0', 'pointer-events-none');
                loadingOverlay.classList.add('opacity-100');
            }

            try {
                const cityId = planCity.value;
                const days = document.getElementById('planDays')?.value || '3';
                const budget = document.getElementById('planBudget')?.value || 'Standard';
                const checkedInterests = Array.from(
                    document.querySelectorAll('input[name="interests"]:checked')
                ).map(cb => cb.value);

                console.log(`[API Start] Requesting AI Generated Itinerary for ${cityId}...`);
                const res = await fetch(`${API_BASE}/api/generate_itinerary`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        city_id: cityId,
                        interests: checkedInterests,
                        budget: budget,
                        days: days
                    })
                });

                if (!res.ok) {
                    console.error(`[API Error] Failed to generate itinerary. Status: ${res.status}`);
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }

                const data = await res.json();
                console.log(`[API Success] Itinerary generated:`, data);
                currentCityData = data;
                renderCityDashboard(data);

                if (loadingOverlay) {
                    loadingOverlay.classList.remove('opacity-100');
                    loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
                }

                if (plannerView) plannerView.classList.add('hidden');
                if (cityView) cityView.classList.remove('hidden');

                window.scrollTo(0, 0);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } catch (error) {
                console.error('Error generating itinerary:', error);

                if (loadingOverlay) {
                    loadingOverlay.classList.remove('opacity-100');
                    loadingOverlay.classList.add('opacity-0', 'pointer-events-none');
                }

                alert('Itinerary generate nahi hua. Backend aur API check kar.');
            }
        });
    }

    // Save Trip
    if (btnSaveTrip) {
        btnSaveTrip.addEventListener('click', async () => {
            if (!currentCityData) return;

            try {
                console.log(`[API Start] Saving trip...`);
                const res = await fetch(`${API_BASE}/api/saved_trips`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: guestId,
                        city_id: currentCityData.id,
                        itinerary_data: currentCityData
                    })
                });

                if (!res.ok) {
                    console.error(`[API Error] Trip save failed. Status: ${res.status}`);
                    throw new Error(`HTTP error! Status: ${res.status}`);
                }

                const result = await res.json();
                console.log(`[API Success] Trip save response:`, result);

                if (toast) {
                    const toastMsg = document.getElementById('toastMsg');
                    if (toastMsg) {
                        toastMsg.textContent = result.message || "Trip saved successfully!";
                    }
                    toast.classList.remove('translate-y-20', 'opacity-0');
                    setTimeout(() => {
                        toast.classList.add('translate-y-20', 'opacity-0');
                    }, 3000);
                }
            } catch (error) {
                console.error('Error saving trip:', error);
                alert('Connection failure! Trip save nahi hui.');
            }
        });
    }

    // Global APIs (Emergency Contacts)
    console.log(`[API Start] Fetching global emergency data...`);
    fetch(`${API_BASE}/api/global`)
        .then(res => {
            if (!res.ok) {
                console.error(`[API Error] Status: ${res.status}`);
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then(data => {
            console.log(`[API Success] Global data loaded:`, data);
            const eg = document.getElementById('emergencyContactsGrid');
            if (!eg) return;

            eg.innerHTML = '';

            (data.emergency_contacts || []).forEach(c => {
                eg.innerHTML += `
                    <div class="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center hover:bg-red-500/20 transition-colors">
                        <p class="text-sm text-slate-300 font-medium mb-1">${c.service}</p>
                        <a href="tel:${c.dial}" class="text-xl font-bold text-red-500 block">${c.dial}</a>
                    </div>
                `;
            });
        })
        .catch(error => {
            console.error('Error loading global data:', error); 
        });
});
