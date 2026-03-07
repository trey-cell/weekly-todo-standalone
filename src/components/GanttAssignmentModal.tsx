import React, { useState, useEffect } from 'react';
import type { GanttAssignment, GanttEmployee, GanttProject } from '../gantt-types';
import { ganttFormatDate } from '../gantt-helpers';

interface GanttAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (assignment: { employeeId: string; projectId: string; startDate: string; endDate: string; notes: string }) => void;
  editAssignment?: GanttAssignment | null;
  employees: GanttEmployee[];
  projects: GanttProject[];
  defaultEmployeeId?: string;
}

const GanttAssignmentModal: React.FC<GanttAssignmentModalProps> = ({
  isOpen, onClose, onSave, editAssignment, employees, projects, defaultEmployeeId,
}) => {
  const [employeeId, setEmployeeId] = useState('');
  const [projectId, setProjectId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editAssignment) {
        setEmployeeId(editAssignment.employeeId);
        setProjectId(editAssignment.projectId);
        setStartDate(editAssignment.startDate);
        setEndDate(editAssignment.endDate);
        setNotes(editAssignment.notes || '');
      } else {
        setEmployeeId(defaultEmployeeId || (employees.length > 0 ? employees[0].id : ''));
        setProjectId(projects.length > 0 ? projects[0].id : '');
        const today = ganttFormatDate(new Date());
        setStartDate(today);
        setEndDate(today);
        setNotes('');
      }
    }
  }, [isOpen, editAssignment, employees, projects, defaultEmployeeId]);

  const handleSave = () => {
    if (!employeeId || !projectId || !startDate || !endDate) return;
    if (endDate < startDate) return;
    onSave({ employeeId, projectId, startDate, endDate, notes: notes.trim() });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-base-100">
        <h3 className="font-bold text-lg text-base-content mb-4">{editAssignment ? 'Edit Assignment' : 'New Assignment'}</h3>
        <div className="form-control mb-3">
          <label className="label py-1"><span className="label-text">Crew Member</span></label>
          <select className="select select-bordered select-sm w-full" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="" disabled>Select crew member</option>
            {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.name} ({emp.type === 'internal' ? 'Internal' : 'Sub'})</option>)}
          </select>
        </div>
        <div className="form-control mb-3">
          <label className="label py-1"><span className="label-text">Project</span></label>
          <select className="select select-bordered select-sm w-full" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="" disabled>Select project</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
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
        <div className="form-control mb-3">
          <label className="label py-1"><span className="label-text">Notes (optional)</span></label>
          <textarea className="textarea textarea-bordered textarea-sm w-full" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional notes..." />
        </div>
        <div className="modal-action">
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={handleSave}>{editAssignment ? 'Update' : 'Assign'}</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};

export default GanttAssignmentModal;
