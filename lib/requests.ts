import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { LessonRequestData } from "@/lib/types";

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
