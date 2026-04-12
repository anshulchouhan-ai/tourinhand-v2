# main.py — TourInHand v2
import os
import logging
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

# Optional AI
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

# Optional Supabase
try:
    from supabase import create_client, Client
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None
except Exception:
    supabase = None

app = FastAPI(title="TourInHand", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


# ── Pydantic Models ──────────────────────────────────────────────────────────

class ItineraryRequest(BaseModel):
    city_id: str
    interests: List[str] = []
    budget: str = "Standard"
    days: str = "3"
    user_budget: int = 0           # user's total budget in ₹; 0 = not provided
    selected_places: List[str] = [] # names of user-picked destinations; empty = use interests/all

class SaveTripRequest(BaseModel):
    user_id: str
    city_id: str
    itinerary_data: dict


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
    return templates.TemplateResponse(
        request=request,
        name="dashboard.html",
        context={"title": "Dashboard", "cities": cities, "widgets": widgets}
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

    # Cap at 3 places/day so no single day feels overwhelming
    max_places = days * 3
    return sorted_places[:max_places]


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
    city = data.CITIES.get(req.city_id.lower())
    if not city:
        raise HTTPException(status_code=404, detail="City not found")

    result = dict(city)

    # ── Place Selection Logic ──────────────────────────────────────
    all_places = city.get("places", [])

    if req.selected_places:
        # Priority 1: User explicitly picked destinations — honour their choice
        # Preserve the order the user selected them, then apply smart time-sort
        name_set = set(req.selected_places)
        places = [p for p in all_places if p["name"] in name_set]
        logger.info(f"Using {len(places)} user-selected places for {city['name']}")
    elif req.interests:
        # Priority 2: Filter by interest categories (existing behaviour)
        places = [p for p in all_places if p["category"] in req.interests]
        if not places:
            places = all_places[:3]  # fallback if no match
        logger.info(f"Using {len(places)} interest-filtered places for {city['name']}")
    else:
        # Priority 3: Use all places (fallback)
        places = list(all_places)
        logger.info(f"Using all {len(places)} places for {city['name']}")

    # Apply smart day-wise ordering (time-slot + popularity)
    trip_days = int(req.days) if req.days.isdigit() else 3
    places = smart_sort_places(places, trip_days)

    # Mark each place with its numeric cost for frontend display
    for p in places:
        p["numeric_cost"] = parse_cost_to_int(p.get("cost", "Free"))

    # ── Dynamic Budget Calculation ─────────────────────────────────
    min_bpd = city.get("min_budget_per_day", 1500)

    # Step 1: Determine the total usable trip budget
    total_estimated_budget = calculate_total_trip_cost(
        places=places,
        trip_days=trip_days,
        user_budget=req.user_budget,
        min_budget_per_day=min_bpd,
        budget_style=req.budget,
    )

    # Step 2: Per-day average (simple and clean for the header card)
    per_day_budget = calculate_per_day_budget(total_estimated_budget, trip_days)

    # Step 3: Day-wise breakdown (proportional to places per day)
    day_budgets = distribute_budget(places, trip_days, total_estimated_budget)

    # Budget warning: user entered a budget but it's less than the minimum
    min_total = min_bpd * trip_days
    budget_warning = (
        req.user_budget > 0 and req.user_budget < min_total
    )

    logger.info(
        f"[Budget] {city['name']} | {trip_days}d | user=₹{req.user_budget} | "
        f"total=₹{total_estimated_budget} | per_day=₹{per_day_budget} | "
        f"days={day_budgets} | warning={budget_warning}"
    )

    result["places"]               = places
    result["day_budgets"]          = day_budgets
    result["total_estimated_budget"] = total_estimated_budget
    result["per_day_budget"]       = per_day_budget
    result["budget_warning"]       = budget_warning
    # Keep for backward compat (old JS reads this)
    result["calculated_total"]     = total_estimated_budget

    # ── Budget Analysis (for sidebar card) ───────────────────────
    user_bud = req.user_budget or 0
    budget_analysis = {
        "min_per_day":  min_bpd,
        "min_total":    min_total,
        "days":         trip_days,
        "user_budget":  user_bud,
        "sufficient":   user_bud >= min_total if user_bud > 0 else None,
        "shortfall":    max(0, min_total - user_bud) if user_bud > 0 else 0,
    }
    result["budget_analysis"] = budget_analysis

    # ── Recommended Days & Best Visit Times ──────────────────────
    # recommended_days = how many days needed to cover ALL city places
    # (3 places per day is comfortable, so ceil(total / 3))
    all_city_places = city.get("places", [])
    recommended_days = math.ceil(len(all_city_places) / 3) if all_city_places else trip_days

    # Build a time-slot → place names mapping for "best time to visit" display
    from collections import defaultdict
    slot_map = defaultdict(list)
    for p in all_city_places:
        slot = p.get("time_slot", "Any")
        slot_map[slot].append(p["name"])

    # Format: [{ slot, places, icon }] sorted Morning → Afternoon → Evening → Night
    SLOT_ORDER = {"Morning": 0, "Afternoon": 1, "Any": 1, "Evening": 2, "Night": 3}
    SLOT_ICONS = {"Morning": "🌅", "Afternoon": "☀️", "Evening": "🌆", "Night": "🌙", "Any": "🕐"}
    best_visit_times = sorted(
        [
            {
                "slot":   slot,
                "icon":   SLOT_ICONS.get(slot, "🕐"),
                "places": names,
            }
            for slot, names in slot_map.items()
        ],
        key=lambda x: SLOT_ORDER.get(x["slot"], 1),
    )

    result["recommended_days"]  = recommended_days
    result["best_visit_times"]  = best_visit_times
    result["best_time"]         = city.get("best_time", "October to March")

    logger.info(f"[City Info] {city['name']} | recommended_days={recommended_days} | best_time={result['best_time']}")

    if model:
        try:
            prompt = f"One catchy sentence travel tagline for {req.days}-day {req.budget} trip to {city['name']} focusing on {', '.join(req.interests) or 'exploration'}."
            result["tagline"] = model.generate_content(prompt).text.strip()
        except Exception as e:
            logger.error(f"AI error: {e}")
            result["tagline"] = f"Your {req.days}-Day {req.budget} Plan for {city['name']}"
    else:
        result["tagline"] = f"Your {req.days}-Day {req.budget} Plan for {city['name']} (AI Offline)"

    return result

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

@app.get("/api/share_ride_matches")
def share_ride_matches():
    return data.get_ride_matches()

@app.post("/api/delete_trip")
def delete_trip(payload: dict):
    return {"status": "success", "message": "Trip deleted."}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
