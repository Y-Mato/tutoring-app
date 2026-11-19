"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { TEST_KIND_LABELS, toNumberOrNull } from "@/lib/testResults";
import type { Judgement, Student, StudentData, SubjectScore, TestKind, TestResultData } from "@/lib/types";

// 入力中は文字列で持つ
type SubjectRow = { subject: string; score: string; average: string; deviation: string };
type JudgementRow = { school: string; grade: string };

const EMPTY_SUBJECT: SubjectRow = { subject: "", score: "", average: "", deviation: "" };
const EMPTY_JUDGEMENT: JudgementRow = { school: "", grade: "" };

// 保存されている数値 → 入力欄の文字列（null は空欄）
function toText(value: number | null): string {
  return value === null ? "" : String(value);
}

type Props = {
  initialValues?: TestResultData;   // 編集のときだけ渡す（追加のときは空のフォーム）
  submitLabel: string;
  onSubmit: (values: TestResultData) => Promise<void>;
};

export function TestResultForm({ initialValues, submitLabel, onSubmit }: Props) {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentId, setStudentId] = useState(initialValues?.studentId ?? "");
  const [kind, setKind] = useState<TestKind>(initialValues?.kind ?? "regular");
  const [name, setName] = useState(initialValues?.name ?? "");
  const [date, setDate] = useState(initialValues?.date ?? "");
  const [subjects, setSubjects] = useState<SubjectRow[]>(
    initialValues
      ? initialValues.subjects.map((s) => ({
          subject: s.subject,
          score: String(s.score),
          average: toText(s.average),
          deviation: toText(s.deviation),
        }))
      : [EMPTY_SUBJECT],
  );
  const [judgements, setJudgements] = useState<JudgementRow[]>(initialValues?.judgements ?? []);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "students")).then((snap) => {
      setStudents(
        snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as StudentData) }))
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
    });
  }, []);

  // 選んでいなければ最初の生徒
  const selectedId = studentId || students[0]?.id || "";

  function updateSubject(index: number, changes: Partial<SubjectRow>) {
    setSubjects(subjects.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }
  function updateJudgement(index: number, changes: Partial<JudgementRow>) {
    setJudgements(judgements.map((row, i) => (i === index ? { ...row, ...changes } : row)));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const student = students.find((s) => s.id === selectedId);
    if (!student || !name.trim() || !date) {
      setError("生徒・テスト名・日付を入れてください");
      return;
    }

    // 教科名が入っている行だけを、数値に直す
    const subjectScores: SubjectScore[] = subjects
      .filter((row) => row.subject.trim() !== "")
      .map((row) => ({
        subject: row.subject.trim(),
        score: toNumberOrNull(row.score) ?? NaN,
        average: toNumberOrNull(row.average),
        deviation: toNumberOrNull(row.deviation),
      }));

    if (subjectScores.length === 0) {
      setError("教科を1つ以上入れてください");
      return;
    }
    // 点数が空・数字でない、または平均点・偏差値が数字でない行があればエラー
    const invalid = subjectScores.some(
      (s) => Number.isNaN(s.score) || Number.isNaN(s.average) || Number.isNaN(s.deviation),
    );
    if (invalid) {
      setError("点数・平均点・偏差値は数字で入れてください（点数は必須）");
      return;
    }

    const judgementList: Judgement[] = judgements
      .filter((row) => row.school.trim() !== "")
      .map((row) => ({ school: row.school.trim(), grade: row.grade.trim() }));

    setSubmitting(true);
    try {
      await onSubmit({
        studentId: student.id,
        parentUid: student.parentUid,
        kind,
        name: name.trim(),
        date,
        subjects: subjectScores,
        judgements: judgementList,
      });
    } catch (err) {
      console.error("保存できませんでした", err);
      setError("保存できませんでした");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <select value={selectedId} onChange={(e) => setStudentId(e.target.value)} className="rounded border px-2 py-1">
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        {(Object.keys(TEST_KIND_LABELS) as TestKind[]).map((k) => (
          <label key={k} className="flex items-center gap-1 text-sm">
            <input type="radio" checked={kind === k} onChange={() => setKind(k)} />
            {TEST_KIND_LABELS[k]}
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="テスト名"
          maxLength={50} className="flex-1 rounded border px-2 py-1" />
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded border px-2 py-1" />
      </div>

      <fieldset className="flex flex-col gap-2 rounded border p-3">
        <legend className="text-sm">教科ごとの結果</legend>
        <div className="grid grid-cols-[1fr_4rem_4rem_4rem_2.5rem] gap-1 text-xs text-gray-500">
          <span>教科</span><span>点数</span><span>平均点</span><span>偏差値</span><span />
        </div>
        {subjects.map((row, index) => (
          <div key={index} className="grid grid-cols-[1fr_4rem_4rem_4rem_2.5rem] gap-1">
            <input type="text" value={row.subject} onChange={(e) => updateSubject(index, { subject: e.target.value })}
              className="rounded border px-2 py-1" />
            <input type="text" inputMode="decimal" value={row.score} onChange={(e) => updateSubject(index, { score: e.target.value })}
              className="rounded border px-2 py-1 text-right" />
            <input type="text" inputMode="decimal" value={row.average} onChange={(e) => updateSubject(index, { average: e.target.value })}
              className="rounded border px-2 py-1 text-right" />
            <input type="text" inputMode="decimal" value={row.deviation} onChange={(e) => updateSubject(index, { deviation: e.target.value })}
              className="rounded border px-2 py-1 text-right" />
            <button type="button" onClick={() => setSubjects(subjects.filter((_, i) => i !== index))}
              className="text-sm text-red-600">削除</button>
          </div>
        ))}
        <button type="button" onClick={() => setSubjects([...subjects, EMPTY_SUBJECT])}
          className="self-start rounded border px-3 py-1 text-sm">教科を追加</button>
      </fieldset>

      <fieldset className="flex flex-col gap-2 rounded border p-3">
        <legend className="text-sm">志望校判定（模試のとき）</legend>
        {judgements.map((row, index) => (
          <div key={index} className="flex gap-1">
            <input type="text" value={row.school} onChange={(e) => updateJudgement(index, { school: e.target.value })}
              placeholder="志望校" className="flex-1 rounded border px-2 py-1" />
            <input type="text" value={row.grade} onChange={(e) => updateJudgement(index, { grade: e.target.value })}
              placeholder="判定" className="w-16 rounded border px-2 py-1" />
            <button type="button" onClick={() => setJudgements(judgements.filter((_, i) => i !== index))}
              className="text-sm text-red-600">削除</button>
          </div>
        ))}
        <button type="button" onClick={() => setJudgements([...judgements, EMPTY_JUDGEMENT])}
          className="self-start rounded border px-3 py-1 text-sm">判定を追加</button>
      </fieldset>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={submitting} className="rounded bg-blue-600 py-2 text-white disabled:opacity-50">
        {submitting ? "保存中…" : submitLabel}
      </button>
    </form>
  );
}
