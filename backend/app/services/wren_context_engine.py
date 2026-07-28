import os
import json
import yaml
from typing import Dict, Any, List

class WrenContextEngine:
    """
    Wren AI Context Engine powering the 5-Layer GenBI Context Architecture:
      1. Structural: Tables, columns, DuckDB data types, primary & foreign keys.
      2. Semantic: Business models, calculated metrics expressions.
      3. Business: Operational definitions (sign conventions, site classifications).
      4. Operational: Approved join paths and aggregate guidelines.
      5. Behavioral: Memory of golden SQL pairs.
    """

    def __init__(self, base_dir: str = "backend/semantic"):
        self.base_dir = base_dir
        self.models = self._load_yaml(os.path.join(base_dir, "models", "olap_cube.yml"))
        self.metrics = self._load_yaml(os.path.join(base_dir, "models", "metrics.yml"))
        self.business_rules = self._load_yaml(os.path.join(base_dir, "knowledge", "business_rules.yml"))
        self.golden_sql = self._load_json(os.path.join(base_dir, "memory", "golden_sql.json"))

    def _load_yaml(self, path: str) -> Dict[str, Any]:
        if not os.path.exists(path):
            return {}
        with open(path, "r", encoding="utf-8") as f:
            return yaml.safe_load(f) or {}

    def _load_json(self, path: str) -> List[Dict[str, Any]]:
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f) or []

    def find_matching_golden_sql(self, prompt: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Retrieves relevant golden SQL pairs using keyword match scoring.
        """
        prompt_words = set(prompt.lower().split())
        scored_pairs = []

        for item in self.golden_sql:
            q_text = item.get("question", "").lower()
            q_words = set(q_text.split())
            overlap = len(prompt_words.intersection(q_words))
            if overlap >= 2:
                scored_pairs.append((overlap, item))

        scored_pairs.sort(key=lambda x: x[0], reverse=True)
        results = [pair[1] for pair in scored_pairs[:top_k]]

        return results

    def build_system_prompt_context(self, user_prompt: str) -> str:
        """
        Formats structured system prompt context matching Wren AI's prompt specification.
        """
        golden_matches = self.find_matching_golden_sql(user_prompt, top_k=3)

        context = []
        context.append("=== WREN AI MODELING DEFINITION LANGUAGE (MDL) CONTEXT LAYER ===")

        # 1. Models & Relationships
        context.append("\n--- STRUCTURAL & SEMANTIC LAYER (MODELS) ---")
        for m in self.models.get("models", []):
            context.append(f"\nModel: {m['name']} (Table: {m['table_reference']['table']})")
            context.append(f"Description: {m.get('description', '')}")
            context.append("Columns:")
            for col in m.get("columns", []):
                pk_flag = " [PRIMARY KEY]" if col.get("is_primary_key") else ""
                context.append(f"  - {col['name']} ({col['type']}){pk_flag}: {col.get('description', '')}")

        context.append("\nRelationships:")
        for r in self.models.get("relationships", []):
            context.append(f"  - {r['name']}: {r['models'][0]} -> {r['models'][1]} ({r['join_type']}) ON {r['condition']}")

        # 2. Business Metrics
        context.append("\n--- BUSINESS METRICS ---")
        for metric in self.metrics.get("metrics", []):
            context.append(f"  - {metric['name']}: Expression `{metric['expression']}` - {metric.get('description', '')}")

        # 3. Business & Operational Rules
        context.append("\n--- BUSINESS & OPERATIONAL KNOWLEDGE RULES ---")
        for rule in self.business_rules.get("business_rules", []):
            context.append(f"  - [{rule.get('category')}]: {rule.get('rule')}")

        # 4. Golden Memory Pairs
        context.append("\n--- BEHAVIORAL MEMORY (RELEVANT GOLDEN SQL EXAMPLES) ---")
        for item in golden_matches:
            context.append(f"  Question: \"{item.get('question')}\"\n  SQL: {item.get('sql')}")

        context.append("\n--- CRITICAL DUCKDB SQL GENERATION RULES ---")
        context.append("1. Generate ONLY a valid, executable DuckDB SQL query inside a ```sql ... ``` code block.")
        context.append("2. Strictly match the metric asked by the user (e.g. if user asks for 'GMROI', calculate GMROI = SUM(GP_AMOUNT)/NULLIF((SUM(OPENING_AMOUNT)+SUM(CLOSING_STOCK_AMOUNT))/2.0, 0). If user asks for 'revenue', calculate SUM(ABS(NET_SALE_AMOUNT)). DO NOT substitute revenue when GMROI or another metric is requested!).")
        context.append("3. Strictly match the entity requested: if user asks for 'products' or 'items', query dim_item (e.g. i.ICODE, i.DESC1). If user asks for 'departments', query dim_item.Department. If user asks for 'stores', query dim_location.")
        context.append("4. NET_SALE_AMOUNT and NET_SALE_QUANTITY are stored with negative sign balances. ALWAYS wrap them in ABS() e.g. SUM(ABS(fact_cube_monthly.NET_SALE_AMOUNT)).")
        context.append("5. Store Location Filtering: Map store names to ADMSITE_CODE or dim_location.Name ILIKE patterns:")
        context.append("   - 'VIP' / 'Store VIP' -> ADMSITE_CODE = 6 or dim_location.Name ILIKE '%Vip%'")
        context.append("   - 'Gariahat' / 'Garihat' -> ADMSITE_CODE = 530 or dim_location.Name ILIKE '%Gariahat%'")
        context.append("   - 'Andul' / 'Andul Road' -> ADMSITE_CODE = 820 or dim_location.Name ILIKE '%Andul%'")
        context.append("   - 'Central Warehouse' / 'DC' -> ADMSITE_CODE = 1070")
        context.append("6. Date Filtering: When user asks for 'this month' or 'sales this month', filter by date snapshot (e.g., WHERE MONTH(fact_cube_monthly.REPORT_DATE) = 7 AND YEAR(fact_cube_monthly.REPORT_DATE) = 2026, or max available date).")
        context.append("7. Join fact_cube_monthly to dim_item ON fact_cube_monthly.BARCODE = dim_item.ICODE.")
        context.append("8. Join fact_cube_monthly to dim_location ON fact_cube_monthly.ADMSITE_CODE = dim_location.ADMSITE_CODE.")
        context.append("9. Negative stock quantities (OPENING_QUANTITY, CLOSING_STOCK_QUANTITY, SITE_TRANSFER_OUT_QUANTITY) represent physical goods sold or transferred before digital transfer file/GRN posting.")

        return "\n".join(context)

wren_engine = WrenContextEngine()
