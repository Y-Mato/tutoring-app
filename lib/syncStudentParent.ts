import { collection, getDocs, query, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";

// students から parentUid をコピーしているコレクション（lessons は syncRegularLessons で書き換える）
const COLLECTIONS = ["exams", "records", "testResults"];

// 生徒の保護者を変えたら、その生徒のテスト日程・授業記録・テスト結果の parentUid もそろえる
export async function syncStudentParent(studentId: string, parentUid: string | null) {
  const batch = writeBatch(db);
  let count = 0;

  for (const name of COLLECTIONS) {
    const snap = await getDocs(query(collection(db, name), where("studentId", "==", studentId)));
    snap.docs.forEach((d) => {
      if (d.data().parentUid !== parentUid) {
        batch.update(d.ref, { parentUid });
        count++;
      }
    });
  }

  if (count > 0) await batch.commit();
}
