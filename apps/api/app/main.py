from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.pipeline import GapForgePipeline, InsufficientTextError

load_dotenv()

app = FastAPI(
    title="GapForge API",
    version="0.1.0",
    description="AI-assisted research gap discovery backend for hackathon MVP.",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins if o.strip()] + ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = GapForgePipeline()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "gapforge-api"}


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
async def analyze_topic(payload: AnalyzeRequest) -> AnalyzeResponse:
    return await pipeline.run(payload)


@app.post("/api/v1/analyze-pdf", response_model=AnalyzeResponse)
async def analyze_pdf(file: UploadFile = File(...)) -> AnalyzeResponse:
    try:
        content = await file.read()
        if not content:
            raise HTTPException(status_code=400, detail="Empty PDF upload.")
        return await pipeline.run_pdf(content, file.filename)
    except InsufficientTextError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF analysis failed: {exc}") from exc


@app.post("/api/v1/extract-pdf")
async def extract_pdf_title(file: UploadFile = File(...)) -> dict[str, str]:
    try:
        content = await file.read()
        title = pipeline.title_extractor.extract(content, file.filename)
        return {"title": title}
    except Exception:
        return {"title": file.filename or "Untitled Research Paper"}
