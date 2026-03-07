import React, { useState, useMemo, useEffect } from 'react';
import { Todo, SortDir } from '../types';
import TaskRow from './TaskRow';
import MobileTaskCard from './MobileTaskCard';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronRight, ChevronDown } from 'lucide-react';
import { sqlExec } from '../lib/db';
import { priorityBadge } from '../utils/helpers';

interface Props { todos: Todo[]; onUpdate: () => void; }

type SortCol = 'task' | 'date_due' | 'time_block' | 'priority' | 'est_time' | 'sort_order';

const PRIORITY_ORDER: Record<string, number> = {
  'Do First (Urgent + Important)': 0,
  'Schedule (Important, Not Urgent)': 1,
  'Delegate (Urgent, Not Important)': 2,
  'Eliminate or Batch': 3,
  '': 4,
};

const columns: { key: SortCol; label: string }[] = [
  { key: 'task', label: 'Task' },
  { key: 'date_due', label: 'Date Due' },
  { key: 'time_block', label: 'Time Block' },
  { key: 'priority', label: 'Priority' },
  { key: 'est_time', label: 'Est. Time' },
];

interface TaskGroup { taskName: string; todos: Todo[]; }

const TaskTable: React.FC<Props> = ({ todos, onUpdate }) => {
  const [sortCol, setSortCol] = useState<SortCol>('sort_order');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const toggleSort = (col: SortCol) => {
    if (sortCol === col) setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const sorted = useMemo(() => {
    return [...todos].sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      if (sortCol === 'sort_order') return (a.sort_order - b.sort_order) * dir;
      if (sortCol === 'priority') return ((PRIORITY_ORDER[a.priority] ?? 4) - (PRIORITY_ORDER[b.priority] ?? 4)) * dir;
      const aVal = ((a as any)[sortCol] || '').toLowerCase();
      const bVal = ((b as any)[sortCol] || '').toLowerCase();
      return aVal < bVal ? -dir : aVal > bVal ? dir : 0;
    });
  }, [todos, sortCol, sortDir]);

  const groups = useMemo(() => {
    const groupMap = new Map<string, Todo[]>();
    const order: string[] = [];
    for (const t of sorted) {
      const key = t.task || '';
      if (!groupMap.has(key)) { groupMap.set(key, []); order.push(key); }
      groupMap.get(key)!.push(t);
    }
    return order.map((taskName): TaskGroup => ({ taskName, todos: groupMap.get(taskName)! }));
  }, [sorted]);

  const toggleExpand = (taskName: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(taskName)) next.delete(taskName); else next.add(taskName);
      return next;
    });
  };

  const toggleGroupDone = async (group: TaskGroup) => {
    const allDone = group.todos.every((t) => t.done === 1);
    if (allDone) {
      const ids = group.todos.map((t) => t.id).join(',');
      await sqlExec(`UPDATE todos SET done = 0, status = 'Not Started' WHERE id IN (${ids})`);
    } else {
      const ids = group.todos.map((t) => t.id).join(',');
      await sqlExec(`DELETE FROM todos WHERE id IN (${ids})`);
    }
    onUpdate();
  };

  const SortIcon: React.FC<{ col: SortCol }> = ({ col }) => {
    if (sortCol !== col) return <ArrowUpDown className="w-3 h-3 opacity-30" />;
    return sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />;
  };

  // ── Mobile Card Layout ──
  if (isMobile) {
    return (
      <div className="space-y-2">
        {sorted.length === 0 && (
          <div className="text-center py-8 text-base-content/50 text-sm">
            No tasks found. Adjust your filters or add a new task.
          </div>
        )}
        {groups.map((group) => {
          const isMulti = group.todos.length > 1;
          const isExpanded = expanded.has(group.taskName);
          const allDone = group.todos.every((t) => t.done === 1);

          if (!isMulti) {
            return <MobileTaskCard key={group.todos[0].id} todo={group.todos[0]} onUpdate={onUpdate} />;
          }

          const firstTodo = group.todos[0];
          const pb = priorityBadge(firstTodo.priority);

          return (
            <div key={`group-${group.taskName}`}>
              {/* Group Header Card */}
              <div className={`bg-base-200 rounded-lg p-3 ${allDone ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-sm checkbox-primary flex-shrink-0"
                    checked={allDone}
                    onChange={() => toggleGroupDone(group)}
                  />
                  <div
                    className="flex-1 flex items-center gap-1 cursor-pointer"
                    onClick={() => toggleExpand(group.taskName)}
                  >
                    {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                    <span className={`text-sm font-medium ${allDone ? 'line-through' : ''}`}>{group.taskName}</span>
                    <span className="badge badge-ghost badge-xs ml-1">{group.todos.length}</span>
                  </div>
                </div>
                {firstTodo.priority && (
                  <div className="ml-8 mt-1">
                    <span className={`${pb.className} badge-xs`}>{pb.emoji} {firstTodo.priority.split('(')[0].trim()}</span>
                  </div>
                )}
              </div>
              {/* Expanded subtasks */}
              {isExpanded && (
                <div className="space-y-1 mt-1">
                  {group.todos.map((t) => (
                    <MobileTaskCard key={t.id} todo={t} onUpdate={onUpdate} isSubRow={true} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // ── Desktop Table Layout ──
  return (
    <div className="overflow-x-auto rounded-lg border border-base-300">
      <table className="table table-sm table-zebra w-full">
        <thead>
          <tr className="bg-base-200">
            <th className="w-8">✅</th>
            {columns.map((c) => (
              <th key={c.key} className="cursor-pointer select-none hover:bg-base-300 transition-colors" onClick={() => toggleSort(c.key)}>
                <span className="flex items-center gap-1">{c.label} <SortIcon col={c.key} /></span>
              </th>
            ))}
            <th className="w-12">Notes</th>
            <th className="w-8"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr><td colSpan={10} className="text-center py-8 text-base-content/50">No tasks found. Adjust your filters or add a new task.</td></tr>
          )}
          {groups.map((group) => {
            const isMulti = group.todos.length > 1;
            const isExpanded = expanded.has(group.taskName);
            if (!isMulti) return <TaskRow key={group.todos[0].id} todo={group.todos[0]} onUpdate={onUpdate} isSubRow={false} />;
            const allDone = group.todos.every((t) => t.done === 1);
            const firstTodo = group.todos[0];
            const pb = priorityBadge(firstTodo.priority);
            return (
              <React.Fragment key={`group-${group.taskName}`}>
                <tr className={`hover bg-base-200/50 font-medium ${allDone ? 'opacity-50' : ''}`}>
                  <td className="w-8">
                    <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={allDone} onChange={() => toggleGroupDone(group)} />
                  </td>
                  <td className="max-w-[200px]">
                    <span className="flex items-center gap-1 cursor-pointer select-none" onClick={() => toggleExpand(group.taskName)}>
                      {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                      <span className={allDone ? 'line-through' : ''}>{group.taskName}</span>
                      <span className="badge badge-ghost badge-xs ml-1">{group.todos.length} subtasks</span>
                    </span>
                  </td>
                  <td className="text-xs text-base-content/50"></td>
                  <td>{firstTodo.time_block || ''}</td>
                  <td>{firstTodo.priority ? <span className={pb.className + ' badge-sm whitespace-nowrap'}>{pb.emoji} {firstTodo.priority.split('(')[0].trim()}</span> : ''}</td>
                  <td></td><td></td><td></td>
                </tr>
                {isExpanded && group.todos.map((t) => <TaskRow key={t.id} todo={t} onUpdate={onUpdate} isSubRow={true} />)}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TaskTable;
