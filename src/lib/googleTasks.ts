import { getValidAccessToken } from './googleAuth';

const BASE_URL = 'https://www.googleapis.com/tasks/v1';

async function googleFetch(endpoint: string, options: RequestInit = {}) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Google not connected');

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Tasks API error: ${response.status} ${errorBody}`);
  }

  if (response.status === 204) return null;
  return response.json();
}

/** Trey's Weekly To-Do task list ID */
export const WEEKLY_TODO_LIST_ID = 'SUZqRVRfTF9oelU5cGN1bw';

/** List all task lists */
export async function listTaskLists() {
  const result = await googleFetch('/users/@me/lists');
  return result.items || [];
}

/** List tasks in a task list */
export async function listTasks(taskListId: string = WEEKLY_TODO_LIST_ID) {
  const params = new URLSearchParams({
    showCompleted: 'false',
    maxResults: '100',
  });
  const result = await googleFetch(`/lists/${taskListId}/tasks?${params}`);
  return result.items || [];
}

/** Create a task */
export async function createTask(taskListId: string, task: {
  title: string;
  notes?: string;
  due?: string;
}) {
  return googleFetch(`/lists/${taskListId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(task),
  });
}

/** Update a task */
export async function updateTask(taskListId: string, taskId: string, updates: any) {
  return googleFetch(`/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/** Delete a task */
export async function deleteTask(taskListId: string, taskId: string) {
  const token = await getValidAccessToken();
  if (!token) throw new Error('Google not connected');

  await fetch(`${BASE_URL}/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` },
  });
}
