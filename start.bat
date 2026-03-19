@echo off
echo.
echo  =========================================
echo   Sri Lakshmi Pottery - Billing System
echo  =========================================
echo.

cd /d "%~dp0"

echo [1/3] Creating virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Python not found. Install Python 3.9+ from python.org
    pause
    exit /b
)

echo [2/3] Installing packages...
call venv\Scripts\activate.bat
pip install -r requirements.txt -q

echo [3/3] Starting server...
echo.
echo  App running at: http://localhost:5000
echo  Admin login:    admin / admin123
echo  Worker login:   worker / worker123
echo.
echo  Press Ctrl+C to stop
echo.
python app.py
pause
