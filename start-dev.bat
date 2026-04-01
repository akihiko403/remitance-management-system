@echo off
setlocal

cd /d "%~dp0"

if not exist "artisan" (
    echo artisan was not found in "%cd%".
    pause
    exit /b 1
)

if not exist "package.json" (
    echo package.json was not found in "%cd%".
    pause
    exit /b 1
)

start "KGBI Laravel Server" /D "%~dp0" cmd /k "php artisan serve"
start "KGBI Vite Dev Server" /D "%~dp0" cmd /k "npm run dev"

echo Started Laravel and Vite in separate windows.
echo Close those windows when you want to stop the dev servers.

endlocal
