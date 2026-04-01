import type { AnalyzeResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export type AnalyzeRequest = {
  topic: string;
  keywords: string[];
  domain: string | null;
};

export async function analyzeResearchGaps(
  req: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const res = await fetch(`${API_BASE}/api/v1/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      topic: req.topic,
      keywords: req.keywords.filter((k) => k.trim()),
      domain: req.domain || null,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Analysis failed (${res.status}): ${err}`);
  }

  return res.json();
}

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    return res.ok;
  } catch {
    return false;
  }
}
