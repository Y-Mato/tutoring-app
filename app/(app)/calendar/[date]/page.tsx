"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, onSnapshot, query, where, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type { Lesson, LessonData, LessonStatus, Student, StudentData } from "@/lib/types";

const DAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

const STATUS_LABELS: Record<LessonStatus, string> = {
  scheduled: "予定",
  cancelled: "休み",
  done: "実施済み",
};

// "2026-11-20" → "11月20日（金）"
function formatDayTitle(date: string): string {
  const d = new Date(`${date}T00:00`);
  return `${d.getMonth() + 1}月${d.getDate()}日（${DAY_LABELS[d.getDay()]}）`;
}

export default function DayPage() {
  const { date } = useParams<{ date: string }>();
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (!user || !profile) return;

    const isTeacher = profile.role === "teacher";
    const studentsQuery: Query = isTeacher
      ? collection(db, "students")
      : query(collection(db, "students"), where("parentUid", "==", user.uid));
    const lessonsQuery: Query = isTeacher
      ? query(collection(db, "lessons"), where("date", "==", date))
      : query(collection(db, "lessons"), where("parentUid", "==", user.uid), where("date", "==", date));

    const unsubStudents = onSnapshot(studentsQuery, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StudentData) })));
    });
    const unsubLessons = onSnapshot(lessonsQuery, (snap) => {
      setLessons(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LessonData) })));
    });

    return () => {
      unsubStudents();
      unsubLessons();
    };
  }, [user, profile, date]);

  // 開始時刻の早い順に並べる（"17:00" のような文字列はそのまま比べられる）
  const sorted = [...lessons].sort((a, b) => a.start.localeCompare(b.start));

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return <p>日付が正しくありません</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href="/calendar" className="text-sm text-blue-600">← カレンダーに戻る</Link>
      <h1 className="text-xl font-bold">{formatDayTitle(date)}</h1>

      {sorted.length === 0 ? (
        <p className="text-sm text-gray-500">この日のコマはありません</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((lesson) => {
            const student = students.find((s) => s.id === lesson.studentId);
            return (
              <li key={lesson.id} className="flex items-center gap-3 rounded border p-3">
                <span
                  className="inline-block h-3 w-3 rounded-full"
                  style={{ backgroundColor: student?.color ?? "#9ca3af" }}
                />
                <span>{lesson.start}〜{lesson.end}</span>
                <span>{student?.name ?? "生徒"}</span>
                <span className="ml-auto text-sm text-gray-500">{STATUS_LABELS[lesson.status]}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
