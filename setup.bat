@echo off
rem Start a session: get the latest code and saves from GitHub, then run the game's server (saves are kept in saves\).
rem The game opens in your browser at http://localhost:8765. Press Ctrl+C in this window to stop the server.
cd /d "%~dp0"

echo Fetching from GitHub...
git fetch
if errorlevel 1 goto fail
echo Pulling the latest changes and saves...
git pull
if errorlevel 1 goto fail

echo.
echo Starting the game at http://localhost:8765 (press Ctrl+C here to stop it).
start "" cmd /c "timeout /t 2 /nobreak >nul & start http://localhost:8765"
python tools\serve.py
goto :eof

:fail
echo.
echo Git couldn't update, so the game wasn't started. See the message above.
pause
exit /b 1
