# data.py Ã¢â‚¬â€ TourInHand v2
"""
TourInHand v2 = AI-powered safe, smart, and sustainable travel planner
for students and budget travelers.

Place metadata fields (new):
  time_slot    : "Morning" | "Afternoon" | "Evening" | "Night" | "Any"
  crowd_level  : "Low" | "Medium" | "High"
  popularity   : 1Ã¢â‚¬â€œ5 integer (5 = most popular)
  best_for     : short label shown in destination chips (e.g. "Most Visited")
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
        "min_budget_per_day": 1500,
        "safety_score": 92,
        "eco_score": 95,
        # Rajwada Palace Ã¢â‚¬â€ Indore's iconic landmark
        "hero_image": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Rajwada_Indore.jpg&width=1200",
        "recommended_days": 2,
        "local_tips": [
            "Try the Bhutte Ki Kees at Sarafa Bazaar.",
            "Visit Chappan Dukan for a legendary breakfast.",
            "The night market at Sarafa is safe and electric after 10 PM!"
        ],
        "places": [
            {
                "name": "Rajwada Palace",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Rajwada_Indore.jpg&width=800",
                "lat": 22.7186, "lon": 75.8560,
                "cost": "₹50", "duration": "1.5 hrs",
                "time_slot": "Morning", "crowd_level": "High",
                "popularity": 5, "best_for": "Most Visited",
            },
            {
                "name": "Sarafa Bazaar",
                "category": "Food",
                "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80",
                "lat": 22.7169, "lon": 75.8570,
                "cost": "₹200", "duration": "2 hrs",
                "time_slot": "Evening", "crowd_level": "High",
                "popularity": 5, "best_for": "Best for Night",
            },
            {
                "name": "Chappan Dukan",
                "category": "Food",
                "image_url": "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80",
                "lat": 22.7232, "lon": 75.8828,
                "cost": "₹150", "duration": "1 hr",
                "time_slot": "Morning", "crowd_level": "Medium",
                "popularity": 4, "best_for": "Food Lovers",
            },
            {
                "name": "Lal Bagh Palace",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Lal_Bagh_Palace_Indore.jpg&width=800",
                "lat": 22.7055, "lon": 75.8456,
                "cost": "₹30", "duration": "2 hrs",
                "time_slot": "Morning", "crowd_level": "Low",
                "popularity": 3, "best_for": "Hidden Gem",
            },
            {
                "name": "Patalpani Waterfall",
                "category": "Nature",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Patalpani_waterfall.jpg&width=800",
                "lat": 22.5186, "lon": 75.7950,
                "cost": "Free", "duration": "3 hrs",
                "time_slot": "Morning", "crowd_level": "Medium",
                "popularity": 4, "best_for": "Nature Escape",
            },
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
        "min_budget_per_day": 2500,
        "safety_score": 88,
        "eco_score": 75,
        # Lake Palace floating on Pichola Ã¢â‚¬â€ Udaipur's signature view
        "hero_image": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Lake_Palace_Udaipur.jpg&width=1200",
        "recommended_days": 3,
        "local_tips": [
            "Book boat rides in the evening for the best sunset view.",
            "Enjoy dinner at Ambrai Ghat overlooking the lake.",
            "Walking by the lakes at dusk is truly beautiful."
        ],
        "places": [
            {
                "name": "City Palace",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/City_Palace_Udaipur.jpg&width=800",
                "lat": 24.5764, "lon": 73.6835,
                "cost": "₹300", "duration": "3 hrs",
                "time_slot": "Morning", "crowd_level": "High",
                "popularity": 5, "best_for": "Must See",
            },
            {
                "name": "Taj Lake Palace",
                "category": "Hotels",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Lake_Palace_Udaipur.jpg&width=800",
                "lat": 24.5753, "lon": 73.6800,
                "cost": "₹500+", "duration": "Afternoon",
                "time_slot": "Afternoon", "crowd_level": "Low",
                "popularity": 4, "best_for": "Iconic Stay",
            },
            {
                "name": "Lake Pichola",
                "category": "Nature",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Lake_Pichola.jpg&width=800",
                "lat": 24.5714, "lon": 73.6791,
                "cost": "₹400 (boat)", "duration": "2 hrs",
                "time_slot": "Evening", "crowd_level": "High",
                "popularity": 5, "best_for": "Best for Sunset",
            },
            {
                "name": "Sajjangarh Palace",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Monsoon_Palace_Udaipur.jpg&width=800",
                "lat": 24.5937, "lon": 73.6391,
                "cost": "₹85", "duration": "1.5 hrs",
                "time_slot": "Morning", "crowd_level": "Low",
                "popularity": 3, "best_for": "Hidden Gem",
            },
            {
                "name": "Jag Mandir",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Jag_Mandir.jpg&width=800",
                "lat": 24.5670, "lon": 73.6766,
                "cost": "₹150", "duration": "1 hr",
                "time_slot": "Afternoon", "crowd_level": "Medium",
                "popularity": 4, "best_for": "Scenic Spot",
            },
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
        "min_budget_per_day": 1800,
        "safety_score": 75,
        "eco_score": 88,
        # Himalayan foothills at dusk
        "hero_image": "https://images.unsplash.com/photo-1597074866923-dc0589150358?auto=format&fit=crop&w=1400&q=80",
        "recommended_days": 2,
        "local_tips": [
            "Visit local bakeries for authentic stick jaws.",
            "Take a scenic drive to Landour for stunning views.",
            "Beware of wildlife during late evening walks near outskirts."
        ],
        "places": [
            {
                "name": "Robber's Cave",
                "category": "Adventure",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Robbers_Cave_Dehradun.jpg&width=800",
                "lat": 30.3705, "lon": 78.0617,
                "cost": "Ã¢â€šÂ¹30", "duration": "2 hrs",
                "time_slot": "Morning", "crowd_level": "Medium",
                "popularity": 4, "best_for": "Adventure Pick",
            },
            {
                "name": "Sahastradhara",
                "category": "Nature",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Sahastradhara_Dehradun.jpg&width=800",
                "lat": 30.3847, "lon": 78.1287,
                "cost": "₹50", "duration": "2 hrs",
                "time_slot": "Morning", "crowd_level": "Low",
                "popularity": 3, "best_for": "Nature Escape",
            },
            {
                "name": "Mindrolling Monastery",
                "category": "Culture",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Mindrolling_Monastery.jpg&width=800",
                "lat": 30.2642, "lon": 77.9972,
                "cost": "Free", "duration": "1.5 hrs",
                "time_slot": "Morning", "crowd_level": "Low",
                "popularity": 3, "best_for": "Peaceful Visit",
            },
            {
                "name": "Forest Research Institute",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Forest_Research_Institute_Dehradun.jpg&width=800",
                "lat": 30.3429, "lon": 77.9996,
                "cost": "₹40", "duration": "2 hrs",
                "time_slot": "Morning", "crowd_level": "Low",
                "popularity": 3, "best_for": "Hidden Gem",
            },
            {
                "name": "Tapkeshwar Temple",
                "category": "Culture",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Tapkeshwar_Temple_Dehradun.jpg&width=800",
                "lat": 30.3541, "lon": 78.0163,
                "cost": "Free", "duration": "1 hr",
                "time_slot": "Morning", "crowd_level": "Medium",
                "popularity": 3, "best_for": "Cultural Pick",
            },
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
        "min_budget_per_day": 2000,
        "safety_score": 82,
        "eco_score": 70,
        # Hawa Mahal Ã¢â‚¬â€ iconic pink facade that symbolises Jaipur
        "hero_image": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Hawa_Mahal%2C_Jaipur.jpg&width=1200",
        "recommended_days": 3,
        "local_tips": [
            "Shop for local crafts at Bapu Bazaar.",
            "Try Pyaz Kachori at Rawat Mishtan Bhandar.",
            "Bargain auto-rickshaw fares beforehand!"
        ],
        "places": [
            {
                "name": "Amber Fort",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Amer_Fort%2C_Jaipur.jpg&width=800",
                "lat": 26.9855, "lon": 75.8513,
                "cost": "₹200", "duration": "3 hrs",
                "time_slot": "Morning", "crowd_level": "High",
                "popularity": 5, "best_for": "Must See",
            },
            {
                "name": "Hawa Mahal",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Hawa_Mahal%2C_Jaipur.jpg&width=800",
                "lat": 26.9239, "lon": 75.8267,
                "cost": "₹50", "duration": "1 hr",
                "time_slot": "Morning", "crowd_level": "High",
                "popularity": 5, "best_for": "Most Visited",
            },
            {
                "name": "Jal Mahal",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Jal_Mahal%2C_Jaipur.jpg&width=800",
                "lat": 26.9675, "lon": 75.8456,
                "cost": "Free (view)", "duration": "45 min",
                "time_slot": "Evening", "crowd_level": "Low",
                "popularity": 4, "best_for": "Best for Sunset",
            },
            {
                "name": "Jantar Mantar",
                "category": "Culture",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Jantar_Mantar%2C_Jaipur.jpg&width=800",
                "lat": 26.9248, "lon": 75.8246,
                "cost": "₹40", "duration": "1.5 hrs",
                "time_slot": "Morning", "crowd_level": "Medium",
                "popularity": 3, "best_for": "Cultural Pick",
            },
            {
                "name": "Nahargarh Fort",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Nahargarh_Fort%2C_Jaipur.jpg&width=800",
                "lat": 26.9373, "lon": 75.8156,
                "cost": "₹50", "duration": "2 hrs",
                "time_slot": "Evening", "crowd_level": "Low",
                "popularity": 4, "best_for": "Sunset View",
            },
        ]
    },
    "goa": {
        "id": "goa",
        "name": "Goa",
        "state": "Goa",
        "tagline": "Pearl of the Orient",
        "description": "India's smallest state with golden beaches, Portuguese churches, and a lively nightlife scene.",
        "best_time": "November to February",
        "budget": "₹2,500 / day",
        "min_budget_per_day": 2500,
        "safety_score": 83,
        "eco_score": 72,
        # Golden Goa beach sunset
        "hero_image": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1400&q=80",
        "recommended_days": 5,
        "local_tips": [
            "Rent a scooter Ã¢â‚¬â€ it's the best way to explore the beaches.",
            "Visit Dudhsagar Falls during monsoon for a dramatic view.",
            "Old Goa churches are stunning and free to visit!"
        ],
        "places": [
            {
                "name": "Calangute Beach",
                "category": "Beach",
                "image_url": "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=800&q=80",
                "lat": 15.5449, "lon": 73.7533,
                "cost": "Free", "duration": "3 hrs",
                "time_slot": "Morning", "crowd_level": "High",
                "popularity": 5, "best_for": "Most Visited",
            },
            {
                "name": "Basilica of Bom Jesus",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Basilica_of_Bom_Jesus.jpg&width=800",
                "lat": 15.5009, "lon": 73.9116,
                "cost": "Free", "duration": "1 hr",
                "time_slot": "Morning", "crowd_level": "Medium",
                "popularity": 4, "best_for": "Cultural Pick",
            },
            {
                "name": "Dudhsagar Falls",
                "category": "Nature",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Dudhsagar_Falls_Goa.jpg&width=800",
                "lat": 15.3144, "lon": 74.3144,
                "cost": "₹400 (jeep)", "duration": "Half Day",
                "time_slot": "Morning", "crowd_level": "Medium",
                "popularity": 5, "best_for": "Adventure Pick",
            },
            {
                "name": "Anjuna Flea Market",
                "category": "Shopping",
                "image_url": "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80",
                "lat": 15.5744, "lon": 73.7411,
                "cost": "Free (entry)", "duration": "2 hrs",
                "time_slot": "Afternoon", "crowd_level": "High",
                "popularity": 4, "best_for": "Shoppers",
            },
            {
                "name": "Fort Aguada",
                "category": "Heritage",
                "image_url": "https://commons.wikimedia.org/w/index.php?title=Special:FilePath/Fort_Aguada_Goa.jpg&width=800",
                "lat": 15.5065, "lon": 73.7749,
                "cost": "Free", "duration": "1.5 hrs",
                "time_slot": "Evening", "crowd_level": "Low",
                "popularity": 4, "best_for": "Sunset View",
            },
        ]
    },
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
    return [
        {
            "id": c["id"],
            "name": c["name"],
            "tagline": c["tagline"],
            "hero_image": c.get("hero_image", ""),
            "safety_score": c.get("safety_score", 80),
            "eco_score": c.get("eco_score", 75),
            "budget": c.get("budget", "Ã¢â‚¬â€œ"),
            "min_budget_per_day": c.get("min_budget_per_day", 0),
        }
        for c in CITIES.values()
    ]


def get_dashboard_widgets():
    return {
        "weather": {"temp": "27Ã‚Â°C", "condition": "Partly Cloudy", "icon": "Ã¢ËœÂÃ¯Â¸Â"},
        "eco": {"total_saved": 128, "label": "Eco Index", "trend": "↑ 3 this week"},
        "trips": {"active": 12, "message": "Ongoing trips"},
        "community": {"members": 5.4, "label": "Explorers"},
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
        {
            "name": "Rohan M.",
            "age": 22,
            "bio": "Engineering student | Loves heritage & street food",
            "travel_style": "adventure",
            "match_pct": 94,
            "co2_saved": "2.4 kg",
            "split_cost": 420,
            "verified": True,
            "avatar_color": "#6366f1",
            "avatar_initials": "RM",
        },
        {
            "name": "Priya S.",
            "age": 21,
            "bio": "Design student | Backpacker & hostel enthusiast",
            "travel_style": "backpacking",
            "match_pct": 88,
            "co2_saved": "1.8 kg",
            "split_cost": 445,
            "verified": False,
            "avatar_color": "#ec4899",
            "avatar_initials": "PS",
        },
        {
            "name": "Arjun T.",
            "age": 23,
            "bio": "Photography buff | Chill traveler, early riser",
            "travel_style": "chill",
            "match_pct": 81,
            "co2_saved": "1.2 kg",
            "split_cost": 460,
            "verified": True,
            "avatar_color": "#0ea5e9",
            "avatar_initials": "AT",
        },
    ]

