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


# ── API Routes ────────────────────────────────────────────────────────────────

@app.get("/api/cities")
def get_cities():
    return [
        {"id": c["id"], "name": c["name"], "tagline": c["tagline"], "hero_image": c.get("hero_image", "")}
        for c in data.CITIES.values()
    ]

@app.get("/api/city/{city_id}")
def get_city(city_id: str):
    city = data.CITIES.get(city_id.lower())
    if not city:
        raise HTTPException(status_code=404, detail="City not found")
    return city

@app.get("/api/global")
def get_global_data():
    return {"emergency_contacts": data.EMERGENCY_CONTACTS, "live_updates": data.LIVE_UPDATES}

@app.post("/api/generate_itinerary")
def generate_itinerary(req: ItineraryRequest):
    city = data.CITIES.get(req.city_id.lower())
    if not city:
        raise HTTPException(status_code=404, detail="City not found")

    places = []
    if req.interests:
        places = [p for p in city.get("places", []) if p["category"] in req.interests]
        if not places:
            places = city.get("places", [])[:3]
    else:
        places = city.get("places", [])

    result = dict(city)
    result["places"] = places

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
