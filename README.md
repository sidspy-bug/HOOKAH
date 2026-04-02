# GapForge

GapForge is a local-first research intelligence platform that analyzes academic papers and produces structured, reviewer-style outputs:

- paper overview
- grouped limitations
- non-obvious research gaps
- linked research directions
- critical reasoning
- most critical insight
- analysis improvement suggestions

It is designed to feel closer to a research reviewer than a generic summarizer.

## What It Does

GapForge turns this:

`paper -> extracted text -> summary`

into this:

`paper -> overview -> evidence -> limitations -> gaps -> critical reasoning -> reviewer loop -> ranking -> report`

The current system supports:

- topic-based analysis from the bundled sample corpus
- PDF upload analysis
- OCR fallback for scanned PDFs
- local Ollama models for reasoning
- optional Gemini fallback
- structured JSON contracts between stages
- a Next.js UI for report browsing

## Project Structure

- `apps/api` — FastAPI backend and multi-agent pipeline
- `apps/web` — Next.js frontend
- `docs` — supporting docs and artifacts

## Current Pipeline

The backend pipeline is orchestrated in [pipeline.py](/Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/api/app/pipeline.py).

Main stages:

1. `TitleExtractorAgent`
2. `PaperAnalysisAgent`
3. `EvidenceExtractionAgent`
4. `ThemeClusteringAgent`
5. `GapSynthesisAgent`
6. `CriticalReasoningAgent`
7. `ReviewerAgent`
8. `DirectionAgent`
9. `RankingAgent`
10. `ReportFormatterAgent`

## Tech Stack

- Backend: FastAPI, Pydantic, Uvicorn
- Frontend: Next.js 14, React 18, TypeScript
- PDF extraction: `pypdf`, `pdfplumber`, `pymupdf`
- OCR: `rapidocr-onnxruntime`, `pytesseract`, `pdf2image`, `opencv`
- LLM runtime: Ollama local models
- Optional fallback: Gemini via `google-genai`

## API Endpoints

Defined in [main.py](/Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/api/app/main.py).

- `GET /health`
- `POST /api/v1/analyze`
- `POST /api/v1/analyze-pdf`
- `POST /api/v1/extract-pdf`

## Local Setup

### 1. Backend

```bash
cd /Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
python run.py
```

The backend starts on:

- `http://127.0.0.1:8000`

Health check:

```bash
curl http://127.0.0.1:8000/health
```

Expected response:

```json
{"status":"ok","service":"gapforge-api"}
```

### 2. Frontend

This project already includes a bundled Node runtime in `apps/web/env_node`, which is useful if your global `node` is missing or outdated.

```bash
cd /Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/web
cp .env.example .env.local
PATH="$PWD/env_node/bin:$PATH" ./env_node/bin/npm install
PATH="$PWD/env_node/bin:$PATH" ./env_node/bin/npm run dev -- --port 3000
```

The frontend starts on:

- `http://localhost:3000`

## Environment Variables

Backend example values live in [apps/api/.env.example](/Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/api/.env.example).

Important backend variables:

- `API_HOST`
- `API_PORT`
- `ALLOWED_ORIGINS`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_TEMPERATURE`
- `OLLAMA_TIMEOUT_SECONDS`
- `OLLAMA_MAX_RETRIES`
- `OLLAMA_KEEP_ALIVE`
- `ENABLE_GEMINI_FALLBACK`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Frontend example values live in [apps/web/.env.example](/Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/web/.env.example).

Important frontend variable:

- `NEXT_PUBLIC_API_BASE_URL`

## Ollama Integration

GapForge uses Ollama through [ai_client.py](/Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/api/app/api/ai_client.py).

The model is now configurable by environment variable, so you do not need to edit Python code every time you change models.

### Default Local Model

By default GapForge uses:

```bash
OLLAMA_MODEL=qwen2.5:7b-instruct
```

### Start Ollama

Make sure Ollama is installed and running:

```bash
ollama serve
```

In another terminal, pull the model you want:

```bash
ollama pull qwen2.5:7b-instruct
```

### Use Any Local Ollama Model

To switch models, change `OLLAMA_MODEL` in `apps/api/.env`.

Example:

```env
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:8b-instruct
OLLAMA_TEMPERATURE=0.2
OLLAMA_TIMEOUT_SECONDS=240
OLLAMA_MAX_RETRIES=2
OLLAMA_KEEP_ALIVE=5m
```

Then restart the backend:

```bash
cd /Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/api
source .venv/bin/activate
python run.py
```

### Models That Usually Work Well

For structured JSON-heavy prompts, these are good candidates:

- `qwen2.5:7b-instruct`
- `qwen2.5:14b-instruct`
- `llama3.1:8b-instruct`
- `mistral:7b-instruct`
- `deepseek-r1:8b`

Smaller or non-instruct models may still run, but they usually produce weaker JSON compliance.

### How To Verify Your Model Is Available

List installed Ollama models:

```bash
ollama list
```

Test the model directly:

```bash
ollama run qwen2.5:7b-instruct
```

You can also confirm the backend can reach Ollama:

```bash
curl http://localhost:11434/api/tags
```

### If You Want To Point GapForge To Another Ollama Host

Set:

```env
OLLAMA_BASE_URL=http://<host>:11434
```

Then restart the API.

## How Model Swapping Works Internally

GapForge sends prompt requests to Ollama with:

- `model`
- `prompt`
- `stream=false`
- `temperature`
- `keep_alive`

Those values are assembled in [ai_client.py](/Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/api/app/api/ai_client.py).

That means any Ollama model that:

- is installed locally
- accepts prompt-style generation
- can follow strict JSON instructions

can be dropped into the pipeline by changing `OLLAMA_MODEL`.

## PDF and OCR Support

GapForge supports both text-based and scanned PDFs.

### Text Extraction Path

It first tries text-layer extraction with:

- `pdfplumber`
- `pypdf`
- `pymupdf`

### OCR Fallback Path

If the extracted text is too weak, it falls back to OCR using:

- `rapidocr-onnxruntime`
- `pytesseract` when available
- OpenCV preprocessing

This logic lives in [pdf_text_extractor.py](/Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/api/app/services/pdf_text_extractor.py).

### Optional System OCR Tools

GapForge can work without Homebrew because it already has a pure-Python OCR path.

If you want stronger OCR on some scanned PDFs, you can optionally install:

- `tesseract`
- `poppler`

On macOS:

```bash
brew install tesseract poppler
```

These are optional, not required for the current codebase to run.

## Example API Usage

### Analyze Topic

```bash
curl -X POST http://127.0.0.1:8000/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "AI assistants for student mental health support",
    "keywords": ["longitudinal", "fairness", "explainability"],
    "domain": "health-ai"
  }'
```

### Analyze PDF

```bash
curl -X POST http://127.0.0.1:8000/api/v1/analyze-pdf \
  -F "file=@/absolute/path/to/paper.pdf"
```

### Extract PDF Title Only

```bash
curl -X POST http://127.0.0.1:8000/api/v1/extract-pdf \
  -F "file=@/absolute/path/to/paper.pdf"
```

## Expected Response Shape

GapForge returns UI-ready JSON with this high-level structure:

```json
{
  "overview": {},
  "limitations": {
    "grouped": []
  },
  "critical_reasoning": {
    "hidden_assumptions": [],
    "methodological_weaknesses": [],
    "conceptual_gaps": [],
    "contradictions": [],
    "deep_insights": []
  },
  "research_gaps": [],
  "directions": [],
  "insights": [],
  "most_critical_insight": {},
  "analysis_improvements": {
    "missing_angles": [],
    "additional_perspectives": [],
    "future_improvements": []
  }
}
```

The schema is defined in [schemas.py](/Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/api/app/models/schemas.py).

## Common Development Commands

### Backend

```bash
cd /Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/api
source .venv/bin/activate
python run.py
```

### Frontend

```bash
cd /Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/web
PATH="$PWD/env_node/bin:$PATH" ./env_node/bin/npm run dev -- --port 3000
```

### Frontend Production Build Check

```bash
cd /Users/ritesh/Documents/ai_tool/HOOKAH-main/apps/web
PATH="$PWD/env_node/bin:$PATH" ./env_node/bin/npm run build
```

## Troubleshooting

### Frontend shows blank page or client-side exception

- Restart the frontend dev server
- Open a fresh `http://localhost:3000` tab
- If the crash came from old saved result data, run a fresh analysis

### `PDF analysis failed (422): Insufficient textual content for analysis`

This means:

- the PDF has little or no readable text
- OCR could not extract enough useful content

Try:

- a cleaner PDF
- enabling optional system OCR tools
- a text-based PDF export instead of scanned images

### Ollama model is installed but GapForge still uses another model

Check:

- `OLLAMA_MODEL` in `apps/api/.env`
- that the backend was restarted after the change
- that the model name exactly matches `ollama list`

### Ollama is slow or timing out

Increase:

```env
OLLAMA_TIMEOUT_SECONDS=360
OLLAMA_MAX_RETRIES=3
OLLAMA_KEEP_ALIVE=10m
```

Then restart the backend.

### Gemini quota errors

GapForge supports optional Gemini fallback, but it is disabled by default.

If you do not want Gemini fallback:

```env
ENABLE_GEMINI_FALLBACK=0
```

If you do want it:

```env
ENABLE_GEMINI_FALLBACK=1
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.0-flash
```

## Notes for Future Extension

Good places to extend the system:

- add stronger evaluator prompts per research domain
- add export to Markdown or PDF
- add persistent storage instead of only local/session state
- add retrieval over external academic databases
- add unit tests around agent contracts and normalizers

## License / Status

This repository is currently set up as an actively evolving local project rather than a published package. Treat the pipeline and prompt contracts as implementation code, not a stable public API.
