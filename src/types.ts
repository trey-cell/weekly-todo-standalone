export interface Todo {
  id: number;
  done: number;
  task: string;
  subtask: string;
  time_block: string;
  priority: string;
  date_added: string;
  date_due: string;
  est_time: string;
  cost_delegate: string;
  status: string;
  notes: string;
  sort_order: number;
  sheet: string;
  google_task_id: string | null;
  google_calendar_event_id: string | null;
}

export const TIME_BLOCKS = ['CMO', 'CFO', 'COO', 'CEO', 'Delegate to Employee', 'Emails/text', 'Personal'];

export const PRIORITIES = [
  'Do First (Urgent + Important)',
  'Schedule (Important, Not Urgent)',
  'Delegate (Urgent, Not Important)',
  'Eliminate or Batch',
];

export const EST_TIMES = ['5 min', '10 min', '15 min', '20 min', '30 min', '45 min', '1 hr', '1.5 hrs', '2 hrs', '2-3 hrs', '2-4 hrs'];

export const COST_DELEGATE = ['0', '10', '15', '25', '35', '50', '75', '100', '150', '200'];

export const STATUSES = ['Not Started', 'In Progress', 'Done'];

export const SHEETS = ['main', 'brian'];

export type SortDir = 'asc' | 'desc';

export interface RecurringBlock {
  id: number;
  stage: number;
  category: string;
  title: string;
  hours_per_week: number;
  frequency: string;
  preferred_days: string;
  preferred_time: string;
  duration_minutes: number;
  notes: string;
  active: number;
}

export interface Goal {
  id: number;
  type: string;
  title: string;
  description: string;
  stage: number;
  status: string;
  target_date: string;
  parent_goal_id: number | null;
  created_at: string;
}

export type QuickFilter = '' | 'driving';

export interface Filters {
  priority: string;
  time_block: string;
  status: string;
  sheet: string;
  search: string;
  quickFilter: QuickFilter;
}
