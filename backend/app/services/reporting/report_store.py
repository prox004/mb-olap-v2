import json
import os
import sqlite3
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from backend.app.config import settings
from backend.app.schemas.reporting import ReportDefinition, SavedReport, SavedReportSummary


class ReportStore:
    """SQLite-backed persistence for saved report definitions."""

    def __init__(self, db_path: str | None = None):
        db_path = db_path or settings.REPORTS_DB_PATH
        self.db_path = db_path
        self._ensure_db()

    def _ensure_db(self) -> None:
        path = self.db_path
        if not os.path.isabs(path):
            path = os.path.abspath(path)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        conn = sqlite3.connect(path)
        try:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS saved_reports (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    dataset_id TEXT NOT NULL,
                    visualization TEXT NOT NULL,
                    definition_json TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                )
                """
            )
            conn.commit()
        finally:
            conn.close()

    def _connect(self) -> sqlite3.Connection:
        path = self.db_path if os.path.isabs(self.db_path) else os.path.abspath(self.db_path)
        conn = sqlite3.connect(path)
        conn.row_factory = sqlite3.Row
        return conn

    def list_reports(self) -> List[SavedReportSummary]:
        conn = self._connect()
        try:
            rows = conn.execute(
                "SELECT id, name, dataset_id, visualization, created_at, updated_at "
                "FROM saved_reports ORDER BY updated_at DESC"
            ).fetchall()
            return [
                SavedReportSummary(
                    id=r["id"],
                    name=r["name"],
                    dataset_id=r["dataset_id"],
                    visualization=r["visualization"],
                    created_at=r["created_at"],
                    updated_at=r["updated_at"],
                )
                for r in rows
            ]
        finally:
            conn.close()

    def get_report(self, report_id: str) -> Optional[SavedReport]:
        conn = self._connect()
        try:
            row = conn.execute(
                "SELECT * FROM saved_reports WHERE id = ?", (report_id,)
            ).fetchone()
            if not row:
                return None
            definition = ReportDefinition.model_validate(json.loads(row["definition_json"]))
            return SavedReport(
                id=row["id"],
                name=row["name"],
                definition=definition,
                created_at=row["created_at"],
                updated_at=row["updated_at"],
            )
        finally:
            conn.close()

    def save_report(self, definition: ReportDefinition, report_id: Optional[str] = None) -> SavedReport:
        now = datetime.now(timezone.utc).isoformat()
        rid = report_id or str(uuid.uuid4())
        conn = self._connect()
        try:
            existing = conn.execute(
                "SELECT created_at FROM saved_reports WHERE id = ?", (rid,)
            ).fetchone()
            created_at = existing["created_at"] if existing else now
            conn.execute(
                """
                INSERT INTO saved_reports (id, name, dataset_id, visualization, definition_json, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    name = excluded.name,
                    dataset_id = excluded.dataset_id,
                    visualization = excluded.visualization,
                    definition_json = excluded.definition_json,
                    updated_at = excluded.updated_at
                """,
                (
                    rid,
                    definition.name,
                    definition.dataset_id,
                    definition.visualization,
                    definition.model_dump_json(),
                    created_at,
                    now,
                ),
            )
            conn.commit()
        finally:
            conn.close()
        saved = self.get_report(rid)
        assert saved is not None
        return saved

    def delete_report(self, report_id: str) -> bool:
        conn = self._connect()
        try:
            cur = conn.execute("DELETE FROM saved_reports WHERE id = ?", (report_id,))
            conn.commit()
            return cur.rowcount > 0
        finally:
            conn.close()


report_store = ReportStore()
