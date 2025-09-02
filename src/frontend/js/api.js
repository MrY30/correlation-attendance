// src/frontend/js/api.js
export async function fetchStudents({ page = 1, limit = 200 } = {}) {
  const url = `/api/students?page=${page}&limit=${limit}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Network error: ${res.status}`);
  }
  const body = await res.json();
  return body.data || [];
}
