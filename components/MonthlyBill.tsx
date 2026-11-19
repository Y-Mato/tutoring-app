"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { displayStatus, summarizeMonth, toMonth, yen } from "@/lib/fees";
import type { Lesson, LessonData, LessonType, Student, StudentData } from "@/lib/types";

const TYPE_LABELS: Record<LessonType, string> = {
  regular: "通常",
  extra: "追加",
  makeup: "振替",
};

export function MonthlyBill() {
  const { user } = useAuth();
  const [now] = useState(() => new Date());
  const month = toMonth(now);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!user) return;

    // parentUid だけで読む（日付の範囲も足すと複合インデックスが必要になるため。今月の分は下で絞る）
    const unsubLessons = onSnapshot(
      query(collection(db, "lessons"), where("parentUid", "==", user.uid)),
      (snap) => setLessons(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LessonData) }))),
    );
    const unsubStudents = onSnapshot(
      query(collection(db, "students"), where("parentUid", "==", user.uid)),
      (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StudentData) }))),
    );
    return () => {
      unsubLessons();
      unsubStudents();
    };
  }, [user]);

  const summary = summarizeMonth(lessons, month, now);

  return (
    <section className="rounded border p-4">
      <h2 className="font-bold">今月の請求額（{Number(month.slice(5))}月）</h2>

      <p className="mt-2 text-lg font-bold">合計 {yen(summary.confirmed + summary.expected)}</p>
      <p className="text-sm text-gray-500">
        確定 {yen(summary.confirmed)} ／ 見込み {yen(summary.expected)}
      </p>

      {summary.lessons.length === 0 ? (
        <p className="mt-2 text-sm text-gray-500">今月のコマはありません</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          {summary.lessons.map((lesson) => {
            const student = students.find((s) => s.id === lesson.studentId);
            const done = displayStatus(lesson, now) === "done";
            return (
              <li key={lesson.id} className="flex flex-wrap items-center gap-2">
                <span>{lesson.date.slice(5).replace("-", "/")} {lesson.start}〜{lesson.end}</span>
                <span>{student?.name ?? "生徒"}</span>
                <span className="text-gray-500">{TYPE_LABELS[lesson.type]}</span>
                <span className="ml-auto">{yen(lesson.fee)}</span>
                <span className={done ? "text-green-700" : "text-gray-500"}>{done ? "実施済み" : "予定"}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
