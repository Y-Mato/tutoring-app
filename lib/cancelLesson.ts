import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Role } from "@/components/AuthProvider";

// コマを休みにする（by：だれが休みにしたか）
export async function cancelLesson(lessonId: string, by: Role) {
    await updateDoc(doc(db, "lessons", lessonId), { status: "cancelled", cancelledBy: by });

}

// 休みを取り消して、予定に戻す
export async function restoreLesson(lessonId: string) {
    await updateDoc(doc(db, "lessons", lessonId), { status: "scheduled", cancelledBy: null });

}
