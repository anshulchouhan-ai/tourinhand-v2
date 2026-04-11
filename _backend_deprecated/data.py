# data.py
"""
TourInHand v2 = AI-powered safe, smart, and sustainable travel planner for students and budget travelers
"""

CITIES = {
    "Indore": {
        "id": "indore",
        "name": "Indore",
        "state": "Madhya Pradesh",
        "tagline": "The Cleanest City in India",
        "description": "Famous for its street food and rich heritage spanning across the Maratha and Mughal eras.",
        "best_time": "October to March",
        "budget": "₹1500 / day",
        "safety_score": 92,
        "eco_score": 95,
        "hero_image": "https://images.unsplash.com/photo-1596720426673-e4e142944b00?auto=format&fit=crop&w=1600&q=80",
        "local_tips": ["Try the Bhutte Ki Kees at Sarafa.", "Visit Chappan Dukan for breakfast.", "The night market feels safe and electric!"],
        "places": [
            {"name": "Rajwada Palace", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1621213032549-fb93be9f7bea?auto=format&fit=crop&w=600&q=80", "lat": 22.7186, "lon": 75.8560},
            {"name": "Sarafa Bazaar", "category": "Food", "image_url": "https://images.unsplash.com/photo-1589301773823-149c4d9f67a2?auto=format&fit=crop&w=600&q=80", "lat": 22.7169, "lon": 75.8570},
            {"name": "Chappan Dukan", "category": "Food", "image_url": "https://images.unsplash.com/photo-1626014498308-410a6de3347b?auto=format&fit=crop&w=600&q=80", "lat": 22.7232, "lon": 75.8828},
            {"name": "Lal Bagh Palace", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1593450979432-613dcf6bc4cb?auto=format&fit=crop&w=600&q=80", "lat": 22.7055, "lon": 75.8456},
            {"name": "Patalpani Waterfall", "category": "Nature", "image_url": "https://images.unsplash.com/photo-1543328225-b040bf5ebfb7?auto=format&fit=crop&w=600&q=80", "lat": 22.5186, "lon": 75.7950}
        ]
    },
    "Udaipur": {
        "id": "udaipur",
        "name": "Udaipur",
        "state": "Rajasthan",
        "tagline": "The City of Lakes",
        "description": "Known for its majestic palaces, luxury hotels, and sunset boating amid serene lakes.",
        "best_time": "September to March",
        "budget": "₹2500 / day",
        "safety_score": 88,
        "eco_score": 75,
        "hero_image": "https://images.unsplash.com/photo-1585012586237-7c73fbbe1d78?auto=format&fit=crop&w=1600&q=80",
        "local_tips": ["Book boat rides in the evening for the best sunset view.", "Enjoy dinner at Ambrai Ghat.", "Walking by the lakes at dusk is beautiful."],
        "places": [
            {"name": "City Palace", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1615836245337-f5b9b23021f1?auto=format&fit=crop&w=600&q=80", "lat": 24.5764, "lon": 73.6835},
            {"name": "Taj Lake Palace", "category": "Hotels", "image_url": "https://images.unsplash.com/photo-1542640244-7e672d6cb466?auto=format&fit=crop&w=600&q=80", "lat": 24.5753, "lon": 73.6800},
            {"name": "Lake Pichola", "category": "Nature", "image_url": "https://images.unsplash.com/photo-1587095493393-db210927c3da?auto=format&fit=crop&w=600&q=80", "lat": 24.5714, "lon": 73.6791},
            {"name": "Sajjangarh Palace", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1601077732296-e27ac9fbc001?auto=format&fit=crop&w=600&q=80", "lat": 24.5937, "lon": 73.6391},
            {"name": "Jag Mandir", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1596701726715-ddca6bded159?auto=format&fit=crop&w=600&q=80", "lat": 24.5670, "lon": 73.6766}
        ]
    },
    "Dehradun": {
        "id": "dehradun",
        "name": "Dehradun",
        "state": "Uttarakhand",
        "tagline": "Gateway to the Doon Valley",
        "description": "Nestled in the foothills of the Himalayas, known for pleasant mornings and deep pine forests.",
        "best_time": "March to June",
        "budget": "₹1800 / day",
        "safety_score": 75,
        "eco_score": 88,
        "hero_image": "https://images.unsplash.com/photo-1610013917812-7daab40d65b7?auto=format&fit=crop&w=1600&q=80",
        "local_tips": ["Visit the local bakeries for authentic stick jaws.", "Take a scenic drive to Landour.", "Beware of wildlife during late evening walks near outskirts."],
        "places": [
            {"name": "Robber's Cave", "category": "Adventure", "image_url": "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=600&q=80", "lat": 30.3705, "lon": 78.0617},
            {"name": "Sahastradhara", "category": "Nature", "image_url": "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&q=80", "lat": 30.3847, "lon": 78.1287},
            {"name": "Mindrolling Monastery", "category": "Culture", "image_url": "https://images.unsplash.com/photo-1590050752117-238cb0fb12b2?auto=format&fit=crop&w=600&q=80", "lat": 30.2642, "lon": 77.9972},
            {"name": "Forest Research Institute", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1518175510697-3b2d186e885c?auto=format&fit=crop&w=600&q=80", "lat": 30.3429, "lon": 77.9996},
            {"name": "Tapkeshwar Temple", "category": "Dharmik", "image_url": "https://images.unsplash.com/photo-1627885060855-304e28cd816e?auto=format&fit=crop&w=600&q=80", "lat": 30.3541, "lon": 78.0163}
        ]
    },
    "Jaipur": {
        "id": "jaipur",
        "name": "Jaipur",
        "state": "Rajasthan",
        "tagline": "The Pink City",
        "description": "An incredible mix of royal heritage, vibrant markets, and towering hill forts.",
        "best_time": "October to March",
        "budget": "₹2000 / day",
        "safety_score": 82,
        "eco_score": 70,
        "hero_image": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a?auto=format&fit=crop&w=1600&q=80",
        "local_tips": ["Shop for local crafts at Bapu Bazaar.", "Try Pyaz Kachori at Rawat Mishtan Bhandar.", "Auto-rickshaws must be bargained beforehand!"],
        "places": [
            {"name": "Amber Fort", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=600&q=80", "lat": 26.9855, "lon": 75.8513},
            {"name": "Hawa Mahal", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1599661559868-b7f5e55026ff?auto=format&fit=crop&w=600&q=80", "lat": 26.9239, "lon": 75.8267},
            {"name": "Jal Mahal", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1518167389069-b5feec1267b2?auto=format&fit=crop&w=600&q=80", "lat": 26.9675, "lon": 75.8456},
            {"name": "Jantar Mantar", "category": "Culture", "image_url": "https://images.unsplash.com/photo-1598466542031-1361c4df7a36?auto=format&fit=crop&w=600&q=80", "lat": 26.9248, "lon": 75.8246},
            {"name": "Nahargarh Fort", "category": "Heritage", "image_url": "https://images.unsplash.com/photo-1592592534062-8eec2e66dbba?auto=format&fit=crop&w=600&q=80", "lat": 26.9373, "lon": 75.8156}
        ]
    }
}

EMERGENCY_CONTACTS = [
    {"service": "National Emergency", "dial": "112"},
    {"service": "Police", "dial": "100"},
    {"service": "Ambulance", "dial": "108"},
    {"service": "Tourist Helpline", "dial": "1363"}
]

LIVE_UPDATES = [
    {"type": "weather", "message": "Clear skies and pleasant breeze expected throughout the weekend.", "level": "success"},
    {"type": "crowd", "message": "Major heritage sites are experiencing moderate traffic.", "level": "info"},
]
