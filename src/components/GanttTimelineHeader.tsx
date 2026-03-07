import React from 'react';
import { getDaysArray, isWeekend, isSameDay } from '../gantt-helpers';

interface GanttTimelineHeaderProps {
  viewStart: Date;
  numDays: number;
  dayWidth: number;
}

const WEEKDAY_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const GanttTimelineHeader: React.FC<GanttTimelineHeaderProps> = ({ viewStart, numDays, dayWidth }) => {
  const days = getDaysArray(viewStart, numDays);
  const today = new Date();

  const monthSpans: { label: string; span: number }[] = [];
  let currentMonth = -1;
  let currentYear = -1;

  for (const day of days) {
    const m = day.getMonth();
    const y = day.getFullYear();
    if (m === currentMonth && y === currentYear) {
      monthSpans[monthSpans.length - 1].span++;
    } else {
      monthSpans.push({ label: `${MONTH_NAMES[m]} ${y}`, span: 1 });
      currentMonth = m;
      currentYear = y;
    }
  }

  return (
    <div className="flex-shrink-0 border-b border-base-300">
      <div className="flex" style={{ minWidth: numDays * dayWidth }}>
        {monthSpans.map((ms, i) => (
          <div
            key={i}
            className="text-xs font-semibold text-base-content/60 border-b border-base-300 flex items-center px-1 bg-base-200"
            style={{ width: ms.span * dayWidth, height: 22 }}
          >
            {ms.label}
          </div>
        ))}
      </div>
      <div className="flex" style={{ minWidth: numDays * dayWidth }}>
        {days.map((day, i) => {
          const weekend = isWeekend(day);
          const isToday = isSameDay(day, today);
          return (
            <div
              key={i}
              className={`flex flex-col items-center justify-center text-center border-r border-base-300/40 select-none
                ${weekend ? 'bg-base-300/50' : 'bg-base-200'}
                ${isToday ? 'bg-primary/20 font-bold' : ''}
              `}
              style={{ width: dayWidth, height: 28, minWidth: dayWidth }}
            >
              <span className={`text-[10px] leading-none ${isToday ? 'text-primary' : 'text-base-content/70'}`}>
                {day.getDate()}
              </span>
              <span className={`text-[9px] leading-none ${isToday ? 'text-primary' : 'text-base-content/40'}`}>
                {WEEKDAY_ABBR[day.getDay()]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GanttTimelineHeader;
