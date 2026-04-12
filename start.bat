@echo off
title TourInHand - AI Travel App
echo.
echo  ============================================
echo   TourInHand v2 - AI Travel Planner
echo   http://localhost:8000
echo  ============================================
echo.
cd /d "%~dp0"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
pause
