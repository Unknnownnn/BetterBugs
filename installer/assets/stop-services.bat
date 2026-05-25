@echo off
title BetterBugs — Stopping Services...
echo Stopping all BetterBugs services...
taskkill /f /im betterbugs-api.exe  >nul 2>&1
taskkill /f /im betterbugs-mcp.exe  >nul 2>&1
taskkill /f /im node.exe            >nul 2>&1
echo Done. All services stopped.
timeout /t 2 /nobreak >nul
