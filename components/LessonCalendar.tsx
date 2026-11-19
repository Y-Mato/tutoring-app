"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import jaLocale from "@fullcalendar/react/locales/ja";
import type { EventInput } from "@fullcalendar/react";
import interactionPlugin from "@fullcalendar/react/interaction";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

export function LessonCalendar({
  events,
  onSelectDate,
}: {
  events: EventInput[];
  onSelectDate: (date: string) => void;   // "2026-11-20" を受け取る
}) {
  return (
    // 今日のマスの色を消す（テスト期間の色と混ざって見分けにくくなるため）
    // FullCalendar の色は CSS の変数で決まっているので、囲む要素で上書きする
    <div style={{ ["--fc-classic-today" as string]: "transparent" }}>
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, classicThemePlugin]}
      dateClick={(info) => onSelectDate(info.dateStr.slice(0,10))} 
      eventClick={(info) => onSelectDate(info.event.startStr.slice(0,10))}
      locale={jaLocale}
      initialView="dayGridMonth"
      headerToolbar={{ start: "prev,next today", center: "title", end: "dayGridMonth,timeGridWeek" }}
      height="auto"
      // 今日はマスの色ではなく、日付を青い丸で示す（期間の色と混ざらないように）
      dayCellTopInnerClass={(info) => (info.isToday ? "rounded-full bg-blue-600 px-2 font-bold text-white!" : "")}
      dayHeaderInnerClass={(info) => (info.isToday ? "rounded-full bg-blue-600 px-2 font-bold text-white!" : "")}
      slotMinTime="08:00"
      slotMaxTime="22:00"
      events={events}
    />
    </div>
  );
}
