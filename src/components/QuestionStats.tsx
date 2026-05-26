import type { ReactNode } from "react";
import { isQuestion, SCHEMA } from "@/lib/schema";
import {
  isRankMap,
  isStringArray,
  isTableRows,
  type AnswerValue,
} from "@/lib/answers";
import type { SurveyResponse } from "@/lib/storage";
import type { SchemaQuestion } from "@/lib/schema";

function responseKey(r: SurveyResponse) {
  return String(r.id ?? r._ts);
}

function TextAnswers({
  responses,
  qId,
}: {
  responses: SurveyResponse[];
  qId: string;
}) {
  const rows = responses
    .filter((r) => r.answers[qId])
    .map((r) => (
      <div key={responseKey(r)} className="survey-ta">
        <b>{r.dept}:</b> {String(r.answers[qId])}
      </div>
    ));

  return (
    <div className="survey-text-answers">
      {rows.length ? (
        rows
      ) : (
        <span style={{ color: "var(--gray)", fontSize: 13 }}>Нет ответов</span>
      )}
    </div>
  );
}

function ChoiceBars({ item, responses }: { item: SchemaQuestion; responses: SurveyResponse[] }) {
  const counts: Record<string, number> = {};
  for (const o of item.options ?? []) counts[o] = 0;

  for (const r of responses) {
    const v = r.answers[item.id] as AnswerValue | undefined;
    if (isStringArray(v)) {
      for (const x of v) {
        if (x in counts) counts[x] += 1;
      }
    } else if (typeof v === "string" && v in counts) {
      counts[v] += 1;
    }
  }

  const max = Math.max(1, ...Object.values(counts));

  return (
    <>
      {(item.options ?? []).map((o) => {
        const c = counts[o];
        return (
          <div key={o} className="survey-bar-row">
            <div className="survey-bar-label">{o}</div>
            <div className="survey-bar-track">
              <div
                className="survey-bar-fill"
                style={{ width: `${(c / max) * 100}%` }}
              />
            </div>
            <div className="survey-bar-val">{c}</div>
          </div>
        );
      })}
    </>
  );
}

function RankBars({ item, responses }: { item: SchemaQuestion; responses: SurveyResponse[] }) {
  const sums: Record<string, number> = {};
  const cnts: Record<string, number> = {};
  for (const o of item.options ?? []) {
    sums[o] = 0;
    cnts[o] = 0;
  }

  for (const r of responses) {
    const o = r.answers[item.id];
    if (!isRankMap(o)) continue;
    for (const [k, val] of Object.entries(o)) {
      const num = parseFloat(val);
      if (!Number.isNaN(num) && k in sums) {
        sums[k] += num;
        cnts[k] += 1;
      }
    }
  }

  const avg = (item.options ?? [])
    .map((o) => ({
      o,
      a: cnts[o] ? sums[o] / cnts[o] : 99,
      c: cnts[o],
    }))
    .sort((x, y) => x.a - y.a);

  return (
    <>
      {avg.map((x) => (
        <div key={x.o} className="survey-bar-row">
          <div className="survey-bar-label">{x.o}</div>
          <div className="survey-bar-track">
            <div
              className="survey-bar-fill"
              style={{
                width: `${x.c ? ((9 - Math.min(8, x.a)) / 8) * 100 : 0}%`,
              }}
            />
          </div>
          <div className="survey-bar-val">{x.c ? x.a.toFixed(1) : "—"}</div>
        </div>
      ))}
      <div className="survey-rank-note">
        Средний приоритет (меньше = важнее), отсортировано
      </div>
    </>
  );
}

function TableAnswers({
  responses,
  qId,
}: {
  responses: SurveyResponse[];
  qId: string;
}) {
  const blocks = responses
    .filter((r) => {
      const v = r.answers[qId];
      return isTableRows(v) && v.length > 0;
    })
    .map((r) => {
      const rows = r.answers[qId] as string[][];
      return (
        <div key={responseKey(r)} className="survey-ta">
          <b>{r.dept}:</b>
          {rows.map((row, i) => (
            <div key={i} className="survey-table-line">
              {row.filter(Boolean).join(" · ")}
            </div>
          ))}
        </div>
      );
    });

  return (
    <div className="survey-text-answers">
      {blocks.length ? (
        blocks
      ) : (
        <span style={{ color: "var(--gray)", fontSize: 13 }}>Нет ответов</span>
      )}
    </div>
  );
}

export function renderAllQuestionStats(responses: SurveyResponse[]) {
  let n = 0;
  const blocks: ReactNode[] = [];

  for (const item of SCHEMA) {
    if (!isQuestion(item)) {
      blocks.push(
        <div key={item.section} className="survey-sec-title">
          {item.section}
        </div>,
      );
      continue;
    }

    n += 1;

    let body: ReactNode;
    if (item.type === "text") {
      body = <TextAnswers responses={responses} qId={item.id} />;
    } else if (item.type === "rank") {
      body = <RankBars item={item} responses={responses} />;
    } else if (item.type === "table3" || item.type === "table2") {
      body = <TableAnswers responses={responses} qId={item.id} />;
    } else {
      body = <ChoiceBars item={item} responses={responses} />;
    }

    blocks.push(
      <div key={item.id} className="survey-bar-q">
        <h4>
          <span style={{ color: "var(--teal)", fontWeight: 800 }}>{n}.</span>{" "}
          {item.label}
        </h4>
        {body}
      </div>,
    );
  }

  return blocks;
}
