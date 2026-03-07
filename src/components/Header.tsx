import React from 'react';
import { Todo, Filters } from '../types';
import { ListChecks, Calendar, Target, FolderKanban, Bot, Plus, Search, Car, Settings } from 'lucide-react';
import GoogleConnect from './GoogleConnect';
import { supabase } from '../lib/supabase';

type ViewMode = 'tasks' | 'calendar' | 'goals' | 'projects' | 'ai';

interface Props {
  todos: Todo[];
  allTodos: Todo[];
  filters: Filters;
  onFilterChange: (f: Filters) => void;
  onAddClick: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  googleConnected: boolean;
  onGoogleConnectionChange: (connected: boolean) => void;
}

const priorityBadge = (p: string) => {
  if (p.includes('Do First')) return '🔴';
  if (p.includes('Schedule')) return '🟡';
  if (p.includes('Delegate')) return '🔵';
  if (p.includes('Eliminate')) return '⚪';
  return '';
};

const Header: React.FC<Props> = ({
  todos, allTodos, filters, onFilterChange, onAddClick,
  viewMode, onViewModeChange, googleConnected, onGoogleConnectionChange,
}) => {
  const doFirst = allTodos.filter(t => t.priority?.includes('Do First')).length;
  const schedule = allTodos.filter(t => t.priority?.includes('Schedule')).length;
  const delegate = allTodos.filter(t => t.priority?.includes('Delegate')).length;
  const total = allTodos.length;

  const timeBlocks = [...new Set(allTodos.map(t => t.time_block).filter(Boolean))].sort();
  const priorities = [...new Set(allTodos.map(t => t.priority).filter(Boolean))].sort();

  const [showSettings, setShowSettings] = React.useState(false);

  const tabs: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: 'tasks', label: 'Tasks', icon: <ListChecks className="w-4 h-4" /> },
    { key: 'calendar', label: 'Calendar', icon: <Calendar className="w-4 h-4" /> },
    { key: 'goals', label: 'Goals', icon: <Target className="w-4 h-4" /> },
    { key: 'projects', label: 'Projects', icon: <FolderKanban className="w-4 h-4" /> },
    { key: 'ai', label: 'AI', icon: <Bot className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-3 mb-4">
      {/* Title + Settings */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListChecks className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-xl font-bold leading-tight mobile-title">Weekly Todo</h1>
            <p className="text-xs text-base-content/50 hidden sm:block">Eisenhower Matrix · Life Management</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost btn-sm btn-square"
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            className="btn btn-ghost btn-sm text-error"
            onClick={() => { supabase.auth.signOut(); }}
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="card bg-base-200 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Google Calendar & Tasks</span>
            <GoogleConnect onConnectionChange={onGoogleConnectionChange} />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs tabs-boxed bg-base-200 p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab tab-sm gap-1.5 flex-1 ${viewMode === tab.key ? 'tab-active' : ''}`}
            onClick={() => onViewModeChange(tab.key)}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Stats (tasks view only) */}
      {viewMode === 'tasks' && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="text-lg font-bold">{total}</div>
              <div className="text-xs text-base-content/50">Total</div>
            </div>
            <div className="stat-card">
              <div className="text-lg font-bold text-error">{doFirst}</div>
              <div className="text-xs text-base-content/50">🔴 Do First</div>
            </div>
            <div className="stat-card">
              <div className="text-lg font-bold text-warning">{schedule}</div>
              <div className="text-xs text-base-content/50">🟡 Schedule</div>
            </div>
            <div className="stat-card">
              <div className="text-lg font-bold text-info">{delegate}</div>
              <div className="text-xs text-base-content/50">🔵 Delegate</div>
            </div>
          </div>

          {/* Filters */}
          <div className="filter-row">
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40" />
              <input
                type="text"
                placeholder="Search tasks..."
                className="input input-bordered input-sm w-full pl-8"
                value={filters.search}
                onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
              />
            </div>
            <select className="select select-bordered select-sm min-w-[100px]" value={filters.time_block} onChange={(e) => onFilterChange({ ...filters, time_block: e.target.value })}>
              <option value="">All Blocks</option>
              {timeBlocks.map(tb => <option key={tb} value={tb}>{tb}</option>)}
            </select>
            <select className="select select-bordered select-sm min-w-[100px]" value={filters.priority} onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}>
              <option value="">All Priority</option>
              {priorities.map(p => <option key={p} value={p}>{priorityBadge(p)} {p}</option>)}
            </select>
            <button className="btn btn-primary btn-sm gap-1" onClick={onAddClick}>
              <Plus className="w-3.5 h-3.5" /> Add
            </button>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-2">
            <button
              className={`btn btn-sm gap-1 ${filters.quickFilter === 'driving' ? 'btn-warning' : 'btn-ghost'}`}
              onClick={() => onFilterChange({ ...filters, quickFilter: filters.quickFilter === 'driving' ? '' : 'driving' })}
            >
              <Car className="w-3.5 h-3.5" /> 🚗 Driving Mode
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Header;
