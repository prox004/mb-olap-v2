from typing import Any, List, Tuple

from backend.app.schemas.reporting import FilterClause, ReportDefinition, SortClause
from backend.app.services.reporting.metadata_service import metadata_service


class SqlCompiler:
    """Metadata-driven SQL compiler for report definitions."""

    def compile(
        self, report: ReportDefinition
    ) -> Tuple[str, List[str], List[Any], str]:
        """
        Compile a report definition into parameterized DuckDB SQL.
        Returns: (sql, column_names, params, count_sql)
        """
        ds = metadata_service.get_dataset(report.dataset_id)
        if not ds:
            raise ValueError(f"Unknown dataset: {report.dataset_id}")

        if not report.rows and not report.measures:
            raise ValueError("At least one dimension or measure is required")

        alias = ds["alias"]
        base_table = ds["base_table"]
        params: List[Any] = []

        select_parts: List[str] = []
        group_by_parts: List[str] = []
        column_names: List[str] = []

        for dim_id in report.rows:
            sql_expr = metadata_service.resolve_dimension_sql(report.dataset_id, dim_id)
            col_alias = metadata_service.dimension_alias(dim_id)
            select_parts.append(f"{sql_expr} AS {col_alias}")
            group_by_parts.append(str(len(group_by_parts) + 1))
            column_names.append(metadata_service.resolve_dimension_label(report.dataset_id, dim_id))

        for measure_id in report.measures:
            sql_expr = metadata_service.resolve_measure_sql(report.dataset_id, measure_id)
            col_alias = metadata_service.measure_alias(measure_id)
            select_parts.append(f"{sql_expr} AS {col_alias}")
            column_names.append(metadata_service.resolve_measure_label(report.dataset_id, measure_id))

        if not select_parts:
            raise ValueError("No fields selected for the report")

        where_clause, filter_params = self._build_filters(report)
        params.extend(filter_params)

        sql = f"SELECT {', '.join(select_parts)} FROM {base_table} {alias}"
        if where_clause:
            sql += f" WHERE {where_clause}"

        if group_by_parts and report.rows:
            sql += f" GROUP BY {', '.join(group_by_parts)}"

        order_clause = self._build_order_by(report)
        if order_clause:
            sql += f" ORDER BY {order_clause}"

        count_sql = self._build_count_sql(sql)

        offset = (report.page - 1) * report.page_size
        sql += f" LIMIT {report.page_size} OFFSET {offset}"

        return sql, column_names, params, count_sql

    def _build_filters(
        self, report: ReportDefinition
    ) -> Tuple[str, List[Any]]:
        conditions: List[str] = []
        params: List[Any] = []

        for flt in report.filters:
            cond, flt_params = self._compile_filter(report.dataset_id, flt)
            if cond:
                conditions.append(cond)
                params.extend(flt_params)

        if not conditions:
            return "", []
        return " AND ".join(f"({c})" for c in conditions), params

    def _compile_filter(
        self, dataset_id: str, flt: FilterClause
    ) -> Tuple[str, List[Any]]:
        sql_expr = metadata_service.resolve_dimension_sql(dataset_id, flt.field_id)
        op = flt.operator
        params: List[Any] = []

        if op == "eq":
            params.append(flt.value)
            return f"{sql_expr} = ?", params
        if op == "neq":
            params.append(flt.value)
            return f"{sql_expr} <> ?", params
        if op == "gt":
            params.append(flt.value)
            return f"{sql_expr} > ?", params
        if op == "gte":
            params.append(flt.value)
            return f"{sql_expr} >= ?", params
        if op == "lt":
            params.append(flt.value)
            return f"{sql_expr} < ?", params
        if op == "lte":
            params.append(flt.value)
            return f"{sql_expr} <= ?", params
        if op == "contains":
            params.append(f"%{flt.value}%")
            return f"CAST({sql_expr} AS VARCHAR) ILIKE ?", params
        if op == "in":
            values = flt.values or (flt.value if isinstance(flt.value, list) else [flt.value])
            if not values:
                return "1=0", []
            placeholders = ", ".join(["?"] * len(values))
            params.extend(values)
            return f"{sql_expr} IN ({placeholders})", params
        if op == "not_in":
            values = flt.values or (flt.value if isinstance(flt.value, list) else [flt.value])
            if not values:
                return "1=1", []
            placeholders = ", ".join(["?"] * len(values))
            params.extend(values)
            return f"{sql_expr} NOT IN ({placeholders})", params
        if op == "between":
            values = flt.values or []
            if len(values) < 2:
                raise ValueError(f"between filter requires two values for {flt.field_id}")
            params.extend([values[0], values[1]])
            return f"{sql_expr} BETWEEN ? AND ?", params

        raise ValueError(f"Unsupported filter operator: {op}")

    def _build_order_by(self, report: ReportDefinition) -> str:
        if not report.sort:
            if report.measures:
                return f"{len(report.rows) + 1} DESC"
            return ""

        parts: List[str] = []
        for s in report.sort:
            if s.role == "dimension" and s.field_id in report.rows:
                idx = report.rows.index(s.field_id) + 1
                parts.append(f"{idx} {s.direction.upper()}")
            elif s.role == "measure" and s.field_id in report.measures:
                idx = len(report.rows) + report.measures.index(s.field_id) + 1
                parts.append(f"{idx} {s.direction.upper()}")
        return ", ".join(parts)

    def _build_count_sql(self, inner_sql: str) -> str:
        # Strip LIMIT/OFFSET if present, wrap for total count
        base = inner_sql
        limit_idx = base.upper().rfind(" LIMIT ")
        if limit_idx != -1:
            base = base[:limit_idx]
        offset_idx = base.upper().rfind(" OFFSET ")
        if offset_idx != -1:
            base = base[:offset_idx]
        order_idx = base.upper().rfind(" ORDER BY ")
        if order_idx != -1:
            base = base[:order_idx]
        return f"SELECT COUNT(*) FROM ({base}) AS _report_count"


sql_compiler = SqlCompiler()
