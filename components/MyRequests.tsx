"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { REQUEST_STATUS_CLASSES, REQUEST_STATUS_LABELS, REQUEST_TYPE_LABELS } from "@/lib/requests";
import type { LessonRequest, LessonRequestData, Student, StudentData } from "@/lib/types";

export function MyRequests() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<LessonRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!user) return;

    const unsubRequests = onSnapshot(
      query(collection(db, "requests"), where("parentUid", "==", user.uid)),
      (snap) => setRequests(snap.docs.map((d) => ({ id: d.id, ...(d.data() as LessonRequestData) }))),
    );
    const unsubStudents = onSnapshot(
      query(collection(db, "students"), where("parentUid", "==", user.uid)),
      (snap) => setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StudentData) }))),
    );
    return () => {
      unsubRequests();
      unsubStudents();
    };
  }, [user]);

  // 申請した日時の新しい順に10件（createdAt がまだ null のものは「今」として扱う）
  const recent = [...requests]
    .sort((a, b) => (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now()))
    .slice(0, 10);

  return (
    <section className="rounded border p-4">
      <h2 className="font-bold">申請の結果</h2>

      {recent.length === 0 ? (
        <p className="text-sm text-gray-500">まだ申請はありません</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-2">
          {recent.map((req) => {
            const student = students.find((s) => s.id === req.studentId);
            return (
              <li key={req.id} className="flex flex-wrap items-center gap-2 rounded border p-3 text-sm">
                <span>{req.date.slice(5).replace("-", "/")} {req.start}〜{req.end}</span>
                <span>{student?.name ?? "生徒"}</span>
                <span className="text-gray-500">{REQUEST_TYPE_LABELS[req.type]}</span>
                <span className={`ml-auto rounded px-2 py-0.5 text-xs ${REQUEST_STATUS_CLASSES[req.status]}`}>
                  {REQUEST_STATUS_LABELS[req.status]}
                </span>
                {req.status === "rejected" && req.reason && (
                  <p className="w-full text-xs text-gray-500">理由：{req.reason}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
