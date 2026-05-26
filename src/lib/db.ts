import type { SurveyResponse } from "@/lib/storage";

export type ResponseRow = {
  id: number;
  created_at: string;
  dept: string;
  name: string | null;
  role: string | null;
  contact: string | null;
  answers: Record<string, string | string[]>;
};

export function rowToResponse(row: ResponseRow): SurveyResponse {
  return {
    id: row.id,
    _ts: new Date(row.created_at).getTime(),
    dept: row.dept,
    name: row.name ?? "",
    role: row.role ?? "",
    contact: row.contact ?? "",
    answers: row.answers ?? {},
  };
}

export function responseToRow(
  resp: Pick<SurveyResponse, "dept" | "name" | "role" | "contact" | "answers"> & {
    _ts?: number;
  },
) {
  return {
    dept: resp.dept,
    name: resp.name || null,
    role: resp.role || null,
    contact: resp.contact || null,
    answers: resp.answers,
    ...(resp._ts
      ? { created_at: new Date(resp._ts).toISOString() }
      : {}),
  };
}
