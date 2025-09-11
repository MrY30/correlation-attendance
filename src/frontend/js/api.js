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

export async function updateSession(sessionId, data) {
  const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (e) {
    // Not JSON, leave json as null but keep the raw text for error messages
  }

  if (!res.ok) {
    const errMsg = (json && (json.error || json.message)) || text || 'Failed to update session';
    throw new Error(errMsg);
  }

  // Return parsed JSON if any, otherwise null (server might return 204 No Content)
  return json;
}

export async function deleteSession(sessionId) {
  if (!sessionId) throw new Error('Missing sessionId');
  const res = await fetch(`/api/sessions/${encodeURIComponent(sessionId)}`, {
    method: 'DELETE'
  });

  const text = await res.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch (e) { /* ignore */ }

  if (!res.ok) {
    const msg = (json && (json.error || json.message)) || text || 'Failed to delete session';
    throw new Error(msg);
  }

  return json;
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

export async function scanAttendance(rfidCode, sessionId, statusColumn) {
  const res = await fetch('/api/attendance/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rfidCode, sessionId, statusColumn })
  });

  if (!res.ok) throw new Error('Network error');
  return res.json();
}

export async function fetchAttendanceData(sessionId) {
  const res = await fetch(`/api/reports/${encodeURIComponent(sessionId)}/attendance`);
  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Fetch failed: ${res.status}`);
  }
  return res.json(); // { session, logs }
}

// src/frontend/api.js
export async function saveSignature(schoolId, sessionId, statusColumn, signature) {
  const res = await fetch('/api/signature/save', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ schoolId, sessionId, statusColumn, signature }),
  });

  if (!res.ok) throw new Error('Network error');
  return res.json();
}


