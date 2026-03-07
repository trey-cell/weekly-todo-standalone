import React, { useState, useEffect } from 'react';
import type { GanttTask, GanttProject, GanttPhase } from '../gantt-types';
import { ganttFormatDate } from '../gantt-helpers';

interface GanttTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: { name: string; startDate: string; endDate: string; projectId: string; phaseId: string }) => void;
  editTask?: GanttTask | null;
  projects: GanttProject[];
  phases: GanttPhase[];
  defaultProjectId?: string;
  defaultPhaseId?: string;
}

const GanttTaskModal: React.FC<GanttTaskModalProps> = ({
  isOpen, onClose, onSave, editTask, projects, phases, defaultProjectId, defaultPhaseId,
}) => {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [phaseId, setPhaseId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editTask) {
        setName(editTask.name);
        setProjectId(editTask.projectId);
        setPhaseId(editTask.phaseId);
        setStartDate(editTask.startDate);
        setEndDate(editTask.endDate);
      } else {
        setName('');
        setProjectId(defaultProjectId || (projects.length > 0 ? projects[0].id : ''));
        setPhaseId(defaultPhaseId || '');
        const today = ganttFormatDate(new Date());
        setStartDate(today);
        setEndDate(today);
      }
    }
  }, [isOpen, editTask, projects, defaultProjectId, defaultPhaseId]);

  useEffect(() => {
    if (!editTask && !defaultPhaseId) {
      const projectPhases = phases.filter((p) => p.projectId === projectId);
      if (projectPhases.length > 0) setPhaseId(projectPhases[0].id);
      else setPhaseId('');
    }
  }, [projectId, phases, editTask, defaultPhaseId]);

  const filteredPhases = phases.filter((p) => p.projectId === projectId);

  const handleSave = () => {
    if (!name.trim() || !projectId || !phaseId || !startDate || !endDate) return;
    if (endDate < startDate) return;
    onSave({ name: name.trim(), startDate, endDate, projectId, phaseId });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-base-100">
        <h3 className="font-bold text-lg text-base-content mb-4">{editTask ? 'Edit Task' : 'New Task'}</h3>
        <div className="form-control mb-3">
          <label className="label py-1"><span className="label-text">Task Name</span></label>
          <input type="text" className="input input-bordered input-sm w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Install cabinets" autoFocus />
        </div>
        <div className="form-control mb-3">
          <label className="label py-1"><span className="label-text">Project</span></label>
          <select className="select select-bordered select-sm w-full" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="" disabled>Select project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="form-control mb-3">
          <label className="label py-1"><span className="label-text">Phase</span></label>
          <select className="select select-bordered select-sm w-full" value={phaseId} onChange={(e) => setPhaseId(e.target.value)}>
            <option value="" disabled>Select phase</option>
            {filteredPhases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="form-control">
            <label className="label py-1"><span className="label-text">Start Date</span></label>
            <input type="date" className="input input-bordered input-sm w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="form-control">
            <label className="label py-1"><span className="label-text">End Date</span></label>
            <input type="date" className="input input-bordered input-sm w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
        <div className="modal-action">
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={handleSave}>{editTask ? 'Update' : 'Create'}</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};

export default GanttTaskModal;
