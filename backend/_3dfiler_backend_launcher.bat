@echo off
title 3dFiler Backend
echo Starting 3dFiler Backend...
echo.
set "PATH=C:\Program Files\nodejs;%PATH%" && C:\Github\3dFiler\backend\node_modules\.bin\nodemon.cmd src/index.js
echo.
echo Server stopped. Press any key to close.
pause >nul
