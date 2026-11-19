"use client";

import { useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import type { TestResult } from "@/lib/types";

type Metric = "score" | "deviation";   // 点数 / 偏差値

// results：選んだ生徒のテスト結果
export function ScoreChart({ results }: { results: TestResult[] }) {
  const [chosenSubject, setChosenSubject] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("score");

  // 出てくる教科の一覧（Set で重複をなくす）
  const subjects = [...new Set(results.flatMap((r) => r.subjects.map((s) => s.subject)))];

  // 選んでいなければ、最初の教科（生徒を切り替えて、その教科がなくなったときも最初の教科）
  const subject = chosenSubject && subjects.includes(chosenSubject) ? chosenSubject : subjects[0] ?? null;

  // 古い順に並べて、その教科が入っているテストだけをグラフの点にする
  const data = [...results]
    .sort((a, b) => a.date.localeCompare(b.date))
    .flatMap((r) => {
      const s = r.subjects.find((x) => x.subject === subject);
      if (!s) return [];
      return [{
        label: `${Number(r.date.slice(5, 7))}/${Number(r.date.slice(8))} ${r.name}`,
        score: s.score,
        average: s.average,
        deviation: s.deviation,
      }];
    });

  if (subjects.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {subjects.map((name) => (
          <button
            key={name}
            onClick={() => setChosenSubject(name)}
            className={`rounded-full border px-3 py-1 ${name === subject ? "bg-blue-600 text-white" : ""}`}
          >
            {name}
          </button>
        ))}
        <span className="ml-auto flex gap-2">
          <label className="flex items-center gap-1">
            <input type="radio" checked={metric === "score"} onChange={() => setMetric("score")} />
            点数
          </label>
          <label className="flex items-center gap-1">
            <input type="radio" checked={metric === "deviation"} onChange={() => setMetric("deviation")} />
            偏差値
          </label>
        </span>
      </div>

      <LineChart responsive style={{ width: "100%", height: 260 }} data={data} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis domain={metric === "score" ? [0, 100] : [30, 80]} />
        <Tooltip />
        <Legend />
        {metric === "score" && (
          <Line type="monotone" dataKey="score" name="点数" stroke="#2563eb" strokeWidth={2} />
        )}
        {metric === "score" && (
          <Line type="monotone" dataKey="average" name="平均点" stroke="#9ca3af" strokeDasharray="5 5" connectNulls />
        )}
        {metric === "deviation" && (
          <Line type="monotone" dataKey="deviation" name="偏差値" stroke="#dc2626" strokeWidth={2} connectNulls />
        )}
      </LineChart>
    </div>
  );
}
