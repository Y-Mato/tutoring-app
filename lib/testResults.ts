import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { TestKind, TestResultData } from "@/lib/types";

export const TEST_KIND_LABELS: Record<TestKind, string> = {
  regular: "定期テスト",
  mock: "模試",
};

export async function addTestResult(data: TestResultData) {
  await addDoc(collection(db, "testResults"), data);
}

export async function deleteTestResult(id: string) {
  await deleteDoc(doc(db, "testResults", id));
}

// 入力欄の文字列 → 数値。空なら null、数字でなければ NaN（エラーにする）
export function toNumberOrNull(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}
