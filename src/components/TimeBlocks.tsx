import React, { useState } from 'react';
import { sqlExec } from '../lib/db';
import { RecurringBlock } from '../types';
import {
  Briefcase,
  Heart,
  ChevronDown,
  ChevronRight,
  Edit3,
  Check,
  X,
  Plus,
  Trash2,
} from 'lucide-react';

interface Props {
  blocks: RecurringBlock[];
  onUpdate: () => Promise<void>;
}

const CATEGORY_ICONS: Record<string, string> = {
  Work: '🏢',
  Financials: '💰',
  Spiritual: '🙏',
  Body: '💪',
  Household: '🏠',
  Relationship: '❤️',
};

const STAGE_CATEGORIES: { [key: string]: string[] } = {
  '1': ['Work', 'Financials'],
  '2': ['Spiritual', 'Body', 'Household', 'Relationship'],
};

const TimeBlocks: React.FC<Props> = ({ blocks, onUpdate }) => {
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 1: true, 2: true });
  const [editing, setEditing] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [adding, setAdding] = useState<number | null>(null);
  const [newBlock, setNewBlock] = useState({ category: '', title: '', hours: '' });

  const toggleStage = (stage: number) => {
    setExpanded((prev) => ({ ...prev, [stage]: !prev[stage] }));
  };

  const startEdit = (block: RecurringBlock) => {
    setEditing(block.id);
    setEditValue(String(block.hours_per_week));
  };

  const saveEdit = async (block: RecurringBlock) => {
    const val = parseFloat(editValue);
    if (isNaN(val) || val < 0) {
      setEditing(null);
      return;
    }
    setEditing(null);
    await sqlExec(
      `UPDATE recurring_blocks SET hours_per_week = ${val} WHERE id = ${block.id}`
    );
    onUpdate();
  };

  const deleteBlock = async (id: number) => {
    await sqlExec(`DELETE FROM recurring_blocks WHERE id = ${id}`);
    onUpdate();
  };

  const addBlock = async (stage: number) => {
    if (!newBlock.category || !newBlock.title || !newBlock.hours) return;
    const hours = parseFloat(newBlock.hours);
    if (isNaN(hours)) return;
    const cat = newBlock.category.replace(/'/g, "''");
    const title = newBlock.title.replace(/'/g, "''");
    await sqlExec(
      `INSERT INTO recurring_blocks (stage, category, title, hours_per_week, active) VALUES (${stage}, '${cat}', '${title}', ${hours}, 1)`
    );
    setAdding(null);
    setNewBlock({ category: '', title: '', hours: '' });
    onUpdate();
  };

  const isSleep = (b: RecurringBlock) =>
    b.category === 'Body' && b.title.toLowerCase().includes('sleep');

  const stages = [
    {
      num: 1,
      title: 'Operational Responsibilities',
      subtitle: "How you support your household — your 9-5 and things needed to live. These are NOT goals.",
      Icon: Briefcase,
    },
    {
      num: 2,
      title: 'Life Maintenance',
      subtitle: 'What makes you healthy — things humans need naturally.',
      Icon: Heart,
    },
  ];

  return (
    <div className="space-y-4">
      {stages.map(({ num, title, subtitle, Icon }) => {
        const stageBlocks = blocks.filter((b) => b.stage === num);
        const categories: string[] = STAGE_CATEGORIES[String(num)] ?? 
          Array.from(new Set(stageBlocks.map((b) => b.category)));
        const totalHours = stageBlocks
          .filter((b) => !isSleep(b))
          .reduce((s, b) => s + b.hours_per_week, 0);
        const isOpen = expanded[num] ?? true;

        return (
          <div key={num} className="card bg-base-200">
            <div className="card-body p-4 space-y-3">
              {/* Stage Header */}
              <div
                className="flex items-center justify-between cursor-pointer select-none"
                onClick={() => toggleStage(num)}
              >
                <div className="flex items-center gap-2">
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <Icon
                    className={`w-5 h-5 ${num === 1 ? 'text-primary' : 'text-secondary'}`}
                  />
                  <div>
                    <h3 className="font-bold text-sm">
                      Stage {num}: {title}
                    </h3>
                    <p className="text-xs text-base-content/50">{subtitle}</p>
                  </div>
                </div>
                <div
                  className={`badge badge-outline ${num === 1 ? 'badge-primary' : 'badge-secondary'}`}
                >
                  {totalHours}h / week
                </div>
              </div>

              {isOpen && (
                <div className="space-y-3">
                  {categories.map((cat) => {
                    const catBlocks = stageBlocks.filter((b) => b.category === cat);
                    if (catBlocks.length === 0) return null;
                    const catTotal = catBlocks
                      .filter((b) => !isSleep(b))
                      .reduce((s, b) => s + b.hours_per_week, 0);
                    const icon = CATEGORY_ICONS[cat] || '📋';

                    return (
                      <div key={cat} className="pl-4">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-base">{icon}</span>
                          <span className="font-semibold text-sm">{cat}</span>
                          <span className="text-xs text-base-content/40">
                            {catTotal}h/wk
                          </span>
                        </div>
                        <div className="space-y-1">
                          {catBlocks.map((block) => (
                            <div
                              key={block.id}
                              className="flex items-center gap-2 group text-sm pl-4 py-1 rounded hover:bg-base-300 transition-colors"
                            >
                              <span className="flex-1 min-w-0 truncate">
                                {block.title}
                                {isSleep(block) && (
                                  <span className="text-xs text-base-content/40 ml-2">
                                    (tracked separately)
                                  </span>
                                )}
                              </span>
                              {block.frequency && (
                                <span className="text-xs text-base-content/40 shrink-0">
                                  {block.frequency}
                                </span>
                              )}

                              {editing === block.id ? (
                                <div className="flex items-center gap-1 shrink-0">
                                  <input
                                    type="number"
                                    step="0.5"
                                    className="input input-bordered input-xs w-16 text-right"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') saveEdit(block);
                                      if (e.key === 'Escape') setEditing(null);
                                    }}
                                    autoFocus
                                  />
                                  <span className="text-xs text-base-content/60">h</span>
                                  <button
                                    className="btn btn-ghost btn-xs text-success"
                                    onClick={() => saveEdit(block)}
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-xs text-error"
                                    onClick={() => setEditing(null)}
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 shrink-0">
                                  <span className="font-mono text-xs bg-base-300 px-2 py-0.5 rounded">
                                    {block.hours_per_week}h
                                  </span>
                                  <button
                                    className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      startEdit(block);
                                    }}
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                  <button
                                    className="btn btn-ghost btn-xs opacity-0 group-hover:opacity-100 text-error"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteBlock(block.id);
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Block */}
                  {adding === num ? (
                    <div className="pl-4 bg-base-300 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <select
                          className="select select-bordered select-xs"
                          value={newBlock.category}
                          onChange={(e) =>
                            setNewBlock({ ...newBlock, category: e.target.value })
                          }
                        >
                          <option value="">Category</option>
                          {(STAGE_CATEGORIES[String(num)] || []).map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                          <option value="Other">Other</option>
                        </select>
                        <input
                          className="input input-bordered input-xs flex-1 min-w-[120px]"
                          placeholder="Title (e.g. Morning Run)"
                          value={newBlock.title}
                          onChange={(e) =>
                            setNewBlock({ ...newBlock, title: e.target.value })
                          }
                        />
                        <input
                          className="input input-bordered input-xs w-16"
                          type="number"
                          step="0.5"
                          placeholder="Hrs"
                          value={newBlock.hours}
                          onChange={(e) =>
                            setNewBlock({ ...newBlock, hours: e.target.value })
                          }
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          className="btn btn-primary btn-xs"
                          onClick={() => addBlock(num)}
                        >
                          Add
                        </button>
                        <button
                          className="btn btn-ghost btn-xs"
                          onClick={() => {
                            setAdding(null);
                            setNewBlock({ category: '', title: '', hours: '' });
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="btn btn-ghost btn-xs gap-1 ml-4 text-base-content/50"
                      onClick={() => setAdding(num)}
                    >
                      <Plus className="w-3 h-3" /> Add time block
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimeBlocks;
