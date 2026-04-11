# data.py — TourInHand v2
"""
TourInHand v2 = AI-powered safe, smart, and sustainable travel planner
for students and budget travelers.
"""

CITIES = {
    "indore": {
        "id": "indore",
        "name": "Indore",
        "state": "Madhya Pradesh",
        "tagline": "The Cleanest City in India",
        "description": "Famous for its street food and rich heritage spanning across the Maratha and Mughal eras.",
        "best_time": "October to March",
        "budget": "₹1,500 / day",
        "safety_score": 92,
        "eco_score": 95,
        "hero_image": "https://images.unsplash.com/photo-1596720426673-e4e142944b00?auto=format&fit=crop&w=1200&q=80",
        "local_tips": [
            "Try the Bhutte Ki Kees at Sarafa Bazaar.",
            "Visit Chappan Dukan for a legendary breakfast.",
            "The night market at Sarafa is safe and electric after 10 PM!"
        ],
        "places": [
            {"name": "Rajwada Palace", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1621213032549-fb93be9f7bea?auto=format&fit=crop&w=600&q=80", "lat": 22.7186, "lon": 75.8560, "cost": "₹50", "duration": "1.5 hrs"},
            {"name": "Sarafa Bazaar", "category": "Food", "image_url": "https://images.unsplash.com/photo-1589301773823-149c4d9f67a2?auto=format&fit=crop&w=600&q=80", "lat": 22.7169, "lon": 75.8570, "cost": "₹200", "duration": "2 hrs"},
            {"name": "Chappan Dukan", "category": "Food", "image_url": "https://images.unsplash.com/photo-1626014498308-410a6de3347b?auto=format&fit=crop&w=600&q=80", "lat": 22.7232, "lon": 75.8828, "cost": "₹150", "duration": "1 hr"},
            {"name": "Lal Bagh Palace", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1593450979432-613dcf6bc4cb?auto=format&fit=crop&w=600&q=80", "lat": 22.7055, "lon": 75.8456, "cost": "₹30", "duration": "2 hrs"},
            {"name": "Patalpani Waterfall", "category": "Nature", "image_url": "https://images.unsplash.com/photo-1543328225-b040bf5ebfb7?auto=format&fit=crop&w=600&q=80", "lat": 22.5186, "lon": 75.7950, "cost": "Free", "duration": "3 hrs"},
        ]
    },
    "udaipur": {
        "id": "udaipur",
        "name": "Udaipur",
        "state": "Rajasthan",
        "tagline": "The City of Lakes",
        "description": "Known for its majestic palaces, luxury hotels, and sunset boating amid serene lakes.",
        "best_time": "September to March",
        "budget": "₹2,500 / day",
        "safety_score": 88,
        "eco_score": 75,
        "hero_image": "https://images.unsplash.com/photo-1585012586237-7c73fbbe1d78?auto=format&fit=crop&w=1200&q=80",
        "local_tips": [
            "Book boat rides in the evening for the best sunset view.",
            "Enjoy dinner at Ambrai Ghat overlooking the lake.",
            "Walking by the lakes at dusk is truly beautiful."
        ],
        "places": [
            {"name": "City Palace", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1615836245337-f5b9b23021f1?auto=format&fit=crop&w=600&q=80", "lat": 24.5764, "lon": 73.6835, "cost": "₹300", "duration": "3 hrs"},
            {"name": "Taj Lake Palace", "category": "Hotels", "image_url": "https://images.unsplash.com/photo-1542640244-7e672d6cb466?auto=format&fit=crop&w=600&q=80", "lat": 24.5753, "lon": 73.6800, "cost": "₹500+", "duration": "Afternoon"},
            {"name": "Lake Pichola", "category": "Nature", "image_url": "https://images.unsplash.com/photo-1587095493393-db210927c3da?auto=format&fit=crop&w=600&q=80", "lat": 24.5714, "lon": 73.6791, "cost": "₹400 (boat)", "duration": "2 hrs"},
            {"name": "Sajjangarh Palace", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1601077732296-e27ac9fbc001?auto=format&fit=crop&w=600&q=80", "lat": 24.5937, "lon": 73.6391, "cost": "₹85", "duration": "1.5 hrs"},
            {"name": "Jag Mandir", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1596701726715-ddca6bded159?auto=format&fit=crop&w=600&q=80", "lat": 24.5670, "lon": 73.6766, "cost": "₹150", "duration": "1 hr"},
        ]
    },
    "dehradun": {
        "id": "dehradun",
        "name": "Dehradun",
        "state": "Uttarakhand",
        "tagline": "Gateway to the Doon Valley",
        "description": "Nestled in the foothills of the Himalayas, known for pleasant mornings and deep pine forests.",
        "best_time": "March to June",
        "budget": "₹1,800 / day",
        "safety_score": 75,
        "eco_score": 88,
        "hero_image": "https://images.unsplash.com/photo-1610013917812-7daab40d65b7?auto=format&fit=crop&w=1200&q=80",
        "local_tips": [
            "Visit local bakeries for authentic stick jaws.",
            "Take a scenic drive to Landour for stunning views.",
            "Beware of wildlife during late evening walks near outskirts."
        ],
        "places": [
            {"name": "Robber's Cave", "category": "Adventure", "image_url": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80", "lat": 30.3705, "lon": 78.0617, "cost": "₹30", "duration": "2 hrs"},
            {"name": "Sahastradhara", "category": "Nature", "image_url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80", "lat": 30.3847, "lon": 78.1287, "cost": "₹50", "duration": "2 hrs"},
            {"name": "Mindrolling Monastery", "category": "Culture", "image_url": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b2?auto=format&fit=crop&w=600&q=80", "lat": 30.2642, "lon": 77.9972, "cost": "Free", "duration": "1.5 hrs"},
            {"name": "Forest Research Institute", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1518175510697-3b2d186e885c?auto=format&fit=crop&w=600&q=80", "lat": 30.3429, "lon": 77.9996, "cost": "₹40", "duration": "2 hrs"},
            {"name": "Tapkeshwar Temple", "category": "Culture", "image_url": "https://images.unsplash.com/photo-1627885060855-304e28cd816e?auto=format&fit=crop&w=600&q=80", "lat": 30.3541, "lon": 78.0163, "cost": "Free", "duration": "1 hr"},
        ]
    },
    "jaipur": {
        "id": "jaipur",
        "name": "Jaipur",
        "state": "Rajasthan",
        "tagline": "The Pink City",
        "description": "An incredible mix of royal heritage, vibrant markets, and towering hill forts.",
        "best_time": "October to March",
        "budget": "₹2,000 / day",
        "safety_score": 82,
        "eco_score": 70,
        "hero_image": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=1200&q=80",
        "local_tips": [
            "Shop for local crafts at Bapu Bazaar.",
            "Try Pyaz Kachori at Rawat Mishtan Bhandar.",
            "Bargain auto-rickshaw fares beforehand!"
        ],
        "places": [
            {"name": "Amber Fort", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80", "lat": 26.9855, "lon": 75.8513, "cost": "₹200", "duration": "3 hrs"},
            {"name": "Hawa Mahal", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1599661559868-b7f5e55026ff?auto=format&fit=crop&w=600&q=80", "lat": 26.9239, "lon": 75.8267, "cost": "₹50", "duration": "1 hr"},
            {"name": "Jal Mahal", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1518167389069-b5feec1267b2?auto=format&fit=crop&w=600&q=80", "lat": 26.9675, "lon": 75.8456, "cost": "Free (view)", "duration": "45 min"},
            {"name": "Jantar Mantar", "category": "Culture", "image_url": "https://images.unsplash.com/photo-1598466542031-1361c4df7a36?auto=format&fit=crop&w=600&q=80", "lat": 26.9248, "lon": 75.8246, "cost": "₹40", "duration": "1.5 hrs"},
            {"name": "Nahargarh Fort", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1592592534062-8eec2e66dbba?auto=format&fit=crop&w=600&q=80", "lat": 26.9373, "lon": 75.8156, "cost": "₹50", "duration": "2 hrs"},
        ]
    }
}

EMERGENCY_CONTACTS = [
    {"service": "National Emergency", "dial": "112"},
    {"service": "Police", "dial": "100"},
    {"service": "Ambulance", "dial": "108"},
    {"service": "Tourist Helpline", "dial": "1363"},
    {"service": "Women Helpline", "dial": "1091"},
]

LIVE_UPDATES = [
    {"type": "weather", "message": "Clear skies and pleasant breeze expected this weekend.", "level": "success"},
    {"type": "crowd", "message": "Major heritage sites experiencing moderate foot traffic.", "level": "info"},
    {"type": "safety", "message": "All popular tourist zones marked safe by local authorities.", "level": "success"},
]


def get_dummy_cities():
    return [{"id": c["id"], "name": c["name"], "tagline": c["tagline"], "hero_image": c.get("hero_image", ""), "safety_score": c.get("safety_score", 80), "eco_score": c.get("eco_score", 75), "budget": c.get("budget", "–")} for c in CITIES.values()]


def get_dashboard_widgets():
    return {
        "weather": {"temp": "27°C", "condition": "Partly Cloudy", "icon": "☁️"},
        "eco_score": {"value": 88, "label": "Eco Index", "trend": "↑ 3 this week"},
        "safety_alert": {"message": "All popular zones safe", "level": "good"},
        "destinations": len(CITIES),
    }


def get_mock_saved_trips():
    return [
        {
            "id": "st_indore_3d",
            "city_id": "indore",
            "city_name": "Indore",
            "title": "3-Day Budget Escape",
            "days": 3,
            "budget_type": "Budget",
            "budget": "₹1,500/day",
            "safety_score": 92,
            "eco_score": 95,
            "tags": ["Heritage", "Food", "Eco-Friendly"],
            "hero_image": "https://images.unsplash.com/photo-1596720426673-e4e142944b00?auto=format&fit=crop&w=600&q=70",
            "saved_at": "Apr 10, 2026",
        },
        {
            "id": "st_udaipur_5d",
            "city_id": "udaipur",
            "city_name": "Udaipur",
            "title": "5-Day Royal Experience",
            "days": 5,
            "budget_type": "Standard",
            "budget": "₹2,500/day",
            "safety_score": 88,
            "eco_score": 75,
            "tags": ["Heritage", "Lakes", "Culture"],
            "hero_image": "https://images.unsplash.com/photo-1585012586237-7c73fbbe1d78?auto=format&fit=crop&w=600&q=70",
            "saved_at": "Apr 9, 2026",
        },
        {
            "id": "st_jaipur_2d",
            "city_id": "jaipur",
            "city_name": "Jaipur",
            "title": "Weekend in the Pink City",
            "days": 2,
            "budget_type": "Budget",
            "budget": "₹2,000/day",
            "safety_score": 82,
            "eco_score": 70,
            "tags": ["Heritage", "Markets", "Food"],
            "hero_image": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=600&q=70",
            "saved_at": "Apr 8, 2026",
        },
    ]


def get_ride_matches():
    return [
        {"name": "Rohan M.", "match_pct": 94, "co2_saved": "2.4kg", "split_cost": 120, "verified": True},
        {"name": "Priya S.", "match_pct": 88, "co2_saved": "1.8kg", "split_cost": 145, "verified": False},
        {"name": "Arjun T.", "match_pct": 81, "co2_saved": "1.2kg", "split_cost": 160, "verified": True},
    ]
