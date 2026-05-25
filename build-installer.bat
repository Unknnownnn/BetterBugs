@echo off
setlocal enabledelayedexpansion
title BetterBugs - Build Installer

echo.
echo ==========================================
echo   BetterBugs Installer Build Script
echo ==========================================
echo.

set ROOT=%~dp0
set ERRORS=0

:: -- Check prerequisites -------------------------------------------
where go >nul 2>&1
if errorlevel 1 (echo [ERROR] Go not found in PATH & set ERRORS=1)

where node >nul 2>&1
if errorlevel 1 (echo [ERROR] Node.js not found in PATH & set ERRORS=1)

where python >nul 2>&1
if errorlevel 1 (echo [ERROR] Python not found in PATH & set ERRORS=1)

where iscc >nul 2>&1
if errorlevel 1 (
    echo [WARN] Inno Setup ^(iscc^) not found in PATH.
    echo        Download: https://jrsoftware.org/isdl.php
    echo        Install it, then re-run this script.
)

if %ERRORS% neq 0 (
    echo.
    echo [FAIL] Prerequisites missing. Fix errors above and retry.
    pause
    exit /b 1
)

echo All prerequisites found.
echo.

:: -- Step 1: Build Go API ------------------------------------------
echo [1/5] Building Go API binary...
cd /d "%ROOT%apps\api"
go build -ldflags="-s -w" -o betterbugs-api.exe .
if errorlevel 1 (
    echo [FAIL] Go build failed. Check errors above.
    pause
    exit /b 1
)
echo [OK] betterbugs-api.exe created
echo.

:: -- Step 2: Build Chrome Extension --------------------------------
echo [2/5] Building Chrome Extension...
cd /d "%ROOT%apps\extension"
call npm run build
if errorlevel 1 (
    echo [FAIL] Extension build failed. Check errors above.
    pause
    exit /b 1
)
echo [OK] Extension built to apps\extension\dist
echo.

:: -- Step 3: Build Next.js Dashboard (standalone) ------------------
echo [3/5] Building Next.js Dashboard...
cd /d "%ROOT%apps\dashboard"
call npm run build
if errorlevel 1 (
    echo [FAIL] Dashboard build failed. Check errors above.
    pause
    exit /b 1
)
echo [OK] Dashboard built to apps\dashboard\.next\standalone
echo.

:: -- Step 4: Build MCP Server with PyInstaller ---------------------
echo [4/5] Building MCP Server binary...
cd /d "%ROOT%apps\mcp-server"

if exist "%ROOT%.venv\Scripts\python.exe" (
    set PYTHON="%ROOT%.venv\Scripts\python.exe"
    echo Using venv Python: %ROOT%.venv\Scripts\python.exe
) else (
    set PYTHON=python
    echo Using system Python
)

%PYTHON% -m PyInstaller --onefile --name betterbugs-mcp ^
    --hidden-import fastmcp ^
    --hidden-import httpx ^
    --hidden-import pydantic ^
    --hidden-import dotenv ^
    server.py

if errorlevel 1 (
    echo [FAIL] PyInstaller failed. Check errors above.
    pause
    exit /b 1
)
echo [OK] betterbugs-mcp.exe created in apps\mcp-server\dist
echo.

:: -- Step 5: Run Inno Setup ----------------------------------------
echo [5/5] Building Windows installer...
cd /d "%ROOT%installer"

if not exist "assets\icon.ico" (
    echo [WARN] No icon.ico found in installer\assets\
    echo        A default icon will be used.
    echo        To use your own, place icon.ico in installer\assets\
)

if not exist "output" mkdir output

where iscc >nul 2>&1
if errorlevel 1 (
    echo.
    echo [SKIP] Inno Setup not installed.
    echo.
    echo All binaries are ready. To finish the installer:
    echo   1. Install Inno Setup: https://jrsoftware.org/isdl.php
    echo   2. Run: iscc installer\BetterBugs.iss
    echo.
) else (
    iscc BetterBugs.iss
    if errorlevel 1 (
        echo [FAIL] Inno Setup failed. Check errors above.
        pause
        exit /b 1
    )
    echo.
    echo ==========================================
    echo  SUCCESS! Installer is ready at:
    echo  installer\output\BetterBugs-Setup-1.0.0.exe
    echo ==========================================
)

echo.
pause
