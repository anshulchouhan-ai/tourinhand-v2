# TourInHand v2.0

AI-powered safe, smart, and sustainable travel planner for students and budget travelers.

## 🚀 Running the App

The project has been consolidated into a clean FastAPI structure.

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the Server**:
   ```bash
   python main.py
   ```
   *Alternatively:*
   ```bash
   python -m uvicorn main:app --reload
   ```

3. **Access the App**:
   Open [http://localhost:8000](http://localhost:8000) in your browser.

## 📂 Project Structure

- `main.py`: The single entry point for both UI and API routes.
- `data.py`: Central data store for cities, emergency contacts, and live updates.
- `templates/`: Jinja2 templates (Landing, Dashboard, Result, Saved Trips).
- `static/`: Static assets (CSS and JS).
- `requirements.txt`: Consolidated list of all necessary Python packages.
- `_backend_deprecated/`: Old backend files (stored for reference).
- `_frontend_deprecated/`: Old frontend files (stored for reference).

## ✨ Features

- **AI Itinerary Generator**: Personalized travel plans using Gemini AI.
- **Safety & Eco Scores**: Real-world metrics for conscious traveling.
- **Premium Design**: Modern "Stitch-inspired" UI with soft shadows and rounded elements.
- **Monolithic Setup**: Both frontend and backend serve from a single FastAPI instance for simplicity.
