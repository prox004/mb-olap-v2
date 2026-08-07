import csv
import io
from typing import List, Optional

from duckdb import DuckDBPyConnection
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse

from backend.app.api.deps import get_db
from backend.app.schemas.reporting import (
    DatasetMeta,
    FieldValueOption,
    PreviewRequest,
    PreviewResponse,
    ReportDefinition,
    SavedReport,
    SavedReportSummary,
)
from backend.app.schemas.response import StandardResponse
from backend.app.services.reporting.metadata_service import metadata_service
from backend.app.services.reporting.query_executor import query_executor
from backend.app.services.reporting.report_store import report_store

router = APIRouter()


@router.get("/datasets", response_model=StandardResponse[List[DatasetMeta]])
def list_datasets():
    """List all curated reporting datasets with dimensions and measures."""
    return StandardResponse(success=True, data=metadata_service.list_datasets())


@router.get("/datasets/{dataset_id}", response_model=StandardResponse[DatasetMeta])
def get_dataset(dataset_id: str):
    """Get metadata for a single dataset."""
    meta = metadata_service.get_dataset_meta(dataset_id)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Dataset '{dataset_id}' not found")
    return StandardResponse(success=True, data=meta)


@router.get(
    "/datasets/{dataset_id}/fields/{field_id}/values",
    response_model=StandardResponse[List[FieldValueOption]],
)
def get_field_values(
    dataset_id: str,
    field_id: str,
    search: str = Query("", description="Search term for autocomplete"),
    limit: int = Query(50, ge=1, le=200),
    db: DuckDBPyConnection = Depends(get_db),
):
    """Return distinct values for a dimension field (for filter autocomplete)."""
    try:
        values = query_executor.search_field_values(db, dataset_id, field_id, search, limit)
        return StandardResponse(
            success=True,
            data=[FieldValueOption(**v) for v in values],
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/preview", response_model=StandardResponse[PreviewResponse])
def preview_report(
    request: PreviewRequest,
    db: DuckDBPyConnection = Depends(get_db),
):
    """Compile and execute a report definition, returning data and generated SQL."""
    try:
        result = query_executor.execute_preview(db, request.report)
        return StandardResponse(success=True, data=result, message="Report executed successfully")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Query execution failed: {e}",
        )


@router.post("/export/csv")
def export_csv(
    request: PreviewRequest,
    db: DuckDBPyConnection = Depends(get_db),
):
    """Export report results as CSV."""
    try:
        report = request.report.model_copy()
        report.page = 1
        report.page_size = min(report.limit, 10000)
        result = query_executor.execute_preview(db, report)

        output = io.StringIO()
        writer = csv.DictWriter(output, fieldnames=result.columns)
        writer.writeheader()
        for row in result.data:
            writer.writerow({k: row.get(k, "") for k in result.columns})

        output.seek(0)
        filename = f"report_{report.dataset_id}_{report.name.replace(' ', '_')}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="{filename}"'},
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/reports", response_model=StandardResponse[List[SavedReportSummary]])
def list_saved_reports():
    """List all saved reports."""
    return StandardResponse(success=True, data=report_store.list_reports())


@router.get("/reports/{report_id}", response_model=StandardResponse[SavedReport])
def get_saved_report(report_id: str):
    """Load a saved report by ID."""
    report = report_store.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return StandardResponse(success=True, data=report)


@router.post("/reports", response_model=StandardResponse[SavedReport])
def save_report(definition: ReportDefinition):
    """Save or update a report definition."""
    saved = report_store.save_report(definition)
    return StandardResponse(success=True, data=saved, message="Report saved successfully")


@router.put("/reports/{report_id}", response_model=StandardResponse[SavedReport])
def update_report(report_id: str, definition: ReportDefinition):
    """Update an existing saved report."""
    existing = report_store.get_report(report_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Report not found")
    saved = report_store.save_report(definition, report_id=report_id)
    return StandardResponse(success=True, data=saved, message="Report updated successfully")


@router.delete("/reports/{report_id}", response_model=StandardResponse[dict])
def delete_report(report_id: str):
    """Delete a saved report."""
    deleted = report_store.delete_report(report_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Report not found")
    return StandardResponse(success=True, data={"id": report_id}, message="Report deleted")
