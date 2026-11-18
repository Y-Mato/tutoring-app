"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, type Query } from "firebase/firestore";
import type { EventInput } from "@fullcalendar/react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { LessonCalendar } from "@/components/LessonCalendar";
import type { Lesson, LessonData, Student, StudentData } from "@/lib/types";

export default function CalendarPage() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);

  useEffect(() => {
    if (!user || !profile) return;

    // 先生は全員分、保護者は自分の子の分だけ
    const isTeacher = profile.role === "teacher";
    const studentsQuery: Query = isTeacher
      ? collection(db, "students")
      : query(collection(db, "students"), where("parentUid", "==", user.uid));
    const lessonsQuery: Query = isTeacher
      ? collection(db, "lessons")
      : query(collection(db, "lessons"), where("parentUid", "==", user.uid));
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
  }, [user, profile]);

  // コマ → カレンダーの予定に変換
  const events: EventInput[] = lessons.map((lesson) => {
    const student = students.find((s) => s.id === lesson.studentId);
    return {
      id: lesson.id,
      title: student?.name ?? "生徒",
      start: `${lesson.date}T${lesson.start}`,
      end: `${lesson.date}T${lesson.end}`,
      color: student?.color ?? "#9ca3af",
    };
  });

  return <LessonCalendar events={events} />;
}
