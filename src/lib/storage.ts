import type { SurveyAnswers } from "@/lib/answers";

export type SurveyResponse = {
  id?: number;
  _ts: number;
  dept: string;
  name: string;
  role: string;
  contact: string;
  answers: SurveyAnswers;
};

async function apiError(res: Response, fallback: string): Promise<never> {
  try {
    const data = (await res.json()) as { error?: string };
    throw new Error(data.error || fallback);
  } catch (e) {
    if (e instanceof Error && e.message !== fallback) throw e;
    throw new Error(fallback);
  }
}

export async function loadAll(): Promise<SurveyResponse[]> {
  const res = await fetch("/api/responses", { cache: "no-store" });
  if (!res.ok) await apiError(res, "Не удалось загрузить ответы");
  return res.json() as Promise<SurveyResponse[]>;
}

export async function submitResponse(
  resp: Omit<SurveyResponse, "id">,
): Promise<SurveyResponse> {
  const res = await fetch("/api/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resp),
  });
  if (!res.ok) await apiError(res, "Не удалось сохранить ответ");
  return res.json() as Promise<SurveyResponse>;
}

export async function importResponses(
  responses: SurveyResponse[],
): Promise<number> {
  const res = await fetch("/api/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ responses }),
  });
  if (!res.ok) await apiError(res, "Не удалось импортировать");
  const data = (await res.json()) as { added: number };
  return data.added;
}
