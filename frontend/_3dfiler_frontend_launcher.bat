@echo off
title 3dFiler Frontend
echo Starting 3dFiler Frontend...
echo.
set "PATH=C:\Program Files\nodejs;%PATH%" && C:\Github\3dFiler\frontend\node_modules\.bin\vite.cmd
echo.
echo Server stopped. Press any key to close.
pause >nul
