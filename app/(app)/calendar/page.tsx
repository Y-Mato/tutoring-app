"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, type Query } from "firebase/firestore";
import type { EventInput } from "@fullcalendar/react";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { LessonCalendar } from "@/components/LessonCalendar";
import { useRouter } from "next/navigation";
import type {
  Availability, AvailabilityData,
  Lesson, LessonData,
  Student, StudentData,
  LessonRequest, LessonRequestData,
  Exam, ExamData,
} from "@/lib/types";
import { addDays, examPeriods } from "@/lib/examPeriods";


export default function CalendarPage() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const router = useRouter();
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);


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

    const examsQuery: Query = isTeacher
      ? collection(db, "exams")
      : query(collection(db, "exams"), where("parentUid", "==", user.uid));

    const unsubExams = onSnapshot(examsQuery, (snap) => {
      setExams(snap.docs.map((d) => ({ id: d.id, ...(d.data() as ExamData) })));
    });



    return () => {
      unsubStudents();
      unsubLessons();
      unsubAvailabilities();
      unsubRequests();
      unsubExams();
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
  // 日付ごとに、提出物期間か勉強期間かを1つに決める
  // 生徒が2人いて期間が重なったときに、黄と赤が混ざってオレンジにならないようにするため
  // 重なったら「勉強期間」を優先する（テストにより近いので）
  const periodByDate = new Map<string, "submit" | "study">();
  exams.forEach((exam) => {
    const p = examPeriods(exam.startDate);
    for (let d = p.submitStart; d <= p.submitEnd; d = addDays(d, 1)) {
      if (!periodByDate.has(d)) periodByDate.set(d, "submit");
    }
    for (let d = p.studyStart; d <= p.studyEnd; d = addDays(d, 1)) {
      periodByDate.set(d, "study");
    }
  });

  // 1日ぶんの背景を2つ作る
  // ・終日（日付だけ）：月表示のマスと、週表示の終日の欄に色が付く
  // ・時刻付き（0:00〜翌0:00）：週表示の時間の列に色が付く（月表示には出ない）
  // 色はテーマが15%だけ混ぜて塗るので、濃い色を指定する
  const periodEvents: EventInput[] = [...periodByDate].flatMap(([date, kind]) => {
    const color = kind === "study" ? "#ef4444" : "#eab308";   // 勉強期間：赤系、提出物期間：黄
    const next = addDays(date, 1);   // end はその日を含まないので、翌日にする
    return [
      { id: `period-${date}-day`, start: date, end: next, allDay: true, display: "background", color },
      { id: `period-${date}-time`, start: `${date}T00:00`, end: `${next}T00:00`, display: "background", color },
    ];
  });

  // テスト期間 → 太字の終日予定
  const examEvents: EventInput[] = exams.map((exam) => {
    const student = students.find((s) => s.id === exam.studentId);
    return {
      id: `${exam.id}-exam`,
      title: `📝 ${exam.name}（${student?.name ?? "生徒"}）`,
      start: exam.startDate,
      end: addDays(exam.endDate, 1),
      allDay: true,
      color: "#b91c1c",
      className: "font-bold!",
    };
  });

  const events = [...periodEvents, ...examEvents, ...availabilityEvents, ...requestEvents, ...lessonEvents];

  return <LessonCalendar events={events} onSelectDate={(date) => router.push(`/calendar/${date}`)} />;
}