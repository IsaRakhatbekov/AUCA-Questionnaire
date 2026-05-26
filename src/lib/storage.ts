export type SurveyResponse = {
  id?: number;
  _ts: number;
  dept: string;
  name: string;
  role: string;
  contact: string;
  answers: Record<string, string | string[]>;
};

export async function loadAll(): Promise<SurveyResponse[]> {
  const res = await fetch("/api/responses", { cache: "no-store" });
  if (!res.ok) throw new Error("Не удалось загрузить ответы");
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
  if (!res.ok) throw new Error("Не удалось сохранить ответ");
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
  if (!res.ok) throw new Error("Не удалось импортировать");
  const data = (await res.json()) as { added: number };
  return data.added;
}
