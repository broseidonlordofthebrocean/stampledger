@echo off
REM StampLedger Cloudflare Setup Script for Windows

echo ==============================================
echo   StampLedger Cloudflare Setup
echo ==============================================
echo.

REM Check prerequisites
echo Checking prerequisites...

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed. Please install Node.js first.
    exit /b 1
)

where wrangler >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Installing wrangler...
    npm install -g wrangler
)

echo Prerequisites OK!
echo.

REM Login to Cloudflare
echo Step 1: Cloudflare Login
echo ------------------------
call wrangler login
echo.

REM Setup Landing Page
echo Step 2: Setup Landing Page
echo --------------------------
cd stampledger-landing
call npm install
echo.

REM Setup API Gateway
echo Step 3: Setup API Gateway
echo -------------------------
cd ..\stampledger-api-gateway
call npm install
echo.

cd ..

echo.
echo ==============================================
echo   Setup Complete!
echo ==============================================
echo.
echo Next steps:
echo 1. Install cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
echo 2. Run: cloudflared tunnel login
echo 3. Run: cloudflared tunnel create stampledger-chain
echo 4. Update stampledger-chain\cloudflare-tunnel.yml with your tunnel ID
echo 5. Deploy landing: cd stampledger-landing ^&^& npm run pages:deploy
echo 6. Deploy API: cd stampledger-api-gateway ^&^& npm run deploy
echo.
pause
