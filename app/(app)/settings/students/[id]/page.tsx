"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StudentForm } from "@/components/StudentForm";
import type { StudentData } from "@/lib/types";
import { syncRegularLessons } from "@/lib/syncLessons";
import { ExamSection } from "@/components/ExamSection";
import { syncExamParent } from "@/lib/exams";

export default function EditStudentPage() {
    const router = useRouter();
    const { id } = useParams<{ id: string }>();
    const [student, setStudent] = useState<StudentData | null>(null);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        getDoc(doc(db, "students", id)).then((snap) => {
            if (snap.exists()) {
                setStudent(snap.data() as StudentData);
            } else {
                setNotFound(true);
            }
        });

    }, [id]);

    async function handleUpdate(values: StudentData) {
        await updateDoc(doc(db, "students", id), values);
        await syncRegularLessons(id, values);
        await syncExamParent(id, values.parentUid);

        router.push("/settings");
    }

    if (notFound) {
        return <p>生徒が見つかりません</p>;
    }
    if (!student) {
        return <p>読み込み中...</p>;
    }


    return (
        <div className="flex flex-col gap-4">
            <h1 className="text-xl font-bold">生徒を編集</h1>
            <StudentForm initialValues={student} submitLabel="保存する" onSubmit={handleUpdate} />
            <ExamSection studentId={id} parentUid={student.parentUid} />

        </div>
    );
}
