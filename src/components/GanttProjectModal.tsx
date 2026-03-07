import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { GanttProject, GanttPhase } from '../gantt-types';
import { GANTT_COLOR_MAP } from '../gantt-helpers';

interface GanttProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: { name: string; color: string; phases: string[] }) => void;
  editProject?: GanttProject | null;
  existingPhases?: GanttPhase[];
}

const COLOR_OPTIONS = Object.keys(GANTT_COLOR_MAP);

const GanttProjectModal: React.FC<GanttProjectModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editProject,
  existingPhases,
}) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');
  const [phaseNames, setPhaseNames] = useState<string[]>(['']);

  useEffect(() => {
    if (isOpen) {
      if (editProject) {
        setName(editProject.name);
        setColor(editProject.color);
        if (existingPhases && existingPhases.length > 0) {
          setPhaseNames(
            existingPhases
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((p) => p.name)
          );
        } else {
          setPhaseNames(['']);
        }
      } else {
        setName('');
        setColor('blue');
        setPhaseNames(['']);
      }
    }
  }, [isOpen, editProject, existingPhases]);

  const handleAddPhase = () => setPhaseNames([...phaseNames, '']);
  const handleRemovePhase = (index: number) => {
    if (phaseNames.length <= 1) return;
    setPhaseNames(phaseNames.filter((_, i) => i !== index));
  };
  const handlePhaseChange = (index: number, value: string) => {
    const updated = [...phaseNames];
    updated[index] = value;
    setPhaseNames(updated);
  };

  const handleSave = () => {
    if (!name.trim()) return;
    const validPhases = phaseNames.filter((p) => p.trim());
    if (validPhases.length === 0) return;
    onSave({ name: name.trim(), color, phases: validPhases });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-base-100">
        <h3 className="font-bold text-lg text-base-content mb-4">
          {editProject ? 'Edit Project' : 'New Project'}
        </h3>
        <div className="form-control mb-3">
          <label className="label py-1"><span className="label-text">Project Name</span></label>
          <input type="text" className="input input-bordered input-sm w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Kitchen Renovation" autoFocus />
        </div>
        <div className="form-control mb-3">
          <label className="label py-1"><span className="label-text">Color</span></label>
          <div className="flex gap-2 flex-wrap">
            {COLOR_OPTIONS.map((c) => {
              const classes = GANTT_COLOR_MAP[c];
              return (
                <button key={c} className={`w-8 h-8 rounded-full ${classes.bg} border-2 ${color === c ? 'border-base-content ring-2 ring-offset-2 ring-offset-base-100 ring-base-content/50' : 'border-transparent'}`} onClick={() => setColor(c)} title={c} />
              );
            })}
          </div>
        </div>
        <div className="form-control mb-3">
          <label className="label py-1"><span className="label-text">Phases</span></label>
          <div className="space-y-2">
            {phaseNames.map((phase, i) => (
              <div key={i} className="flex gap-2">
                <input type="text" className="input input-bordered input-sm flex-1" value={phase} onChange={(e) => handlePhaseChange(i, e.target.value)} placeholder={`Phase ${i + 1}`} />
                {phaseNames.length > 1 && (
                  <button className="btn btn-ghost btn-sm btn-square text-error" onClick={() => handleRemovePhase(i)}><Trash2 size={14} /></button>
                )}
              </div>
            ))}
          </div>
          <button className="btn btn-ghost btn-sm mt-2 gap-1 self-start" onClick={handleAddPhase}><Plus size={14} /> Add Phase</button>
        </div>
        <div className="modal-action">
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={handleSave}>{editProject ? 'Update' : 'Create'}</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};

export default GanttProjectModal;
