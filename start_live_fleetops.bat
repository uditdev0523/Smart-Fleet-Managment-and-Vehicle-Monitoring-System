@echo off
title FleetOps - Live Server & Cloudflare Tunnel
echo ======================================================================
echo    FleetOps - Smart Fleet Management ^& Vehicle Monitoring System
echo ======================================================================
echo.
echo [1/3] Checking environment...
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

echo [2/3] Starting FleetOps FastAPI Backend on port 8000...
start "FleetOps Backend (FastAPI)" /min cmd /c "cd /d %~dp0backend && python -m uvicorn main:app --host 127.0.0.1 --port 8000"

echo [3/3] Initializing local service...
timeout /t 3 /nobreak >nul

echo.
echo ======================================================================
echo    Launching Cloudflare Public HTTPS Tunnel
echo ======================================================================
echo Local App:   http://localhost:8000/
echo API Docs:    http://localhost:8000/docs
echo.
echo Starting Cloudflare Tunnel... The live public URL will be generated below:
echo (Keep this window open to maintain live public access)
echo.
npx.cmd --yes cloudflared tunnel --url http://127.0.0.1:8000
pause
