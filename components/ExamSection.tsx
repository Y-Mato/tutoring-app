"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { addExam, deleteExam } from "@/lib/exams";
import type { Exam, ExamData } from "@/lib/types";

type Props = {
  studentId: string;
  parentUid: string | null;
};

export function ExamSection({ studentId, parentUid }: Props) {
  const [exams, setExams] = useState<Exam[]>([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "exams"), where("studentId", "==", studentId));
    const unsubscribe = onSnapshot(q, (snap) => {
      setExams(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ExamData) })));
    });
    return unsubscribe;
  }, [studentId]);

  // テスト初日の早い順
  const sorted = [...exams].sort((a, b) => a.startDate.localeCompare(b.startDate));

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!name.trim() || !startDate || !endDate) {
      setError("テスト名と日付を入れてください");
      return;
    }
    if (endDate < startDate) {
      setError("最終日は初日以降にしてください");
      return;
    }

    setSubmitting(true);
    try {
      await addExam({ studentId, parentUid, name: name.trim(), startDate, endDate });
      setName("");
      setStartDate("");
      setEndDate("");
    } catch (err) {
      console.error("テストを追加できませんでした", err);
      setError("テストを追加できませんでした");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex max-w-md flex-col gap-2 rounded border p-3">
      <h2 className="font-bold">テスト日程</h2>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">まだテストが登録されていません</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((exam) => (
            <li key={exam.id} className="flex items-center gap-3 text-sm">
              <span>{exam.name}</span>
              <span className="text-gray-500">
                {exam.startDate.slice(5).replace("-", "/")}〜{exam.endDate.slice(5).replace("-", "/")}
              </span>
              <button type="button" onClick={() => deleteExam(exam.id)} className="ml-auto text-red-600">
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-2 border-t pt-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="テスト名（例：2学期期末テスト）"
          className="rounded border px-2 py-1"
        />
        <div className="flex flex-wrap items-center gap-2">
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="rounded border px-2 py-1" />
          <span>〜</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="rounded border px-2 py-1" />
          <button type="submit" disabled={submitting}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white disabled:opacity-50">
            {submitting ? "追加中…" : "追加"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </section>
  );
}
