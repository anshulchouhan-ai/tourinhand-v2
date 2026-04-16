import streamlit as st
import folium
from streamlit_folium import st_folium
import urllib.parse

# Page config
st.set_page_config(page_title="TourInHand - Offline Map", page_icon="🗺️", layout="wide")

st.title("🗺️ Offline Destination Map")

# Read query parameters
query_params = st.query_params

# Fallback values if none provided
city_name = query_params.get("city", "Unknown Destination")
lat_str = query_params.get("lat", "22.7196") # Default Indore
lng_str = query_params.get("lng", "75.8577")

try:
    lat = float(lat_str)
    lng = float(lng_str)
except ValueError:
    st.error("Invalid coordinates provided.")
    st.stop()

st.subheader(f"📍 Location: {city_name}")

# Create Folium Map
# We configure it to use our local FastAPI static tiles
# Assuming FastAPI runs on localhost:8000
map_center = [lat, lng]
m = folium.Map(
    location=map_center,
    zoom_start=13,
    tiles="http://localhost:8000/tiles/{z}/{x}/{y}.png",
    attr="Offline Map (TourInHand)"
)

# Add Marker
folium.Marker(
    location=map_center,
    popup=folium.Popup(city_name, max_width=300),
    icon=folium.Icon(color="blue", icon="info-sign"),
    tooltip=f"Click for more info on {city_name}"
).add_to(m)

# Render map in Streamlit
st_folium(m, width=800, height=500, returned_objects=[])

st.markdown("""
---
*Note: This map uses completely offline pre-downloaded map tiles served from the TourInHand FastAPI backend.*
""")
