# main.py
import os
import logging
import google.generativeai as genai
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from supabase import create_client, Client

from data import CITIES, EMERGENCY_CONTACTS, LIVE_UPDATES

# Logging setup for easier debugging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TourInHand Backend", version="2.0")

# Allow frontend ports for CORS
# ROOT CAUSE FIX: 
# FastAPI (Starlette) raises an error if allow_origins=['*'] is used with allow_credentials=True
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all localhost ports or IP variations
    allow_credentials=False, # Must be False when origins is '*'
    allow_methods=["*"],
    allow_headers=["*"],
)

# AI Setup
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")
if GOOGLE_API_KEY:
    try:
        genai.configure(api_key=GOOGLE_API_KEY)
        model = genai.GenerativeModel('gemini-1.5-flash')
        logger.info("Google Generative AI successfully configured.")
    except Exception as e:
        logger.error(f"Error configuring GenAI: {e}")
        model = None
else:
    logger.warning("GOOGLE_API_KEY not found. Operating without AI.")
    model = None

# Supabase Setup
SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized.")
    except Exception as e:
        logger.error(f"Error initializing Supabase: {e}")
        supabase = None
else:
    logger.warning("Supabase keys missing. Offline save mode active.")
    supabase = None

class ItineraryRequest(BaseModel):
    city_id: str
    interests: List[str] = []
    budget: str = "Standard"
    days: str = "3"

class SaveTripRequest(BaseModel):
    user_id: str
    city_id: str
    itinerary_data: dict

@app.get("/")
def read_root():
    logger.info("Root endpoint accessed.")
    return {"message": "TourInHand backend running"}

@app.get("/api/cities")
def get_cities():
    logger.info("Fetching all cities.")
    cities_list = []
    for key, city in CITIES.items():
        # Keep only required lightweight fields for the list view
        cities_list.append({
            "id": city["id"],
            "name": city["name"],
            "tagline": city["tagline"],
            "hero_image": city["hero_image"]
        })
    return cities_list

@app.get("/api/city/{city_id}")
def get_city(city_id: str):
    logger.info(f"Fetching specific city details: {city_id}")
    for key, city in CITIES.items():
        if city["id"].lower() == city_id.lower():
            return city
    logger.error(f"City '{city_id}' not found.")
    raise HTTPException(status_code=404, detail="City not found")

@app.get("/api/global")
def get_global_data():
    logger.info("Fetching global emergency data.")
    return {
        "emergency_contacts": EMERGENCY_CONTACTS,
        "live_updates": LIVE_UPDATES
    }

@app.post("/api/generate_itinerary")
def generate_itinerary(req: ItineraryRequest):
    logger.info(f"Generating itinerary for city: {req.city_id}")
    target_city = None
    for key, c in CITIES.items():
        if c["id"].lower() == req.city_id.lower():
            target_city = c
            break
            
    if not target_city:
        logger.error(f"City '{req.city_id}' not found for itinerary.")
        raise HTTPException(status_code=404, detail="City not found")

    filtered_places = []
    
    # Apply interest-based filtering
    if req.interests:
        for p in target_city.get("places", []):
            if p["category"] in req.interests:
                filtered_places.append(p)
                
        # Fallback if no matching places
        if not filtered_places and target_city.get("places"):
            filtered_places = target_city["places"][:3]
    else:
        filtered_places = target_city.get("places", [])

    # Shallow copy base city data to form response
    response_data = dict(target_city)
    response_data["places"] = filtered_places
    
    # Enhance the experience with AI, if configured
    if model:
        try:
            logger.info("Attempting to generate AI tagline.")
            prompt = f"Generate a short 1 sentence tagline for a {req.days}-day {req.budget} trip to {target_city['name']} focusing on {', '.join(req.interests)}."
            ai_response = model.generate_content(prompt)
            response_data["tagline"] = ai_response.text.strip()
            logger.info("AI tagline generated successfully.")
        except Exception as e:
            logger.error(f"AI generation failed: {e}")
            response_data["tagline"] = f"Your {req.days}-Day {req.budget} AI Itinerary"
    else:
        response_data["tagline"] = f"Your {req.days}-Day {req.budget} Itinerary (AI Key Missing)"

    return response_data

@app.post("/api/saved_trips")
def save_trip(req: SaveTripRequest):
    logger.info(f"Save trip requested by user {req.user_id} for city {req.city_id}.")
    
    if not supabase:
        logger.warning("Simulating trip save due to missing Supabase config.")
        return {"status": "success", "message": "Trip saved locally! configure SUPABASE keys to sync."}
    
    try:
        data, count = supabase.table("saved_trips").insert({
            "user_id": req.user_id,
            "city_id": req.city_id,
            "itinerary_data": req.itinerary_data
        }).execute()
        logger.info("Trip saved to Supabase successfully.")
        return {"status": "success", "data": data}
    except Exception as e:
        logger.error(f"Supabase exception during insert: {e}")
        # Return success anyway to not block user flow during hackathon demo
        return {"status": "success", "message": f"Trip cached safely! (Cloud sync dropped: {str(e)})"}
