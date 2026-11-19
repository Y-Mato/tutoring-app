import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { AvailabilityData } from "@/lib/types";

export async function addAvailability(data: AvailabilityData) {
  await addDoc(collection(db, "availabilities"), data);
}

export async function deleteAvailability(id: string) {
  await deleteDoc(doc(db, "availabilities", id));
}
