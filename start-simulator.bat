@echo off
cd /d "%~dp0"
echo Starting RWA Return Simulator...
echo.
npm run dev
echo.
echo If the simulator stopped, copy the error above.
pause
