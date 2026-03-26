<#
  BitwiseLearn Microservices - Local Development Launcher
  Starts all services on their designated ports.
  Press Ctrl+C in any window to stop that service.
#>

$ErrorActionPreference = "Continue"
$BASE = Split-Path -Parent $MyInvocation.MyCommand.Path
$APPS = Join-Path $BASE "apps"
$ENV_FILE = Join-Path $BASE ".env"

# Verify uv is available
if (-not (Get-Command uv -ErrorAction SilentlyContinue)) {
    Write-Host "uv is not installed or not available in PATH." -ForegroundColor Red
    Write-Host "Install from: https://docs.astral.sh/uv/getting-started/installation/" -ForegroundColor Yellow
    exit 1
}

Write-Host "Using uv ephemeral environments (no venv activation required)." -ForegroundColor Cyan

$services = @(
    @{ Name = "gateway";              Port = 8000; Dir = "gateway" },
    @{ Name = "auth-service";         Port = 8001; Dir = "auth-service" },
    @{ Name = "user-service";         Port = 8002; Dir = "user-service" },
    @{ Name = "course-service";       Port = 8003; Dir = "course-service" },
    @{ Name = "problem-service";      Port = 8004; Dir = "problem-service" },
    @{ Name = "assessment-service";   Port = 8005; Dir = "assessment-service" },
    @{ Name = "code-service";         Port = 8006; Dir = "code-service" },
    @{ Name = "notification-service"; Port = 8007; Dir = "notification-service" },
    @{ Name = "report-service";       Port = 8008; Dir = "report-service" }
)

$jobs = @()

foreach ($svc in $services) {
    $svcDir = Join-Path $APPS $svc.Dir
    $port = $svc.Port
    $name = $svc.Name

    Write-Host "Starting $name on port $port..." -ForegroundColor Green

    $jobs += Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "Set-Location '$svcDir'; uv run --no-project --with-editable '$APPS\shared' --with-requirements '$svcDir\requirements.txt' uvicorn main:app --host 0.0.0.0 --port $port --reload"
    ) -PassThru
}

Write-Host "`nAll services started!" -ForegroundColor Cyan
Write-Host "Gateway:        http://localhost:8000" -ForegroundColor Yellow
Write-Host "Auth:           http://localhost:8001" -ForegroundColor Yellow
Write-Host "User:           http://localhost:8002" -ForegroundColor Yellow
Write-Host "Course:         http://localhost:8003" -ForegroundColor Yellow
Write-Host "Problem:        http://localhost:8004" -ForegroundColor Yellow
Write-Host "Assessment:     http://localhost:8005" -ForegroundColor Yellow
Write-Host "Code:           http://localhost:8006" -ForegroundColor Yellow
Write-Host "Notification:   http://localhost:8007" -ForegroundColor Yellow
Write-Host "Report:         http://localhost:8008" -ForegroundColor Yellow
Write-Host "`nPress Enter to stop all services..." -ForegroundColor Red

Read-Host

foreach ($job in $jobs) {
    if (!$job.HasExited) {
        Stop-Process -Id $job.Id -Force -ErrorAction SilentlyContinue
    }
}
Write-Host "All services stopped." -ForegroundColor Cyan
