import React, { useState } from 'react';
import { Todo, TIME_BLOCKS, PRIORITIES, EST_TIMES } from '../types';
import { sqlExec } from '../lib/db';
import { escSql, priorityBadge } from '../utils/helpers';
import { Trash2, Calendar, ChevronDown, ChevronRight } from 'lucide-react';

interface Props {
  todo: Todo;
  onUpdate: () => void;
  isSubRow?: boolean;
}

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

const MobileTaskCard: React.FC<Props> = ({ todo, onUpdate, isSubRow = false }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingDate, setEditingDate] = useState(false);
  const [dateVal, setDateVal] = useState('');
  const [scheduling, setScheduling] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');

  const toggleDone = async () => {
    if (todo.done === 1) {
      await sqlExec(`UPDATE todos SET done = 0, status = 'Not Started' WHERE id = ${todo.id}`);
    } else {
      await sqlExec(`DELETE FROM todos WHERE id = ${todo.id}`);
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
    } finally {
      setScheduling(false);
    }
    onUpdate();
  };

  const saveField = async (field: string, value: string) => {
    const escaped = escSql(value);
    await sqlExec(`UPDATE todos SET ${field} = '${escaped}' WHERE id = ${todo.id}`);
    setEditingField(null);
    onUpdate();
  };

  const pb = priorityBadge(todo.priority);

  const DROPDOWN_OPTIONS: Record<string, string[]> = {
    time_block: ['', ...TIME_BLOCKS],
    priority: ['', ...PRIORITIES],
    est_time: ['', ...EST_TIMES],
  };

  return (
    <div className={`bg-base-200 rounded-lg p-3 ${isSubRow ? 'ml-6 border-l-2 border-primary/30' : ''} ${todo.done ? 'opacity-50' : ''}`}>
      {/* Main Row: checkbox + task name + expand arrow */}
      <div className="flex items-start gap-2">
        <input
          type="checkbox"
          className="checkbox checkbox-sm checkbox-primary mt-0.5 flex-shrink-0"
          checked={todo.done === 1}
          onChange={toggleDone}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-1">
            <span className={`text-sm font-medium ${todo.done ? 'line-through' : ''} break-words`}>
              {todo.task}
              {todo.subtask && <span className="text-xs opacity-60 ml-1">— {todo.subtask}</span>}
            </span>
            <button
              className="btn btn-ghost btn-xs px-1 flex-shrink-0"
              onClick={() => setDetailsOpen(!detailsOpen)}
            >
              {detailsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {/* Quick info badges */}
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {todo.priority && (
              <span className={`${pb.className} badge-xs`}>{pb.emoji} {todo.priority.split('(')[0].trim()}</span>
            )}
            {todo.time_block && (
              <span className="badge badge-ghost badge-xs">{todo.time_block}</span>
            )}
            {todo.est_time && (
              <span className="badge badge-outline badge-xs">{todo.est_time}</span>
            )}
            {/* Date Due inline */}
            {editingDate ? (
              <input
                type="datetime-local"
                className="input input-bordered input-xs w-auto"
                value={dateVal}
                autoFocus
                onChange={(e) => setDateVal(e.target.value)}
                onBlur={() => saveDate(dateVal)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveDate(dateVal); if (e.key === 'Escape') setEditingDate(false); }}
              />
            ) : (
              <span
                className="badge badge-xs cursor-pointer gap-0.5"
                onClick={startEditDate}
              >
                {scheduling ? (
                  <span className="loading loading-spinner loading-xs"></span>
                ) : todo.date_due ? (
                  <><Calendar className="w-2.5 h-2.5 text-primary" />{formatDateDue(todo.date_due)}</>
                ) : (
                  <span className="opacity-40">+ Schedule</span>
                )}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expandable Details */}
      {detailsOpen && (
        <div className="mt-3 pt-2 border-t border-base-300 space-y-2">
          {/* Priority */}
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-50 w-16 flex-shrink-0">Priority</span>
            {editingField === 'priority' ? (
              <select
                className="select select-bordered select-xs flex-1"
                value={editVal}
                autoFocus
                onChange={(e) => { setEditVal(e.target.value); saveField('priority', e.target.value); }}
                onBlur={() => setEditingField(null)}
              >
                {DROPDOWN_OPTIONS.priority.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
              </select>
            ) : (
              <span
                className="text-xs cursor-pointer hover:bg-base-300 rounded px-1 py-0.5 flex-1"
                onClick={() => { setEditingField('priority'); setEditVal(todo.priority || ''); }}
              >
                {todo.priority ? <span className={`${pb.className} badge-xs`}>{pb.emoji} {todo.priority.split('(')[0].trim()}</span> : <span className="opacity-30">Set priority</span>}
              </span>
            )}
          </div>

          {/* Time Block */}
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-50 w-16 flex-shrink-0">Block</span>
            {editingField === 'time_block' ? (
              <select
                className="select select-bordered select-xs flex-1"
                value={editVal}
                autoFocus
                onChange={(e) => { setEditVal(e.target.value); saveField('time_block', e.target.value); }}
                onBlur={() => setEditingField(null)}
              >
                {DROPDOWN_OPTIONS.time_block.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
              </select>
            ) : (
              <span
                className="text-xs cursor-pointer hover:bg-base-300 rounded px-1 py-0.5 flex-1"
                onClick={() => { setEditingField('time_block'); setEditVal(todo.time_block || ''); }}
              >
                {todo.time_block || <span className="opacity-30">Set time block</span>}
              </span>
            )}
          </div>

          {/* Est. Time */}
          <div className="flex items-center gap-2">
            <span className="text-xs opacity-50 w-16 flex-shrink-0">Est.</span>
            {editingField === 'est_time' ? (
              <select
                className="select select-bordered select-xs flex-1"
                value={editVal}
                autoFocus
                onChange={(e) => { setEditVal(e.target.value); saveField('est_time', e.target.value); }}
                onBlur={() => setEditingField(null)}
              >
                {DROPDOWN_OPTIONS.est_time.map((o) => <option key={o} value={o}>{o || '—'}</option>)}
              </select>
            ) : (
              <span
                className="text-xs cursor-pointer hover:bg-base-300 rounded px-1 py-0.5 flex-1"
                onClick={() => { setEditingField('est_time'); setEditVal(todo.est_time || ''); }}
              >
                {todo.est_time || <span className="opacity-30">Set estimate</span>}
              </span>
            )}
          </div>

          {/* Notes */}
          <div className="flex items-start gap-2">
            <span className="text-xs opacity-50 w-16 flex-shrink-0 pt-0.5">Notes</span>
            {editingField === 'notes' ? (
              <input
                className="input input-bordered input-xs flex-1"
                value={editVal}
                autoFocus
                onChange={(e) => setEditVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveField('notes', editVal); if (e.key === 'Escape') setEditingField(null); }}
                onBlur={() => saveField('notes', editVal)}
              />
            ) : (
              <span
                className="text-xs cursor-pointer hover:bg-base-300 rounded px-1 py-0.5 flex-1"
                onClick={() => { setEditingField('notes'); setEditVal((todo as any).notes || ''); }}
              >
                {(todo as any).notes || <span className="opacity-30">Add notes</span>}
              </span>
            )}
          </div>

          {/* Delete */}
          <div className="flex justify-end pt-1">
            <button className="btn btn-ghost btn-xs text-error gap-1" onClick={deleteTodo}>
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileTaskCard;
