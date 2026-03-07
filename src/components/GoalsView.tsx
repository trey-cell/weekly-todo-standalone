import React, { useState, useEffect, useCallback } from 'react';
import { RecurringBlock, Goal } from '../types';
import { sqlQuery } from '../lib/db';
import TimeBlocks from './TimeBlocks';
import GoalTracker from './GoalTracker';
import { BarChart3, AlertTriangle } from 'lucide-react';

const TOTAL_HOURS_WEEK = 168;

const GoalsView: React.FC = () => {
  const [blocks, setBlocks] = useState<RecurringBlock[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    const [b, g] = await Promise.all([
      sqlQuery('SELECT * FROM recurring_blocks WHERE active = 1 ORDER BY stage, category, id'),
      sqlQuery("SELECT * FROM goals WHERE status = 'active' ORDER BY type DESC, stage, id"),
    ]);
    setBlocks(b as unknown as RecurringBlock[]);
    setGoals(g as unknown as Goal[]);
    setLoading(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return <div className="flex items-center justify-center py-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;

  const sleepBlock = blocks.find((b) => b.category === 'Body' && b.title.toLowerCase().includes('sleep'));
  const sleepHours = sleepBlock ? sleepBlock.hours_per_week : 42;
  const wakingHours = TOTAL_HOURS_WEEK - sleepHours;
  const nonSleepBlocks = blocks.filter((b) => !(b.category === 'Body' && b.title.toLowerCase().includes('sleep')));
  const allocatedHours = nonSleepBlocks.reduce((sum, b) => sum + b.hours_per_week, 0);
  const freeHours = wakingHours - allocatedHours;
  const marginPct = wakingHours > 0 ? Math.round((freeHours / wakingHours) * 100) : 0;
  const isHealthy = marginPct >= 20;
  const allocPct = wakingHours > 0 ? Math.round((allocatedHours / wakingHours) * 100) : 0;
  const stage1Hours = blocks.filter((b) => b.stage === 1).reduce((s, b) => s + b.hours_per_week, 0);
  const stage2Hours = blocks.filter((b) => b.stage === 2 && !(b.category === 'Body' && b.title.toLowerCase().includes('sleep'))).reduce((s, b) => s + b.hours_per_week, 0);
  const s1WidthPct = Math.min((stage1Hours / wakingHours) * 100, 100);
  const s2WidthPct = Math.min((stage2Hours / wakingHours) * 100, 100);

  return (
    <div className="space-y-6 pb-8">
      <div className="card bg-base-200">
        <div className="card-body p-4 space-y-3">
          <h2 className="card-title text-base gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Weekly Time Budget
            <span className="text-xs font-normal text-base-content/50">Quick Rule: Keep ≥20% margin</span>
          </h2>
          <div className="stats stats-horizontal shadow w-full text-sm">
            <div className="stat py-2 px-3"><div className="stat-title text-xs">Waking Hours</div><div className="stat-value text-lg">{wakingHours}h</div><div className="stat-desc">{sleepHours}h sleep/wk</div></div>
            <div className="stat py-2 px-3"><div className="stat-title text-xs">Allocated</div><div className="stat-value text-lg text-warning">{allocatedHours}h</div><div className="stat-desc">S1: {stage1Hours}h · S2: {stage2Hours}h</div></div>
            <div className="stat py-2 px-3"><div className="stat-title text-xs">Free for Goals</div><div className="stat-value text-lg text-success">{freeHours.toFixed(1)}h</div><div className="stat-desc">Stage 3 time</div></div>
            <div className="stat py-2 px-3"><div className="stat-title text-xs">Margin</div><div className={`stat-value text-lg ${isHealthy ? 'text-success' : 'text-error'}`}>{marginPct}%</div><div className="stat-desc">Target: ≥20%</div></div>
          </div>
          <div className="w-full">
            <div className="flex justify-between text-xs text-base-content/60 mb-1"><span>{allocPct}% of waking hours allocated</span><span>{wakingHours}h waking</span></div>
            <div className="w-full bg-base-300 rounded-full h-3 overflow-hidden flex">
              <div className="bg-primary h-full transition-all" style={{ width: `${s1WidthPct}%` }} />
              <div className="bg-secondary h-full transition-all" style={{ width: `${s2WidthPct}%` }} />
            </div>
            <div className="flex gap-4 text-xs mt-1 text-base-content/60">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> Stage 1 ({stage1Hours}h)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary inline-block" /> Stage 2 ({stage2Hours}h)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success/30 inline-block" /> Free ({freeHours.toFixed(1)}h)</span>
            </div>
          </div>
          {!isHealthy && <div className="alert alert-warning text-sm py-2"><AlertTriangle className="w-4 h-4" /><span>Margin is below 20%. You&apos;re overcommitted — consider reducing allocated hours or delegating.</span></div>}
        </div>
      </div>
      <TimeBlocks blocks={blocks} onUpdate={loadData} />
      <GoalTracker goals={goals} freeHours={freeHours} onUpdate={loadData} />
    </div>
  );
};

export default GoalsView;
