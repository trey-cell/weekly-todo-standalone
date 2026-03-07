import React, { useState } from 'react';
import { sqlExec } from '../lib/db';
import { Goal } from '../types';
import {
  Target,
  Calendar,
  ListChecks,
  Plus,
  Check,
  Trash2,
  Link,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

interface Props {
  goals: Goal[];
  freeHours: number;
  onUpdate: () => Promise<void>;
}

const GOAL_TYPES = [
  {
    type: '90-day',
    label: '🎯 90-Day Goals',
    Icon: Target,
    desc: 'Your big outcomes for the quarter — 3-5 max',
    addLabel: 'goal',
  },
  {
    type: '30-day',
    label: '📅 30-Day Goals',
    Icon: Calendar,
    desc: 'Monthly milestones that build toward 90-day goals',
    addLabel: 'goal',
  },
  {
    type: 'weekly',
    label: '📋 Weekly Actions',
    Icon: ListChecks,
    desc: "This week's specific actions to complete",
    addLabel: 'action',
  },
];

const GoalTracker: React.FC<Props> = ({ goals, freeHours, onUpdate }) => {
  const [adding, setAdding] = useState<string | null>(null);
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    parentId: '',
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    '90-day': true,
    '30-day': true,
    weekly: true,
  });

  const addGoal = async (type: string) => {
    if (!newGoal.title.trim()) return;
    const title = newGoal.title.replace(/'/g, "''");
    const desc = newGoal.description.replace(/'/g, "''");
    const parentPart = newGoal.parentId
      ? `, ${parseInt(newGoal.parentId)}`
      : ', NULL';
    await sqlExec(
      `INSERT INTO goals (type, title, description, stage, status, parent_goal_id) VALUES ('${type}', '${title}', '${desc}', 3, 'active'${parentPart})`
    );
    setAdding(null);
    setNewGoal({ title: '', description: '', parentId: '' });
    onUpdate();
  };

  const completeGoal = async (id: number) => {
    await sqlExec(
      `UPDATE goals SET status = 'completed' WHERE id = ${id}`
    );
    onUpdate();
  };

  const deleteGoal = async (id: number) => {
    await sqlExec(`DELETE FROM goals WHERE id = ${id}`);
    onUpdate();
  };

  const getParentGoals = (type: string): Goal[] => {
    if (type === '30-day') return goals.filter((g) => g.type === '90-day');
    if (type === 'weekly') return goals.filter((g) => g.type === '30-day');
    return [];
  };

  const getParentTitle = (parentId: number | null): string | null => {
    if (!parentId) return null;
    const parent = goals.find((g) => g.id === parentId);
    return parent ? parent.title : null;
  };

  return (
    <div className="card bg-base-200">
      <div className="card-body p-4 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="card-title text-base gap-2">
              <Target className="w-5 h-5 text-accent" />
              Stage 3: Goal Time (RPM)
            </h2>
            <p className="text-xs text-base-content/50">
              3-5 outcomes to focus on. Break 90-day → 30-day → weekly actions.
            </p>
          </div>
          <div className="badge badge-accent badge-outline">
            {freeHours.toFixed(1)}h available/wk
          </div>
        </div>

        <div className="text-xs text-base-content/40 italic bg-base-300 rounded-lg p-2">
          💡 Ask yourself: Can any items be hired out, delegated, or pay someone
          else who is cheaper than your time?
        </div>

        {GOAL_TYPES.map(({ type, label, desc, addLabel }) => {
          const typeGoals = goals.filter((g) => g.type === type);
          const parentOptions = getParentGoals(type);
          const isOpen = expanded[type] ?? true;

          return (
            <div key={type} className="space-y-2">
              <div
                className="flex items-center gap-2 cursor-pointer select-none"
                onClick={() =>
                  setExpanded((prev) => ({ ...prev, [type]: !prev[type] }))
                }
              >
                {isOpen ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                <span className="font-semibold text-sm">{label}</span>
                <span className="badge badge-sm badge-ghost">
                  {typeGoals.length}
                </span>
                <span className="text-xs text-base-content/40 hidden sm:inline">
                  — {desc}
                </span>
              </div>

              {isOpen && (
                <div className="pl-6 space-y-2">
                  {typeGoals.length === 0 && adding !== type && (
                    <p className="text-xs text-base-content/40 italic py-1">
                      No {label.toLowerCase().replace(/[🎯📅📋]\s*/, '')} set yet —
                      add your first one below
                    </p>
                  )}

                  {typeGoals.map((goal) => {
                    const parentTitle = getParentTitle(goal.parent_goal_id);
                    return (
                      <div
                        key={goal.id}
                        className="flex items-start gap-2 group bg-base-300 rounded-lg p-2.5 hover:bg-base-300/80 transition-colors"
                      >
                        <button
                          className="btn btn-ghost btn-xs mt-0.5 text-success"
                          onClick={() => completeGoal(goal.id)}
                          title="Mark complete"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{goal.title}</div>
                          {goal.description && (
                            <div className="text-xs text-base-content/60 mt-0.5">
                              {goal.description}
                            </div>
                          )}
                          {parentTitle && (
                            <div className="text-xs text-base-content/40 flex items-center gap-1 mt-0.5">
                              <Link className="w-3 h-3" />
                              <span className="truncate">{parentTitle}</span>
                            </div>
                          )}
                        </div>
                        <button
                          className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 text-error shrink-0"
                          onClick={() => deleteGoal(goal.id)}
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}

                  {adding === type ? (
                    <div className="bg-base-300 rounded-lg p-3 space-y-2">
                      <input
                        className="input input-bordered input-sm w-full"
                        placeholder={`${addLabel === 'action' ? 'Action' : 'Goal'} title...`}
                        value={newGoal.title}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, title: e.target.value })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newGoal.title.trim())
                            addGoal(type);
                          if (e.key === 'Escape') {
                            setAdding(null);
                            setNewGoal({
                              title: '',
                              description: '',
                              parentId: '',
                            });
                          }
                        }}
                        autoFocus
                      />
                      <input
                        className="input input-bordered input-sm w-full"
                        placeholder="Description (optional)..."
                        value={newGoal.description}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, description: e.target.value })
                        }
                      />
                      {parentOptions.length > 0 && (
                        <select
                          className="select select-bordered select-sm w-full"
                          value={newGoal.parentId}
                          onChange={(e) =>
                            setNewGoal({ ...newGoal, parentId: e.target.value })
                          }
                        >
                          <option value="">
                            Link to{' '}
                            {type === '30-day' ? '90-day goal' : '30-day goal'}{' '}
                            (optional)
                          </option>
                          {parentOptions.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.title}
                            </option>
                          ))}
                        </select>
                      )}
                      <div className="flex gap-2">
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => addGoal(type)}
                          disabled={!newGoal.title.trim()}
                        >
                          Add {addLabel}
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => {
                            setAdding(null);
                            setNewGoal({
                              title: '',
                              description: '',
                              parentId: '',
                            });
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn btn-ghost btn-xs gap-1 text-base-content/50"
                      onClick={() => setAdding(type)}
                    >
                      <Plus className="w-3 h-3" /> Add {addLabel}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalTracker;
