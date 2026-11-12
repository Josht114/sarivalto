@echo off
rem End a session: commit everything that's changed (your saves in saves\ and any other changes) and push it to GitHub,
rem so the other computer gets it when it runs setup.bat. Stop the server (Ctrl+C in its window) first.
cd /d "%~dp0"

git add -A
if errorlevel 1 goto fail
git diff --cached --quiet
if errorlevel 1 (
  echo Committing your changes and saves...
  git commit -m "Saves and changes from %COMPUTERNAME%, %date% %time:~0,5%"
  if errorlevel 1 goto fail
) else (
  echo Nothing new to commit.
)

echo Getting anything new from GitHub first...
git pull --rebase
if errorlevel 1 goto fail
echo Pushing to GitHub...
git push
if errorlevel 1 goto fail

echo.
echo Done. Everything is on GitHub.
pause
goto :eof

:fail
echo.
echo Something went wrong: see the message above. Nothing more was done.
pause
exit /b 1
