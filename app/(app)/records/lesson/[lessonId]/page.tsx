"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type { LessonData, LessonRecordData, StudentData } from "@/lib/types";

export default function LessonRecordPage() {
  const router = useRouter();
  const { lessonId } = useParams<{ lessonId: string }>();
  const { profile } = useAuth();
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [student, setStudent] = useState<StudentData | null>(null);
  const [condition, setCondition] = useState("");
  const [homework, setHomework] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // コマ・生徒・すでにある記録を読む
  useEffect(() => {
    async function load() {
      const lessonSnap = await getDoc(doc(db, "lessons", lessonId));
      if (!lessonSnap.exists()) {
        setLoading(false);
        return;
      }
      const l = lessonSnap.data() as LessonData;
      setLesson(l);

      const [studentSnap, recordSnap] = await Promise.all([
        getDoc(doc(db, "students", l.studentId)),
        getDoc(doc(db, "records", lessonId)),
      ]);
      if (studentSnap.exists()) setStudent(studentSnap.data() as StudentData);
      if (recordSnap.exists()) {
        const r = recordSnap.data() as LessonRecordData;
        setCondition(r.condition);
        setHomework(r.homework);
      }
      setLoading(false);
    }

    load().catch((err) => {
      console.error("読み込めませんでした", err);
      setError("読み込めませんでした");
      setLoading(false);
    });
  }, [lessonId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!lesson) return;

    setError(null);
    setSubmitting(true);
    try {
      const record: LessonRecordData = {
        studentId: lesson.studentId,
        parentUid: lesson.parentUid,
        lessonId,
        date: lesson.date,
        condition: condition.trim(),
        homework: homework.trim(),
      };

      await setDoc(doc(db, "records", lessonId), record);
      router.push(`/calendar/${lesson.date}`);
    } catch (err) {
      console.error("保存できませんでした", err);
      setError("保存できませんでした");
    } finally {
      setSubmitting(false);
    }
  }

  if (profile?.role !== "teacher") return <p>授業記録は先生だけが書けます</p>;
  if (loading) return <p>読み込み中...</p>;
  if (!lesson) return <p>コマが見つかりません</p>;

  return (
    <div className="flex max-w-md flex-col gap-4">
      <Link href={`/calendar/${lesson.date}`} className="text-sm text-blue-600">← 日の詳細に戻る</Link>
      <h1 className="text-xl font-bold">授業記録</h1>
      <p>
        {lesson.date.slice(5).replace("-", "/")} {lesson.start}〜{lesson.end} {student?.name ?? "生徒"}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm">様子</span>
          <textarea
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
            rows={5}
            maxLength={2000}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm">宿題</span>
          <textarea
            value={homework}
            onChange={(e) => setHomework(e.target.value)}
            rows={3}
            maxLength={2000}
            className="rounded border px-3 py-2"
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={submitting} className="rounded bg-blue-600 py-2 text-white disabled:opacity-50">
          {submitting ? "保存中…" : "保存する"}
        </button>
      </form>
    </div>
  );
}
