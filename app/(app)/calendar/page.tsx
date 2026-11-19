"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, type Query } from "firebase/firestore";
import type { EventInput } from "@fullcalendar/react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { LessonCalendar } from "@/components/LessonCalendar";
import { useRouter } from "next/navigation";
import type { Availability, AvailabilityData, Lesson, LessonData, Student, StudentData, LessonRequest, LessonRequestData } from "@/lib/types";


export default function CalendarPage() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const router = useRouter();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [requests, setRequests] = useState<LessonRequest[]>([]);


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
    const unsubAvailabilities = onSnapshot(collection(db, "availabilities"), (snap) => {
      setAvailabilities(snap.docs.map((d) => ({ id: d.id, ...(d.data() as AvailabilityData) })));
    });
    const requestsQuery: Query = isTeacher
      ? collection(db, "requests")
      : query(collection(db, "requests"), where("parentUid", "==", user.uid));
    const unsubRequests = onSnapshot(requestsQuery, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LessonRequestData) })));
    });


    return () => {
      unsubStudents();
      unsubLessons();
      unsubAvailabilities();
      unsubRequests();
    };
  }, [user, profile]);

  // コマ → カレンダーの予定に変換
  const lessonEvents: EventInput[] = lessons.map((lesson) => {
    const student = students.find((s) => s.id === lesson.studentId);
    const cancelled = lesson.status === "cancelled";

    return {
      id: lesson.id,
      title: student?.name ?? "生徒",
      start: `${lesson.date}T${lesson.start}`,
      end: `${lesson.date}T${lesson.end}`,
      color: cancelled ? "#9ca3af" : (student?.color ?? "#9ca3af"),
      className: cancelled ? "opacity-60 [&_*]:line-through" : "",
    };
  });

  // 出勤可能枠 → 破線の予定
  const availabilityEvents: EventInput[] = availabilities.map((slot) => ({
    id: slot.id,
    title: "空き",
    start: `${slot.date}T${slot.start}`,
    end: `${slot.date}T${slot.end}`,
    className: "bg-transparent! border-2! border-dashed! border-gray-400! text-gray-600!",
  }));

  // 承認待ちの申請 → 黄色の破線
  const requestEvents: EventInput[] = requests.filter((req) => req.status === "pending").map((req) => {
    const student = students.find((s) => s.id === req.studentId);
    return {
      id: req.id,
      title: `承認待ち（${student?.name ?? "生徒"}）`,
      start: `${req.date}T${req.start}`,
      end: `${req.date}T${req.end}`,
      className: "bg-yellow-50! border-2! border-dashed! border-yellow-500! text-yellow-800!",
    };
  });

  const events = [...availabilityEvents, ...requestEvents, ...lessonEvents];   // ← requestEvents を足す


  return <LessonCalendar events={events} onSelectDate={(date) => router.push(`/calendar/${date}`)} />;
}