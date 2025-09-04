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

export async function addSession(session) {
  const res = await fetch('/api/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(session),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to create session');
  }
  return res.json();
}

export async function fetchSessions() {
  const res = await fetch('/api/sessions');
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Network error: ${res.status}`);
  }
  const body = await res.json();
  return body.data || [];
}

export async function scanAttendance(rfidCode, sessionId) {
  const res = await fetch('/api/attendance/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfidCode, sessionId })
  });

  if (!res.ok) throw new Error('Network error');
  return res.json();
}
