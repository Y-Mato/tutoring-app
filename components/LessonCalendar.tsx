"use client";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/react/daygrid";
import timeGridPlugin from "@fullcalendar/react/timegrid";
import classicThemePlugin from "@fullcalendar/react/themes/classic";
import jaLocale from "@fullcalendar/react/locales/ja";
import type { EventInput } from "@fullcalendar/react";

import "@fullcalendar/react/skeleton.css";
import "@fullcalendar/react/themes/classic/theme.css";
import "@fullcalendar/react/themes/classic/palette.css";

export function LessonCalendar({ events }: { events: EventInput[] }) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, classicThemePlugin]}
      locale={jaLocale}
      initialView="dayGridMonth"
      headerToolbar={{ start: "prev,next today", center: "title", end: "dayGridMonth,timeGridWeek" }}
      height="auto"
      allDaySlot={false}
      slotMinTime="08:00"
      slotMaxTime="22:00"
      events={events}
    />
  );
}
