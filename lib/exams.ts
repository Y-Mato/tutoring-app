import { addDoc, collection, deleteDoc, doc, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExamData } from "@/lib/types";

export async function addExam(data: ExamData) {
  await addDoc(collection(db, "exams"), data);
}

export async function deleteExam(id: string) {
  await deleteDoc(doc(db, "exams", id));
}

// 生徒の保護者を変えたら、その生徒のテストの parentUid もそろえる
export async function syncExamParent(studentId: string, parentUid: string | null) {
  const snap = await getDocs(query(collection(db, "exams"), where("studentId", "==", studentId)));
  const batch = writeBatch(db);
  let count = 0;

  snap.docs.forEach((d) => {
    if (d.data().paretUid !== parentUid) {
      batch.update(d.ref, { parentUid });
      count++;
    }
  });

  if (count > 0) await batch.commit();
}
