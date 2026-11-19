"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  addDoc, collection, doc, getDoc, onSnapshot, orderBy, query, serverTimestamp, writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type { Message, MessageData, StudentData } from "@/lib/types";

// Timestamp → "11/20 18:02"
function formatTime(message: Message): string {
  const d = message.createdAt?.toDate();
  if (!d) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

export default function ChatPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const { user, profile } = useAuth();
  const [student, setStudent] = useState<StudentData | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);   // 一番下の目印

  // 生徒の名前を読む
  useEffect(() => {
    getDoc(doc(db, "students", studentId)).then((snap) => {
      if (snap.exists()) setStudent(snap.data() as StudentData);
    });
  }, [studentId]);

  // メッセージを古い順に読み続ける
  useEffect(() => {
    const q = query(collection(db, "chats", studentId, "messages"), orderBy("createdAt"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({
          id: d.id,
          ...(d.data({ serverTimestamps: "estimate" }) as MessageData),
        })),
      );
    });
    return unsubscribe;
  }, [studentId]);

  // 相手から来た、まだ読んでいないメッセージを既読にする
  useEffect(() => {
    if (!profile) return;
    const unread = messages.filter((m) => m.senderRole !== profile.role && m.readAt === null);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach((m) => {
      batch.update(doc(db, "chats", studentId, "messages", m.id), { readAt: serverTimestamp() });
    });
    batch.commit().catch((err) => console.error("既読にできませんでした", err));
  }, [messages, profile, studentId]);

  // メッセージが増えたら一番下までスクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || !profile || !text.trim()) return;

    setError(null);
    setSending(true);
    try {
      await addDoc(collection(db, "chats", studentId, "messages"), {
        senderUid: user.uid,
        senderRole: profile.role,
        text: text.trim(),
        createdAt: serverTimestamp(),
        readAt: null,
      });

      setText("");
    } catch (err) {
      console.error("送信できませんでした", err);
      setError("送信できませんでした");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <Link href="/messages" className="text-sm text-blue-600">← メッセージ一覧</Link>
      <h1 className="text-xl font-bold">{student?.name ?? "生徒"} のチャット</h1>

      {messages.length === 0 && <p className="text-sm text-gray-500">まだメッセージはありません</p>}

      <ul className="flex flex-col gap-3">
        {messages.map((m) => {
          const isMine = m.senderRole === profile?.role;
          return (
            <li key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
              <p
                className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${
                  isMine ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-900"
                }`}
              >
                {m.text}
              </p>
              <span className="mt-0.5 text-xs text-gray-500">
                {formatTime(m)}
                {isMine && m.readAt && " 既読"}
              </span>
            </li>
          );
        })}
      </ul>
      <div ref={bottomRef} />

      {error && <p className="text-sm text-red-600">{error}</p>}

      {/* 下部タブの上に、入力欄を固定する */}
      <form onSubmit={handleSend} className="sticky bottom-16 flex gap-2 bg-white py-2 dark:bg-black">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          maxLength={1000}
          placeholder="メッセージを入力"
          className="flex-1 resize-none rounded border px-3 py-2"
        />
        <button type="submit" disabled={sending || !text.trim()}
          className="rounded bg-blue-600 px-4 text-white disabled:opacity-50">
          送信
        </button>
      </form>
    </div>
  );
}
