export type AnswerValue =
  | string
  | string[]
  | Record<string, string>
  | string[][];

export type SurveyAnswers = Record<string, AnswerValue>;

export function isStringArray(v: AnswerValue | undefined): v is string[] {
  return (
    Array.isArray(v) &&
    (v.length === 0 || typeof v[0] === "string")
  );
}

export function isTableRows(v: AnswerValue | undefined): v is string[][] {
  return (
    Array.isArray(v) &&
    v.length > 0 &&
    Array.isArray(v[0]) &&
    typeof v[0][0] === "string"
  );
}

export function isRankMap(
  v: AnswerValue | undefined,
): v is Record<string, string> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

export function emptyTableRows(type: "table3" | "table2", count = 2): string[][] {
  const cols = type === "table3" ? 3 : 2;
  return Array.from({ length: count }, () => Array(cols).fill(""));
}
