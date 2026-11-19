"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, limit, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Role } from "@/components/AuthProvider";
import type { Message, MessageData, Student } from "@/lib/types";

type Props = {
  student: Student;
  myRole: Role;
};

// チャット一覧の1行：最後のメッセージと未読の数
export function ChatListItem({ student, myRole }: Props) {
  const [last, setLast] = useState<Message | null>(null);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const messages = collection(db, "chats", student.id, "messages");
    const otherRole: Role = myRole === "teacher" ? "parent" : "teacher";

    // 最後のメッセージ（新しい順に1件だけ）
    const unsubLast = onSnapshot(query(messages, orderBy("createdAt", "desc"), limit(1)), (snap) => {
      const d = snap.docs[0];
      setLast(d ? { id: d.id, ...(d.data({ serverTimestamps: "estimate" }) as MessageData) } : null);
    });

    // 未読の数：相手から来た、まだ読んでいないメッセージ
    const unsubUnread = onSnapshot(query(messages, where("senderRole", "==", otherRole), where("readAt", "==", null)), (snap) => {
      setUnread(snap.size);
    });

    return () => {
      unsubLast();
      unsubUnread();
    };
  }, [student.id, myRole]);

  return (
    <li>
      <Link href={`/messages/${student.id}`} className="flex items-center gap-3 rounded border p-3">
        <span className="inline-block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: student.color }} />
        <span className="shrink-0 font-bold">{student.name}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-gray-500">
          {last ? last.text : "まだメッセージはありません"}
        </span>
        {unread > 0 && (
          <span className="shrink-0 rounded-full bg-red-600 px-2 py-0.5 text-xs text-white">{unread}</span>
        )}
      </Link>
    </li>
  );
}
