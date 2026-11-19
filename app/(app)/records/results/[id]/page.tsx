"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { TestResultForm } from "@/components/TestResultForm";
import { updateTestResult } from "@/lib/testResults";
import type { TestResultData } from "@/lib/types";

export default function EditTestResultPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  // 読んだ結果を、どの id のものかと一緒に持つ（別の結果を開いたときに、前の結果でフォームを作らないように）
  const [loaded, setLoaded] = useState<{ id: string; data: TestResultData } | null>(null);
  const [notFoundId, setNotFoundId] = useState<string | null>(null);

  useEffect(() => {
    getDoc(doc(db, "testResults", id)).then((snap) => {
      if (snap.exists()) {
        setLoaded({ id, data: snap.data() as TestResultData });
      } else {
        setNotFoundId(id);
      }
    });
  }, [id]);

  async function handleUpdate(values: TestResultData) {
    await updateTestResult(id, values);
    setLoaded({ id, data: values });   // 次にこの画面を開いたとき、保存した内容が出るように
    router.push("/records");
  }

  if (profile?.role !== "teacher") return <p>テスト結果は先生だけが編集できます</p>;
  if (notFoundId === id) return <p>テスト結果が見つかりません</p>;
  if (loaded?.id !== id) return <p>読み込み中...</p>;

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Link href="/records" className="text-sm text-blue-600">← 記録に戻る</Link>
      <h1 className="text-xl font-bold">テスト結果を編集</h1>
      <TestResultForm key={id} initialValues={loaded.data} submitLabel="保存する" onSubmit={handleUpdate} />
    </div>
  );
}
