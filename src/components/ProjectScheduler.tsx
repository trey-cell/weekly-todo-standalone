import React, { useState, useEffect, useCallback } from 'react';
import { sqlQuery as dbQuery, sqlExec as dbExec } from '../lib/db';
import type {
  GanttProject, GanttPhase, GanttTask, GanttEmployee,
  GanttAssignment, GanttBacklogItem, GanttModalType,
} from '../gantt-types';
import {
  generateId, ganttFormatDate, ganttParseDate, ganttAddDays,
  ganttDiffDays, getStartOfWeek,
} from '../gantt-helpers';
import GanttToolbar from './GanttToolbar';
import GanttChart from './GanttChart';
import GanttProjectModal from './GanttProjectModal';
import GanttTaskModal from './GanttTaskModal';
import GanttEmployeeModal from './GanttEmployeeModal';
import GanttAssignmentModal from './GanttAssignmentModal';
import GanttBacklogPanel from './GanttBacklogPanel';
import GanttBacklogItemModal from './GanttBacklogItemModal';

const NUM_DAYS = 21;
const DAY_WIDTH = 45;

const sql = async (query: string) => {
  try { return await dbQuery(query); }
  catch (err) { console.warn('SQL query failed:', err); return []; }
};
const exec = async (query: string) => {
  try { return await dbExec(query); }
  catch (err) { console.warn('SQL exec failed:', err); }
};

async function autoRollOverdueTasks(tasks: GanttTask[]): Promise<GanttTask[]> {
  const today = ganttFormatDate(new Date());
  const overdue = tasks.filter(t => t.status !== 'completed' && t.endDate < today);
  if (overdue.length > 0) {
    // Batch update ALL overdue tasks in a single SQL call using SQLite date math
    await exec(
      `UPDATE gantt_tasks SET
        end_date = '${today}'::date + (end_date::date - start_date::date),
        start_date = '${today}'
      WHERE status != 'completed' AND end_date < '${today}'`
    );
  }
  // Return updated in-memory list
  return tasks.map(task => {
    if (task.status !== 'completed' && task.endDate < today) {
      const duration = ganttDiffDays(ganttParseDate(task.startDate), ganttParseDate(task.endDate));
      const newEnd = ganttFormatDate(ganttAddDays(new Date(), duration));
      return { ...task, startDate: today, endDate: newEnd };
    }
    return task;
  });
}

const ProjectScheduler: React.FC = () => {
  const [projects, setProjects] = useState<GanttProject[]>([]);
  const [phases, setPhases] = useState<GanttPhase[]>([]);
  const [tasks, setTasks] = useState<GanttTask[]>([]);
  const [employees, setEmployees] = useState<GanttEmployee[]>([]);
  const [assignments, setAssignments] = useState<GanttAssignment[]>([]);
  const [backlogItems, setBacklogItems] = useState<GanttBacklogItem[]>([]);

  const [viewStart, setViewStart] = useState<Date>(getStartOfWeek(new Date()));
  const [showCompleted, setShowCompleted] = useState(false);
  const [collapsedProjects, setCollapsedProjects] = useState<Set<string>>(new Set());
  const [backlogOpen, setBacklogOpen] = useState(false);

  const [activeModal, setActiveModal] = useState<GanttModalType>(null);
  const [editingProject, setEditingProject] = useState<GanttProject | null>(null);
  const [editingTask, setEditingTask] = useState<GanttTask | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<GanttEmployee | null>(null);
  const [editingAssignment, setEditingAssignment] = useState<GanttAssignment | null>(null);
  const [editingBacklogItem, setEditingBacklogItem] = useState<GanttBacklogItem | null>(null);
  const [defaultProjectId, setDefaultProjectId] = useState('');
  const [defaultPhaseId, setDefaultPhaseId] = useState('');
  const [defaultEmployeeId, setDefaultEmployeeId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAllData(); }, []);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [projRows, phaseRows, taskRows, empRows, asgnRows, backlogRows] = await Promise.all([
        sql('SELECT * FROM gantt_projects ORDER BY sort_order'),
        sql('SELECT * FROM gantt_phases ORDER BY sort_order'),
        sql('SELECT * FROM gantt_tasks ORDER BY sort_order'),
        sql('SELECT * FROM gantt_employees ORDER BY sort_order'),
        sql('SELECT * FROM gantt_assignments'),
        sql('SELECT * FROM gantt_backlog ORDER BY sort_order'),
      ]);

      const loadedProjects: GanttProject[] = (projRows || []).map((r: any) => ({ id: r.id, name: r.name, color: r.color, sortOrder: r.sort_order }));
      const loadedPhases: GanttPhase[] = (phaseRows || []).map((r: any) => ({ id: r.id, projectId: r.project_id, name: r.name, sortOrder: r.sort_order }));
      let loadedTasks: GanttTask[] = (taskRows || []).map((r: any) => ({ id: r.id, phaseId: r.phase_id, projectId: r.project_id, name: r.name, startDate: r.start_date, endDate: r.end_date, status: r.status, sortOrder: r.sort_order }));
      const loadedEmployees: GanttEmployee[] = (empRows || []).map((r: any) => ({ id: r.id, name: r.name, type: r.type, color: r.color, sortOrder: r.sort_order }));
      const loadedAssignments: GanttAssignment[] = (asgnRows || []).map((r: any) => ({ id: r.id, employeeId: r.employee_id, taskId: r.task_id, projectId: r.project_id, startDate: r.start_date, endDate: r.end_date, notes: r.notes || '' }));
      const loadedBacklog: GanttBacklogItem[] = (backlogRows || []).map((r: any) => ({ id: r.id, name: r.name, projectId: r.project_id || null, phaseId: r.phase_id || null, estimatedDays: r.estimated_days, notes: r.notes || '', priority: r.priority || 'normal', sortOrder: r.sort_order }));

      loadedTasks = await autoRollOverdueTasks(loadedTasks);

      setProjects(loadedProjects);
      setPhases(loadedPhases);
      setTasks(loadedTasks);
      setEmployees(loadedEmployees);
      setAssignments(loadedAssignments);
      setBacklogItems(loadedBacklog);
    } catch (err) {
      console.error('Failed to load gantt data:', err);
    } finally {
      setLoading(false);
    }
  };

  const onPrev = () => setViewStart(ganttAddDays(viewStart, -7));
  const onNext = () => setViewStart(ganttAddDays(viewStart, 7));
  const onToday = () => setViewStart(getStartOfWeek(new Date()));

  const onToggleProject = useCallback((id: string) => {
    setCollapsedProjects((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const esc = (s: string) => s.replace(/'/g, "''");

  // PROJECT CRUD
  const handleSaveProject = async (data: { name: string; color: string; phases: string[] }) => {
    if (editingProject) {
      await exec(`UPDATE gantt_projects SET name = '${esc(data.name)}', color = '${data.color}' WHERE id = '${editingProject.id}'`);
      setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? { ...p, name: data.name, color: data.color } : p)));
      const existingPhases = phases.filter((p) => p.projectId === editingProject.id);
      for (const ep of existingPhases) await exec(`DELETE FROM gantt_phases WHERE id = '${ep.id}'`);
      const newPhases: GanttPhase[] = data.phases.map((pName, i) => ({ id: generateId(), projectId: editingProject.id, name: pName, sortOrder: i }));
      for (const np of newPhases) await exec(`INSERT INTO gantt_phases (id, project_id, name, sort_order) VALUES ('${np.id}', '${np.projectId}', '${esc(np.name)}', ${np.sortOrder})`);
      setPhases((prev) => [...prev.filter((p) => p.projectId !== editingProject.id), ...newPhases]);
    } else {
      const projectId = generateId();
      const sortOrder = projects.length;
      await exec(`INSERT INTO gantt_projects (id, name, color, sort_order, created_at) VALUES ('${projectId}', '${esc(data.name)}', '${data.color}', ${sortOrder}, '${new Date().toISOString()}')`);
      setProjects((prev) => [...prev, { id: projectId, name: data.name, color: data.color, sortOrder }]);
      const newPhases: GanttPhase[] = data.phases.map((pName, i) => ({ id: generateId(), projectId, name: pName, sortOrder: i }));
      for (const np of newPhases) await exec(`INSERT INTO gantt_phases (id, project_id, name, sort_order) VALUES ('${np.id}', '${np.projectId}', '${esc(np.name)}', ${np.sortOrder})`);
      setPhases((prev) => [...prev, ...newPhases]);
    }
    setEditingProject(null);
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Delete this project and all its phases/tasks?')) return;
    await exec(`DELETE FROM gantt_assignments WHERE project_id = '${projectId}'`);
    await exec(`DELETE FROM gantt_tasks WHERE project_id = '${projectId}'`);
    await exec(`DELETE FROM gantt_phases WHERE project_id = '${projectId}'`);
    await exec(`DELETE FROM gantt_projects WHERE id = '${projectId}'`);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setPhases((prev) => prev.filter((p) => p.projectId !== projectId));
    setTasks((prev) => prev.filter((t) => t.projectId !== projectId));
    setAssignments((prev) => prev.filter((a) => a.projectId !== projectId));
  };

  const handleEditProject = (project: GanttProject) => { setEditingProject(project); setActiveModal('project'); };

  const handleAddPhase = async (projectId: string) => {
    const name = prompt('Phase name:');
    if (!name?.trim()) return;
    const id = generateId();
    const sortOrder = phases.filter((p) => p.projectId === projectId).length;
    await exec(`INSERT INTO gantt_phases (id, project_id, name, sort_order) VALUES ('${id}', '${projectId}', '${esc(name.trim())}', ${sortOrder})`);
    setPhases((prev) => [...prev, { id, projectId, name: name.trim(), sortOrder }]);
  };

  const handleDeletePhase = async (projectId: string, phaseId: string) => {
    if (!confirm('Delete this phase and all its tasks?')) return;
    await exec(`DELETE FROM gantt_tasks WHERE phase_id = '${phaseId}'`);
    await exec(`DELETE FROM gantt_phases WHERE id = '${phaseId}'`);
    setPhases((prev) => prev.filter((p) => p.id !== phaseId));
    setTasks((prev) => prev.filter((t) => t.phaseId !== phaseId));
  };

  // TASK CRUD
  const handleSaveTask = async (data: { name: string; startDate: string; endDate: string; projectId: string; phaseId: string }) => {
    if (editingTask) {
      await exec(`UPDATE gantt_tasks SET name = '${esc(data.name)}', start_date = '${data.startDate}', end_date = '${data.endDate}', project_id = '${data.projectId}', phase_id = '${data.phaseId}' WHERE id = '${editingTask.id}'`);
      setTasks((prev) => prev.map((t) => t.id === editingTask.id ? { ...t, name: data.name, startDate: data.startDate, endDate: data.endDate, projectId: data.projectId, phaseId: data.phaseId } : t));
    } else {
      const id = generateId();
      const sortOrder = tasks.filter((t) => t.phaseId === data.phaseId).length;
      await exec(`INSERT INTO gantt_tasks (id, phase_id, project_id, name, start_date, end_date, status, sort_order) VALUES ('${id}', '${data.phaseId}', '${data.projectId}', '${esc(data.name)}', '${data.startDate}', '${data.endDate}', 'pending', ${sortOrder})`);
      setTasks((prev) => [...prev, { id, phaseId: data.phaseId, projectId: data.projectId, name: data.name, startDate: data.startDate, endDate: data.endDate, status: 'pending', sortOrder }]);
    }
    setEditingTask(null);
  };

  const handleEditTask = (task: GanttTask) => { setEditingTask(task); setDefaultProjectId(task.projectId); setDefaultPhaseId(task.phaseId); setActiveModal('task'); };

  const handleToggleTaskStatus = async (task: GanttTask) => {
    let newStatus: GanttTask['status'];
    if (task.status === 'pending') newStatus = 'in_progress';
    else if (task.status === 'in_progress') newStatus = 'completed';
    else newStatus = 'pending';
    await exec(`UPDATE gantt_tasks SET status = '${newStatus}' WHERE id = '${task.id}'`);
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
  };

  const handleAddTask = (projectId: string, phaseId: string) => { setEditingTask(null); setDefaultProjectId(projectId); setDefaultPhaseId(phaseId); setActiveModal('task'); };

  // EMPLOYEE CRUD
  const handleSaveEmployee = async (data: { name: string; type: 'internal' | 'sub'; color: string }) => {
    if (editingEmployee) {
      await exec(`UPDATE gantt_employees SET name = '${esc(data.name)}', type = '${data.type}', color = '${data.color}' WHERE id = '${editingEmployee.id}'`);
      setEmployees((prev) => prev.map((e) => e.id === editingEmployee.id ? { ...e, name: data.name, type: data.type, color: data.color } : e));
    } else {
      const id = generateId();
      const sortOrder = employees.length;
      await exec(`INSERT INTO gantt_employees (id, name, type, color, sort_order) VALUES ('${id}', '${esc(data.name)}', '${data.type}', '${data.color}', ${sortOrder})`);
      setEmployees((prev) => [...prev, { id, name: data.name, type: data.type, color: data.color, sortOrder }]);
    }
    setEditingEmployee(null);
  };

  const handleEditEmployee = (emp: GanttEmployee) => { setEditingEmployee(emp); setActiveModal('employee'); };

  const handleDeleteEmployee = async (empId: string) => {
    if (!confirm('Delete this crew member and all their assignments?')) return;
    await exec(`DELETE FROM gantt_assignments WHERE employee_id = '${empId}'`);
    await exec(`DELETE FROM gantt_employees WHERE id = '${empId}'`);
    setEmployees((prev) => prev.filter((e) => e.id !== empId));
    setAssignments((prev) => prev.filter((a) => a.employeeId !== empId));
  };

  // ASSIGNMENT CRUD
  const handleSaveAssignment = async (data: { employeeId: string; projectId: string; startDate: string; endDate: string; notes: string }) => {
    if (editingAssignment) {
      await exec(`UPDATE gantt_assignments SET employee_id = '${data.employeeId}', project_id = '${data.projectId}', start_date = '${data.startDate}', end_date = '${data.endDate}', notes = '${esc(data.notes)}' WHERE id = '${editingAssignment.id}'`);
      setAssignments((prev) => prev.map((a) => a.id === editingAssignment.id ? { ...a, ...data } : a));
    } else {
      const id = generateId();
      await exec(`INSERT INTO gantt_assignments (id, employee_id, task_id, project_id, start_date, end_date, notes) VALUES ('${id}', '${data.employeeId}', NULL, '${data.projectId}', '${data.startDate}', '${data.endDate}', '${esc(data.notes)}')`);
      setAssignments((prev) => [...prev, { id, employeeId: data.employeeId, taskId: null, projectId: data.projectId, startDate: data.startDate, endDate: data.endDate, notes: data.notes }]);
    }
    setEditingAssignment(null);
  };

  const handleAddAssignment = (employeeId: string) => { setEditingAssignment(null); setDefaultEmployeeId(employeeId); setActiveModal('assignment'); };
  const handleDeleteAssignment = async (assignmentId: string) => {
    await exec(`DELETE FROM gantt_assignments WHERE id = '${assignmentId}'`);
    setAssignments((prev) => prev.filter((a) => a.id !== assignmentId));
  };

  // BACKLOG CRUD
  const handleSaveBacklogItem = async (data: { name: string; projectId: string | null; phaseId: string | null; estimatedDays: number; notes: string; priority: 'low' | 'normal' | 'high' }) => {
    if (editingBacklogItem) {
      await exec(`UPDATE gantt_backlog SET name = '${esc(data.name)}', project_id = ${data.projectId ? "'" + data.projectId + "'" : 'NULL'}, phase_id = ${data.phaseId ? "'" + data.phaseId + "'" : 'NULL'}, estimated_days = ${data.estimatedDays}, notes = '${esc(data.notes || '')}', priority = '${data.priority}' WHERE id = '${editingBacklogItem.id}'`);
      setBacklogItems((prev) => prev.map((b) => b.id === editingBacklogItem.id ? { ...b, ...data } : b));
    } else {
      const id = generateId();
      const sortOrder = backlogItems.length;
      await exec(`INSERT INTO gantt_backlog (id, name, project_id, phase_id, estimated_days, notes, priority, sort_order) VALUES ('${id}', '${esc(data.name)}', ${data.projectId ? "'" + data.projectId + "'" : 'NULL'}, ${data.phaseId ? "'" + data.phaseId + "'" : 'NULL'}, ${data.estimatedDays}, '${esc(data.notes || '')}', '${data.priority}', ${sortOrder})`);
      setBacklogItems((prev) => [...prev, { id, name: data.name, projectId: data.projectId, phaseId: data.phaseId, estimatedDays: data.estimatedDays, notes: data.notes, priority: data.priority, sortOrder }]);
    }
    setEditingBacklogItem(null);
  };

  const handleDeleteBacklogItem = async (id: string) => {
    await exec(`DELETE FROM gantt_backlog WHERE id = '${id}'`);
    setBacklogItems((prev) => prev.filter((b) => b.id !== id));
  };

  // BACKLOG DROP
  const handleBacklogDrop = async (backlogItem: GanttBacklogItem, projectId: string, phaseId: string, dropDate: string) => {
    const id = generateId();
    const startDate = dropDate;
    const endDate = ganttFormatDate(ganttAddDays(ganttParseDate(dropDate), backlogItem.estimatedDays - 1));
    const sortOrder = tasks.filter((t) => t.phaseId === phaseId).length;
    await exec(`INSERT INTO gantt_tasks (id, phase_id, project_id, name, start_date, end_date, status, sort_order) VALUES ('${id}', '${phaseId}', '${projectId}', '${esc(backlogItem.name)}', '${startDate}', '${endDate}', 'pending', ${sortOrder})`);
    setTasks((prev) => [...prev, { id, phaseId, projectId, name: backlogItem.name, startDate, endDate, status: 'pending', sortOrder }]);
    await exec(`DELETE FROM gantt_backlog WHERE id = '${backlogItem.id}'`);
    setBacklogItems((prev) => prev.filter((b) => b.id !== backlogItem.id));
  };

  const closeModal = () => {
    setActiveModal(null);
    setEditingProject(null);
    setEditingTask(null);
    setEditingEmployee(null);
    setEditingAssignment(null);
    setEditingBacklogItem(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-base-100">
      <GanttToolbar
        viewStart={viewStart}
        numDays={NUM_DAYS}
        onPrev={onPrev}
        onNext={onNext}
        onToday={onToday}
        onAddProject={() => { setEditingProject(null); setActiveModal('project'); }}
        onAddEmployee={() => { setEditingEmployee(null); setActiveModal('employee'); }}
        showCompleted={showCompleted}
        onToggleCompleted={() => setShowCompleted(!showCompleted)}
      />
      <div className="flex-1 overflow-hidden relative">
        <GanttChart
          projects={projects}
          phases={phases}
          tasks={tasks}
          employees={employees}
          assignments={assignments}
          viewStart={viewStart}
          numDays={NUM_DAYS}
          dayWidth={DAY_WIDTH}
          showCompleted={showCompleted}
          collapsedProjects={collapsedProjects}
          onToggleProject={onToggleProject}
          onEditTask={handleEditTask}
          onToggleTaskStatus={handleToggleTaskStatus}
          onEditEmployee={handleEditEmployee}
          onAddTask={handleAddTask}
          onAddPhase={handleAddPhase}
          onAddAssignment={handleAddAssignment}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
          onDeletePhase={handleDeletePhase}
          onDeleteEmployee={handleDeleteEmployee}
          onDeleteAssignment={handleDeleteAssignment}
          onBacklogDrop={handleBacklogDrop}
          backlogOpen={backlogOpen}
        />
        <GanttBacklogPanel
          isOpen={backlogOpen}
          onToggle={() => setBacklogOpen(!backlogOpen)}
          items={backlogItems}
          projects={projects}
          onAdd={() => { setEditingBacklogItem(null); setActiveModal('backlog'); }}
          onEdit={(item) => { setEditingBacklogItem(item); setActiveModal('backlog'); }}
          onDelete={handleDeleteBacklogItem}
        />
      </div>

      <GanttProjectModal isOpen={activeModal === 'project'} onClose={closeModal} onSave={handleSaveProject} editProject={editingProject} existingPhases={editingProject ? phases.filter((p) => p.projectId === editingProject.id) : undefined} />
      <GanttTaskModal isOpen={activeModal === 'task'} onClose={closeModal} onSave={handleSaveTask} editTask={editingTask} projects={projects} phases={phases} defaultProjectId={defaultProjectId} defaultPhaseId={defaultPhaseId} />
      <GanttEmployeeModal isOpen={activeModal === 'employee'} onClose={closeModal} onSave={handleSaveEmployee} editEmployee={editingEmployee} />
      <GanttAssignmentModal isOpen={activeModal === 'assignment'} onClose={closeModal} onSave={handleSaveAssignment} editAssignment={editingAssignment} employees={employees} projects={projects} defaultEmployeeId={defaultEmployeeId} />
      <GanttBacklogItemModal isOpen={activeModal === 'backlog'} onClose={closeModal} onSave={handleSaveBacklogItem} editItem={editingBacklogItem} projects={projects} phases={phases} />
    </div>
  );
};

export default ProjectScheduler;
