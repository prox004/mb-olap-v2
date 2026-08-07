from typing import Any, Dict, List, Tuple

from duckdb import DuckDBPyConnection

from backend.app.schemas.reporting import PreviewResponse, ReportDefinition
from backend.app.services.reporting.metadata_service import metadata_service
from backend.app.services.reporting.sql_compiler import sql_compiler
from backend.app.services.sql_validator import sql_validator


class QueryExecutor:
    """Executes compiled report queries against DuckDB."""

    def execute_preview(
        self, db: DuckDBPyConnection, report: ReportDefinition
    ) -> PreviewResponse:
        sql, column_names, params, count_sql = sql_compiler.compile(report)

        safe_sql = sql_validator.enforce_security_and_limits(sql)

        cursor = db.execute(safe_sql, params)
        rows = cursor.fetchall()
        db_columns = [desc[0] for desc in cursor.description]

        # Map internal aliases to user-friendly column names
        display_columns = column_names if column_names else db_columns
        data: List[Dict[str, Any]] = []
        for row in rows:
            record = {}
            for i, col_name in enumerate(display_columns):
                val = row[i] if i < len(row) else None
                record[col_name] = val
            data.append(record)

        total_count = db.execute(count_sql, params).fetchone()[0]

        return PreviewResponse(
            sql=safe_sql,
            columns=display_columns,
            data=data,
            record_count=len(data),
            total_count=int(total_count),
            page=report.page,
            page_size=report.page_size,
            visualization=report.visualization,
        )

    def search_field_values(
        self,
        db: DuckDBPyConnection,
        dataset_id: str,
        field_id: str,
        search: str = "",
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        ds = metadata_service.get_dataset(dataset_id)
        if not ds:
            raise ValueError(f"Unknown dataset: {dataset_id}")

        sql_expr = metadata_service.resolve_dimension_sql(dataset_id, field_id)
        alias = ds["alias"]
        base_table = ds["base_table"]

        params: List[Any] = []
        where = f"{sql_expr} IS NOT NULL"
        if search:
            where += f" AND CAST({sql_expr} AS VARCHAR) ILIKE ?"
            params.append(f"%{search}%")

        query = (
            f"SELECT {sql_expr} AS value, COUNT(*) AS cnt "
            f"FROM {base_table} {alias} "
            f"WHERE {where} "
            f"GROUP BY 1 ORDER BY cnt DESC LIMIT {limit}"
        )
        rows = db.execute(query, params).fetchall()
        return [{"value": str(r[0]), "label": str(r[0]), "count": int(r[1])} for r in rows]


query_executor = QueryExecutor()
