# GapForge MVP

GapForge is an **AI-assisted research gap discovery** MVP for hackathon demos.

Users provide a topic (plus optional keywords/domain), and the system:
- analyzes a local sample set of papers,
- extracts limitations and future work,
- synthesizes likely research gaps,
- scores and ranks project directions,
- returns short, execution-friendly project scopes with source references.

> Note: GapForge suggests plausible opportunities from sampled evidence. It does **not** guarantee truly novel research outcomes.

## Project Structure

- `apps/web` — Next.js + TypeScript frontend
- `apps/api` — FastAPI backend with modular multi-agent pipeline
- `docs` — architecture and sample response artifacts

## Architecture (MVP)

### Frontend (Next.js)
- Landing + analysis form
- Results dashboard cards:
  - analyzed papers
  - extracted limitations
  - identified gaps with citations
  - ranked directions with novelty/feasibility/impact/overall scores

### Backend (FastAPI)
- `GET /health`
- `POST /api/v1/analyze`
- Local sample dataset (no external credentials required)
- Multi-agent modules:
  - `PaperAnalyst`
  - `LimitationExtractor`
  - `GapSynthesizer`
  - `NoveltyValidator`
  - `ScopeGenerator`
  - `RankingAgent`

## Setup

## 1) API setup

```bash
cd apps/api
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API endpoints:
- Health: `http://localhost:8000/health`
- Analyze: `http://localhost:8000/api/v1/analyze`

## 2) Web setup

```bash
cd apps/web
npm install
copy .env.example .env.local
npm run dev
```

Frontend URL:
- `http://localhost:3000`

## Example Analyze Request

```json
{
  "topic": "AI assistants for student mental health support",
  "keywords": ["longitudinal", "fairness", "explainability"],
  "domain": "health-ai"
}
```

Sample response: see `docs/sample-api-response.json`.

## Hackathon-Friendly Design Choices

- No auth, no DB, no paid APIs for v0
- Local JSON paper dataset for deterministic demo
- Modular backend so real integrations can be swapped in later (arXiv/PubMed/Semantic Scholar, vector search, LLM-based extraction)

## Future Improvements

1. Add real paper ingestion connectors and caching.
2. Add stronger NLP extraction (NER + relation extraction).
3. Improve novelty check with retrieval against larger corpora.
4. Add experiment planning templates and timeline estimators.
5. Add export (Markdown/PDF) and session persistence.
6. Add test suite and CI pipelines.
