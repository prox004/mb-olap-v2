import re
import json
from typing import List, Dict, Any
from duckdb import DuckDBPyConnection

ENTITY_EXTRACTION_SYSTEM_PROMPT = """Extract likely business/entity phrases from the user's retail analytics question.

Return JSON only in this exact shape:
{"entities":["phrase 1","phrase 2"]}

Rules:
- Extract only noun-like business/entity phrases that may need database matching.
- Include supplier names, brand/company names, category phrases, department/section/division phrases, product codes, product-type phrases, and short description-like product references.
- Do not include metric words like sales, profit, margin, top, bottom, highest, lowest, report, show.
- Keep phrases short and literal from the user's query.
- Maximum 5 phrases.
- If there are no likely entity phrases, return {"entities":[]}.
"""

def normalize_entity_text(text: str) -> str:
    return re.sub(r"[^A-Z0-9]+", "", text.upper())

def extract_entities_with_llm(groq_service, raw_query: str) -> List[str]:
    """
    Extracts entity phrases from user prompt using Groq API.
    """
    if not groq_service.client:
        return []
    try:
        messages = [
            {"role": "system", "content": ENTITY_EXTRACTION_SYSTEM_PROMPT},
            {"role": "user", "content": raw_query}
        ]
        content = groq_service._create_completion(messages, temperature=0.0, max_tokens=256)
        if not content:
            return []
        content = re.sub(r"<think>.*?</think>", "", content, flags=re.DOTALL).strip()

        # Clean markdown wrappers if any
        if content.startswith("```"):
            content = re.sub(r"^```json\s*|^```\s*|```$", "", content, flags=re.MULTILINE).strip()

        payload = json.loads(content)
        entities = payload.get("entities", [])
        if not isinstance(entities, list):
            return []
        cleaned = [e.strip() for e in entities if isinstance(e, str) and e.strip()]
        return cleaned[:5]
    except Exception as e:
        print(f"[ENTITY_EXTRACTOR] Entity extraction failed: {e}")
        return []

def search_entity_candidates(db: DuckDBPyConnection, entity_phrases: List[str], limit_per_phrase: int = 10) -> List[Dict[str, Any]]:
    """
    Fuzzy/normalized search in DuckDB tables (dim_item, dim_location) for candidate matching.
    """
    if not entity_phrases:
        return []

    candidates = []
    seen = set()

    search_specs = [
        ("supplier", "dim_item", "PARTYNAME"),
        ("category", "dim_item", "CNAME1"),
        ("category", "dim_item", "CNAME2"),
        ("division", "dim_item", "Division"),
        ("section", "dim_item", "Section"),
        ("department", "dim_item", "Department"),
        ("product_code", "dim_item", "ICODE"),
        ("product_text", "dim_item", "DESC1"),
        ("store_name", "dim_location", "Name"),
    ]

    for phrase in entity_phrases:
        normalized_phrase = normalize_entity_text(phrase)
        if len(normalized_phrase) < 2:
            continue
        like_value = f"%{normalized_phrase}%"

        for entity_type, table_name, column_name in search_specs:
            sql = f"""
            SELECT DISTINCT {column_name} AS candidate
            FROM {table_name}
            WHERE {column_name} IS NOT NULL
              AND CAST({column_name} AS VARCHAR) <> ''
              AND REGEXP_REPLACE(UPPER(CAST({column_name} AS VARCHAR)), '[^A-Z0-9]+', '', 'g') LIKE ?
            LIMIT ?
            """
            try:
                rows = db.execute(sql, [like_value, limit_per_phrase]).fetchall()
                for row in rows:
                    val = row[0]
                    key = (entity_type, val)
                    if not val or key in seen:
                        continue
                    seen.add(key)
                    candidates.append({
                        "query_phrase": phrase,
                        "entity_type": entity_type,
                        "value": str(val),
                        "normalized_value": normalize_entity_text(str(val))
                    })
            except Exception:
                continue

    return candidates[:30]

def should_attempt_zero_result_repair(raw_query: str) -> bool:
    q = raw_query.lower()
    explicit_zero_cases = ["zero sales", "no sales", "without sales", "dead stock", "not sold", "unsold"]
    return not any(phrase in q for phrase in explicit_zero_cases)
