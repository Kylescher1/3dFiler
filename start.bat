@echo off
echo ==========================================
echo  3dFiler - Starting Backend + Frontend
echo ==========================================
echo.

REM Check if frontend .env exists, create from example if not
if not exist "frontend\.env" (
  echo Creating frontend\.env from example...
  copy "frontend\.env.example" "frontend\.env" >nul
)

REM Check if backend node_modules exists
if not exist "backend\node_modules" (
  echo Installing backend dependencies...
  cd backend
  call npm install
  cd ..
)

REM Check if frontend node_modules exists
if not exist "frontend\node_modules" (
  echo Installing frontend dependencies...
  cd frontend
  call npm install
  cd ..
)

echo.
echo Starting backend on http://localhost:3001
start "3dFiler Backend" cmd /k "cd /d %~dp0backend && npm run dev"

echo Starting frontend on http://localhost:5173
start "3dFiler Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo Waiting 4 seconds for servers to start...
timeout /t 4 /nobreak >nul

echo Opening browser...
start http://localhost:5173

echo.
echo ==========================================
echo  Both servers are running in new windows.
echo  Press Ctrl+C in those windows to stop.
echo ==========================================
echo.
pause
