@echo off
cd /d "%~dp0"
where node >nul 2>nul || (echo Install Node.js 18+ from https://nodejs.org first, then run this again. & pause & exit /b)
if not exist node_modules (echo Installing packages, first run only... & call npm install)
start "" http://localhost:3000
call npm run dev
pause
