-- =====================================================
-- Weekly Todo Standalone - Supabase Schema
-- Run this in your Supabase SQL Editor
-- =====================================================

-- TODOS table
CREATE TABLE IF NOT EXISTS todos (
  id BIGSERIAL PRIMARY KEY,
  done INTEGER DEFAULT 0,
  task TEXT,
  subtask TEXT DEFAULT '',
  time_block TEXT DEFAULT '',
  priority TEXT DEFAULT '',
  date_added TEXT DEFAULT '',
  date_due TEXT DEFAULT '',
  est_time TEXT DEFAULT '',
  cost_delegate TEXT DEFAULT '',
  status TEXT DEFAULT 'Not Started',
  notes TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  sheet TEXT DEFAULT 'main',
  google_task_id TEXT,
  google_calendar_event_id TEXT,
  other TEXT DEFAULT '',
  day_of_week TEXT DEFAULT ''
);

-- GOALS table
CREATE TABLE IF NOT EXISTS goals (
  id BIGSERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  stage INTEGER DEFAULT 3,
  status TEXT DEFAULT 'active',
  target_date TEXT,
  parent_goal_id BIGINT REFERENCES goals(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RECURRING_BLOCKS table
CREATE TABLE IF NOT EXISTS recurring_blocks (
  id BIGSERIAL PRIMARY KEY,
  stage INTEGER NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  hours_per_week DECIMAL(5,2) DEFAULT 0,
  frequency TEXT DEFAULT '',
  preferred_days TEXT DEFAULT '',
  preferred_time TEXT DEFAULT '',
  duration_minutes INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',
  active INTEGER DEFAULT 1
);

-- GANTT tables
CREATE TABLE IF NOT EXISTS gantt_projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'blue',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gantt_phases (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES gantt_projects(id),
  name TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gantt_tasks (
  id TEXT PRIMARY KEY,
  phase_id TEXT REFERENCES gantt_phases(id),
  project_id TEXT REFERENCES gantt_projects(id),
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gantt_employees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'internal',
  color TEXT DEFAULT 'blue',
  hourly_rate DECIMAL(8,2),
  sort_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS gantt_assignments (
  id TEXT PRIMARY KEY,
  employee_id TEXT REFERENCES gantt_employees(id),
  task_id TEXT REFERENCES gantt_tasks(id),
  project_id TEXT REFERENCES gantt_projects(id),
  start_date TEXT,
  end_date TEXT,
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS gantt_backlog (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  project_id TEXT REFERENCES gantt_projects(id),
  phase_id TEXT REFERENCES gantt_phases(id),
  estimated_days INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',
  priority TEXT DEFAULT 'normal',
  sort_order INTEGER DEFAULT 0
);

-- =====================================================
-- RPC Functions for raw SQL execution
-- These allow the app to run raw SQL queries safely
-- =====================================================

-- run_query: executes a SELECT and returns JSON array of rows
CREATE OR REPLACE FUNCTION run_query(query_text text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  EXECUTE 'SELECT COALESCE(json_agg(t), ''[]''::json) FROM (' || query_text || ') t'
  INTO result;
  RETURN result;
END;
$$;

-- run_exec: executes INSERT/UPDATE/DELETE statements
CREATE OR REPLACE FUNCTION run_exec(query_text text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE query_text;
END;
$$;

-- Grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION run_query(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION run_exec(text) TO anon, authenticated;

-- =====================================================
-- Seed: Default recurring blocks (Stage 1 & 2)
-- =====================================================
INSERT INTO recurring_blocks (stage, category, title, hours_per_week, frequency, active) VALUES
  (1, 'Work', 'Work / Job Time', 40, 'Mon-Fri', 1),
  (1, 'Financials', 'Personal Finance Review', 2, 'Weekly', 1),
  (2, 'Spiritual', 'Morning Prayer', 2.3, 'Daily (20 min)', 1),
  (2, 'Spiritual', 'Church Attendance', 2, 'Weekly', 1),
  (2, 'Body', 'Gym (4x/week, 45 min)', 3, '4x/week', 1),
  (2, 'Body', 'Meal Prep & Groceries', 3, 'Weekly', 1),
  (2, 'Body', 'Sleep', 42, 'Daily', 1),
  (2, 'Household', 'Laundry, Cleaning, Chores', 3, 'Weekly', 1),
  (2, 'Relationship', 'Date Night', 3, 'Weekly', 1),
  (2, 'Relationship', 'Friends / Family / Hobbies', 4, 'Weekly', 1)
ON CONFLICT DO NOTHING;

