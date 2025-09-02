// src/frontend/js/api.js
export async function fetchStudents() {
  const url = `/api/students`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Network error: ${res.status}`);
  }
  const body = await res.json();
  return body.data || [];
}
