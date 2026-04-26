@echo off
setlocal EnableDelayedExpansion

REM -- Find Node.js -----------------------------------------------------------
set "NODE_DIR=C:\Program Files\nodejs"
if not exist "%NODE_DIR%\node.exe" set "NODE_DIR=C:\Program Files (x86)\nodejs"
if not exist "%NODE_DIR%\node.exe" (
    echo ERROR: Node.js not found.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)
set "NPM=%NODE_DIR%\npm.cmd"
set "PATH=%NODE_DIR%;%PATH%"

set "PROJECT_DIR=%~dp0"

REM -- Check / install backend dependencies ------------------------------------
set "BE_NEEDS_INSTALL=0"
if not exist "%PROJECT_DIR%backend\node_modules" set "BE_NEEDS_INSTALL=1"

if "%BE_NEEDS_INSTALL%"=="1" (
    echo [Backend] Dependencies missing. Installing...
    cd /d "%PROJECT_DIR%backend"
    call "%NPM%" install --no-audit --no-fund
    if errorlevel 1 (
        echo ERROR: Backend install failed.
        pause
        exit /b 1
    )
) else (
    echo [Backend] Dependencies OK.
)

REM -- Check Prisma client has Windows engine ----------------------------------
if not exist "%PROJECT_DIR%backend\node_modules\.prisma\client\libquery_engine-windows.dll.node" (
    echo [Backend] Prisma Client missing Windows engine. Regenerating...
    cd /d "%PROJECT_DIR%backend"
    "%NODE_DIR%\node.exe" "node_modules\prisma\build\index.js" generate
    if errorlevel 1 (
        echo ERROR: Prisma generate failed.
        pause
        exit /b 1
    )
) else (
    echo [Backend] Prisma Windows engine OK.
)

REM -- Check / install frontend dependencies -----------------------------------
set "FE_NEEDS_INSTALL=0"
if not exist "%PROJECT_DIR%frontend\node_modules" (
    set "FE_NEEDS_INSTALL=1"
) else if not exist "%PROJECT_DIR%frontend\node_modules\@rolldown\binding-win32-x64-msvc" (
    echo [Frontend] Dependencies were installed via WSL/Linux.
    echo            Missing Windows native bindings. Reinstalling from Windows...
    set "FE_NEEDS_INSTALL=1"
)

if "%FE_NEEDS_INSTALL%"=="1" (
    cd /d "%PROJECT_DIR%frontend"
    call "%NPM%" install --no-audit --no-fund
    if errorlevel 1 (
        echo ERROR: Frontend install failed.
        pause
        exit /b 1
    )
) else (
    echo [Frontend] Dependencies OK.
)

REM -- Write temp launchers (bypass missing .cmd wrappers) ---------------------
(
echo @echo off
echo set "PATH=%NODE_DIR%;%%PATH%%"
echo title 3dFiler Backend
echo cd /d "%PROJECT_DIR%backend"
echo "%NODE_DIR%\node.exe" "node_modules\nodemon\bin\nodemon.js" src/index.js
echo echo.
echo echo Server stopped. Press any key to close.
echo pause ^>nul
) > "%PROJECT_DIR%backend\_start_backend.cmd"

(
echo @echo off
echo set "PATH=%NODE_DIR%;%%PATH%%"
echo title 3dFiler Frontend
echo cd /d "%PROJECT_DIR%frontend"
echo "%NODE_DIR%\node.exe" "node_modules\vite\bin\vite.js"
echo echo.
echo echo Server stopped. Press any key to close.
echo pause ^>nul
) > "%PROJECT_DIR%frontend\_start_frontend.cmd"

REM -- Launch -----------------------------------------------------------------
echo =========================================
echo      3dFiler Starting Up...
echo =========================================
echo.

echo [1/2] Starting Backend  (http://localhost:3001)
start "3dFiler Backend"   "%PROJECT_DIR%backend\_start_backend.cmd"
timeout /t 1 >nul

echo [2/2] Starting Frontend (http://localhost:5173)
start "3dFiler Frontend" "%PROJECT_DIR%frontend\_start_frontend.cmd"

echo.
echo =========================================
echo  Both servers are launching...
echo  * API:    http://localhost:3001
echo  * App:    http://localhost:5173
echo =========================================
echo.
echo Press any key to close this launcher.
echo (Servers will keep running in their own windows.)
pause >nul
