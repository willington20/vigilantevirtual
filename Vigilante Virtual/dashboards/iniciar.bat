@echo off
REM Vigilante Virtual - levanta los dashboards en http://localhost:5173
REM Requiere Python 3 instalado. Para detener: cierra esta ventana o presiona Ctrl+C.
cd /d "%~dp0"
echo.
echo  Vigilante Virtual - Dashboards
echo  -------------------------------
echo  Ingreso:    http://localhost:5173/login.html
echo  (la primera vez se definen las claves de cada perfil en este navegador)
echo.
echo  Para detener el servidor presiona Ctrl+C o cierra esta ventana.
echo.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:5173/login.html"
python -m http.server 5173
