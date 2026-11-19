"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { collection, onSnapshot, query, where, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type { Availability, AvailabilityData, Lesson, LessonData, LessonRequest, LessonRequestData, LessonStatus, Student, StudentData } from "@/lib/types";
import { cancelLesson, restoreLesson } from "@/lib/cancelLesson";
import { formatDate } from "@/lib/lessons";
import { AvailabilityForm } from "@/components/AvailabilityForm";
import { deleteAvailability } from "@/lib/availabilities";
import { RequestForm } from "@/components/RequestForm";
import { REQUEST_STATUS_CLASSES, REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS } from "@/lib/requests";
import { displayStatus } from "@/lib/fees";


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
    const [availabilities, setAvailabilities] = useState<Availability[]>([]);
    const [openSlotId, setOpenSlotId] = useState<string | null>(null);   // 申請フォームを開いている枠
    const [busyId, setBusyId] = useState<string | null>(null);   // 処理中のコマのID
    const [error, setError] = useState<string | null>(null);
    const [requests, setRequests] = useState<LessonRequest[]>([]);
    const [now] = useState(() => new Date());   // 画面を開いたときの時刻（描くたびに変わらないように）



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
        const availabilitiesQuery = query(collection(db, "availabilities"), where("date", "==", date));

        const unsubAvailabilities = onSnapshot(availabilitiesQuery, (snap) => {
            setAvailabilities(snap.docs.map((d) => ({ id: d.id, ...(d.data() as AvailabilityData) })));
        });

        const requestsQuery: Query = isTeacher
            ? query(collection(db, "requests"), where("date", "==", date))
            : query(collection(db, "requests"), where("parentUid", "==", user.uid), where("date", "==", date));
        const unsubRequests = onSnapshot(requestsQuery, (snap) => {
            setRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LessonRequestData) })));
        });



        return () => {
            unsubStudents();
            unsubLessons();
            unsubAvailabilities();
            unsubRequests();
        };

    }, [user, profile, date]);

    // 開始時刻の早い順に並べる（"17:00" のような文字列はそのまま比べられる）
    const sorted = [...lessons].sort((a, b) => a.start.localeCompare(b.start));

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return <p>日付が正しくありません</p>;
    }

    const today = formatDate(now);
    const isTeacher = profile?.role === "teacher";

    async function handleCancel(lesson: Lesson) {
        if (!profile) return;
        if (!window.confirm(`${lesson.start}〜 のコマを休みにしますか？`)) return;

        setError(null);
        setBusyId(lesson.id);
        try {
            await cancelLesson(lesson.id, profile.role);

        } catch (err) {
            console.error("休みにできませんでした", err);
            setError("休みにできませんでした");
        } finally {
            setBusyId(null);
        }
    }

    async function handleRestore(lesson: Lesson) {
        setError(null);
        setBusyId(lesson.id);
        try {
            await restoreLesson(lesson.id);
        } catch (err) {
            console.error("取り消せませんでした", err);
            setError("取り消せませんでした");
        } finally {
            setBusyId(null);
        }
    }


    return (
        <div className="flex flex-col gap-4">
            <Link href="/calendar" className="text-sm text-blue-600">← カレンダーに戻る</Link>
            <h1 className="text-xl font-bold">{formatDayTitle(date)}</h1>

            {error && <p className="text-sm text-red-600">{error}</p>}


            {sorted.length === 0 ? (
                <p className="text-sm text-gray-500">この日のコマはありません</p>
            ) : (
                <ul className="flex flex-col gap-2">
                    {sorted.map((lesson) => {
                        const status = displayStatus(lesson, now);
                        const canCancel = status === "scheduled" && lesson.date >= today;
                        const canRestore = lesson.status === "cancelled" && (isTeacher || lesson.cancelledBy === "parent");
                        const busy = busyId === lesson.id;
                        const student = students.find((s) => s.id === lesson.studentId);


                        return (
                            <li key={lesson.id} className="flex flex-wrap items-center gap-3 rounded border p-3">
                                <span
                                    className="inline-block h-3 w-3 rounded-full"
                                    style={{ backgroundColor: student?.color ?? "#9ca3af" }}
                                />
                                <span>{lesson.start}〜{lesson.end}</span>
                                <span>{student?.name ?? "生徒"}</span>
                                <span className="ml-auto text-sm text-gray-500">{STATUS_LABELS[status]}</span>

                                {canCancel && (
                                    <button
                                        onClick={() => handleCancel(lesson)}
                                        disabled={busy}
                                        className="rounded border border-red-600 px-2 py-1 text-sm text-red-600 disabled:opacity-50"
                                    >
                                        休みにする
                                    </button>
                                )}
                                {canRestore && (
                                    <button
                                        onClick={() => handleRestore(lesson)}
                                        disabled={busy}
                                        className="rounded border px-2 py-1 text-sm disabled:opacity-50"
                                    >
                                        取り消す
                                    </button>
                                )}
                                {isTeacher && status === "done" && (
                                    <Link href={`/records/lesson/${lesson.id}`} className="rounded border px-2 py-1 text-sm">
                                        記録を書く
                                    </Link>
                                )}


                                {lesson.status === "cancelled" && lesson.cancelledBy && (
                                    <p className="w-full text-xs text-gray-500">
                                        （{lesson.cancelledBy === "teacher" ? "先生" : "保護者"}が休みにしました）
                                    </p>
                                )}
                            </li>
                        );

                    })}
                </ul>
            )}
            <section className="flex flex-col gap-2">
                <h2 className="font-bold">出勤可能枠</h2>

                {availabilities.length === 0 ? (
                    <p className="text-sm text-gray-500">この日の枠はありません</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {availabilities.map((slot) => (
                            <li key={slot.id} className="flex flex-wrap items-center gap-3 rounded border border-dashed p-3">
                                <span>{slot.start}〜{slot.end}</span>
                                {isTeacher && (
                                    <button onClick={() => deleteAvailability(slot.id)} className="ml-auto text-sm text-red-600">
                                        削除
                                    </button>
                                )}
                                {!isTeacher && openSlotId !== slot.id && (
                                    <button onClick={() => setOpenSlotId(slot.id)} className="ml-auto rounded border px-2 py-1 text-sm">
                                        申請する
                                    </button>
                                )}
                                {openSlotId === slot.id && user && (
                                    <RequestForm
                                        slot={slot}
                                        students={students}
                                        parentUid={user.uid}
                                        onDone={() => setOpenSlotId(null)}
                                    />
                                )}
                            </li>
                        ))}
                    </ul>
                )}

                {isTeacher && <AvailabilityForm date={date} />}

            </section>

            {requests.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="font-bold">申請</h2>
                    <ul className="flex flex-col gap-2">
                        {requests.map((req) => {
                            const student = students.find((s) => s.id === req.studentId);
                            return (
                                <li key={req.id} className="flex flex-wrap items-center gap-3 rounded border p-3">
                                    <span>{req.start}〜{req.end}</span>
                                    <span>{student?.name ?? "生徒"}</span>
                                    <span className="text-sm text-gray-500">{REQUEST_TYPE_LABELS[req.type]}</span>
                                    <span className={`ml-auto rounded px-2 py-0.5 text-xs ${REQUEST_STATUS_CLASSES[req.status]}`}>
                                        {REQUEST_STATUS_LABELS[req.status]}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </section>
            )}


        </div>
    );
}
