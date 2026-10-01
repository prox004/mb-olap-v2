# Start M Baazar OLAP dev servers (backend + frontend)
$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "=== M Baazar OLAP Dev Startup ===" -ForegroundColor Cyan

$DbPath = Join-Path $ProjectRoot "backend\db\olap_warehouse.duckdb"
$ReportsDbPath = Join-Path $ProjectRoot "backend\db\reports.db"

$WarehouseBackend = if ($env:WAREHOUSE_BACKEND) { $env:WAREHOUSE_BACKEND } else { "clickhouse" }
$env:WAREHOUSE_BACKEND = $WarehouseBackend

Write-Host "Warehouse Backend: $WarehouseBackend" -ForegroundColor Green
Write-Host "DuckDB Path:       $DbPath" -ForegroundColor Gray
Write-Host "Reports DB:        $ReportsDbPath" -ForegroundColor Gray

$env:DUCKDB_PATH = $DbPath
$env:REPORTS_DB_PATH = $ReportsDbPath
$env:PYTHONPATH = $ProjectRoot

# Check if backend is already responding
$BackendRunning = $false
try {
    $health = Invoke-RestMethod -Uri "http://localhost:8000/api/v1/health" -TimeoutSec 2 -ErrorAction Stop
    if ($health.success) {
        $BackendRunning = $true
        Write-Host "Backend is ALREADY running on http://localhost:8000 (Backend: $($health.data.warehouse_backend))" -ForegroundColor Green
    }
} catch {
    $BackendRunning = $false
}

if (-not $BackendRunning) {
    Write-Host "Starting backend on http://localhost:8000 ..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "Set-Location '$ProjectRoot'; `$env:WAREHOUSE_BACKEND='$WarehouseBackend'; `$env:DUCKDB_PATH='$env:DUCKDB_PATH'; `$env:REPORTS_DB_PATH='$ReportsDbPath'; `$env:PYTHONPATH='$ProjectRoot'; python backend/run.py"
    )
    Start-Sleep -Seconds 3
}

Write-Host "Starting frontend on http://localhost:3000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$ProjectRoot\frontend'; npm run dev"
)

Write-Host ""
Write-Host "Servers starting in separate windows." -ForegroundColor Green
Write-Host "  Backend:        http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Frontend:       http://localhost:3000" -ForegroundColor White
Write-Host "  Report Builder: http://localhost:3000/report-builder" -ForegroundColor White
