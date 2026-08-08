import os
from typing import Any, Dict, List, Optional

import yaml

from backend.app.schemas.reporting import DatasetMeta, DimensionMeta, MeasureMeta


class MetadataService:
    """Loads curated reporting datasets from semantic YAML configuration."""

    def __init__(self, config_path: str = "backend/semantic/reporting/datasets.yml"):
        self.config_path = config_path
        self._datasets: Dict[str, Dict[str, Any]] = {}
        self._reload()

    def _reload(self) -> None:
        path = self.config_path
        if not os.path.isabs(path):
            path = os.path.abspath(path)
        if not os.path.exists(path):
            self._datasets = {}
            return
        with open(path, "r", encoding="utf-8") as f:
            raw = yaml.safe_load(f) or {}
        self._datasets = {d["id"]: d for d in raw.get("datasets", [])}

    def list_datasets(self) -> List[DatasetMeta]:
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
