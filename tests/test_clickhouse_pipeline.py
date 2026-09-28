import os
import sys
import unittest
from decimal import Decimal
import datetime

# Ensure project root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.etl.load_clickhouse import (
    extract_excel_records,
    build_date_dimension,
    build_location_dimension,
    reconcile_and_audit,
    TARGET_TOTALS,
)


class TestClickHouseETLPipeline(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.excel_path = os.path.join("data", "1april-15sept2025.xlsx")
        cls.valid_rows, cls.items_dict, cls.rejected_rows = extract_excel_records(cls.excel_path)

    def test_record_count(self):
        """Verify that exactly 397,805 valid operational rows were extracted."""
        self.assertEqual(len(self.valid_rows), TARGET_TOTALS["row_count"])
        self.assertEqual(len(self.rejected_rows), 0)

    def test_grain_uniqueness(self):
        """Verify that the fact grain (store, item, period_start) is 100% unique (0 duplicates)."""
        keys = set((r["store_code"], r["item_code"], r["period_start_date"]) for r in self.valid_rows)
        self.assertEqual(len(keys), TARGET_TOTALS["row_count"])

    def test_financial_reconciliation(self):
        """Verify revenue, quantity, COGS, and Gross Profit match verified totals."""
        total_qty = sum(r["bill_qty"] for r in self.valid_rows)
        total_rev = sum(r["net_amount"] for r in self.valid_rows)
        total_cogs = sum(r["cogs"] for r in self.valid_rows)
        total_gp = sum(r["gross_profit"] for r in self.valid_rows)

        self.assertEqual(total_qty, TARGET_TOTALS["bill_qty"])
        self.assertEqual(total_rev, TARGET_TOTALS["net_revenue"])
        self.assertEqual(total_cogs, TARGET_TOTALS["cogs"])
        self.assertEqual(total_gp, TARGET_TOTALS["gross_profit"])

    def test_signed_negative_preservation(self):
        """Verify negative values are preserved as signed numbers."""
        neg_qty = [r for r in self.valid_rows if r["bill_qty"] < 0]
        neg_rev = [r for r in self.valid_rows if r["net_amount"] < 0]
        self.assertEqual(len(neg_qty), 624)
        self.assertEqual(len(neg_rev), 647)

    def test_distinct_items_catalog(self):
        """Verify 95,071 unique products are extracted for dim_product."""
        self.assertEqual(len(self.items_dict), 95071)

    def test_location_dimension(self):
        """Verify 6 retail stores are modeled with appropriate states."""
        locs = build_location_dimension()
        self.assertEqual(len(locs), 6)
        store_codes = {l["store_code"] for l in locs}
        expected_stores = {"GRHAT", "ANDUL RD", "BBSR", "BRHMPR ODS", "SLCHR", "TZPUR"}
        self.assertEqual(store_codes, expected_stores)

    def test_date_dimension(self):
        """Verify date dimension covers the 6 monthly cycles."""
        dates = build_date_dimension()
        self.assertEqual(len(dates), 6)
        months = {d["month"] for d in dates}
        self.assertEqual(months, {4, 5, 6, 7, 8, 9})


if __name__ == "__main__":
    unittest.main()
