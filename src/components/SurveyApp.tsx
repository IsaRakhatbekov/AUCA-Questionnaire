"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  isQuestion,
  QUESTION_COUNT,
  SCHEMA,
  type SchemaQuestion,
} from "@/lib/schema";
import {
  importResponses,
  loadAll,
  submitResponse,
  type SurveyResponse,
} from "@/lib/storage";

function responseKey(r: SurveyResponse): string {
  return String(r.id ?? r._ts);
}
type Panel = "form" | "stats";

type Meta = {
  dept: string;
  name: string;
  role: string;
  contact: string;
};

const emptyMeta: Meta = { dept: "", name: "", role: "", contact: "" };

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

export default function SurveyApp() {
  const [panel, setPanel] = useState<Panel>("form");
  const [meta, setMeta] = useState<Meta>(emptyMeta);
  const [responses, setResponses] = useState<SurveyResponse[]>([]);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [checkedKeys, setCheckedKeys] = useState<Record<string, boolean>>({});
  const [formKey, setFormKey] = useState(0);
  const importRef = useRef<HTMLInputElement>(null);
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

  const collectAnswers = (): Record<string, string | string[]> => {
    const answers: Record<string, string | string[]> = {};
    for (const item of SCHEMA) {
      if (!isQuestion(item)) continue;
      if (item.type === "text") {
        const el = document.getElementById(item.id) as HTMLTextAreaElement | null;
        answers[item.id] = el?.value.trim() ?? "";
      } else {
        const checked = Object.entries(checkedKeys)
          .filter(([k, v]) => v && k.startsWith(`${item.id}::`))
          .map(([k]) => k.slice(item.id.length + 2));
        answers[item.id] =
          item.type === "multi" ? checked : (checked[0] ?? "");
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
      contact: meta.contact.trim(),
      answers: collectAnswers(),
    };

    try {
      await submitResponse(resp);
      await refreshStats();
      showToast(`✓ Ответы сохранены! Спасибо, ${dept}`);
      clearForm();
    } catch {
      showToast("Ошибка сохранения. Проверьте .env.local");
    }
  };

  const clearForm = () => {
    setMeta(emptyMeta);
    setCheckedKeys({});
    setFormKey((k) => k + 1);
  };

  const exportData = async () => {
    const all = await loadAll();
    const blob = new Blob([JSON.stringify(all, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `auca_survey_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("Файл с ответами скачан");
  };

  const importData = async (file: File) => {
    try {
      const imported = JSON.parse(await file.text()) as SurveyResponse[];
      if (!Array.isArray(imported)) throw new Error("invalid");
      const added = await importResponses(imported);
      await refreshStats();
      showToast(`Импортировано новых ответов: ${added}`);
    } catch {
      showToast("Ошибка: неверный файл");
    }
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

    let n = 0;
    const blocks: React.ReactNode[] = [];

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
      const qNum = n;

      if (item.type === "text") {
        const rows = responses
          .filter((r) => r.answers[item.id])
          .map((r) => (
            <div key={responseKey(r)} className="survey-ta">
              <b>{r.dept}:</b> {String(r.answers[item.id])}
            </div>
          ));

        blocks.push(
          <div key={item.id} className="survey-bar-q">
            <h4>
              <span style={{ color: "var(--teal)", fontWeight: 800 }}>
                {qNum}.
              </span>{" "}
              {item.label}
            </h4>
            <div className="survey-text-answers">
              {rows.length ? (
                rows
              ) : (
                <span style={{ color: "var(--gray)", fontSize: 13 }}>
                  Нет ответов
                </span>
              )}
            </div>
          </div>,
        );
      } else {
        const counts: Record<string, number> = {};
        for (const o of item.options ?? []) counts[o] = 0;
        for (const r of responses) {
          const v = r.answers[item.id];
          if (Array.isArray(v)) {
            for (const x of v) {
              if (x in counts) counts[x] += 1;
            }
          } else if (v && v in counts) {
            counts[v] += 1;
          }
        }
        const max = Math.max(1, ...Object.values(counts));

        blocks.push(
          <div key={item.id} className="survey-bar-q">
            <h4>
              <span style={{ color: "var(--teal)", fontWeight: 800 }}>
                {qNum}.
              </span>{" "}
              {item.label}
            </h4>
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
          </div>,
        );
      }
    }

    return <>{blocks}</>;
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

        <div className="survey-warn">
          <b>Общая база включена.</b> Ответы сохраняются в Supabase — статистика
          общая для всех, кто открывает сайт.
        </div>

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
              <div>
                <label htmlFor="m_contact">Email / телефон</label>
                <input
                  type="text"
                  id="m_contact"
                  placeholder="email@auca.kg"
                  value={meta.contact}
                  onChange={(e) =>
                    setMeta((m) => ({ ...m, contact: e.target.value }))
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
                  {item.type === "text" ? (
                    <textarea
                      id={item.id}
                      placeholder="Ваш ответ…"
                      defaultValue=""
                    />
                  ) : (
                    (item.options ?? []).map((opt) => {
                      const key = optionKey(item.id, opt);
                      const inputType =
                        item.type === "multi" ? "checkbox" : "radio";
                      return (
                        <label
                          key={opt}
                          className={`survey-opt${checkedKeys[key] ? " checked" : ""}`}
                        >
                          <input
                            type={inputType}
                            name={item.id}
                            value={opt}
                            checked={!!checkedKeys[key]}
                            onChange={(e) =>
                              toggleOption(
                                item.id,
                                opt,
                                item.type as "single" | "multi",
                                e.target.checked,
                              )
                            }
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })
                  )}
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
            <div className="survey-btnrow" style={{ marginTop: 18 }}>
              <button
                type="button"
                className="survey-btn survey-btn-gold"
                onClick={() => void exportData()}
              >
                ⬇ Экспорт всех ответов (JSON)
              </button>
              <button
                type="button"
                className="survey-btn survey-btn-ghost"
                onClick={() => importRef.current?.click()}
              >
                ⬆ Импорт ответов
              </button>
              <input
                ref={importRef}
                type="file"
                accept=".json"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void importData(file);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                className="survey-btn survey-btn-ghost"
                onClick={() => void refreshStats()}
              >
                ↻ Обновить
              </button>
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
