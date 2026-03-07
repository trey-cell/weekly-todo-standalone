import React, { useState, useEffect } from 'react';
import type { GanttEmployee } from '../gantt-types';
import { GANTT_COLOR_MAP } from '../gantt-helpers';

interface GanttEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (emp: { name: string; type: 'internal' | 'sub'; color: string }) => void;
  editEmployee?: GanttEmployee | null;
}

const COLOR_OPTIONS = Object.keys(GANTT_COLOR_MAP);

const GanttEmployeeModal: React.FC<GanttEmployeeModalProps> = ({
  isOpen, onClose, onSave, editEmployee,
}) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<'internal' | 'sub'>('internal');
  const [color, setColor] = useState('blue');

  useEffect(() => {
    if (isOpen) {
      if (editEmployee) {
        setName(editEmployee.name);
        setType(editEmployee.type);
        setColor(editEmployee.color);
      } else {
        setName(''); setType('internal'); setColor('blue');
      }
    }
  }, [isOpen, editEmployee]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), type, color });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box bg-base-100">
        <h3 className="font-bold text-lg text-base-content mb-4">{editEmployee ? 'Edit Crew Member' : 'New Crew Member'}</h3>
        <div className="form-control mb-3">
          <label className="label py-1"><span className="label-text">Name</span></label>
          <input type="text" className="input input-bordered input-sm w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Smith" autoFocus />
        </div>
        <div className="form-control mb-3">
          <label className="label py-1"><span className="label-text">Type</span></label>
          <div className="flex gap-4">
            <label className="label cursor-pointer gap-2">
              <input type="radio" name="gantt-emp-type" className="radio radio-sm radio-primary" checked={type === 'internal'} onChange={() => setType('internal')} />
              <span className="label-text">Internal</span>
            </label>
            <label className="label cursor-pointer gap-2">
              <input type="radio" name="gantt-emp-type" className="radio radio-sm radio-secondary" checked={type === 'sub'} onChange={() => setType('sub')} />
              <span className="label-text">Subcontractor</span>
            </label>
          </div>
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
        <div className="modal-action">
          <button className="btn btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-sm btn-primary" onClick={handleSave}>{editEmployee ? 'Update' : 'Add'}</button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
};

export default GanttEmployeeModal;
