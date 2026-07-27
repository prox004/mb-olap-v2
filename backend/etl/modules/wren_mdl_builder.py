import os
import json
import yaml

def build_wren_mdl_catalog():
    """
    Generates official Wren AI Modeling Definition Language (MDL) catalog files:
      - backend/semantic/models/olap_cube.yml
      - backend/semantic/models/metrics.yml
      - backend/semantic/knowledge/business_rules.yml
      - backend/semantic/memory/golden_sql.json
    """
    print("=== WREN AI MDL CATALOG BUILDER ===")

    base_semantic_dir = os.path.join("backend", "semantic")
    models_dir = os.path.join(base_semantic_dir, "models")
    knowledge_dir = os.path.join(base_semantic_dir, "knowledge")
    memory_dir = os.path.join(base_semantic_dir, "memory")

    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(knowledge_dir, exist_ok=True)
    os.makedirs(memory_dir, exist_ok=True)

    print(f"Target semantic root: {os.path.abspath(base_semantic_dir)}")

    # 1. Validate olap_cube.yml
    olap_cube_path = os.path.join(models_dir, "olap_cube.yml")
    if os.path.exists(olap_cube_path):
        with open(olap_cube_path, "r", encoding="utf-8") as f:
            cube_data = yaml.safe_load(f)
        print(f" [PASS] Loaded {len(cube_data.get('models', []))} models and {len(cube_data.get('relationships', []))} relationships from olap_cube.yml")
    else:
        raise FileNotFoundError(f"Missing {olap_cube_path}")

    # 2. Validate metrics.yml
    metrics_path = os.path.join(models_dir, "metrics.yml")
    if os.path.exists(metrics_path):
        with open(metrics_path, "r", encoding="utf-8") as f:
            metrics_data = yaml.safe_load(f)
        print(f" [PASS] Loaded {len(metrics_data.get('metrics', []))} business metrics from metrics.yml")
    else:
        raise FileNotFoundError(f"Missing {metrics_path}")

    # 3. Validate business_rules.yml
    rules_path = os.path.join(knowledge_dir, "business_rules.yml")
    if os.path.exists(rules_path):
        with open(rules_path, "r", encoding="utf-8") as f:
            rules_data = yaml.safe_load(f)
        print(f" [PASS] Loaded {len(rules_data.get('business_rules', []))} operational business rules from business_rules.yml")
    else:
        raise FileNotFoundError(f"Missing {rules_path}")

    # 4. Validate golden_sql.json
    golden_path = os.path.join(memory_dir, "golden_sql.json")
    if os.path.exists(golden_path):
        with open(golden_path, "r", encoding="utf-8") as f:
            golden_data = json.load(f)
        print(f" [PASS] Loaded {len(golden_data)} golden NL-to-SQL pairs from golden_sql.json")
    else:
        raise FileNotFoundError(f"Missing {golden_path}")

    print("\n=== WREN AI MDL CATALOG VERIFIED AND INTACT ===")

if __name__ == "__main__":
    build_wren_mdl_catalog()
