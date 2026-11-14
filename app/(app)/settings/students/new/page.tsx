"use client";

import { useRouter } from "next/navigation";
import { addDoc, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudentForm } from "@/components/StudentForm";
import { DEFAULT_STUDENT, type StudentData } from "@/lib/types";
import { useState } from "react";

export default function NewStudentPage() {
  const router = useRouter();
  const [formKey, setFormKey] = useState(0);

  async function handleCreate(values: StudentData) {
    await addDoc(collection(db, "students"), values);
    setFormKey((k) => k + 1);   // フォームを作り直す
    router.push("/settings");
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">生徒を追加</h1>
      <StudentForm key={formKey} initialValues={DEFAULT_STUDENT} submitLabel="登録する" onSubmit={handleCreate} />

    </div>
  );
}
