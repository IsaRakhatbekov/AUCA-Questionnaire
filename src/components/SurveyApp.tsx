"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  emptyTableRows,
  type SurveyAnswers,
} from "@/lib/answers";
import {
  isQuestion,
  QUESTION_COUNT,
  SCHEMA,
  type SchemaQuestion,
} from "@/lib/schema";
import {
  loadAll,
  submitResponse,
  type SurveyResponse,
} from "@/lib/storage";
import QuestionField from "@/components/QuestionField";
import { renderAllQuestionStats } from "@/components/QuestionStats";

function responseKey(r: SurveyResponse): string {
  return String(r.id ?? r._ts);
}

type Panel = "form" | "stats";

type Meta = {
  dept: string;
  name: string;
  role: string;
};

const emptyMeta: Meta = { dept: "", name: "", role: "" };

function buildQuestionSections() {
  const sections: {
    section: string;
    note?: string;
    questions: { item: SchemaQuestion; num: number }[];
  }[] = [];
  let current: (typeof sections)[number] | null = null;
  let num = 0;

  for (const item of SCHEMA) {
    if (isQuestion(item)) {
      num += 1;
      current?.questions.push({ item, num });
    } else {
      current = { section: item.section, note: item.note, questions: [] };
      sections.push(current);
    }
  }

  return sections;
}

const QUESTION_SECTIONS = buildQuestionSections();

function initTableState(): Record<string, string[][]> {
  const tables: Record<string, string[][]> = {};
  for (const item of SCHEMA) {
    if (isQuestion(item) && (item.type === "table3" || item.type === "table2")) {
      tables[item.id] = emptyTableRows(item.type);
    }
  }
  return tables;
}

export default function SurveyApp() {
  const [panel, setPanel] = useState<Panel>("form");
  const [meta, setMeta] = useState<Meta>(emptyMeta);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState<Record<string, boolean>>({});
  const [textValues, setTextValues] = useState<Record<string, string>>({});
  const [rankValues, setRankValues] = useState<
    Record<string, Record<string, string>>
  >({});
  const [tableValues, setTableValues] = useState<Record<string, string[][]>>(
    initTableState,
  );
  const [formKey, setFormKey] = useState(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastVisible(false), 2600);
  }, []);

  const refreshStats = useCallback(async () => {
    try {
      setResponses(await loadAll());
    } catch {
      showToast("Не удалось загрузить ответы");
    }
  }, [showToast]);

  useEffect(() => {
    void refreshStats();
  }, [refreshStats]);

  const optionKey = (qId: string, value: string) => `${qId}::${value}`;

  const toggleOption = (
    qId: string,
    value: string,
    type: "single" | "multi",
    checked: boolean,
  ) => {
    const key = optionKey(qId, value);
    setCheckedKeys((prev) => {
      const next = { ...prev };
      if (type === "single") {
        Object.keys(next).forEach((k) => {
          if (k.startsWith(`${qId}::`)) delete next[k];
        });
        if (checked) next[key] = true;
      } else {
        if (checked) next[key] = true;
        else delete next[key];
      }
      return next;
    });
  };

  const collectAnswers = (): SurveyAnswers => {
    const answers: SurveyAnswers = {};

    for (const item of SCHEMA) {
      if (!isQuestion(item)) continue;

      if (item.type === "text") {
        answers[item.id] = textValues[item.id]?.trim() ?? "";
      } else if (item.type === "multi") {
        answers[item.id] = Object.entries(checkedKeys)
          .filter(([k, v]) => v && k.startsWith(`${item.id}::`))
          .map(([k]) => k.slice(item.id.length + 2));
      } else if (item.type === "single") {
        const checked = Object.entries(checkedKeys).find(
          ([k, v]) => v && k.startsWith(`${item.id}::`),
        );
        answers[item.id] = checked
          ? checked[0].slice(item.id.length + 2)
          : "";
      } else if (item.type === "rank") {
        const map = rankValues[item.id] ?? {};
        const filtered: Record<string, string> = {};
        for (const [opt, val] of Object.entries(map)) {
          if (val.trim()) filtered[opt] = val.trim();
        }
        answers[item.id] = filtered;
      } else if (item.type === "table3" || item.type === "table2") {
        const rows = (tableValues[item.id] ?? []).map((row) =>
          row.map((c) => c.trim()),
        );
        answers[item.id] = rows.filter((row) => row.some((c) => c));
      }
    }

    return answers;
  };

  const submitForm = async () => {
    const dept = meta.dept.trim();
    if (!dept) {
      showToast("Укажите департамент");
      return;
    }

    const resp: SurveyResponse = {
      _ts: Date.now(),
      dept,
      name: meta.name.trim(),
      role: meta.role.trim(),
      contact: "",
      answers: collectAnswers(),
    };

    try {
      await submitResponse(resp);
      await refreshStats();
      showToast(`✓ Ответы сохранены! Спасибо, ${dept}`);
      clearForm();
    } catch {
      showToast("Ошибка сохранения");
    }
  };

  const clearForm = () => {
    setMeta(emptyMeta);
    setCheckedKeys({});
    setTextValues({});
    setRankValues({});
    setTableValues(initTableState());
    setFormKey((k) => k + 1);
  };

  const uniqueDepts = useMemo(
    () => new Set(responses.map((r) => r.dept)).size,
    [responses],
  );

  const statsBody = useMemo(() => {
    if (!responses.length) {
      return (
        <div className="survey-card">
          <div className="survey-empty">
            Пока никто не заполнил анкету. Статистика появится после первых
            ответов.
          </div>
        </div>
      );
    }
    return <>{renderAllQuestionStats(responses)}</>;
  }, [responses]);

  return (
    <div className="survey-root">
      <div className="survey-wrap">
        <header className="survey-header">
          <h1>Анкета для департаментов</h1>
          <p>
            Сбор требований для редизайна сайта AUCA. Ваши ответы лягут в основу
            технического задания.
          </p>
        </header>

        <div className="survey-tabs">
          <button
            type="button"
            className={`survey-tab${panel === "form" ? " active" : ""}`}
            onClick={() => setPanel("form")}
          >
            📝 Заполнить анкету
          </button>
          <button
            type="button"
            className={`survey-tab${panel === "stats" ? " active" : ""}`}
            onClick={() => {
              setPanel("stats");
              void refreshStats();
            }}
          >
            📊 Статистика ответов
          </button>
        </div>

        <div
          className={`survey-panel${panel === "form" ? " active" : ""}`}
          key={formKey}
        >
          <div className="survey-card">
            <div className="survey-sec-title">Информация о заполняющем</div>
            <div className="survey-meta-grid" style={{ marginTop: 14 }}>
              <div>
                <label htmlFor="m_dept">
                  Департамент / отдел <span className="survey-req">*</span>
                </label>
                <input
                  type="text"
                  id="m_dept"
                  placeholder="Например: Приёмная комиссия"
                  value={meta.dept}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, dept: e.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="m_name">ФИО заполняющего</label>
                <input
                  type="text"
                  id="m_name"
                  placeholder="Имя Фамилия"
                  value={meta.name}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, name: e.target.value }))
                  }
                />
              </div>
              <div>
                <label htmlFor="m_role">Должность</label>
                <input
                  type="text"
                  id="m_role"
                  placeholder="Например: Координатор"
                  value={meta.role}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, role: e.target.value }))
                  }
                />
              </div>
            </div>
          </div>

          {QUESTION_SECTIONS.map((sec) => (
            <div className="survey-card" key={sec.section}>
              <div className="survey-sec-title">{sec.section}</div>
              {sec.note ? (
                <div className="survey-sec-note">{sec.note}</div>
              ) : null}
              {sec.questions.map(({ item, num }) => (
                <div className="survey-q" key={item.id}>
                  <div className="survey-q-label">
                    <span className="survey-q-num">{num}.</span> {item.label}
                  </div>
                  {item.hint ? (
                    <div className="survey-q-hint">{item.hint}</div>
                  ) : null}
                  <QuestionField
                    item={item}
                    checkedKeys={checkedKeys}
                    onToggleOption={toggleOption}
                    rankValues={rankValues[item.id] ?? {}}
                    onRankChange={(opt, val) =>
                      setRankValues((prev) => ({
                        ...prev,
                        [item.id]: { ...(prev[item.id] ?? {}), [opt]: val },
                      }))
                    }
                    tableRows={
                      tableValues[item.id] ??
                      emptyTableRows(
                        item.type === "table3" ? "table3" : "table2",
                      )
                    }
                    onTableChange={(rows) =>
                      setTableValues((prev) => ({ ...prev, [item.id]: rows }))
                    }
                    textValues={textValues}
                    onTextChange={(val) =>
                      setTextValues((prev) => ({ ...prev, [item.id]: val }))
                    }
                  />
                </div>
              ))}
            </div>
          ))}

          <div className="survey-card">
            <div className="survey-btnrow">
              <button
                type="button"
                className="survey-btn survey-btn-primary"
                onClick={() => void submitForm()}
              >
                ✓ Отправить ответы
              </button>
              <button
                type="button"
                className="survey-btn survey-btn-ghost"
                onClick={clearForm}
              >
                Очистить форму
              </button>
            </div>
            <p className="survey-fine">
              После отправки ваши ответы добавятся в общую статистику. Можно
              отправить ещё раз от другого департамента.
            </p>
          </div>
        </div>

        <div className={`survey-panel${panel === "stats" ? " active" : ""}`}>
          <div className="survey-card">
            <div className="survey-sec-title">Сводка ответов</div>
            <div className="survey-stat-top">
              <div className="survey-stat-box">
                <b>{responses.length}</b>
                <small>ответов получено</small>
              </div>
              <div className="survey-stat-box">
                <b>{uniqueDepts}</b>
                <small>уникальных департаментов</small>
              </div>
              <div className="survey-stat-box">
                <b>{QUESTION_COUNT}</b>
                <small>вопросов в анкете</small>
              </div>
            </div>
            <div>
              <b style={{ fontSize: 14 }}>Ответившие департаменты:</b>
              <div style={{ marginTop: 8 }}>
                {responses.length ? (
                  responses.map((r) => (
                    <span key={responseKey(r)} className="survey-resp-chip">
                      {r.dept}
                      {r.name ? ` · ${r.name}` : ""}
                    </span>
                  ))
                ) : (
                  <span style={{ color: "var(--gray)" }}>Пока нет ответов</span>
                )}
              </div>
            </div>
          </div>
          <div>{statsBody}</div>
        </div>
      </div>

      <div className={`survey-toast${toastVisible ? " show" : ""}`}>
        {toast}
      </div>
    </div>
  );
}
