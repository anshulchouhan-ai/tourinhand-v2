# TourInHand v2

AI-powered safe, smart, and sustainable travel planner for students and budget travelers.

---

## 🚀 Overview

TourInHand v2 is a travel planning system designed to help students and budget travelers plan trips efficiently by combining AI-powered itinerary generation with safety and decision-support insights.

This repository contains:

* an **earlier prototype / exploration of the idea**, and
* a **refined hackathon build focused on core functionality**

The hackathon version focuses on simplifying the product and rebuilding the most important features for a clean, explainable demo.

---

## 🎯 Hackathon Focus

During the hackathon, the goal is to **rebuild and refine the core travel flow**, rather than presenting a fully finished product.

### Core Features (Demo Scope)

* 📍 User Input System
  (city, budget, time, interests)

* 🧠 AI Itinerary Generation
  (simple, structured travel plan)

* 🚨 Safety Score
  (basic logic-based risk indicator)

---

## 🧩 Future Scope / Extended Features

The following features were explored in earlier versions and may be expanded in future iterations:

* Ride sharing / cost splitting
* Live weather integration
* Crowd density insights
* Sustainability / carbon scoring
* Smart re-planning
* Saved trips & history
* Advanced UI polish and personalization

---

## 🛠️ Tech Stack

* **Frontend:** HTML, Tailwind CSS
* **Backend:** FastAPI
* **AI:** Gemini API
* **Database:** Supabase (optional / extendable)

---

## 🧱 Project Structure

```
tourinhand-v2/
├── hackathon_build/
│   ├── app/
│   │   ├── main.py
│   │   ├── data.py
│   │   ├── templates/
│   │   ├── static/
│   │   └── data/
│   └── docs/
│       ├── BUILD_LOG.md
│       └── SCOPE.md
├── prototype_archive/
├── requirements.txt
└── README.md
```

---

## ⚙️ Running the Project

1. Install dependencies:

```
pip install -r requirements.txt
```

2. Run the server:

```
uvicorn main:app --reload
```

3. Open in browser:

```
http://127.0.0.1:8000
```

---

## 🧪 Hackathon Development Approach

* Simplified feature set for clarity
* Focus on core user flow
* Incremental improvements during event
* Emphasis on explainability and live demo

---

## 🎤 Demo Flow

1. Enter travel details (city, budget, time, interests)
2. Generate AI-based itinerary
3. View structured plan + safety score

---

## 🧠 Key Idea

The goal of TourInHand is not just trip planning, but **making travel safer, smarter, and more accessible for students**.

---

## 📌 Note

This project includes earlier prototype/reference material for idea exploration.
The hackathon build focuses on rebuilding and refining the core system for demonstration and evaluation.

---

## 👨‍💻 Author

Anshul Chouhan
AIML Student | Builder | Hackathon Enthusiast
