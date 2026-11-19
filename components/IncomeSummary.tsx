"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { summarizeMonth, toMonth, yen } from "@/lib/fees";
import type { Lesson, LessonData, Student, StudentData } from "@/lib/types";

export function IncomeSummary() {
  const [now] = useState(() => new Date());
  const month = toMonth(now);   // "2026-11"
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    // 今月のコマだけ読む（"2026-11-01" 〜 "2026-11-31" の文字列の範囲）
    const lessonsQuery = query(
      collection(db, "lessons"),
      where("date", ">=", `${month}-01`),
      where("date", "<=", `${month}-31`),
    );
    const unsubLessons = onSnapshot(lessonsQuery, (snap) => {
      setLessons(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LessonData) })));
    });
    const unsubStudents = onSnapshot(collection(db, "students"), (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StudentData) })));
    });
    return () => {
      unsubLessons();
      unsubStudents();
    };
  }, [month]);

  const total = summarizeMonth(lessons, month, now);

  // 生徒ごとにまとめる
  const byStudent = students.map((student) => ({
    student,
    summary: summarizeMonth(lessons.filter((l) => l.studentId === student.id), month, now),
  }));

  return (
    <section className="rounded border p-4">
      <h2 className="font-bold">今月の収入（{Number(month.slice(5))}月）</h2>

      <p className="mt-2">
           合計　確定 <span className="font-bold">{yen(total.confirmed)}</span>
        <span className="text-sm text-gray-500">　／　見込み {yen(total.expected)}</span>
      </p>

      <ul className="mt-2 flex flex-col gap-1 text-sm">
        {byStudent.map(({ student, summary }) => (
          <li key={student.id} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: student.color }} />
            <span>{student.name}</span>
            <span className="ml-auto">確定 {yen(summary.confirmed)}</span>
            <span className="text-gray-500">／ 見込み {yen(summary.expected)}</span>
          </li>
        ))}
      </ul>

      <Link href="/settings/income" className="mt-2 inline-block text-sm text-blue-600">
        月ごとの履歴 →
      </Link>
    </section>
  );
}
