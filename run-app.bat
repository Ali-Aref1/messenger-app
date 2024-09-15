@echo off

echo Checking if any new packages need to be installed...
npm ci --dry-run >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo New or missing packages detected. Running npm install...
    npm install
) else (
    echo All packages are already installed and up to date.
)

echo Starting the Chat App...
start "Chat App" cmd /k "npm run dev"
