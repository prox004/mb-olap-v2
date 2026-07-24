from typing import Optional, List, Tuple

def build_where_clause(
    store_ids: Optional[List[int]] = None,
    months: Optional[List[str]] = None,
    division: Optional[str] = None,
    department: Optional[str] = None,
    table_prefix: str = ""
) -> Tuple[str, list]:
    """
    Builds parameterized SQL WHERE clause and params list for DuckDB queries.
    `table_prefix`: optional alias prefix (e.g. 'v.')
    `division` / `department`: case-insensitive partial/exact match support.
    """
    conditions = []
    params = []

    prefix = f"{table_prefix}." if table_prefix and not table_prefix.endswith(".") else table_prefix

    if store_ids:
        placeholders = ", ".join(["?"] * len(store_ids))
        conditions.append(f"{prefix}ADMSITE_CODE IN ({placeholders})")
        params.extend(store_ids)

    if months:
        month_conds = []
        for m in months:
            month_conds.append(f"strftime({prefix}START_DATE, '%Y-%m') = ?")
            params.append(m)
        if month_conds:
            conditions.append(f"({' OR '.join(month_conds)})")

    if division and division.lower() != "all":
        conditions.append(f"UPPER({prefix}Division) LIKE ?")
        params.append(f"%{division.strip().upper()}%")

    if department and department.lower() != "all":
        conditions.append(f"UPPER({prefix}Department) LIKE ?")
        params.append(f"%{department.strip().upper()}%")

    if not conditions:
        return "", []

    return "WHERE " + " AND ".join(conditions), params
