"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type { LessonRecord, LessonRecordData, Student, StudentData } from "@/lib/types";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

// "2026-11-16" → "11/16（月）"
function formatShortDate(date: string): string {
  const d = new Date(`${date}T00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}（${DAY_LABELS[d.getDay()]}）`;
}

export default function RecordsPage() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [records, setRecords] = useState<LessonRecord[]>([]);
  const [chosenId, setChosenId] = useState<string | null>(null);   // ボタンで選んだ生徒

  useEffect(() => {
    if (!user || !profile) return;

    const isTeacher = profile.role === "teacher";
    const studentsQuery: Query = isTeacher
      ? collection(db, "students")
      : query(collection(db, "students"), where("parentUid", "==", user.uid));
    const recordsQuery: Query = isTeacher
      ? collection(db, "records")
      : query(collection(db, "records"), where("parentUid", "==", user.uid));

    const unsubStudents = onSnapshot(studentsQuery, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StudentData) })));
    });
    const unsubRecords = onSnapshot(recordsQuery, (snap) => {
      setRecords(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LessonRecordData) })));
    });
    return () => {
      unsubStudents();
      unsubRecords();
    };
  }, [user, profile]);

  const isTeacher = profile?.role === "teacher";
  const sortedStudents = [...students].sort((a, b) => a.name.localeCompare(b.name));

  // まだ選んでいなければ、最初の生徒
  const selectedId = chosenId ?? sortedStudents[0]?.id ?? null;

  // 選んだ生徒の記録を、新しい順に
  const studentRecords = records
    .filter((r) => r.studentId === selectedId)
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">記録</h1>

      {sortedStudents.length === 0 ? (
        <p className="text-sm text-gray-500">生徒がいません</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {sortedStudents.map((s) => (
            <button
              key={s.id}
              onClick={() => setChosenId(s.id)}
              className={`rounded-full border px-3 py-1 text-sm ${s.id === selectedId ? "bg-blue-600 text-white" : ""}`}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">授業記録</h2>
        {studentRecords.length === 0 ? (
          <p className="text-sm text-gray-500">まだ記録はありません</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {studentRecords.map((r) => (
              <li key={r.id} className="flex flex-col gap-1 rounded border p-3 text-sm">
                <div className="flex items-center">
                  <span className="font-bold">{formatShortDate(r.date)}</span>
                  {isTeacher && (
                    <Link href={`/records/lesson/${r.lessonId}`} className="ml-auto text-blue-600">
                      編集
                    </Link>
                  )}
                </div>
                {r.condition && <p className="whitespace-pre-wrap">様子：{r.condition}</p>}
                {r.homework && <p className="whitespace-pre-wrap">宿題：{r.homework}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-bold">テスト結果</h2>
        <p className="text-sm text-gray-500">準備中</p>
      </section>
    </div>
  );
}
