import React, { useState, useEffect, useCallback } from 'react';
import { Todo, Filters } from './types';
import { supabase } from './lib/supabase';
import { sqlQuery } from './lib/db';
import { handleAuthCallback, isGoogleConnected } from './lib/googleAuth';
import Header from './components/Header';
import TaskTable from './components/TaskTable';
import AddTaskModal from './components/AddTaskModal';
import CalendarView from './components/CalendarView';
import AIScheduling from './components/AIScheduling';
import GoalsView from './components/GoalsView';
import ProjectScheduler from './components/ProjectScheduler';
import Login from './components/Login';

type ViewMode = 'tasks' | 'calendar' | 'goals' | 'projects' | 'ai';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('tasks');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [allTodos, setAllTodos] = useState<Todo[]>([]);
  const [filters, setFilters] = useState<Filters>({
    priority: '', time_block: '', status: '', sheet: '', search: '', quickFilter: '',
  });
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [oauthProcessing, setOauthProcessing] = useState(false);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    if (code) {
      setOauthProcessing(true);
      // Wait for auth session to be ready, then exchange code
      const processCallback = async () => {
        // Small delay to ensure Supabase session is loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        const success = await handleAuthCallback(code);
        if (success) {
          setGoogleConnected(true);
        }
        // Clean up URL
        window.history.replaceState({}, '', window.location.pathname);
        setOauthProcessing(false);
      };
      processCallback();
    }
  }, [session]); // Re-run when session changes so we have auth

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Check Google connection when session loads
  useEffect(() => {
    if (session) {
      isGoogleConnected().then(setGoogleConnected);
    }
  }, [session]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(filters.search), 350);
    return () => clearTimeout(timer);
  }, [filters.search]);

  const loadTodos = useCallback(async () => {
    try {
      const clauses: string[] = [];
      if (filters.priority) clauses.push(`priority = '${filters.priority.split("'").join("''")}'`);
      if (filters.time_block) clauses.push(`time_block = '${filters.time_block.split("'").join("''")}'`);
      if (filters.status) clauses.push(`status = '${filters.status.split("'").join("''")}'`);
      if (filters.sheet) clauses.push(`sheet = '${filters.sheet.split("'").join("''")}'`);
      if (debouncedSearch) {
        const s = debouncedSearch.split("'").join("''");
        clauses.push(`(task ILIKE '%${s}%' OR subtask ILIKE '%${s}%' OR notes ILIKE '%${s}%')`);
      }
      if (filters.quickFilter === 'driving') {
        clauses.push(`(LOWER(task) LIKE '%call%' OR LOWER(task) LIKE '%text%' OR LOWER(subtask) LIKE '%call%' OR LOWER(subtask) LIKE '%text%')`);
      }
      const where = clauses.length > 0 ? ' WHERE ' + clauses.join(' AND ') : '';
      const rows = await sqlQuery(`SELECT * FROM todos${where} ORDER BY sort_order ASC`);
      setTodos(rows);
      const all = await sqlQuery(`SELECT * FROM todos ORDER BY sort_order ASC`);
      setAllTodos(all);
    } catch (err) {
      console.warn('Failed to load todos:', err);
    } finally {
      setLoading(false);
    }
  }, [filters.priority, filters.time_block, filters.status, filters.sheet, filters.quickFilter, debouncedSearch]);

  useEffect(() => {
    if (session) loadTodos();
  }, [loadTodos, session]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (!session) {
    return <Login onLogin={setSession} />;
  }

  if (oauthProcessing) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <span className="loading loading-spinner loading-lg text-primary"></span>
        <p className="text-base-content/60">Connecting Google account...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-[1400px] mx-auto safe-area-padding">
      <Header
        todos={todos}
        allTodos={allTodos}
        filters={filters}
        onFilterChange={setFilters}
        onAddClick={() => setShowAdd(true)}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        googleConnected={googleConnected}
        onGoogleConnectionChange={setGoogleConnected}
      />
      {viewMode === 'tasks' ? (
        <>
          <TaskTable todos={todos} onUpdate={loadTodos} />
          <AddTaskModal open={showAdd} onClose={() => setShowAdd(false)} onAdded={loadTodos} />
          <div className="text-center text-xs text-base-content/40 mt-4">
            {todos.length} task{todos.length !== 1 ? 's' : ''} shown
          </div>
        </>
      ) : viewMode === 'calendar' ? (
        <CalendarView googleConnected={googleConnected} />
      ) : viewMode === 'goals' ? (
        <GoalsView />
      ) : viewMode === 'projects' ? (
        <div className="-mx-4 -mb-4" style={{ height: 'calc(100vh - 140px)' }}>
          <ProjectScheduler />
        </div>
      ) : (
        <AIScheduling />
      )}
    </div>
  );
};

export default App;
