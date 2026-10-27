@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ===== Regrabar solo Tomar lista y Cobros =====
set /p DEMO_URL=Direccion del sistema (Enter = https://prueba.crear-academia.com): 
if "%DEMO_URL%"=="" set DEMO_URL=https://prueba.crear-academia.com
set /p DEMO_EMAIL=Correo de la cuenta directora: 
set /p DEMO_PASSWORD=Contrasena: 
call npm install
set ONLY_FLOW=asistencia
call npm run record:demo
set ONLY_FLOW=pagos
call npm run record:demo
echo.
echo Terminado. Mandame estos 4 videos: asistencia-escritorio, asistencia-celular, pagos-escritorio, pagos-celular (carpeta assets\videos).
pause
