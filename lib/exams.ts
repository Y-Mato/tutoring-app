import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ExamData } from "@/lib/types";

export async function addExam(data: ExamData) {
  await addDoc(collection(db, "exams"), data);
}

export async function deleteExam(id: string) {
  await deleteDoc(doc(db, "exams", id));
}
