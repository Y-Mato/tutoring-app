import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LessonRequestData, RequestStatus, RequestType } from "@/lib/types";

// 保護者が入力する部分（status などは自動で決まるので含めない）
export type NewRequest = Omit<LessonRequestData, "status" | "reason" | "lessonId" | "createdAt">;

export async function createRequest(data: NewRequest) {
  await addDoc(collection(db, "requests"), {
    ...data,
    status: "pending",
    reason: null,
    lessonId: null,
    createdAt: serverTimestamp(),
  });
}

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  extra: "追加コマ",
  makeup: "振替",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  pending: "承認待ち",
  approved: "承認",
  rejected: "却下",
};

// バッジの色
export const REQUEST_STATUS_CLASSES: Record<RequestStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-gray-100 text-gray-600",
};
