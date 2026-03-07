import { supabase } from './supabase';

export async function sqlQuery(query: string): Promise<any[]> {
  const { data, error } = await supabase.rpc('run_query', { query_text: query });
  if (error) { console.warn('DB query error:', error.message); throw error; }
  return Array.isArray(data) ? data : (data ? [data] : []);
}

export async function sqlExec(query: string): Promise<void> {
  const { error } = await supabase.rpc('run_exec', { query_text: query });
  if (error) { console.warn('DB exec error:', error.message); throw error; }
}

export const db = { query: sqlQuery, exec: sqlExec };
