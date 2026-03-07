export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function ganttParseDate(dateStr: string): Date {
  return new Date(dateStr + 'T00:00:00');
}

export function ganttFormatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function ganttAddDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function ganttDiffDays(a: Date, b: Date): number {
  const msPerDay = 86400000;
  const aTime = new Date(a.getFullYear(), a.getMonth(), a.getDate()).getTime();
  const bTime = new Date(b.getFullYear(), b.getMonth(), b.getDate()).getTime();
  return Math.round((bTime - aTime) / msPerDay);
}

export function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getDaysArray(start: Date, numDays: number): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < numDays; i++) {
    days.push(ganttAddDays(start, i));
  }
  return days;
}

export const GANTT_COLOR_MAP: Record<string, { bg: string; text: string }> = {
  blue: { bg: 'bg-info', text: 'text-info-content' },
  red: { bg: 'bg-error', text: 'text-error-content' },
  green: { bg: 'bg-success', text: 'text-success-content' },
  amber: { bg: 'bg-warning', text: 'text-warning-content' },
  purple: { bg: 'bg-secondary', text: 'text-secondary-content' },
  cyan: { bg: 'bg-accent', text: 'text-accent-content' },
  primary: { bg: 'bg-primary', text: 'text-primary-content' },
};

export function getBarStyle(
  startDate: string,
  endDate: string,
  viewStart: Date,
  dayWidth: number
): { left: number; width: number; visible: boolean } {
  const taskStart = ganttParseDate(startDate);
  const taskEnd = ganttParseDate(endDate);
  const left = ganttDiffDays(viewStart, taskStart) * dayWidth;
  const width = (ganttDiffDays(taskStart, taskEnd) + 1) * dayWidth;
  const viewEnd = left + width;
  const visible = viewEnd > 0 && left < 1000 * dayWidth;
  return { left, width, visible };
}
