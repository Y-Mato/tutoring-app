"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Student, StudentData } from "@/lib/types";

export default function SettingsPage() {
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    const q = query(collection(db, "students"), orderBy("name"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setStudents(snap.docs.map((d) => ({id: d.id, ...(d.data() as StudentData) })));
    });
    return unsubscribe;
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">生徒</h1>
        <Link href="/settings/students/new" className="rounded bg-blue-600 px-3 py-1 text-sm text-white">
          生徒を追加
        </Link>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-gray-500">まだ生徒が登録されていません</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {students.map((s) => (
            <li key={s.id}>
                <Link href={`/settings/students/${s.id}`} className="flex items-center gap-2 rounded border p-3">
                    <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span>{s.name}</span>
                </Link>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}
