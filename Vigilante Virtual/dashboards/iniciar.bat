@echo off
REM Vigilante Virtual - levanta los dashboards en http://localhost:5173
REM Requiere Python 3 instalado. Para detener: cierra esta ventana o presiona Ctrl+C.
cd /d "%~dp0"
echo.
echo  Vigilante Virtual - Dashboards
echo  -------------------------------
echo  Indice:     http://localhost:5173
echo  Vigilante:  http://localhost:5173/vigilante/
echo  Admin:      http://localhost:5173/admin/
echo  General:    http://localhost:5173/general/
echo.
echo  Para detener el servidor presiona Ctrl+C o cierra esta ventana.
echo.
start "" cmd /c "timeout /t 2 >nul & start http://localhost:5173"
python -m http.server 5173
