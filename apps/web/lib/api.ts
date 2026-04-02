import type { AnalyzeResponse } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
const API_UNREACHABLE_MESSAGE = `Cannot reach API server at ${API_BASE}. Start the backend on port 8000 and retry.`;

export type AnalyzeRequest = {
  topic: string;
  keywords: string[];
  domain: string | null;
  file?: File | null;
};

export async function analyzeResearchGaps(
  req: AnalyzeRequest
): Promise<AnalyzeResponse> {
  const readError = async (res: Response): Promise<string> => {
    const raw = await res.text();
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.detail === "string") return parsed.detail;
    } catch {
      // no-op
    }
    return raw;
  };

  if (req.file) {
    const formData = new FormData();
    formData.append("file", req.file);

    let res: Response;
    try {
      res = await fetch(`${API_BASE}/api/v1/analyze-pdf`, {
        method: "POST",
        body: formData,
      });
    } catch (error) {
      if (error instanceof TypeError) {
        throw new Error(API_UNREACHABLE_MESSAGE);
      }
      throw error;
    }

    if (!res.ok) {
      const err = await readError(res);
      if (
        res.status === 422 &&
        err.toLowerCase().includes("insufficient textual content for analysis")
      ) {
        throw new Error(
          "This PDF does not contain enough readable research text. If it is a scanned PDF, enable OCR tools (Tesseract + Poppler) or upload a text-based PDF."
        );
      }
      throw new Error(`PDF analysis failed (${res.status}): ${err}`);
    }
    return res.json();
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/api/v1/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: req.topic,
        keywords: req.keywords.filter((k) => k.trim()),
        domain: req.domain || null,
      }),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error(API_UNREACHABLE_MESSAGE);
    }
    throw error;
  }

  if (!res.ok) {
    const err = await readError(res);
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
