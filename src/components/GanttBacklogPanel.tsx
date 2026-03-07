import React from 'react';
import { Plus, Pencil, Trash2, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import type { GanttBacklogItem, GanttProject } from '../gantt-types';

interface GanttBacklogPanelProps {
  isOpen: boolean;
  onToggle: () => void;
  items: GanttBacklogItem[];
  projects: GanttProject[];
  onAdd: () => void;
  onEdit: (item: GanttBacklogItem) => void;
  onDelete: (id: string) => void;
}

const priorityLabel: Record<string, { emoji: string }> = {
  high: { emoji: '🔴' },
  normal: { emoji: '🟡' },
  low: { emoji: '🟢' },
};

const GanttBacklogPanel: React.FC<GanttBacklogPanelProps> = ({
  isOpen, onToggle, items, projects, onAdd, onEdit, onDelete,
}) => {
  const sorted = [...items].sort((a, b) => {
    const pOrder: Record<string, number> = { high: 0, normal: 1, low: 2 };
    const pa = pOrder[a.priority] ?? 1;
    const pb = pOrder[b.priority] ?? 1;
    if (pa !== pb) return pa - pb;
    return a.sortOrder - b.sortOrder;
  });

  const handleDragStart = (e: React.DragEvent, item: GanttBacklogItem) => {
    e.dataTransfer.setData('application/x-backlog', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
    const el = e.currentTarget as HTMLElement;
    e.dataTransfer.setDragImage(el, 10, 10);
  };

  return (
    <>
      <button
        className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-primary text-primary-content rounded-l-lg px-1 py-3 shadow-lg hover:bg-primary-focus transition-all"
        style={{ right: isOpen ? 280 : 0 }}
        onClick={onToggle}
        title={isOpen ? 'Close backlog' : 'Open backlog'}
      >
        {isOpen ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
      <div
        className="absolute right-0 top-0 bottom-0 bg-base-200 border-l border-base-300 shadow-xl z-20 transition-all duration-200 flex flex-col"
        style={{ width: isOpen ? 280 : 0, opacity: isOpen ? 1 : 0, overflow: 'hidden' }}
      >
        <div className="flex items-center justify-between p-3 border-b border-base-300 flex-shrink-0">
          <h3 className="font-bold text-sm uppercase tracking-wide text-base-content/70">📋 Backlog</h3>
          <button className="btn btn-xs btn-primary gap-1" onClick={onAdd}><Plus size={12} /> Add</button>
        </div>
        <div className="px-3 py-2 text-[10px] text-base-content/50 border-b border-base-300/50 flex-shrink-0">
          Drag items onto a phase row to schedule them
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sorted.length === 0 && (
            <div className="text-center text-base-content/40 text-xs py-8">No items yet.<br />Add things you need to schedule.</div>
          )}
          {sorted.map((item) => {
            const project = item.projectId ? projects.find((p) => p.id === item.projectId) : null;
            const prio = priorityLabel[item.priority] || priorityLabel.normal;
            return (
              <div key={item.id} className="bg-base-100 rounded-lg border border-base-300/50 p-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow group" draggable onDragStart={(e) => handleDragStart(e, item)}>
                <div className="flex items-start gap-1.5">
                  <GripVertical size={14} className="flex-shrink-0 text-base-content/30 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs">{prio.emoji}</span>
                      <span className="text-sm font-medium truncate text-base-content">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-base-content/50">{item.estimatedDays}d</span>
                      {project && <span className="text-[10px] text-base-content/40 truncate">{project.name}</span>}
                    </div>
                    {item.notes && <p className="text-[10px] text-base-content/40 mt-0.5 truncate">{item.notes}</p>}
                  </div>
                  <div className="hidden group-hover:flex items-center gap-0.5 flex-shrink-0">
                    <button className="btn btn-ghost btn-xs btn-square" onClick={() => onEdit(item)} title="Edit"><Pencil size={11} /></button>
                    <button className="btn btn-ghost btn-xs btn-square text-error" onClick={() => onDelete(item.id)} title="Delete"><Trash2 size={11} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

export default GanttBacklogPanel;
