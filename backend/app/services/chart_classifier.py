from typing import List, Dict, Any

class ChartClassifierService:
    """
    Result Chart Auto-Classifier:
      - 1 row & 1 metric column -> KPI_CARD
      - 2 columns (1 category/string, 1 metric) & <= 8 rows -> PIE_CHART
      - 2 columns (1 category/string/date, 1 metric) & > 8 rows -> BAR_CHART
      - 3+ columns -> DATA_TABLE
    """

    def classify(self, columns: List[str], data: List[Dict[str, Any]]) -> str:
        row_count = len(data)
        col_count = len(columns)

        if col_count == 0 or row_count == 0:
            return "DATA_TABLE"

        # 1. Single scalar result -> KPI Card
        if col_count == 1 and row_count == 1:
            return "KPI_CARD"
        if col_count == 2 and row_count == 1:
            return "KPI_CARD"

        # 2. Two-column outputs
        if col_count == 2:
            if row_count <= 8:
                return "PIE_CHART"
            else:
                return "BAR_CHART"

        # 3. Multi-column tabular outputs
        return "DATA_TABLE"

chart_classifier = ChartClassifierService()
