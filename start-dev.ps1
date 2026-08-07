# Start M Baazar OLAP dev servers (backend + frontend)
$ProjectRoot = $PSScriptRoot
Set-Location $ProjectRoot

Write-Host "=== M Baazar OLAP Dev Startup ===" -ForegroundColor Cyan

$DbPath = Join-Path $ProjectRoot "backend\db\olap_warehouse.duckdb"
$ReportsDbPath = Join-Path $ProjectRoot "backend\db\reports.db"

if (-not (Test-Path $DbPath)) {
    Write-Host "ERROR: olap_warehouse.duckdb not found at:" -ForegroundColor Red
    Write-Host "  $DbPath" -ForegroundColor Red
    Write-Host "Run the ETL pipeline first: python backend/etl/run_pipeline.py" -ForegroundColor Yellow
    exit 1
}

Write-Host "DuckDB: $DbPath" -ForegroundColor Green
Write-Host "Reports DB: $ReportsDbPath" -ForegroundColor Green

$env:DUCKDB_PATH = (Resolve-Path $DbPath).Path
$env:REPORTS_DB_PATH = $ReportsDbPath
$env:PYTHONPATH = $ProjectRoot

Write-Host "Starting backend on http://localhost:8000 ..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList @(
    "-NoExit", "-Command",
    "Set-Location '$ProjectRoot'; `$env:DUCKDB_PATH='$env:DUCKDB_PATH'; `$env:REPORTS_DB_PATH='$ReportsDbPath'; `$env:PYTHONPATH='$ProjectRoot'; python backend/run.py"
)

Start-Sleep -Seconds 3

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
