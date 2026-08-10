import os
import sys
from typing import Any, Dict, List, Optional

import yaml

from backend.app.schemas.reporting import DatasetMeta, DimensionMeta, MeasureMeta


def _find_datasets_yaml(specified_path: Optional[str] = None) -> Optional[str]:
    candidates = []

    # 1. Specified path if provided and not default
    if specified_path:
        candidates.append(specified_path if os.path.isabs(specified_path) else os.path.abspath(specified_path))

    # 2. Environment variable
    env_path = os.getenv("DATASETS_YAML_PATH")
    if env_path:
        candidates.append(env_path if os.path.isabs(env_path) else os.path.abspath(env_path))

    # 3. PyInstaller bundle directory (_MEIPASS)
    if getattr(sys, "frozen", False):
        bundle_dir = getattr(sys, "_MEIPASS", os.path.dirname(sys.executable))
        exe_dir = os.path.dirname(sys.executable)
        candidates.append(os.path.join(bundle_dir, "backend", "semantic", "reporting", "datasets.yml"))
        candidates.append(os.path.join(bundle_dir, "semantic", "reporting", "datasets.yml"))
        candidates.append(os.path.join(exe_dir, "backend", "semantic", "reporting", "datasets.yml"))
        candidates.append(os.path.join(exe_dir, "semantic", "reporting", "datasets.yml"))

    # 4. Source tree relative to this file
    current_file_dir = os.path.dirname(os.path.abspath(__file__))
    repo_root = os.path.abspath(os.path.join(current_file_dir, "..", "..", ".."))
    candidates.append(os.path.join(repo_root, "backend", "semantic", "reporting", "datasets.yml"))

    # 5. Fallback relative to CWD
    candidates.append(os.path.abspath("backend/semantic/reporting/datasets.yml"))

    for path in candidates:
        if path and os.path.isfile(path):
            return path
    return None


class MetadataService:
    """Loads curated reporting datasets from semantic YAML configuration."""

    def __init__(self, config_path: str = "backend/semantic/reporting/datasets.yml"):
        self.config_path = config_path
        self._datasets: Dict[str, Dict[str, Any]] = {}
        self._reload()

    def _reload(self) -> None:
        path = _find_datasets_yaml(self.config_path)
        if not path or not os.path.exists(path):
            self._datasets = {}
            return
        self.config_path = path
        with open(path, "r", encoding="utf-8") as f:
            raw = yaml.safe_load(f) or {}
        self._datasets = {d["id"]: d for d in raw.get("datasets", [])}

    def list_datasets(self) -> List[DatasetMeta]:
        if not self._datasets:
            self._reload()
        result = []
        for ds in self._datasets.values():
            result.append(
                DatasetMeta(
                    id=ds["id"],
                    label=ds["label"],
                    description=ds.get("description", ""),
                    dimensions=self._parse_dimensions(ds),
                    measures=self._parse_measures(ds),
                )
            )
        return result

    def get_dataset(self, dataset_id: str) -> Optional[Dict[str, Any]]:
        if not self._datasets:
            self._reload()
        return self._datasets.get(dataset_id)

    def get_dataset_meta(self, dataset_id: str) -> Optional[DatasetMeta]:
        ds = self.get_dataset(dataset_id)
        if not ds:
            return None
        return DatasetMeta(
            id=ds["id"],
            label=ds["label"],
            description=ds.get("description", ""),
            dimensions=self._parse_dimensions(ds),
            measures=self._parse_measures(ds),
        )

    def get_dimension(self, dataset_id: str, field_id: str) -> Optional[Dict[str, Any]]:
        ds = self.get_dataset(dataset_id)
        if not ds:
            return None
        for dim in ds.get("dimensions", []):
            if dim["id"] == field_id:
                return dim
        return None

    def get_measure(self, dataset_id: str, field_id: str) -> Optional[Dict[str, Any]]:
        ds = self.get_dataset(dataset_id)
        if not ds:
            return None
        for measure in ds.get("measures", []):
            if measure["id"] == field_id:
                return measure
        return None

    def resolve_dimension_sql(self, dataset_id: str, field_id: str) -> str:
        dim = self.get_dimension(dataset_id, field_id)
        if not dim:
            raise ValueError(f"Unknown dimension '{field_id}' in dataset '{dataset_id}'")
        if dim.get("hidden"):
            raise ValueError(f"Dimension '{field_id}' is not available for reporting")
        if "expression" in dim:
            return dim["expression"]
        alias = self._datasets[dataset_id]["alias"]
        col = dim["column"]
        if col.isidentifier():
            return f"{alias}.{col}"
        return f'{alias}."{col}"'

    def resolve_dimension_label(self, dataset_id: str, field_id: str) -> str:
        dim = self.get_dimension(dataset_id, field_id)
        return dim["label"] if dim else field_id

    def resolve_measure_sql(self, dataset_id: str, field_id: str) -> str:
        measure = self.get_measure(dataset_id, field_id)
        if not measure:
            raise ValueError(f"Unknown measure '{field_id}' in dataset '{dataset_id}'")
        return measure["expression"]

    def resolve_value_sql(
        self, dataset_id: str, field_id: str, aggregation: str
    ) -> str:
        measure = self.get_measure(dataset_id, field_id)
        if not measure:
            raise ValueError(f"Unknown measure '{field_id}' in dataset '{dataset_id}'")

        source = measure.get("source_expression")
        if not source:
            if aggregation == "sum":
                return measure["expression"]
            raise ValueError(
                f"Aggregation '{aggregation}' requires source_expression for measure '{field_id}'"
            )

        agg = aggregation.lower()
        if agg == "count_distinct":
            return f"COUNT(DISTINCT {source})"
        if agg == "count":
            return f"COUNT({source})"
        if agg == "stddev":
            return f"STDDEV_POP({source})"
        if agg == "variance":
            return f"VAR_POP({source})"
        if agg == "median":
            return f"MEDIAN({source})"
        return f"{agg.upper()}({source})"

    def value_field_alias(self, value_field_id: str, field_id: str, aggregation: str) -> str:
        return f"val_{value_field_id.replace('-', '_')[:8]}_{field_id}_{aggregation}"

    def resolve_dimension_with_grouping(
        self, dataset_id: str, field_id: str, grouping: Optional[str] = None
    ) -> str:
        base = self.resolve_dimension_sql(dataset_id, field_id)
        if not grouping:
            return base
        g = grouping.lower()
        if g == "year":
            return f"strftime(CAST({base} AS DATE), '%Y')"
        if g == "quarter":
            return f"strftime(CAST({base} AS DATE), '%Y-Q') || CAST(EXTRACT(QUARTER FROM CAST({base} AS DATE)) AS VARCHAR)"
        if g == "month":
            return f"strftime(CAST({base} AS DATE), '%Y-%m')"
        if g == "week":
            return f"strftime(CAST({base} AS DATE), '%Y-W%W')"
        if g == "day":
            return f"strftime(CAST({base} AS DATE), '%Y-%m-%d')"
        return base

    def resolve_measure_label(self, dataset_id: str, field_id: str) -> str:
        measure = self.get_measure(dataset_id, field_id)
        return measure["label"] if measure else field_id

    def dimension_alias(self, field_id: str) -> str:
        return f"dim_{field_id}"

    def measure_alias(self, field_id: str) -> str:
        return f"msr_{field_id}"

    def _parse_dimensions(self, ds: Dict[str, Any]) -> List[DimensionMeta]:
        return [
            DimensionMeta(
                id=d["id"],
                label=d["label"],
                data_type=d.get("data_type", "string"),
                category=d.get("category", "general"),
                high_cardinality=bool(d.get("high_cardinality")),
                description=d.get("description"),
            )
            for d in ds.get("dimensions", [])
            if not d.get("hidden")
        ]

    def _parse_measures(self, ds: Dict[str, Any]) -> List[MeasureMeta]:
        return [
            MeasureMeta(
                id=m["id"],
                label=m["label"],
                format=m.get("format", "number"),
                description=m.get("description"),
            )
            for m in ds.get("measures", [])
        ]


metadata_service = MetadataService()
