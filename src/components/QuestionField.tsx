"use client";

import type { SchemaQuestion } from "@/lib/schema";

type Props = {
  item: SchemaQuestion;
  checkedKeys: Record<string, boolean>;
  onToggleOption: (
    qId: string,
    value: string,
    type: "single" | "multi",
    checked: boolean,
  ) => void;
  rankValues: Record<string, string>;
  onRankChange: (option: string, value: string) => void;
  tableRows: string[][];
  onTableChange: (rows: string[][]) => void;
  textValues: Record<string, string>;
  onTextChange: (value: string) => void;
};

function optionKey(qId: string, value: string) {
  return `${qId}::${value}`;
}

export default function QuestionField({
  item,
  checkedKeys,
  onToggleOption,
  rankValues,
  onRankChange,
  tableRows,
  onTableChange,
  textValues,
  onTextChange,
}: Props) {
  if (item.type === "text") {
    return (
      <textarea
        id={item.id}
        placeholder="Ваш ответ…"
        value={textValues[item.id] ?? ""}
        onChange={(e) => onTextChange(e.target.value)}
      />
    );
  }

  if (item.type === "rank") {
    return (
      <>
        {(item.options ?? []).map((opt) => (
          <div key={opt} className="survey-rank-row">
            <input
              type="text"
              className="survey-rank-input"
              placeholder="#"
              value={rankValues[opt] ?? ""}
              onChange={(e) => onRankChange(opt, e.target.value)}
            />
            <span>{opt}</span>
          </div>
        ))}
      </>
    );
  }

  if (item.type === "table3" || item.type === "table2") {
    const cols = item.type === "table3" ? 3 : 2;
    const gridClass = item.type === "table3" ? "cols3" : "cols2";
    const placeholders =
      item.type === "table3"
        ? ["Название страницы", "URL", "оставить/убрать/обновить"]
        : ["Название блока", "Что содержит"];

    const updateCell = (ri: number, ci: number, val: string) => {
      const next = tableRows.map((row, i) =>
        i === ri ? row.map((cell, j) => (j === ci ? val : cell)) : [...row],
      );
      onTableChange(next);
    };

    const addRow = () => {
      onTableChange([...tableRows, Array(cols).fill("")]);
    };

    const removeRow = (ri: number) => {
      onTableChange(tableRows.filter((_, i) => i !== ri));
    };

    return (
      <>
        <div className={`survey-rowhead ${gridClass}`}>
          {(item.cols ?? []).map((c) => (
            <div key={c}>{c}</div>
          ))}
          <div />
        </div>
        <div className="survey-rowset">
          {tableRows.map((row, ri) => (
            <div key={ri} className={`survey-drow ${gridClass}`}>
              {row.map((cell, ci) => (
                <input
                  key={ci}
                  type="text"
                  placeholder={placeholders[ci]}
                  value={cell}
                  onChange={(e) => updateCell(ri, ci, e.target.value)}
                />
              ))}
              <button
                type="button"
                className="survey-del"
                onClick={() => removeRow(ri)}
                aria-label="Удалить строку"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="survey-btn survey-btn-ghost survey-btn-sm"
          onClick={addRow}
        >
          {item.type === "table3" ? "+ добавить страницу" : "+ добавить блок"}
        </button>
      </>
    );
  }

  return (
    <>
      {(item.options ?? []).map((opt) => {
        const key = optionKey(item.id, opt);
        const inputType = item.type === "multi" ? "checkbox" : "radio";
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
                onToggleOption(
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
      })}
    </>
  );
}
