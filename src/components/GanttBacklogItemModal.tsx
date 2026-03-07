import React, { useState, useEffect } from 'react';
import type { GanttBacklogItem, GanttProject, GanttPhase } from '../gantt-types';

interface GanttBacklogItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; projectId: string | null; phaseId: string | null; estimatedDays: number; notes: string; priority: 'low' | 'normal' | 'high' }) => void;
  editItem: GanttBacklogItem | null;
  projects: GanttProject[];
  phases: GanttPhase[];
}

const GanttBacklogItemModal: React.FC<GanttBacklogItemModalProps> = ({
  isOpen, onClose, onSave, editItem, projects, phases,
}) => {
  const [name, setName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [phaseId, setPhaseId] = useState('');
  const [estimatedDays, setEstimatedDays] = useState(1);
  const [notes, setNotes] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setName(editItem.name);
        setProjectId(editItem.projectId || '');
        setPhaseId(editItem.phaseId || '');
        setEstimatedDays(editItem.estimatedDays);
        setNotes(editItem.notes);
        setPriority(editItem.priority);
      } else {
        setName(''); setProjectId(''); setPhaseId(''); setEstimatedDays(1); setNotes(''); setPriority('normal');
      }
    }
  }, [isOpen, editItem]);

  if (!isOpen) return null;

  const filteredPhases = projectId ? phases.filter((p) => p.projectId === projectId) : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({ name: name.trim(), projectId: projectId || null, phaseId: phaseId || null, estimatedDays, notes, priority });
    onClose();
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <h3 className="font-bold text-lg mb-4">{editItem ? 'Edit Backlog Item' : 'Add to Backlog'}</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-control mb-3">
            <label className="label py-1"><span className="label-text text-sm">Task Name *</span></label>
            <input type="text" className="input input-bordered input-sm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Install kitchen cabinets" autoFocus required />
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-sm">Est. Days</span></label>
              <input type="number" className="input input-bordered input-sm" value={estimatedDays} onChange={(e) => setEstimatedDays(Math.max(1, parseInt(e.target.value) || 1))} min={1} />
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-sm">Priority</span></label>
              <select className="select select-bordered select-sm" value={priority} onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high')}>
                <option value="high">🔴 High</option>
                <option value="normal">🟡 Normal</option>
                <option value="low">🟢 Low</option>
              </select>
            </div>
          </div>
          <div className="form-control mb-3">
            <label className="label py-1"><span className="label-text text-sm">Project (optional)</span></label>
            <select className="select select-bordered select-sm" value={projectId} onChange={(e) => { setProjectId(e.target.value); setPhaseId(''); }}>
              <option value="">— No project —</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {filteredPhases.length > 0 && (
            <div className="form-control mb-3">
              <label className="label py-1"><span className="label-text text-sm">Phase (optional)</span></label>
              <select className="select select-bordered select-sm" value={phaseId} onChange={(e) => setPhaseId(e.target.value)}>
                <option value="">— No phase —</option>
                {filteredPhases.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
          <div className="form-control mb-4">
            <label className="label py-1"><span className="label-text text-sm">Notes</span></label>
            <textarea className="textarea textarea-bordered textarea-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any details..." rows={2} />
          </div>
          <div className="modal-action mt-2">
            <button type="button" className="btn btn-sm btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-sm btn-primary">{editItem ? 'Save' : 'Add to Backlog'}</button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};

export default GanttBacklogItemModal;
