from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_sample_papers() -> list[dict[str, Any]]:
    data_path = Path(__file__).resolve().parent.parent / "data" / "sample_papers.json"
    with data_path.open("r", encoding="utf-8") as f:
        payload = json.load(f)
    return payload.get("papers", [])
