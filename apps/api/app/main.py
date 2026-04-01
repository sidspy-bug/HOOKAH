from __future__ import annotations

import os

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.models.schemas import AnalyzeRequest, AnalyzeResponse
from app.pipeline import GapForgePipeline

load_dotenv()

app = FastAPI(
    title="GapForge API",
    version="0.1.0",
    description="AI-assisted research gap discovery backend for hackathon MVP.",
)

allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in allowed_origins if o.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = GapForgePipeline()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "gapforge-api"}


@app.post("/api/v1/analyze", response_model=AnalyzeResponse)
def analyze_topic(payload: AnalyzeRequest) -> AnalyzeResponse:
    return pipeline.run(payload)
