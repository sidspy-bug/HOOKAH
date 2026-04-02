from __future__ import annotations

import re
from typing import Any


SYSTEM_ARTIFACT_PATTERNS = [
    r"\bpdf\b",
    r"\bocr\b",
    r"\bfile\b",
    r"\blayout\b",
    r"\bstructure\b",
    r"\bextract(?:ion|able|ed)?\b",
    r"visual inspection",
    r"multi[\s-]?page",
    r"document format",
    r"limited extractable text",
]

GENERIC_REASONING_PATTERNS = [
    r"this limits conclusions",
    r"more research is needed",
    r"future work is needed",
    r"insufficient data available",
    r"small sample size",
    r"larger datasets are needed",
    r"real world validation is needed",
    r"performance may not generalize",
    r"further studies should explore",
]

OBVIOUSNESS_PATTERNS = [
    r"lacks generalizability",
    r"needs more data",
    r"needs more evaluation",
    r"limited sample",
    r"insufficient diversity",
]


def has_system_artifact_language(text: str) -> bool:
    content = text.lower()
    return any(re.search(pattern, content) for pattern in SYSTEM_ARTIFACT_PATTERNS)


def has_generic_language(text: str) -> bool:
    content = text.lower()
    return any(re.search(pattern, content) for pattern in GENERIC_REASONING_PATTERNS)


def sounds_obvious(text: str) -> bool:
    content = text.lower()
    return any(re.search(pattern, content) for pattern in OBVIOUSNESS_PATTERNS)


def looks_academic(text: str) -> bool:
    content = text.lower()
    signals = [
        "study",
        "method",
        "methodology",
        "dataset",
        "evaluation",
        "result",
        "findings",
        "experiment",
    ]
    return sum(1 for signal in signals if signal in content) >= 2


def validate_paper_analysis(payload: dict[str, Any]) -> bool:
    objective = str(payload.get("objective", "")).strip()
    methodology = str(payload.get("methodology", "")).strip()
    findings = payload.get("key_findings", [])
    if not objective or not methodology or not isinstance(findings, list) or len(findings) < 3:
        return False

    combined = " ".join([objective, methodology] + [str(item) for item in findings])
    if has_system_artifact_language(combined) or has_generic_language(combined):
        return False
    return looks_academic(combined)


def validate_evidence(payload: dict[str, Any], key_findings: list[str]) -> bool:
    limitations = payload.get("limitations", [])
    if not isinstance(limitations, list) or len(limitations) < 3:
        return False

    findings_tokens = _keywords(" ".join(key_findings))
    if not findings_tokens:
        findings_tokens = {"study", "evaluation", "results"}

    matched = 0
    for limitation in limitations:
        statement = str(limitation.get("statement", "")).strip()
        explanation = str(limitation.get("explanation", "")).strip()
        evidence = limitation.get("evidence", [])
        if not statement or not explanation or not isinstance(evidence, list) or len(evidence) < 2:
            return False

        joined = " ".join([statement, explanation] + [str(item) for item in evidence])
        if has_system_artifact_language(joined) or has_generic_language(joined):
            return False

        limitation_tokens = _keywords(joined)
        if limitation_tokens.intersection(findings_tokens):
            matched += 1

    return matched >= 2


def validate_gaps(payload: dict[str, Any]) -> bool:
    gaps = payload.get("gaps", [])
    if not isinstance(gaps, list) or len(gaps) < 3:
        return False

    for gap in gaps:
        title = str(gap.get("title", "")).strip()
        problem = str(gap.get("problem", "")).strip()
        why_exists = str(gap.get("why_gap_exists", "")).strip()
        why_matters = str(gap.get("why_it_matters", "")).strip()
        evidence = gap.get("evidence", [])
        depth_score = _bounded_float(gap.get("depth_score"), default=0.0)
        if not title or not problem or not why_exists or not why_matters:
            return False
        if not isinstance(evidence, list) or len(evidence) < 2:
            return False
        if depth_score < 7.0:
            return False

        joined = " ".join([title, problem, why_exists, why_matters] + [str(item) for item in evidence])
        if has_system_artifact_language(joined) or has_generic_language(joined):
            return False
        if sounds_obvious(joined):
            return False
        if not _mentions_method_or_results(joined):
            return False

    return True


def validate_critical_reasoning(payload: dict[str, Any]) -> bool:
    required_keys = [
        "hidden_assumptions",
        "methodological_weaknesses",
        "conceptual_gaps",
        "contradictions",
        "deep_insights",
    ]
    for key in required_keys:
        items = payload.get(key, [])
        if not isinstance(items, list) or len(items) < 2:
            return False
        joined = " ".join(str(item) for item in items)
        if has_system_artifact_language(joined) or has_generic_language(joined):
            return False
        if not _has_reasoning_signal(joined):
            return False
    return True


def validate_review(payload: dict[str, Any]) -> bool:
    approved = payload.get("approved")
    needs_regeneration = payload.get("needs_regeneration")
    feedback = str(payload.get("feedback", "")).strip()
    gap_reviews = payload.get("gap_reviews", [])
    if not isinstance(approved, bool) or not isinstance(needs_regeneration, bool):
        return False
    if not feedback or not isinstance(gap_reviews, list) or len(gap_reviews) < 3:
        return False

    for review in gap_reviews:
        title = str(review.get("title", "")).strip()
        reasoning_note = str(review.get("reasoning_note", "")).strip()
        revision_focus = str(review.get("revision_focus", "")).strip()
        depth_score = _bounded_float(review.get("depth_score"), default=0.0)
        is_obvious = review.get("is_obvious")
        if not title or not reasoning_note or not revision_focus:
            return False
        if not isinstance(is_obvious, bool):
            return False
        if depth_score <= 0.0:
            return False

    return True


def validate_directions(payload: dict[str, Any]) -> bool:
    directions = payload.get("directions", [])
    if not isinstance(directions, list) or len(directions) < 3:
        return False

    for direction in directions:
        gap_title = str(direction.get("gap_title", "")).strip()
        title = str(direction.get("title", "")).strip()
        approach = str(direction.get("approach", "")).strip()
        if not gap_title or not title or not approach:
            return False
        if has_system_artifact_language(" ".join([gap_title, title, approach])):
            return False
        if has_generic_language(approach):
            return False

    return True


def validate_improvement_plan(payload: dict[str, Any]) -> bool:
    keys = ["missing_angles", "additional_perspectives", "future_improvements"]
    for key in keys:
        items = payload.get(key, [])
        if not isinstance(items, list) or len(items) < 2:
            return False
        if has_system_artifact_language(" ".join(str(item) for item in items)):
            return False
    return True


def _keywords(text: str) -> set[str]:
    cleaned = re.sub(r"[^a-zA-Z0-9\s]", " ", text.lower())
    return {token for token in cleaned.split() if len(token) >= 5}


def _mentions_method_or_results(text: str) -> bool:
    content = text.lower()
    anchors = [
        "method",
        "methodology",
        "evaluation",
        "results",
        "findings",
        "experiment",
        "dataset",
        "performance",
        "causal",
        "validity",
    ]
    return any(anchor in content for anchor in anchors)


def _has_reasoning_signal(text: str) -> bool:
    content = text.lower()
    anchors = [
        "assumes",
        "because",
        "therefore",
        "implies",
        "overclaim",
        "causal",
        "confound",
        "tradeoff",
        "underlying",
        "unmeasured",
    ]
    return any(anchor in content for anchor in anchors)


def _bounded_float(value: Any, default: float) -> float:
    try:
        return round(max(0.0, min(float(value), 10.0)), 2)
    except (TypeError, ValueError):
        return default
