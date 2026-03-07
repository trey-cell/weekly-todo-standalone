import React, { useState } from 'react';
import { TIME_BLOCKS, PRIORITIES, EST_TIMES, COST_DELEGATE, STATUSES, SHEETS } from '../types';
import { sqlExec } from '../lib/db';
import { escSql } from '../utils/helpers';
import { X } from 'lucide-react';

interface Props { open: boolean; onClose: () => void; onAdded: () => void; }

const defaults = { task: '', subtask: '', time_block: '', priority: '', est_time: '', cost_delegate: '', status: 'Not Started', notes: '', sheet: 'main' };

const AddTaskModal: React.FC<Props> = ({ open, onClose, onAdded }) => {
  const [form, setForm] = useState({ ...defaults });
  const [saving, setSaving] = useState(false);

  const set = (key: string, val: string) => setForm((prev) => ({ ...prev, [key]: val }));

  const handleSave = async () => {
    if (!form.task.trim()) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    try {
      await sqlExec(
        `INSERT INTO todos (task, subtask, time_block, priority, est_time, cost_delegate, status, notes, sheet, date_added, done, sort_order)
         VALUES ('${escSql(form.task)}', '${escSql(form.subtask)}', '${escSql(form.time_block)}', '${escSql(form.priority)}', '${escSql(form.est_time)}', '${escSql(form.cost_delegate)}', '${escSql(form.status)}', '${escSql(form.notes)}', '${escSql(form.sheet)}', '${today}', 0, (SELECT COALESCE(MAX(sort_order),0)+1 FROM todos))`
      );
      setForm({ ...defaults });
      onAdded();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg">Add New Task</h3>
          <button className="btn btn-ghost btn-sm btn-circle" onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="space-y-3">
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-sm font-medium">Task *</span></label>
            <input className="input input-bordered input-sm" value={form.task} onChange={(e) => set('task', e.target.value)} placeholder="What needs to be done?" />
          </div>
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-sm font-medium">Subtask</span></label>
            <input className="input input-bordered input-sm" value={form.subtask} onChange={(e) => set('subtask', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-sm font-medium">Sheet</span></label>
              <select className="select select-bordered select-sm" value={form.sheet} onChange={(e) => set('sheet', e.target.value)}>
                {SHEETS.map((s) => <option key={s} value={s}>{s === 'brian' ? "Brian's Tasks" : 'Main'}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-sm font-medium">Priority</span></label>
              <select className="select select-bordered select-sm" value={form.priority} onChange={(e) => set('priority', e.target.value)}>
                <option value="">— Select —</option>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-sm font-medium">Time Block</span></label>
              <select className="select select-bordered select-sm" value={form.time_block} onChange={(e) => set('time_block', e.target.value)}>
                <option value="">— Select —</option>
                {TIME_BLOCKS.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-control">
              <label className="label py-1"><span className="label-text text-sm font-medium">Est. Time</span></label>
              <select className="select select-bordered select-sm" value={form.est_time} onChange={(e) => set('est_time', e.target.value)}>
                <option value="">— Select —</option>
                {EST_TIMES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-control">
            <label className="label py-1"><span className="label-text text-sm font-medium">Notes</span></label>
            <textarea className="textarea textarea-bordered textarea-sm" rows={2} value={form.notes} onChange={(e) => set('notes', e.target.value)} />
          </div>
        </div>
        <div className="modal-action">
          <button className="btn btn-ghost btn-sm" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || !form.task.trim()}>
            {saving ? 'Saving...' : 'Add Task'}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose}></div>
    </div>
  );
};

export default AddTaskModal;
