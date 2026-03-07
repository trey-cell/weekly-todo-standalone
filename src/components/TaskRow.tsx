import React, { useState } from 'react';
import { Todo, TIME_BLOCKS, PRIORITIES, EST_TIMES } from '../types';
import { sqlExec } from '../lib/db';
import { escSql, priorityBadge } from '../utils/helpers';
import { Trash2, Calendar } from 'lucide-react';

interface Props { todo: Todo; onUpdate: () => void; isSubRow?: boolean; }

type EditField = 'task' | 'time_block' | 'priority' | 'est_time' | 'notes' | null;

const DROPDOWN_FIELDS: Record<string, string[]> = {
  time_block: ['', ...TIME_BLOCKS],
  priority: ['', ...PRIORITIES],
  est_time: ['', ...EST_TIMES],
};

function parseEstMinutes(est: string): number {
  if (!est) return 30;
  const m = est.match(/(\d+)\s*(min|hour)/i);
  if (!m) return 30;
  const val = parseInt(m[1], 10);
  return m[2].toLowerCase().startsWith('hour') ? val * 60 : val;
}

function formatDateDue(val: string): string {
  if (!val) return '';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const day = days[d.getDay()];
  const month = d.getMonth() + 1;
  const date = d.getDate();
  let hours = d.getHours();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${day} ${month}/${date} ${hours}:${mins} ${ampm}`;
}

const TaskRow: React.FC<Props> = ({ todo, onUpdate, isSubRow = false }) => {
  const [editing, setEditing] = useState<EditField>(null);
  const [editVal, setEditVal] = useState('');
  const [hover, setHover] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [dateVal, setDateVal] = useState('');
  const [scheduling, setScheduling] = useState(false);

  const startEdit = (field: EditField) => {
    if (!field) return;
    setEditing(field);
    setEditVal((todo as any)[field] || '');
  };

  const save = async (field: string, value: string) => {
    const escaped = escSql(value);
    await sqlExec(`UPDATE todos SET ${field} = '${escaped}' WHERE id = ${todo.id}`);
    setEditing(null);
    onUpdate();
  };

  const toggleDone = async () => {
    if (todo.done === 1) {
      await sqlExec(`UPDATE todos SET done = 0, status = 'Not Started' WHERE id = ${todo.id}`);
    } else {
      await sqlExec(`DELETE FROM todos WHERE id = ${todo.id}`);
      // Google Tasks sync happens via the scheduled two-way sync
    }
    onUpdate();
  };

  const deleteTodo = async () => {
    await sqlExec(`DELETE FROM todos WHERE id = ${todo.id}`);
    onUpdate();
  };

  const startEditDate = () => {
    let initial = '';
    if (todo.date_due) {
      const d = new Date(todo.date_due);
      if (!isNaN(d.getTime())) {
        const year = d.getFullYear();
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const hours = d.getHours().toString().padStart(2, '0');
        const mins = d.getMinutes().toString().padStart(2, '0');
        initial = `${year}-${month}-${day}T${hours}:${mins}`;
      }
    }
    setDateVal(initial);
    setEditingDate(true);
  };

  const saveDate = async (val: string) => {
    setEditingDate(false);
    if (!val) {
      await sqlExec(`UPDATE todos SET date_due = '' WHERE id = ${todo.id}`);
      onUpdate();
      return;
    }
    setScheduling(true);
    try {
      const escaped = escSql(val);
      await sqlExec(`UPDATE todos SET date_due = '${escaped}' WHERE id = ${todo.id}`);
      // TODO Phase 2: Create Google Calendar event via Google Calendar API with OAuth
      // const durationMin = parseEstMinutes(todo.est_time);
      // await createGoogleCalendarEvent(todo, val, durationMin);
    } finally {
      setScheduling(false);
    }
    onUpdate();
  };

  const handleKeyDown = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter') save(field, editVal);
    if (e.key === 'Escape') setEditing(null);
  };

  const renderCell = (field: EditField, display?: React.ReactNode) => {
    if (editing === field && field) {
      const opts = DROPDOWN_FIELDS[field];
      if (opts) {
        return (
          <select className="select select-bordered select-xs w-full" value={editVal} autoFocus onChange={(e) => { setEditVal(e.target.value); save(field, e.target.value); }} onBlur={() => setEditing(null)}>
            {opts.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
          </select>
        );
      }
      return (
        <input className="input input-bordered input-xs w-full" value={editVal} autoFocus onChange={(e) => setEditVal(e.target.value)} onKeyDown={(e) => handleKeyDown(e, field)} onBlur={() => save(field, editVal)} />
      );
    }
    return (
      <span className="cursor-pointer hover:bg-base-200 rounded px-1 py-0.5 block truncate min-h-[1.25rem]" onClick={() => startEdit(field)} title={String((todo as any)[field!] || '')}>
        {display ?? ((todo as any)[field!] || '')}
      </span>
    );
  };

  const pb = priorityBadge(todo.priority);

  return (
    <tr className={`hover ${todo.done ? 'opacity-50' : ''} ${isSubRow ? 'bg-base-100/50' : ''}`} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}>
      <td className="w-8">
        <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={todo.done === 1} onChange={toggleDone} />
      </td>
      <td className="max-w-[200px]">
        <div className={isSubRow ? 'pl-6' : ''}>
          {renderCell('task', <span className={todo.done ? 'line-through' : ''}>{todo.task}</span>)}
        </div>
      </td>
      <td className="min-w-[140px]">
        {editingDate ? (
          <input type="datetime-local" className="input input-bordered input-xs w-full" value={dateVal} autoFocus onChange={(e) => setDateVal(e.target.value)} onBlur={() => saveDate(dateVal)} onKeyDown={(e) => { if (e.key === 'Enter') saveDate(dateVal); if (e.key === 'Escape') setEditingDate(false); }} />
        ) : (
          <span className="cursor-pointer hover:bg-base-200 rounded px-1 py-0.5 block min-h-[1.25rem] text-xs flex items-center gap-1" onClick={startEditDate}>
            {scheduling ? <span className="loading loading-spinner loading-xs"></span> : todo.date_due ? (
              <><Calendar className="w-3 h-3 text-primary flex-shrink-0" /><span>{formatDateDue(todo.date_due)}</span></>
            ) : <span className="text-base-content/30">+ Schedule</span>}
          </span>
        )}
      </td>
      <td>{renderCell('time_block')}</td>
      <td>{renderCell('priority', todo.priority ? <span className={pb.className + ' badge-sm whitespace-nowrap'}>{pb.emoji} {todo.priority.split('(')[0].trim()}</span> : '')}</td>
      <td>{renderCell('est_time')}</td>
      <td className="max-w-[180px]">{renderCell('notes')}</td>
      <td className="w-8">
        {hover && <button className="btn btn-ghost btn-xs text-error" onClick={deleteTodo} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
      </td>
    </tr>
  );
};

export default TaskRow;
