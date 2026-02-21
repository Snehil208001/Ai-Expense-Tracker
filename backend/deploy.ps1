# Deploy AI Expense Tracker Backend
# Run from backend/ folder

param(
    [ValidateSet("fly", "railway")]
    [string]$Platform = "fly"
)

$ErrorActionPreference = "Stop"
$flyPath = "$env:USERPROFILE\.fly\bin\flyctl.exe"

if ($Platform -eq "fly") {
    Write-Host "`n=== Deploying to Fly.io ===" -ForegroundColor Cyan
    Write-Host "Note: Fly.io requires a payment method (free tier available).`n" -ForegroundColor Yellow

    if (-not (Test-Path $flyPath)) {
        Write-Host "Installing flyctl..." -ForegroundColor Yellow
        iwr https://fly.io/install.ps1 -useb | iex
    }

    # Check auth
    & $flyPath auth whoami 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Logging in to Fly.io..."
        & $flyPath auth login
    }

    # Create Postgres if not exists
    Write-Host "`nCreating Postgres (if needed)..."
    & $flyPath postgres create --name expense-tracker-db --region ord 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Attaching Postgres to app..."
        & $flyPath postgres attach expense-tracker-db
    }

    # Set JWT secret if not set
    $jwt = [System.Environment]::GetEnvironmentVariable("JWT_SECRET", "User")
    if (-not $jwt -or $jwt.Length -lt 16) {
        $jwt = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 24 | ForEach-Object {[char]$_})
        Write-Host "`nSetting JWT_SECRET (generated)..."
        & $flyPath secrets set "JWT_SECRET=$jwt"
    }

    Write-Host "`nDeploying..."
    & $flyPath deploy
    if ($LASTEXITCODE -eq 0) {
        Write-Host "`nDeployed! Get URL: flyctl open" -ForegroundColor Green
    }
} elseif ($Platform -eq "railway") {
    Write-Host "`n=== Deploying to Railway ===" -ForegroundColor Cyan
    Write-Host "1. Go to https://railway.app"
    Write-Host "2. New Project -> Deploy from GitHub"
    Write-Host "3. Select repo, set Root Directory: backend"
    Write-Host "4. Add PostgreSQL from Railway dashboard"
    Write-Host "5. Add variables: JWT_SECRET, GOOGLE_GEMINI_API_KEY"
    Write-Host "6. Redeploy`n"
}
