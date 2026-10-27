@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ===== Grabador de videos del Manual CREAR =====
where node >nul 2>nul || (echo No encuentro Node.js. Instalalo desde https://nodejs.org y volve a abrir este archivo. & pause & exit /b)
set /p DEMO_URL=Direccion del sistema (Enter = https://prueba.crear-academia.com): 
if "%DEMO_URL%"=="" set DEMO_URL=https://prueba.crear-academia.com
set /p DEMO_EMAIL=Correo de la cuenta directora: 
set /p DEMO_PASSWORD=Contrasena: 
echo.
echo Instalando lo necesario (solo tarda la primera vez)...
call npm install
call npx playwright install chromium
echo.
echo Grabando las pantallas. No hace falta tocar nada, puede tardar varios minutos...
call npm run record:demo
echo.
echo Listo. Los videos quedaron en assets\videos
pause
