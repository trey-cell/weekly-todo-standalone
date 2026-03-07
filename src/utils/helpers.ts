export function escSql(val: string): string {
  return val.split("'").join("''");
}

export function priorityBadge(priority: string): { className: string; emoji: string } {
  if (priority.startsWith('Do First')) return { className: 'badge badge-error', emoji: '🔴' };
  if (priority.startsWith('Schedule')) return { className: 'badge badge-warning', emoji: '🟡' };
  if (priority.startsWith('Delegate')) return { className: 'badge bg-orange-500 text-white border-orange-500', emoji: '🟠' };
  if (priority.startsWith('Eliminate')) return { className: 'badge badge-ghost', emoji: '⚪' };
  return { className: 'badge badge-ghost', emoji: '' };
}

export function statusBadge(status: string): string {
  if (status === 'Done') return 'badge badge-success badge-sm';
  if (status === 'In Progress') return 'badge badge-info badge-sm';
  return 'badge badge-ghost badge-sm';
}
