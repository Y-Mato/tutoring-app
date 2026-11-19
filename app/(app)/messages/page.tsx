"use client";

import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where, type Query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { ChatListItem } from "@/components/ChatListItem";
import type { Student, StudentData } from "@/lib/types";

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);

  useEffect(() => {
    if (!user || !profile) return;

    const studentsQuery: Query = profile.role === "teacher"
      ? collection(db, "students")
      : query(collection(db, "students"), where("parentUid", "==", user.uid));
    const unsubscribe = onSnapshot(studentsQuery, (snap) => {
      setStudents(snap.docs.map((d) => ({ id: d.id, ...(d.data() as StudentData) })));
    });
    return unsubscribe;
  }, [user, profile]);

  if (!profile) return null;

  // 保護者が登録されている生徒だけ（相手がいないとチャットできないため）を、名前順に
  const chatStudents = students
    .filter((s) => s.parentUid !== null)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">メッセージ</h1>
      {chatStudents.length === 0 ? (
        <p className="text-sm text-gray-500">チャットできる生徒がいません（生徒に保護者を登録してください）</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {chatStudents.map((s) => (
            <ChatListItem key={s.id} student={s} myRole={profile.role} />
          ))}
        </ul>
      )}
    </div>
  );
}
