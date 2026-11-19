import type { Role } from "@/components/AuthProvider"; 

// レギュラーコマ（毎週の決まった時間）
export type RegularSlot = {
  dayOfWeek: number; // 0=日, 1=月, ... 6=土（JavaScript の Date と同じ）
  start: string;     // "17:00"
  end: string;       // "18:20"
};

// 単価
export type Rates = {
  regularFee: number;     // 通常コマ1回の料金（円）
  regularMinutes: number; // 通常コマの長さ（分）
  hourlyRate: number;     // 追加コマの時給（円）
  unitMinutes: number;    // 追加コマの計算単位（分）
};

// Firestore に保存する形
export type StudentData = {
  name: string;
  color: string;            // "#3b82f6"
  parentUid: string | null; // まだ保護者がいなければ null
  regularSlots: RegularSlot[];
  rates: Rates;
};

// 画面で使う形（ドキュメントID付き）
export type Student = StudentData & { id: string };

// 新しく生徒を作るときの初期値（DESIGN.md の決定事項）
export const DEFAULT_STUDENT: StudentData = {
  name: "",
  color: "#3b82f6",
  parentUid: null,
  regularSlots: [],
  rates: { regularFee: 2000, regularMinutes: 80, hourlyRate: 1500, unitMinutes: 30 },
};

// 1コマ（lessons コレクション）
export type LessonType = "regular" | "extra" | "makeup";
export type LessonStatus = "scheduled" | "cancelled" | "done";

export type LessonData = {
  studentId: string;
  parentUid: string | null; // 保護者が読めるかどうかの判定に使う（students からコピー）
  date: string;             // "2026-11-16"
  start: string;            // "17:00"
  end: string;              // "18:20"
  type: LessonType;
  status: LessonStatus;
  cancelledBy: Role | null;
  makeupForId: string | null;
  fee: number;              // 作った時点の料金（あとで単価を変えても変わらない）
};

export type Lesson = LessonData & { id: string };
