@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
    echo Node.js is required. Install Node.js 20 or newer, then try again.
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo npm is required. Reinstall Node.js with npm, then try again.
    pause
    exit /b 1
)

if not exist "node_modules\express\package.json" (
    echo Installing app dependencies...
    call npm install
    if errorlevel 1 (
        echo Dependency installation failed.
        pause
        exit /b 1
    )
)

powershell -NoProfile -Command "try { Invoke-RestMethod -Uri 'http://localhost:3010/api/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    start "Textify OCR server" /D "%~dp0" cmd /k "npm start"
)

for /L %%i in (1,1,30) do (
    powershell -NoProfile -Command "try { Invoke-RestMethod -Uri 'http://localhost:3010/api/health' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }"
    if not errorlevel 1 goto open_site
    timeout /t 1 /nobreak >nul
)

echo The server did not become ready. Check the Textify OCR server window for errors.
pause
exit /b 1

:open_site
start "" "http://localhost:3010"
