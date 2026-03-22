@echo off
title AUTO POTTERY BILL
echo.
echo  ==========================================
echo    AUTO POTTERY BILL - HK.pvt.Ltd
echo  ==========================================
echo.

cd /d "%~dp0"

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo  ERROR: Python not found!
    echo  Please install Python 3.9+ from https://python.org
    echo  Make sure to check "Add Python to PATH" during install
    pause
    exit /b
)

:: Create venv only if it doesn't exist
if not exist "venv\Scripts\activate.bat" (
    echo  [1/3] Creating virtual environment...
    python -m venv venv
) else (
    echo  [1/3] Virtual environment found, skipping...
)

:: Activate
call venv\Scripts\activate.bat

:: Install/update packages
echo  [2/3] Checking packages...
pip install -r requirements.txt -q --exists-action i

:: Delete old db only if app.py changed (optional, comment out if you want to keep data)
:: del /f /q pottery.db >nul 2>&1

echo  [3/3] Starting server...
echo.
echo  ==========================================
echo   App running at: http://localhost:5000
echo   Admin:  admin / admin123
echo   Worker: worker / worker123
echo  ==========================================
echo.
echo  Opening browser...
timeout /t 2 /nobreak >nul
start http://localhost:5000

echo  Press Ctrl+C to stop the server
echo.
python app.py
pause
