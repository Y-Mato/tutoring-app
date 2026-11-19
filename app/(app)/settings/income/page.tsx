"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { summarizeMonth, toMonth, yen } from "@/lib/fees";
import type { Lesson, LessonData, Student, StudentData } from "@/lib/types";

const MONTH_COUNT = 12;

export default function IncomePage() {
  const [now] = useState(() => new Date());
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // 今月から12か月前までの "2026-11" の一覧（新しい順）
  const months = Array.from({ length: MONTH_COUNT }, (_, i) =>
    toMonth(new Date(now.getFullYear(), now.getMonth() - i, 1)),
  );
  const newest = months[0];
  const oldest = months[months.length - 1];

  useEffect(() => {
    const lessonsQuery = query(
      collection(db, "lessons"),
      where("date", ">=", `${oldest}-01`),
      where("date", "<=", `${newest}-31`),
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
  }, [newest, oldest]);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/" className="text-sm text-blue-600">← ホーム</Link>
      <h1 className="text-xl font-bold">月ごとの収入</h1>

      <ul className="flex flex-col gap-2">
        {months.map((month) => {
          const total = summarizeMonth(lessons, month, now);
          const [y, m] = month.split("-");

          return (
            <li key={month} className="rounded border p-3">
              <div className="flex items-baseline gap-2">
                <span className="font-bold">{y}年{Number(m)}月</span>
                <span className="ml-auto font-bold">{yen(total.confirmed)}</span>
                {total.expected > 0 && (
                  <span className="text-sm text-gray-500">（見込み {yen(total.expected)}）</span>
                )}
              </div>

              <p className="mt-1 text-sm text-gray-500">
                {students
                  .map((s) => {
                    const summary = summarizeMonth(lessons.filter((l) => l.studentId === s.id), month, now);
                    return `${s.name} ${yen(summary.confirmed)}`;
                  })
                  .join(" ／ ")}
              </p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
