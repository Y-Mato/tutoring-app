"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, query, where, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type {
    LessonRecord, LessonRecordData,
    Student, StudentData,
    TestResult, TestResultData,
} from "@/lib/types";
import { deleteTestResult, TEST_KIND_LABELS } from "@/lib/testResults";
import { ScoreChart } from "@/components/ScoreChart";


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
    const [results, setResults] = useState<TestResult[]>([]);

    useEffect(() => {
        if (!user || !profile) return;

        const isTeacher = profile.role === "teacher";
        const studentsQuery: Query = isTeacher
            ? collection(db, "students")
            : query(collection(db, "students"), where("parentUid", "==", user.uid));
        const recordsQuery: Query = isTeacher
            ? collection(db, "records")
            : query(collection(db, "records"), where("parentUid", "==", user.uid));

        const resultsQuery: Query = isTeacher
            ? collection(db, "testResults")
            : query(collection(db, "testResults"), where("parentUid", "==", user.uid));
        const unsubResults = onSnapshot(resultsQuery, (snap) => {
            setResults(snap.docs.map((d) => ({ id: d.id, ...(d.data() as TestResultData) })));
        });


        const unsubStudents = onSnapshot(studentsQuery, (snap) => {
            setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StudentData) })));
        });
        const unsubRecords = onSnapshot(recordsQuery, (snap) => {
            setRecords(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LessonRecordData) })));
        });
        return () => {
            unsubStudents();
            unsubRecords();
            unsubResults();
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

    // 選んだ生徒のテスト結果を、新しい順に
    const studentResults = results
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
                <div className="flex items-center">
                    <h2 className="font-bold">テスト結果</h2>
                    {isTeacher && (
                        <Link href="/records/results/new" className="ml-auto rounded bg-blue-600 px-3 py-1 text-sm text-white">
                            結果を追加
                        </Link>
                    )}
                </div>

                {studentResults.length === 0 ? (
                    <p className="text-sm text-gray-500">まだ結果はありません</p>
                ) : (
                    <ul className="flex flex-col gap-2">
                        {studentResults.map((r) => (
                            <li key={r.id} className="flex flex-col gap-1 rounded border p-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold">{formatShortDate(r.date)} {r.name}</span>
                                    <span className="text-gray-500">{TEST_KIND_LABELS[r.kind]}</span>
                                    {isTeacher && (
                                        <span className="ml-auto flex gap-3">
                                            <Link href={`/records/results/${r.id}`} className="text-blue-600">編集</Link>
                                            <button onClick={() => deleteTestResult(r.id)} className="text-red-600">削除</button>
                                        </span>
                                    )}
                                </div>
                                {r.subjects.map((s) => (
                                    <p key={s.subject}>
                                        {s.subject} {s.score}点
                                        {s.average !== null && `（平均 ${s.average}）`}
                                        {s.deviation !== null && ` 偏差値 ${s.deviation}`}
                                    </p>
                                ))}
                                {r.judgements.map((j) => (
                                    <p key={j.school} className="text-gray-600">{j.school}：{j.grade}判定</p>
                                ))}
                            </li>
                        ))}
                    </ul>
                )}
            </section>

            {studentResults.length > 0 && (
                <section className="flex flex-col gap-2">
                    <h2 className="font-bold">推移グラフ</h2>
                    <ScoreChart results={studentResults} />
                </section>
            )}


        </div>
    );
}
