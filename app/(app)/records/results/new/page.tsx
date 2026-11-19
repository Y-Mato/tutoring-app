"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { TestResultForm } from "@/components/TestResultForm";
import { addTestResult } from "@/lib/testResults";
import type { TestResultData } from "@/lib/types";

export default function NewTestResultPage() {
  const router = useRouter();
  const { profile } = useAuth();
  // 保存したら key を変えてフォームを作り直す
  // （cacheComponents で画面が隠れて残るので、次に「結果を追加」を押したときに前の入力が残らないように）
  const [formKey, setFormKey] = useState(0);

  async function handleCreate(values: TestResultData) {
    await addTestResult(values);
    setFormKey((k) => k + 1);
    router.push("/records");
  }

  if (profile?.role !== "teacher") return <p>テスト結果は先生だけが入力できます</p>;

  return (
    <div className="flex max-w-lg flex-col gap-4">
      <Link href="/records" className="text-sm text-blue-600">← 記録に戻る</Link>
      <h1 className="text-xl font-bold">テスト結果を追加</h1>
      <TestResultForm key={formKey} submitLabel="保存する" onSubmit={handleCreate} />
    </div>
  );
}
