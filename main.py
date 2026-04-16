# main.py — TourInHand v2
import os
import logging
import warnings
from typing import List
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

import data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Optional AI — suppress FutureWarning from legacy package
with warnings.catch_warnings():
    warnings.simplefilter('ignore', FutureWarning)
    try:
        import google.generativeai as genai
        GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
        if GOOGLE_API_KEY:
            genai.configure(api_key=GOOGLE_API_KEY)
            model = genai.GenerativeModel("gemini-1.5-flash")
            logger.info("Gemini AI ready.")
        else:
            model = None
    except Exception:
        model = None

_AI_CACHE = {}

def get_ai_response(prompt: str) -> str:
    if not model:
        return ""
    if prompt in _AI_CACHE:
        return _AI_CACHE[prompt]
    try:
        response = model.generate_content(prompt)
        text = response.text.strip()
        _AI_CACHE[prompt] = text
        return text
    except Exception as e:
        logger.error(f"Gemini error: {e}")
        return ""

# Optional Supabase
try:
    from supabase import create_client, Client
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
except Exception:
    supabase = None

app = FastAPI(
    title="TourInHand",
    description="AI-powered safe, smart, and sustainable travel planner for students.",
    version="2.0.1"
)

# ── CORS Setup ───────────────────────────────────────────────────────────────
# Allow requests from frontend development ports and local hosting
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:8000",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:8000",
    "*", # Robust fallback for hackathon environments
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files & Templates ────────────────────────────────────────────────
# Ensure static folder is mounted correctly for CSS/JS assets
static_path = os.path.join(os.path.dirname(__file__), "static")
if not os.path.exists(static_path):
    os.makedirs(static_path, exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

tiles_path = os.path.join(static_path, "tiles")
if not os.path.exists(tiles_path):
    os.makedirs(tiles_path, exist_ok=True)
app.mount("/tiles", StaticFiles(directory=tiles_path), name="tiles")

templates = Jinja2Templates(directory="templates")


# ── Global Exception Handling ───────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error: {exc}", exc_info=True)
    return HTMLResponse(
        content=f"<html><body><h1>Something went wrong</h1><p>{str(exc)}</p></body></html>",
        status_code=500
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return HTMLResponse(
        content=f"<html><body><h1>{exc.status_code}</h1><p>{exc.detail}</p></body></html>",
        status_code=exc.status_code
    )


# ── Pydantic Models ──────────────────────────────────────────────────────────

class ItineraryRequest(BaseModel):
    city_id: str
    interests: List[str] = []
    budget: str = "Standard"
    days: str = "3"
    user_budget: int = 0           # user's total budget in ₹; 0 = not provided
    selected_places: List[str] = [] # names of user-picked destinations; empty = use interests/all
    travel_style: str = "chill"    # backpacking | chill | adventure | foodie

class SaveTripRequest(BaseModel):
    user_id: str
    city_id: str
    itinerary_data: dict

class ComparePriceRequest(BaseModel):
    city: str
    food_name: str
    entered_price: float


# ── UI Routes ─────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="landing.html",
        context={"title": "AI Travel Planner for Students"}
    )

@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    cities = data.get_dummy_cities()
    widgets = data.get_dashboard_widgets()
    saved_trips = data.get_mock_saved_trips()
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={
            "title": "Dashboard", 
            "cities": cities, 
            "widgets": widgets,
            "saved_trips_count": len(saved_trips)
        }
    )

@app.get("/result-view", response_class=HTMLResponse)
async def result_view(request: Request):
    emergency = data.EMERGENCY_CONTACTS
    return templates.TemplateResponse(
        request=request,
        name="result.html",
        context={"title": "Your Itinerary", "emergency": emergency}
    )

@app.get("/saved-trips", response_class=HTMLResponse)
async def saved_trips(request: Request):
    trips = data.get_mock_saved_trips()
    return templates.TemplateResponse(
        request=request,
        name="saved_trips.html",
        context={"title": "Saved Trips", "trips": trips}
    )   

@app.get("/compare", response_class=HTMLResponse)
async def compare_page(request: Request):
    return templates.TemplateResponse(
        request=request,
        name="compare.html",
        context={"title": "Compare"}
    )

@app.get("/location-map", response_class=HTMLResponse)
async def location_map_page(request: Request, place: str = "", city: str = ""):
    # If the user tries to load directly without param, gracefully fallback in UI
    # We will pass the query parameters straight to the template so it can query the dataset or use JS.
    # Alternatively we can extract it in python and pass it as context. 
    # Let's extract place data from data.CITIES securely in python for absolute resilience.
    
    city_key = city.strip().lower()
    place_key = place.strip().lower().replace('-', ' ') # handles slug or spacing
    
    found_city = None
    found_place = None
    
    for c_id, c_data in data.CITIES.items():
        if c_id == city_key or c_data['name'].lower() == city_key:
            found_city = c_data
            for p in c_data.get('places', []):
                # check slugified or direct match
                p_name_lower = p['name'].lower()
                p_slug = p_name_lower.replace(' ', '-')
                if p_name_lower == place_key or p_name_lower == place.strip().lower() or p_slug == place.strip().lower():
                    found_place = p
                    break
            break

    # If parsing failed, fallback safely
    return templates.TemplateResponse(
        request=request,
        name="location_map.html",
        context={
            "title": f"Location: {found_place['name'] if found_place else place}",
            "city": found_city,
            "place": found_place,
            "raw_place_query": place
        }
    )

# ── Smart Planning Helpers ───────────────────────────────────────────────────

import re
import math

def parse_cost_to_int(cost_str: str) -> int:
    """
    Parses admission/entry cost strings into an integer (₹).
    Examples: '₹50' → 50, '₹300 (boat)' → 300, 'Free' → 0, '' → 0
    """
    if not cost_str or 'free' in cost_str.lower():
        return 0
    match = re.search(r'\d+', cost_str.replace(',', ''))
    return int(match.group()) if match else 0


def calculate_total_trip_cost(
    places: list,
    trip_days: int,
    user_budget: int,
    min_budget_per_day: int,
    budget_style: str = "Standard",
) -> int:
    """
    Determines the actual total trip budget to plan with.

    Priority order:
      1. Use user_budget if provided (non-zero)
      2. Estimate using total_fixed_costs + a discretionary multiplier based on
         travel style and trip length
      3. Fall back to city's min_budget_per_day × days

    budget_style multipliers:
      Budget   → 1.2× fixed costs (tight margin)
      Standard → 1.5× fixed costs (comfortable buffer)
      Premium  → 2.0× fixed costs (generous buffer)
    """
    STYLE_MULTIPLIER = {"Budget": 1.2, "Standard": 1.5, "Premium": 2.0}
    multiplier = STYLE_MULTIPLIER.get(budget_style, 1.5)

    total_fixed = sum(parse_cost_to_int(p.get("cost", "Free")) for p in places)

    if user_budget > 0:
        # User explicitly entered a budget — respect it (use as floor if it's too low)
        return max(user_budget, total_fixed)

    if total_fixed > 0:
        # Estimate: scale up fixed costs + add a daily comfort margin
        daily_comfort = min_budget_per_day * trip_days
        estimated = max(int(total_fixed * multiplier), daily_comfort)
        return estimated

    # Pure fallback: city minimum × days
    return max(min_budget_per_day * trip_days, trip_days * 500)


def calculate_per_day_budget(total_budget: int, trip_days: int) -> int:
    """
    Returns the per-day budget, evenly split from total.
    Guaranteed no zero-division.
    """
    if trip_days <= 0:
        return total_budget
    return total_budget // trip_days


def distribute_budget(places: list, trip_days: int, total_budget: int) -> list:
    """
    Distributes the total budget across days proportionally based on
    the number of places scheduled each day.

    Returns a list of integers (one per day), guaranteed to sum exactly
    to total_budget.

    Logic:
      - Fixed place admission costs are allocated directly.
      - Remaining discretionary budget (food, transport, misc.) is
        split proportionally: days with more places get a larger share.
    """
    if trip_days <= 0 or not places:
        return [0] * max(trip_days, 1)

    # Compute per-day fixed costs
    per_day_count = math.ceil(len(places) / trip_days)
    total_fixed = sum(parse_cost_to_int(p.get("cost", "Free")) for p in places)
    discretionary_pool = max(0, total_budget - total_fixed)

    day_budgets = []
    total_distributed = 0

    for d in range(trip_days):
        start = d * per_day_count
        end = (d + 1) * per_day_count
        day_places = places[start:end]

        if not day_places:
            # Free / rest day — give it a small equal share of discretionary
            equal_share = discretionary_pool // trip_days
            day_budgets.append(equal_share)
            total_distributed += equal_share
            continue

        # Fixed costs for this day's places
        fixed_today = sum(parse_cost_to_int(p.get("cost", "Free")) for p in day_places)

        # Proportional discretionary share (weighted by activity count)
        proportion = len(day_places) / len(places)
        disc_share = int(proportion * discretionary_pool)

        day_total = fixed_today + disc_share
        day_budgets.append(day_total)
        total_distributed += day_total

    # Assign any leftover (rounding) to the last day so total is exact
    remainder = total_budget - total_distributed
    if day_budgets:
        day_budgets[-1] += remainder

    return day_budgets


def smart_sort_places(places: list, days: int) -> list:
    """
    Intelligently order places for a day-wise itinerary:
      1. Morning-slot places lead (visit while fresh & crowd-free)
      2. Afternoon-slot places in the middle
      3. Evening / Night places last (optimal crowd avoidance)
      4. Within the same time-slot, higher-popularity places come first
      5. Caps total at 3 places/day so each day stays comfortable
    """
    TIME_ORDER = {"Morning": 0, "Afternoon": 1, "Any": 1, "Evening": 2, "Night": 3}

    sorted_places = sorted(
        places,
        key=lambda p: (
            TIME_ORDER.get(p.get("time_slot", "Any"), 1),
            -(p.get("popularity", 3))
        )
    )

    # Cap at 5 places/day globally to stay comfortable but allow more flexibility
    # especially when users manually pick places
    max_places = max(days * 5, len(places) if places else 0)
    return sorted_places[:max_places]


def smart_schedule_places(places: list, trip_days: int) -> list:
    """
    Stamps start_time and end_time on every place in-place.
    Rules:
      - Day 1 starts at 09:00 AM; each subsequent day also resets to 09:00 AM.
      - Duration parsed from place['duration'] (e.g. '1.5 hrs', '90 min').
      - 35-minute travel buffer injected between consecutive activities.
      - Times formatted as 12-hour IST (09:00 AM – 11:30 AM).
    """
    import re as _re

    def parse_duration_mins(dur_str: str) -> int:
        if not dur_str:
            return 90
        s = dur_str.lower()
        m = _re.search(r'([\d.]+)\s*hr', s)
        if m:
            return int(float(m.group(1)) * 60)
        m = _re.search(r'([\d]+)\s*min', s)
        if m:
            return int(m.group(1))
        return 90

    def mins_to_12hr(total_mins: int) -> str:
        h  = (total_mins // 60) % 24
        mn = total_mins % 60
        sfx = 'AM' if h < 12 else 'PM'
        h12 = h % 12 or 12
        return f"{h12:02d}:{mn:02d} {sfx}"

    TRAVEL_BUFFER = 35
    DAY_START     = 9 * 60          # 09:00 AM
    per_day = math.ceil(len(places) / trip_days) if trip_days > 0 else len(places)
    cursor  = DAY_START

    for i, p in enumerate(places):
        local_idx = i % per_day if per_day else i
        if local_idx == 0:          # new day — reset clock
            cursor = DAY_START

        dur_mins    = parse_duration_mins(p.get('duration', '1.5 hrs'))
        p['start_time'] = mins_to_12hr(cursor)
        p['end_time']   = mins_to_12hr(cursor + dur_mins)
        p['day_index']  = i // per_day if per_day else 0
        cursor = cursor + dur_mins + TRAVEL_BUFFER

    return places


# ── API Routes ────────────────────────────────────────────────────────────────


@app.get("/api/cities")
def get_cities():
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "tagline": c["tagline"],
            "hero_image": c.get("hero_image", ""),
            "min_budget_per_day": c.get("min_budget_per_day", 0),
        }
        for c in data.CITIES.values()
    ]

@app.get("/api/city/{city_id}")
def get_city(city_id: str):
    city = data.CITIES.get(city_id.lower())
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city

@app.get("/api/city/{city_id}/places")
def get_city_places(city_id: str, in_plan: str = ""):
    """
    Returns all places for a city, with an `in_plan` flag on each.
    `in_plan` query param is a comma-separated list of place names currently in the itinerary.
    """
    city = data.CITIES.get(city_id.lower())
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    in_plan_set = set(n.strip() for n in in_plan.split(",") if n.strip())
    places = []
    for p in city.get("places", []):
        entry = dict(p)
        entry["in_plan"] = p["name"] in in_plan_set
        places.append(entry)
    return {
        "city_id": city["id"],
        "city_name": city["name"],
        "total": len(places),
        "places": places,
    }

@app.get("/api/global")
def get_global_data():
    return {"emergency_contacts": data.EMERGENCY_CONTACTS, "live_updates": data.LIVE_UPDATES}

@app.post("/api/generate_itinerary")
def generate_itinerary(req: ItineraryRequest):
    try:
        city = data.CITIES.get(req.city_id.lower())
        if not city:
            raise HTTPException(status_code=404, detail="City not found")

        result = dict(city)

        # ── Place Selection Logic ──────────────────────────────────────
        all_places = city.get("places", [])

        if req.selected_places:
            # Priority 1: User explicitly picked destinations — honour their choice
            name_set = set(req.selected_places)
            places = [p for p in all_places if p["name"] in name_set]
            logger.info(f"Using {len(places)} user-selected places for {city['name']}")
        elif req.interests:
            # Priority 2: Filter by interest categories
            places = [p for p in all_places if p["category"] in req.interests]
            if not places:
                places = all_places[:3]  # fallback
            logger.info(f"Using {len(places)} interest-filtered places for {city['name']}")
        else:
            # Priority 3: Use all places
            places = list(all_places)
            logger.info(f"Using all {len(places)} places for {city['name']}")

        # Apply smart day-wise ordering
        trip_days = int(req.days) if req.days.isdigit() else 3
        places = smart_sort_places(places, trip_days)

        # Stamp start/end times on every place
        places = smart_schedule_places(places, trip_days)

        # Mark each place with its numeric cost
        for p in places:
            p["numeric_cost"] = parse_cost_to_int(p.get("cost", "Free"))

        # ── Dynamic Budget Calculation ─────────────────────────────────
        min_bpd = city.get("min_budget_per_day", 1500)
        total_estimated_budget = calculate_total_trip_cost(
            places=places,
            trip_days=trip_days,
            user_budget=req.user_budget,
            min_budget_per_day=min_bpd,
            budget_style=req.budget,
        )
        per_day_budget = calculate_per_day_budget(total_estimated_budget, trip_days)
        day_budgets = distribute_budget(places, trip_days, total_estimated_budget)

        min_total = min_bpd * trip_days
        budget_warning = (req.user_budget > 0 and req.user_budget < min_total)

        # ── Advanced AI Features ───────────────────────────────────────
        risk_level = "Safe"
        safety_alerts = []
        city_safety = city.get("safety_score", 85)
        
        if city_safety < 70:
            risk_level = "High"
            safety_alerts.append("Exercise extreme caution in isolated areas after dark.")
        elif city_safety < 85:
            risk_level = "Moderate"
            safety_alerts.append("Avoid unfamiliar shortcuts after 8 PM.")
        else:
            risk_level = "Safe"
            safety_alerts.append("Generally safe city. Maintain basic awareness at night.")

        # Simulate dynamic weather/area risks
        if "Indore" in city['name']:
            safety_alerts.append("Heavy traffic zone: Stay on main roads near Sarafa.")
        elif "Shri Balaji" in str(places): # Example trigger
            safety_alerts.append("Dress modestly for temple visits in the area.")
        
        if "Dehradun" in city['name'] or "Shimla" in city['name']:
             safety_alerts.append("Rain risk area: High chance of sudden showers.")

        # Eco Score Logic (0-100)
        eco_base = city.get("eco_score", 70)
        nature_hits = len([p for p in places if p["category"] in ["Nature", "Heritage"]])
        eco_final = min(100, eco_base + (nature_hits * 5))
        
        # ── Smart AI Trip Summary (Gemini Powered) ────────────────────
        prompt = (
            f"Generate a friendly, concise 3-sentence travel summary for a {req.travel_style} trip to {city['name']} for {req.days} days. "
            f"Include weather advice (best for {city.get('best_time', 'the current season')}), clothing tips, and safety level ({risk_level}). "
            f"Mention the Eco-Score of {eco_final}/100. End with a student-friendly note."
        )
        
        final_summary = ""
        final_summary = get_ai_response(prompt)

        
        if not final_summary:
            # High-quality fallback summary
            summary_paragraphs = [
                f"Your {req.travel_style} trip to {city['name']} looks fantastic!",
                f"Recommended Gear: Pack {('light linens' if 'Indore' in city['name'] else 'warm layers')} and sturdy walking shoes.",
                f"Sustainability: Your trip has an Eco-Score of {eco_final}/100.",
                f"Safety & Local Tips: {city['name']} is currently {risk_level.lower()}."
            ]
            if req.travel_style == "foodie":
                summary_paragraphs.append("Pro Tip: Carry hand sanitizer and always drink bottled water at food stalls.")
            elif req.travel_style == "adventure":
                summary_paragraphs.append("Adventure Note: Check weather forecasts 2 hours before any treks.")
            elif req.travel_style == "backpacking":
                summary_paragraphs.append("Budget Tip: Use local buses and shared e-rickshaws to save big.")
            summary_paragraphs.append("Stay safe and enjoy your TourInHand journey!")
            final_summary = " ".join(summary_paragraphs)

        # ── Assemble Result ──────────────────────────────────────────
        result["places"]               = places
        result["day_budgets"]          = day_budgets
        result["total_estimated_budget"] = total_estimated_budget
        result["per_day_budget"]       = per_day_budget
        result["budget_warning"]       = budget_warning
        result["ai_insights"] = {
            "summary": final_summary,
            "risk_level": risk_level,
            "safety_alerts": safety_alerts,
            "eco_score": eco_final,
            "travel_style": req.travel_style
        }
        result["calculated_total"]     = total_estimated_budget

        # ── Budget Analysis ──────────────────────────────────────────
        user_bud = req.user_budget or 0
        result["budget_analysis"] = {
            "min_per_day":  min_bpd,
            "min_total":    min_total,
            "days":         trip_days,
            "user_budget":  user_bud,
            "sufficient":   user_bud >= min_total if user_bud > 0 else None,
            "shortfall":    max(0, min_total - user_bud) if user_bud > 0 else 0,
        }

        # ── Recommended Days & Best Visit Times ──────────────────────
        all_city_places = city.get("places", [])
        recommended_days = math.ceil(len(all_city_places) / 3) if all_city_places else trip_days

        from collections import defaultdict
        slot_map = defaultdict(list)
        for p in all_city_places:
            slot = p.get("time_slot", "Any")
            slot_map[slot].append(p["name"])

        SLOT_ORDER = {"Morning": 0, "Afternoon": 1, "Any": 1, "Evening": 2, "Night": 3}
        SLOT_ICONS = {"Morning": "🌅", "Afternoon": "☀️", "Evening": "🌆", "Night": "🌙", "Any": "🕐"}
        result["best_visit_times"] = sorted([
            {"slot": slot, "icon": SLOT_ICONS.get(slot, "🕐"), "places": names}
            for slot, names in slot_map.items()
        ], key=lambda x: SLOT_ORDER.get(x["slot"], 1))

        result["recommended_days"]  = recommended_days
        result["best_time"]         = city.get("best_time", "October to March")

        # ── AI Tagline ───────────────────────────────────────────────
        tagline_prompt = f"One catchy sentence travel tagline for {req.days}-day {req.budget} trip to {city['name']} focusing on {', '.join(req.interests) or 'exploration'}."
        result["tagline"] = get_ai_response(tagline_prompt) or f"Your {req.days}-Day {req.budget} Plan for {city['name']}"

        return result
    except Exception as e:
        logger.error(f"Itinerary generation error: {e}", exc_info=True)
        # Fallback to a basic response so frontend doesn't crash
        return {
            "status": "error",
            "message": str(e),
            "name": "Fallback Itinerary",
            "places": [],
            "tagline": "Planning error. Please refresh."
        }

@app.post("/api/saved_trips")
def save_trip(req: SaveTripRequest):
    if not supabase:
        return {"status": "success", "message": "Trip saved locally. (Supabase not configured)"}
    try:
        res = supabase.table("saved_trips").insert({
            "user_id": req.user_id,
            "city_id": req.city_id,
            "itinerary_data": req.itinerary_data
        }).execute()
        return {"status": "success", "data": res.data}
    except Exception as e:
        logger.error(f"Supabase error: {e}")
        return {"status": "success", "message": f"Cached locally. Error: {str(e)}"}

import math
from datetime import datetime

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def normalize_dest(d):
    import re
    return re.sub(r'[^a-zA-Z0-9]', '', str(d)).lower()

def check_time_overlap(t1_str, t2_str, threshold_mins=15):
    try:
        t1 = datetime.strptime(t1_str.strip(), "%I:%M %p")
        t2 = datetime.strptime(t2_str.strip(), "%I:%M %p")
        diff_mins = abs((t1 - t2).total_seconds()) / 60.0
        return diff_mins <= threshold_mins
    except:
        return False

@app.get("/api/share_ride_matches")
def share_ride_matches(budget: float = 0, dest: str = "", lat: float = 0.0, lon: float = 0.0, time: str = "10:00 AM"):
    all_riders = data.get_ride_matches()
    matches = []
    
    user_dest_norm = normalize_dest(dest)
    if not user_dest_norm:
        return []

    for r in all_riders:
        r_dest_norm = normalize_dest(r.get("destination", ""))
        if user_dest_norm != r_dest_norm:
            continue
            
        r_lat = r.get("lat", 0.0)
        r_lon = r.get("lon", 0.0)
        dist = calculate_distance(lat, lon, r_lat, r_lon)
        
        # Must be within 2km
        if dist > 2.0:
            continue
            
        r_time = r.get("departure_time", "")
        if not check_time_overlap(time, r_time, 15):
            continue
            
        # Using destination distance simulation for Fare logic:
        # Distance to destination = somewhat random based on current offset
        dest_dist = max(2.5, dist + 4.5) 
        
        solo_fare = round(dest_dist * 18) # 18rs/km
        detour_buffer = 0.15 * solo_fare
        shared_total = solo_fare + detour_buffer
        per_person = round(shared_total / 2)
        saving = solo_fare - per_person
        
        co2_per_km = 120 # g/km
        co2_saved = round((dest_dist * co2_per_km) / 1000, 1)
        
        m_copy = r.copy()
        m_copy["solo_fare"] = solo_fare
        m_copy["split_cost"] = per_person
        m_copy["money_saved"] = saving
        m_copy["distance_km"] = f"{dist:.1f}"
        m_copy["co2_saved"] = f"{co2_saved} kg"
        m_copy["match_pct"] = 98 if dist < 0.5 else 92 
        
        matches.append(m_copy)

    return sorted(matches, key=lambda x: float(x["distance_km"]))

@app.post("/api/update_carbon_score")
async def update_carbon_score(payload: dict):
    """Return an updated eco score when ride sharing is activated."""
    current_score = payload.get("current_score", 70)
    ride_selected = payload.get("ride_selected", False)
    if ride_selected:
        new_score = min(100, current_score + 15)
        co2_offset = "3.2 kg"
    else:
        new_score = max(0, current_score - 15)
        co2_offset = "0 kg"
    return {
        "eco_score": new_score,
        "co2_offset": co2_offset,
        "message": "Great choice! Sharing a ride saved 3.2 kg of CO₂." if ride_selected else "Eco score updated."
    }

@app.post("/api/delete_trip")
def delete_trip(payload: dict):
    return {"status": "success", "message": "Trip deleted."}

FOOD_PRICE_CACHE = {}

def load_food_prices():
    global FOOD_PRICE_CACHE
    if FOOD_PRICE_CACHE:
        return FOOD_PRICE_CACHE
    
    import csv
    data_dir = os.path.join(os.path.dirname(__file__), "data")
    if not os.path.exists(data_dir):
        return {}
        
    cache = {}
    for filename in os.listdir(data_dir):
        if filename.endswith("foodpriceavg.csv"):
            city_name = filename.replace("foodpriceavg.csv", "").lower()
            city_data = {}
            filepath = os.path.join(data_dir, filename)
            try:
                with open(filepath, "r", encoding="utf-8-sig") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        food = row.get("food_name", "").strip()
                        avg_price = row.get("avg_price_rs", "")
                        if not avg_price:
                            avg_price = row.get("avg_price_inr", "")
                        avg_price = str(avg_price).strip()
                        
                        if food and avg_price and avg_price.isdigit():
                            import re as _re
                            normalized = _re.sub(r'\s+', '', food.lower())
                            city_data[normalized] = {"name": food, "price": int(avg_price)}
            except Exception as e:
                logger.error(f"Error reading CSV {filename}: {e}")
            cache[city_name] = city_data
    
    FOOD_PRICE_CACHE = cache
    return cache

@app.get("/api/food_catalogue")
def get_food_catalogue():
    cache = load_food_prices()
    # restructure to be friendlier for frontend: { "Dehradun": ["Gol Gappe", "Momos"], ... }
    result = {}
    for city_key, foods in cache.items():
        city_display = city_key.title()
        result[city_display] = [f["name"] for f in foods.values()]
    return result

@app.post("/api/compare_price")
def compare_price(req: ComparePriceRequest):
    import re as _re
    cache = load_food_prices()
    city_key = req.city.strip().lower()
    
    if city_key not in cache:
        return {"success": False, "message": f"Price data is currently unavailable for {req.city}."}
        
    city_data = cache[city_key]
    normalized_input = _re.sub(r'\s+', '', req.food_name.lower())
    
    # Try exact normalized match
    if normalized_input not in city_data:
        # Forgiving match logic: check substring
        found = False
        for key, val in city_data.items():
            if normalized_input in key or key in normalized_input:
                normalized_input = key
                found = True
                break
        if not found:
            return {"success": False, "message": "This food item was not found for the selected city."}
            
    match = city_data[normalized_input]
    avg_price = match["price"]
    food_name_display = match["name"]
    
    diff = req.entered_price - avg_price
    
    if diff > 0:
        verdict = "Overpriced"
        msg = f"You are getting it for ₹{diff:g} more than the actual average price."
    elif diff < 0:
        verdict = "Good Deal"
        msg = f"You are getting it for ₹{abs(diff):g} less than the city average price."
    else:
        verdict = "Fair Price"
        msg = "You are getting a fair average price."
        
    # Add Percentage note if applicable
    if diff != 0 and avg_price > 0:
        pct = (abs(diff) / avg_price) * 100
        if verdict == "Overpriced":
            msg += f"\nThat is {pct:.0f}% above the city average."
        elif verdict == "Good Deal":
            msg += f"\nThat is {pct:.0f}% below the city average."

    return {
        "success": True,
        "food_name": food_name_display,
        "city": req.city.title(),
        "entered_price": req.entered_price,
        "average_price": avg_price,
        "difference": diff,
        "difference_type": "higher" if diff > 0 else "lower" if diff < 0 else "equal",
        "verdict": verdict,
        "message": msg
    }


# ── Pydantic model for re-evaluate ─────────────────────────────────────────
class ReEvalRequest(BaseModel):
    places: list          # current places with start_time / end_time
    user_input: str       # natural language shift, e.g. 'Spent 1 hour extra at Chappan'
    trip_days: int = 3


@app.post("/api/re_evaluate")
def re_evaluate(req: ReEvalRequest):
    """
    Parses a natural-language delay instruction from the user,
    finds which place caused the delay, and shifts all subsequent
    activity times accordingly.

    Returns: { places, warnings }
      places   — updated list with new start_time / end_time
      warnings — list of closing_soon messages if any place > 22:00
    """
    import re as _re

    # ── 1. Extract delay in minutes ────────────────────────────────────
    txt = req.user_input.lower()
    delay_mins = 0

    m = _re.search(r'(\d+(?:\.\d+)?)\s*hour', txt)
    if m:
        delay_mins = int(float(m.group(1)) * 60)
    else:
        m = _re.search(r'(\d+)\s*min', txt)
        if m:
            delay_mins = int(m.group(1))

    if delay_mins == 0:
        return {"places": req.places, "warnings": [], "message": "No delay detected in input."}

    # ── 2. Find the affected place (first name match) ──────────────────
    pivot_idx = 0  # default: shift everything from start
    for i, p in enumerate(req.places):
        if p.get("name", "").lower() in txt:
            pivot_idx = i
            break

    # ── 3. Helper: parse '09:00 AM' → minutes from midnight ───────────
    def parse_12hr(t: str) -> int:
        m2 = _re.match(r'(\d{1,2}):(\d{2})\s*(AM|PM)', t.strip(), _re.IGNORECASE)
        if not m2:
            return 9 * 60
        h, mn, sfx = int(m2.group(1)), int(m2.group(2)), m2.group(3).upper()
        if sfx == 'PM' and h != 12:
            h += 12
        elif sfx == 'AM' and h == 12:
            h = 0
        return h * 60 + mn

    def mins_to_12hr(total: int) -> str:
        h = (total // 60) % 24
        mn = total % 60
        sfx = 'AM' if h < 12 else 'PM'
        h12 = h % 12 or 12
        return f"{h12:02d}:{mn:02d} {sfx}"

    # ── 4. Shift all places from pivot_idx + 1 ─────────────────────────
    updated = list(req.places)
    # First shift the pivot place's end_time
    pivot = dict(updated[pivot_idx])
    pivot_end = parse_12hr(pivot.get("end_time", "10:00 AM")) + delay_mins
    pivot["end_time"] = mins_to_12hr(pivot_end)
    updated[pivot_idx] = pivot

    # Cascade shift to subsequent places
    TRAVEL_BUFFER = 35
    cursor = pivot_end + TRAVEL_BUFFER
    for i in range(pivot_idx + 1, len(updated)):
        p = dict(updated[i])
        st_mins = parse_12hr(p.get("start_time", "09:00 AM"))
        et_mins = parse_12hr(p.get("end_time",   "10:30 AM"))
        dur_mins = et_mins - st_mins if et_mins > st_mins else 90
        p["start_time"] = mins_to_12hr(cursor)
        p["end_time"]   = mins_to_12hr(cursor + dur_mins)
        cursor = cursor + dur_mins + TRAVEL_BUFFER
        updated[i] = p

    # ── 5. Generate closing_soon warnings (>= 22:00 = 1320 mins) ──────
    LATE_THRESHOLD = 22 * 60  # 10 PM
    warnings = []
    for p in updated[pivot_idx:]:
        if parse_12hr(p.get("start_time", "09:00 AM")) >= LATE_THRESHOLD:
            warnings.append({
                "place": p.get("name", "Unknown"),
                "closing_soon": True,
                "message": f"{p['name']} starts after 10 PM — consider visiting tomorrow."
            })

    return {
        "places": updated,
        "warnings": warnings,
        "delay_applied_mins": delay_mins,
        "message": f"Shifted {len(updated) - pivot_idx - 1} activities by {delay_mins} min."
    }


if __name__ == "__main__":
    import uvicorn
    try:
        logger.info("Starting TourInHand Backend on http://localhost:8000")
        uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
    except Exception as e:
        logger.error(f"Could not start server: {e}")
