import React, { useRef, useCallback, useMemo, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  Pencil,
  CheckSquare,
  Square,
  CircleDot,
} from 'lucide-react';
import type {
  GanttProject, GanttPhase, GanttTask, GanttEmployee,
  GanttAssignment, GanttBacklogItem, GanttRow,
} from '../gantt-types';
import GanttTimelineHeader from './GanttTimelineHeader';
import {
  getDaysArray, isWeekend, isSameDay, getBarStyle, GANTT_COLOR_MAP,
  ganttDiffDays, ganttFormatDate, ganttAddDays,
} from '../gantt-helpers';

interface GanttChartProps {
  projects: GanttProject[];
  phases: GanttPhase[];
  tasks: GanttTask[];
  employees: GanttEmployee[];
  assignments: GanttAssignment[];
  viewStart: Date;
  numDays: number;
  dayWidth: number;
  showCompleted: boolean;
  collapsedProjects: Set<string>;
  onToggleProject: (id: string) => void;
  onEditTask: (task: GanttTask) => void;
  onToggleTaskStatus: (task: GanttTask) => void;
  onEditEmployee: (emp: GanttEmployee) => void;
  onAddTask: (projectId: string, phaseId: string) => void;
  onAddPhase: (projectId: string) => void;
  onAddAssignment: (employeeId: string) => void;
  onEditProject: (project: GanttProject) => void;
  onDeleteProject: (projectId: string) => void;
  onDeletePhase: (projectId: string, phaseId: string) => void;
  onDeleteEmployee: (employeeId: string) => void;
  onDeleteAssignment: (assignmentId: string) => void;
  onBacklogDrop: (backlogItem: GanttBacklogItem, projectId: string, phaseId: string, dropDate: string) => void;
  backlogOpen: boolean;
}

const GanttChart: React.FC<GanttChartProps> = ({
  projects, phases, tasks, employees, assignments,
  viewStart, numDays, dayWidth, showCompleted, collapsedProjects,
  onToggleProject, onEditTask, onToggleTaskStatus, onEditEmployee,
  onAddTask, onAddPhase, onAddAssignment, onEditProject, onDeleteProject,
  onDeletePhase, onDeleteEmployee, onDeleteAssignment, onBacklogDrop, backlogOpen,
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  const [dragOverRowId, setDragOverRowId] = useState<string | null>(null);
  const [dragOverDayIdx, setDragOverDayIdx] = useState<number | null>(null);

  const handleTimelineScroll = useCallback(() => {
    if (timelineRef.current && sidebarRef.current) {
      sidebarRef.current.scrollTop = timelineRef.current.scrollTop;
    }
    if (timelineRef.current && headerRef.current) {
      headerRef.current.scrollLeft = timelineRef.current.scrollLeft;
    }
  }, []);

  const days = useMemo(() => getDaysArray(viewStart, numDays), [viewStart, numDays]);
  const today = new Date();

  const todayOffset = useMemo(() => {
    const d = ganttDiffDays(viewStart, today);
    if (d >= 0 && d < numDays) return d * dayWidth + dayWidth / 2;
    return null;
  }, [viewStart, numDays, dayWidth]);

  const getColorClasses = (colorKey?: string) => {
    return GANTT_COLOR_MAP[colorKey || 'blue'] || GANTT_COLOR_MAP.blue;
  };

  // Build flat row list
  const rows: GanttRow[] = useMemo(() => {
    const result: GanttRow[] = [];
    result.push({ type: 'project-header' as const, id: '__projects_section', label: 'PROJECTS', indent: 0 });

    const sortedProjects = [...projects].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const project of sortedProjects) {
      result.push({ type: 'project-header', id: project.id, label: project.name, indent: 0, projectId: project.id, color: project.color });
      if (!collapsedProjects.has(project.id)) {
        const projectPhases = phases.filter((p) => p.projectId === project.id).sort((a, b) => a.sortOrder - b.sortOrder);
        for (const phase of projectPhases) {
          result.push({ type: 'phase-header', id: phase.id, label: phase.name, indent: 1, projectId: project.id, phaseId: phase.id, color: project.color });
          const phaseTasks = tasks
            .filter((t) => t.phaseId === phase.id && t.projectId === project.id)
            .filter((t) => showCompleted || t.status !== 'completed')
            .sort((a, b) => a.sortOrder - b.sortOrder);
          for (const task of phaseTasks) {
            result.push({ type: 'task', id: task.id, label: task.name, indent: 2, projectId: project.id, phaseId: phase.id, task, color: project.color });
          }
        }
      }
    }
    result.push({ type: 'employee-header' as const, id: '__crew_section', label: 'CREW', indent: 0 });
    const sortedEmployees = [...employees].sort((a, b) => a.sortOrder - b.sortOrder);
    for (const emp of sortedEmployees) {
      result.push({ type: 'employee', id: emp.id, label: emp.name, indent: 0, employee: emp, color: emp.color });
    }
    return result;
  }, [projects, phases, tasks, employees, showCompleted, collapsedProjects]);

  const getRowHeight = (row: GanttRow): number => {
    if (row.id === '__projects_section' || row.id === '__crew_section') return 40;
    if (row.type === 'project-header') return 36;
    if (row.type === 'phase-header') return 32;
    if (row.type === 'task') return 32;
    if (row.type === 'employee') return 36;
    return 32;
  };

  const timelineWidth = numDays * dayWidth;

  const calcDayFromX = (e: React.DragEvent, container: HTMLElement): number => {
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + (timelineRef.current?.scrollLeft || 0);
    return Math.max(0, Math.min(numDays - 1, Math.floor(x / dayWidth)));
  };

  const handleDragOver = (e: React.DragEvent, row: GanttRow) => {
    if (!e.dataTransfer.types.includes('application/x-backlog')) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverRowId(row.id);
    const container = e.currentTarget as HTMLElement;
    setDragOverDayIdx(calcDayFromX(e, container));
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const related = e.relatedTarget as Node | null;
    if (!e.currentTarget.contains(related)) {
      setDragOverRowId(null);
      setDragOverDayIdx(null);
    }
  };

  const handleDrop = (e: React.DragEvent, row: GanttRow) => {
    e.preventDefault();
    setDragOverRowId(null);
    setDragOverDayIdx(null);
    const data = e.dataTransfer.getData('application/x-backlog');
    if (!data) return;
    try {
      const backlogItem: GanttBacklogItem = JSON.parse(data);
      const container = e.currentTarget as HTMLElement;
      const dayIdx = calcDayFromX(e, container);
      const dropDate = ganttFormatDate(ganttAddDays(viewStart, dayIdx));
      if (!row.projectId || !row.phaseId) return;
      onBacklogDrop(backlogItem, row.projectId, row.phaseId, dropDate);
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const isDropTarget = (row: GanttRow): boolean => {
    return (row.type === 'phase-header' || row.type === 'task') && !!row.projectId && !!row.phaseId;
  };

  const renderSidebarRow = (row: GanttRow) => {
    const h = getRowHeight(row);
    if (row.id === '__projects_section' || row.id === '__crew_section') {
      return (
        <div key={row.id} className="flex items-center px-3 bg-base-300 font-bold uppercase text-xs tracking-wider text-base-content/60 border-b border-base-300" style={{ height: h, minHeight: h }}>
          {row.label}
        </div>
      );
    }
    if (row.type === 'project-header' && row.projectId) {
      const isCollapsed = collapsedProjects.has(row.id);
      const project = projects.find((p) => p.id === row.id);
      return (
        <div key={row.id} className="flex items-center bg-base-200 border-b border-base-300/50 group cursor-pointer hover:bg-base-300/50" style={{ height: h, minHeight: h }}>
          <button className="flex items-center gap-1 flex-1 px-2 min-w-0" onClick={() => onToggleProject(row.id)}>
            {isCollapsed ? <ChevronRight size={14} className="flex-shrink-0 text-base-content/50" /> : <ChevronDown size={14} className="flex-shrink-0 text-base-content/50" />}
            <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${getColorClasses(row.color).bg}`} />
            <span className="font-semibold text-sm truncate text-base-content">{row.label}</span>
          </button>
          <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
            <button className="btn btn-ghost btn-xs btn-square" onClick={(e) => { e.stopPropagation(); onAddPhase(row.id); }} title="Add phase"><Plus size={12} /></button>
            <button className="btn btn-ghost btn-xs btn-square" onClick={(e) => { e.stopPropagation(); if (project) onEditProject(project); }} title="Edit project"><Pencil size={12} /></button>
            <button className="btn btn-ghost btn-xs btn-square text-error" onClick={(e) => { e.stopPropagation(); onDeleteProject(row.id); }} title="Delete project"><Trash2 size={12} /></button>
          </div>
        </div>
      );
    }
    if (row.type === 'phase-header') {
      const isDragTarget = dragOverRowId === row.id;
      return (
        <div key={row.id} className={`flex items-center bg-base-200/30 border-b border-base-300/30 group hover:bg-base-200/50 ${isDragTarget ? 'bg-primary/10' : ''}`} style={{ height: h, minHeight: h }}>
          <span className="text-xs font-medium text-base-content/70 truncate pl-8 flex-1">{row.label}</span>
          <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
            <button className="btn btn-ghost btn-xs btn-square" onClick={() => onAddTask(row.projectId!, row.id)} title="Add task"><Plus size={12} /></button>
            <button className="btn btn-ghost btn-xs btn-square text-error" onClick={() => onDeletePhase(row.projectId!, row.id)} title="Delete phase"><Trash2 size={12} /></button>
          </div>
        </div>
      );
    }
    if (row.type === 'task' && row.task) {
      const task = row.task;
      const isCompleted = task.status === 'completed';
      const isInProgress = task.status === 'in_progress';
      return (
        <div key={row.id} className="flex items-center border-b border-base-300/20 group hover:bg-base-200/50" style={{ height: h, minHeight: h }}>
          <button className="flex-shrink-0 ml-8 mr-1" onClick={() => onToggleTaskStatus(task)} title={isCompleted ? 'Mark incomplete' : 'Mark complete'}>
            {isCompleted ? <CheckSquare size={14} className="text-success" /> : isInProgress ? <CircleDot size={14} className="text-warning" /> : <Square size={14} className="text-base-content/40" />}
          </button>
          <span className={`text-xs truncate flex-1 cursor-pointer hover:underline ${isCompleted ? 'line-through text-base-content/40' : 'text-base-content/80'}`} onClick={() => onEditTask(task)}>
            {row.label}
          </span>
          <div className="hidden group-hover:flex items-center gap-0.5 pr-1">
            <button className="btn btn-ghost btn-xs btn-square" onClick={() => onEditTask(task)} title="Edit task"><Pencil size={12} /></button>
          </div>
        </div>
      );
    }
    if (row.type === 'employee' && row.employee) {
      const emp = row.employee;
      return (
        <div key={row.id} className="flex items-center border-b border-base-300/30 group hover:bg-base-200/50 px-2" style={{ height: h, minHeight: h }}>
          <span className={`w-2 h-2 rounded-full flex-shrink-0 mr-2 ${getColorClasses(emp.color).bg}`} />
          <span className="text-sm truncate flex-1 cursor-pointer hover:underline text-base-content" onClick={() => onEditEmployee(emp)}>{emp.name}</span>
          <span className="badge badge-xs badge-outline text-[9px] mr-1">{emp.type === 'internal' ? 'INT' : 'SUB'}</span>
          <div className="hidden group-hover:flex items-center gap-0.5">
            <button className="btn btn-ghost btn-xs btn-square" onClick={() => onAddAssignment(emp.id)} title="Add assignment"><Plus size={12} /></button>
            <button className="btn btn-ghost btn-xs btn-square text-error" onClick={() => onDeleteEmployee(emp.id)} title="Delete"><Trash2 size={12} /></button>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderTimelineRow = (row: GanttRow) => {
    const h = getRowHeight(row);
    const isTarget = isDropTarget(row);
    const isDraggedOver = dragOverRowId === row.id;

    const gridCells = days.map((day, i) => {
      const isDropDay = isDraggedOver && dragOverDayIdx === i;
      return (
        <div key={i} className={`border-r border-base-300/20 flex-shrink-0 ${isWeekend(day) ? 'bg-base-300/30' : ''} ${isSameDay(day, today) ? 'bg-primary/10' : ''} ${isDropDay ? 'bg-primary/25' : ''}`} style={{ width: dayWidth, height: h, minWidth: dayWidth }} />
      );
    });

    const wrapWithDropZone = (content: React.ReactNode) => {
      if (!isTarget) return content;
      return (
        <div className={`relative flex ${isDraggedOver ? 'ring-2 ring-primary/40 ring-inset' : ''}`} style={{ height: h, minHeight: h, width: timelineWidth, minWidth: timelineWidth }} onDragOver={(e) => handleDragOver(e, row)} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, row)}>
          {content}
        </div>
      );
    };

    if (row.id === '__projects_section' || row.id === '__crew_section') {
      return (
        <div key={row.id} className="flex bg-base-300 border-b border-base-300" style={{ height: h, minHeight: h, width: timelineWidth, minWidth: timelineWidth }}>
          {gridCells}
        </div>
      );
    }

    if (row.type === 'project-header' && row.projectId) {
      const projectTasks = tasks.filter((t) => t.projectId === row.projectId && t.status !== 'completed');
      let bar = null;
      if (projectTasks.length > 0) {
        const minStart = projectTasks.reduce((min, t) => (t.startDate < min ? t.startDate : min), projectTasks[0].startDate);
        const maxEnd = projectTasks.reduce((max, t) => (t.endDate > max ? t.endDate : max), projectTasks[0].endDate);
        const style = getBarStyle(minStart, maxEnd, viewStart, dayWidth);
        if (style.visible) {
          const colors = getColorClasses(row.color);
          bar = <div className={`absolute ${colors.bg} opacity-30 rounded gantt-bar`} style={{ left: style.left, width: style.width, top: 6, height: h - 12 }} />;
        }
      }
      return (
        <div key={row.id} className="relative flex bg-base-200 border-b border-base-300/50" style={{ height: h, minHeight: h, width: timelineWidth, minWidth: timelineWidth }}>
          {gridCells}
          {bar}
        </div>
      );
    }

    if (row.type === 'phase-header') {
      return (
        <React.Fragment key={row.id}>
          {wrapWithDropZone(
            <>
              {gridCells}
              {isDraggedOver && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                  <span className="text-[10px] text-primary font-semibold bg-base-100/90 px-2 py-0.5 rounded">Drop to schedule here</span>
                </div>
              )}
            </>
          )}
        </React.Fragment>
      );
    }

    if (row.type === 'task' && row.task) {
      const task = row.task;
      const barStyle = getBarStyle(task.startDate, task.endDate, viewStart, dayWidth);
      const colors = getColorClasses(row.color);
      const isCompleted = task.status === 'completed';
      const inner = (
        <>
          {gridCells}
          {barStyle.visible && (
            <div
              className={`absolute ${colors.bg} ${colors.text} rounded gantt-bar cursor-pointer ${isCompleted ? 'opacity-40' : 'opacity-80'}`}
              style={{ left: barStyle.left, width: barStyle.width, top: 4, height: h - 8, display: 'flex', alignItems: 'center', paddingLeft: 4, paddingRight: 4, fontSize: 11, whiteSpace: 'nowrap', overflow: 'hidden' }}
              onClick={() => onEditTask(task)}
              title={`${task.name}: ${task.startDate} → ${task.endDate}`}
            >
              {barStyle.width > 50 && <span className="truncate">{task.name}</span>}
            </div>
          )}
        </>
      );
      return <React.Fragment key={row.id}>{wrapWithDropZone(inner)}</React.Fragment>;
    }

    if (row.type === 'employee' && row.employee) {
      const empAssignments = assignments.filter((a) => a.employeeId === row.employee!.id);
      return (
        <div key={row.id} className="relative flex border-b border-base-300/30" style={{ height: h, minHeight: h, width: timelineWidth, minWidth: timelineWidth }}>
          {gridCells}
          {empAssignments.map((asgn) => {
            const barStyle = getBarStyle(asgn.startDate, asgn.endDate, viewStart, dayWidth);
            if (!barStyle.visible) return null;
            const project = projects.find((p) => p.id === asgn.projectId);
            const colors = getColorClasses(project?.color);
            return (
              <div key={asgn.id} className={`absolute ${colors.bg} ${colors.text} rounded gantt-bar opacity-70 cursor-pointer group/asgn`}
                style={{ left: barStyle.left, width: barStyle.width, top: 4, height: h - 8, display: 'flex', alignItems: 'center', paddingLeft: 4, paddingRight: 4, fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden' }}
                title={`${project?.name || 'Unknown'}: ${asgn.startDate} → ${asgn.endDate}${asgn.notes ? ' | ' + asgn.notes : ''}`}
              >
                {barStyle.width > 40 && <span className="truncate">{project?.name || '?'}</span>}
                <button className="absolute -top-1 -right-1 btn btn-xs btn-circle btn-error hidden group-hover/asgn:flex" style={{ width: 16, height: 16, minHeight: 16, padding: 0 }}
                  onClick={(e) => { e.stopPropagation(); onDeleteAssignment(asgn.id); }} title="Remove assignment">
                  <Trash2 size={10} />
                </button>
              </div>
            );
          })}
        </div>
      );
    }

    return (
      <div key={row.id} className="flex border-b border-base-300/20" style={{ height: h, minHeight: h, width: timelineWidth, minWidth: timelineWidth }}>
        {gridCells}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ marginRight: backlogOpen ? 280 : 0, transition: 'margin-right 0.2s' }}>
      <div className="flex flex-shrink-0">
        <div className="flex-shrink-0 bg-base-200 border-r border-base-300 border-b border-base-300" style={{ width: 220, minWidth: 220, height: 50 }}>
          <div className="flex items-center h-full px-3 text-xs font-semibold text-base-content/50 uppercase tracking-wider">Name</div>
        </div>
        <div ref={headerRef} className="flex-1 overflow-hidden">
          <GanttTimelineHeader viewStart={viewStart} numDays={numDays} dayWidth={dayWidth} />
        </div>
      </div>
      <div className="flex flex-1 overflow-hidden">
        <div ref={sidebarRef} className="flex-shrink-0 border-r border-base-300 bg-base-100 sidebar-scroll" style={{ width: 220, minWidth: 220, overflowY: 'hidden', overflowX: 'hidden' }}>
          {rows.map((row) => renderSidebarRow(row))}
        </div>
        <div ref={timelineRef} className="flex-1 overflow-auto relative" onScroll={handleTimelineScroll}>
          <div style={{ minWidth: timelineWidth, position: 'relative' }}>
            {rows.map((row) => renderTimelineRow(row))}
            {todayOffset !== null && (
              <div className="today-line bg-error" style={{ left: todayOffset, position: 'absolute', top: 0, bottom: 0, width: 2, zIndex: 20, pointerEvents: 'none' }} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GanttChart;
