export interface GanttProject {
  id: string;
  name: string;
  color: string;
  sortOrder: number;
}

export interface GanttPhase {
  id: string;
  projectId: string;
  name: string;
  sortOrder: number;
}

export interface GanttTask {
  id: string;
  phaseId: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  sortOrder: number;
}

export interface GanttEmployee {
  id: string;
  name: string;
  type: 'internal' | 'sub';
  color: string;
  sortOrder: number;
}

export interface GanttAssignment {
  id: string;
  employeeId: string;
  taskId: string | null;
  projectId: string;
  startDate: string;
  endDate: string;
  notes: string;
}

export interface GanttBacklogItem {
  id: string;
  name: string;
  projectId: string | null;
  phaseId: string | null;
  estimatedDays: number;
  notes: string;
  priority: 'low' | 'normal' | 'high';
  sortOrder: number;
}

export type GanttModalType = 'project' | 'task' | 'employee' | 'assignment' | 'backlog' | null;

export interface GanttRow {
  type: 'project-header' | 'phase-header' | 'task' | 'employee-header' | 'employee';
  id: string;
  label: string;
  indent: number;
  projectId?: string;
  phaseId?: string;
  task?: GanttTask;
  employee?: GanttEmployee;
  color?: string;
}
