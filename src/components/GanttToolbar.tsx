import React from 'react';
import { ChevronLeft, ChevronRight, FolderPlus, Users, Eye, EyeOff } from 'lucide-react';
import { ganttAddDays } from '../gantt-helpers';

interface GanttToolbarProps {
  viewStart: Date;
  numDays: number;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onAddProject: () => void;
  onAddEmployee: () => void;
  showCompleted: boolean;
  onToggleCompleted: () => void;
}

const GanttToolbar: React.FC<GanttToolbarProps> = ({
  viewStart,
  numDays,
  onPrev,
  onNext,
  onToday,
  onAddProject,
  onAddEmployee,
  showCompleted,
  onToggleCompleted,
}) => {
  const viewEnd = ganttAddDays(viewStart, numDays - 1);

  const formatRange = () => {
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    const startStr = viewStart.toLocaleDateString('en-US', opts);
    const endStr = viewEnd.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
    return `${startStr} – ${endStr}`;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-base-200 border-b border-base-300 flex-wrap">
      <div className="flex items-center gap-1">
        <button className="btn btn-sm btn-ghost" onClick={onPrev} title="Previous week">
          <ChevronLeft size={16} />
        </button>
        <button className="btn btn-sm btn-outline" onClick={onToday}>
          Today
        </button>
        <button className="btn btn-sm btn-ghost" onClick={onNext} title="Next week">
          <ChevronRight size={16} />
        </button>
      </div>

      <span className="text-sm font-semibold text-base-content min-w-[180px] text-center">
        {formatRange()}
      </span>

      <div className="flex-1" />

      <button
        className={`btn btn-sm btn-ghost gap-1 ${showCompleted ? 'btn-active' : ''}`}
        onClick={onToggleCompleted}
        title={showCompleted ? 'Hide completed' : 'Show completed'}
      >
        {showCompleted ? <Eye size={14} /> : <EyeOff size={14} />}
        <span className="text-xs hidden sm:inline">Completed</span>
      </button>

      <button className="btn btn-sm btn-outline btn-primary gap-1" onClick={onAddProject}>
        <FolderPlus size={14} />
        <span className="hidden sm:inline">Project</span>
      </button>

      <button className="btn btn-sm btn-outline btn-secondary gap-1" onClick={onAddEmployee}>
        <Users size={14} />
        <span className="hidden sm:inline">Crew</span>
      </button>
    </div>
  );
};

export default GanttToolbar;
