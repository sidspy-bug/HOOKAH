# GapForge MVP Architecture

## Product Positioning

GapForge is an **AI-assisted research gap discovery** system.

It helps users explore plausible opportunities from a small literature sample. It does not claim guaranteed novelty.

## High-Level Architecture

### Frontend: Next.js + TypeScript (`apps/web`)

- Landing section with positioning copy
- Input form:
  - research topic (required)
  - keywords (optional)
  - domain (optional)
- Dashboard output:
  - analyzed papers
  - extracted limitations
  - identified research gaps with source references
  - ranked research directions with scores + short project scope

### Backend: FastAPI (`apps/api`)

- `GET /health`
- `POST /api/v1/analyze`
- Local sample paper dataset in JSON (`app/data/sample_papers.json`)
- No external credentials required for MVP

## Multi-Agent Pipeline (MVP)

Request flow:

1. **Paper Analyst**
   - Selects most relevant papers from local dataset based on topic/keywords/domain overlap.
2. **Limitation Extractor**
   - Extracts limitations and future-work statements.
3. **Gap Synthesizer**
   - Clusters recurring signals into gap candidates.
4. **Novelty Validator**
   - Assigns heuristic novelty/impact/feasibility scores.
5. **Scope Generator**
   - Produces concise project hypothesis + short 8–10 week scope.
6. **Ranking Agent**
   - Computes weighted overall score and rank priority.

## API Contract

### Analyze Request

```json
{
  "topic": "AI assistants for student mental health support",
  "keywords": ["longitudinal", "fairness", "explainability"],
  "domain": "health-ai"
}
```

### Analyze Response

Returns:
- `analyzed_papers`
- `extracted_limitations`
- `identified_research_gaps`
- `top_suggested_research_directions`

Each suggested direction includes:
- `novelty_score`
- `feasibility_score`
- `impact_score`
- `overall_score`
- `short_scope`
- `citations`

See full sample in `docs/sample-api-response.json`.

## Extensibility Plan

- Replace local dataset loader with connectors (arXiv, Semantic Scholar, PubMed)
- Upgrade extraction to stronger NLP/LLM modules
- Add retrieval and novelty cross-checking over larger corpora
- Add persistent storage for run history and export artifacts