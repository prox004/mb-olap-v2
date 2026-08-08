from typing import Any, List, Tuple

from backend.app.schemas.reporting import FilterClause, ReportDefinition, SortClause, ValueFieldConfig
from backend.app.services.reporting.metadata_service import metadata_service


class SqlCompiler:
    """Metadata-driven SQL compiler for pivot-style report definitions."""

    def compile(
        self, report: ReportDefinition
    ) -> Tuple[str, List[str], List[Any], str]:
        ds = metadata_service.get_dataset(report.dataset_id)
        if not ds:
            raise ValueError(f"Unknown dataset: {report.dataset_id}")

        value_fields = self._normalize_value_fields(report)
        if not report.rows and not report.columns and not value_fields:
            raise ValueError("At least one row, column, or value field is required")

        alias = ds["alias"]
        base_table = ds["base_table"]
        params: List[Any] = []

        select_parts: List[str] = []
        group_by_parts: List[str] = []
        column_names: List[str] = []
        group_idx = 0

        for dim_id in report.rows:
            sql_expr = metadata_service.resolve_dimension_sql(report.dataset_id, dim_id)
            col_alias = metadata_service.dimension_alias(dim_id)
            select_parts.append(f"{sql_expr} AS {col_alias}")
            group_idx += 1
            group_by_parts.append(str(group_idx))
            column_names.append(metadata_service.resolve_dimension_label(report.dataset_id, dim_id))

        for dim_id in report.columns:
            sql_expr = metadata_service.resolve_dimension_sql(report.dataset_id, dim_id)
            col_alias = f"col_{metadata_service.dimension_alias(dim_id)}"
            select_parts.append(f"{sql_expr} AS {col_alias}")
            group_idx += 1
            group_by_parts.append(str(group_idx))
            column_names.append(metadata_service.resolve_dimension_label(report.dataset_id, dim_id))

        for vf in value_fields:
            sql_expr = metadata_service.resolve_value_sql(
                report.dataset_id, vf.field_id, vf.aggregation
            )
            col_alias = metadata_service.value_field_alias(vf.id, vf.field_id, vf.aggregation)
            select_parts.append(f"{sql_expr} AS {col_alias}")
            label = vf.display_name or self._default_value_label(report.dataset_id, vf)
            column_names.append(label)

        if not select_parts:
            raise ValueError("No fields selected for the report")

        where_clause, filter_params = self._build_filters(report)
        params.extend(filter_params)

        sql = f"SELECT {', '.join(select_parts)} FROM {base_table} {alias}"
        if where_clause:
            sql += f" WHERE {where_clause}"

        if group_by_parts and (report.rows or report.columns):
            sql += f" GROUP BY {', '.join(group_by_parts)}"

        order_clause = self._build_order_by(report, len(value_fields))
        if order_clause:
            sql += f" ORDER BY {order_clause}"

        count_sql = self._build_count_sql(sql)

        offset = (report.page - 1) * report.page_size
        sql += f" LIMIT {report.page_size} OFFSET {offset}"

        return sql, column_names, params, count_sql

    def _normalize_value_fields(self, report: ReportDefinition) -> List[ValueFieldConfig]:
        if report.value_fields:
            return report.value_fields
        return [
            ValueFieldConfig(field_id=m, aggregation="sum")
            for m in report.measures
        ]

    def _default_value_label(self, dataset_id: str, vf: ValueFieldConfig) -> str:
        base = metadata_service.resolve_measure_label(dataset_id, vf.field_id)
        return f"{base} ({vf.aggregation.upper()})"

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
        if op == "starts_with":
            params.append(f"{flt.value}%")
            return f"CAST({sql_expr} AS VARCHAR) ILIKE ?", params
        if op == "ends_with":
            params.append(f"%{flt.value}")
            return f"CAST({sql_expr} AS VARCHAR) ILIKE ?", params
        if op == "is_empty":
            return f"({sql_expr} IS NULL OR CAST({sql_expr} AS VARCHAR) = '')", params
        if op == "is_not_empty":
            return f"({sql_expr} IS NOT NULL AND CAST({sql_expr} AS VARCHAR) <> '')", params
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

    def _build_order_by(self, report: ReportDefinition, value_count: int) -> str:
        if not report.sort:
            if value_count > 0:
                return f"{len(report.rows) + len(report.columns) + 1} DESC"
            return ""

        parts: List[str] = []
        value_fields = self._normalize_value_fields(report)
        for s in report.sort:
            if s.role == "dimension":
                if s.field_id in report.rows:
                    idx = report.rows.index(s.field_id) + 1
                    parts.append(f"{idx} {s.direction.upper()}")
                elif s.field_id in report.columns:
                    idx = len(report.rows) + report.columns.index(s.field_id) + 1
                    parts.append(f"{idx} {s.direction.upper()}")
            elif s.role == "measure":
                for i, vf in enumerate(value_fields):
                    if vf.field_id == s.field_id:
                        idx = len(report.rows) + len(report.columns) + i + 1
                        parts.append(f"{idx} {s.direction.upper()}")
                        break
        return ", ".join(parts)

    def _build_count_sql(self, inner_sql: str) -> str:
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
