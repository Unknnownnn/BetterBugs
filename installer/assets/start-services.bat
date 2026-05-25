@echo off
setlocal enabledelayedexpansion
title BetterBugs Launcher

:: ─────────────────────────────────────────
:: BetterBugs — Service Launcher
:: Starts API, Dashboard, and MCP Server
:: ─────────────────────────────────────────

set INSTALL_DIR=%~dp0
set LOG_DIR=%INSTALL_DIR%logs
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo.
echo  ╔══════════════════════════════════════╗
echo  ║        BetterBugs  v1.0.0           ║
echo  ╚══════════════════════════════════════╝
echo.

:: ── 1. Load .env ────────────────────────
if not exist "%INSTALL_DIR%.env" (
    echo  [ERROR] .env not found. Re-run the installer.
    pause
    exit /b 1
)

:: ── 2. Start Go API ─────────────────────
echo  [1/3] Starting API Server on :3001...
start "BetterBugs API" /min cmd /c "cd /d "%INSTALL_DIR%" && betterbugs-api.exe >> "%LOG_DIR%\api.log" 2>&1"

timeout /t 3 /nobreak >nul

:: ── 3. Start Next.js Dashboard ──────────
echo  [2/3] Starting Dashboard on :3002...
set PORT=3002
start "BetterBugs Dashboard" /min cmd /c "cd /d "%INSTALL_DIR%dashboard" && node server.js >> "%LOG_DIR%\dashboard.log" 2>&1"

:: ── 4. Start MCP Server ─────────────────
echo  [3/3] Starting MCP Server...
start "BetterBugs MCP" /min cmd /c "cd /d "%INSTALL_DIR%mcp-server" && betterbugs-mcp.exe >> "%LOG_DIR%\mcp.log" 2>&1"

timeout /t 3 /nobreak >nul

:: ── 5. Verify API is up ─────────────────
set API_OK=0
for /l %%i in (1,1,10) do (
    if !API_OK! equ 0 (
        curl -s -o nul -w "%%{http_code}" http://localhost:3001/health 2>nul | find "200" >nul 2>&1
        if not errorlevel 1 set API_OK=1
        if !API_OK! equ 0 (
            timeout /t 2 /nobreak >nul
        )
    )
)

echo.
if %API_OK% equ 1 (
    echo  [OK] All services running!
) else (
    echo  [WARN] API may still be starting. Check logs\api.log
)

echo.
echo  ┌────────────────────────────────────────┐
echo  │  API:        http://localhost:3001      │
echo  │  Dashboard:  http://localhost:3002      │
echo  │  Swagger:    http://localhost:3001/docs │
echo  └────────────────────────────────────────┘
echo.
echo  Extension: Load from extension\ folder in Chrome
echo  (chrome://extensions -^> Load unpacked)
echo.

:: Open dashboard in browser
start "" "http://localhost:3002"

echo  Press any key to keep services running in background...
pause >nul
