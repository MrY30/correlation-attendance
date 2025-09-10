// src/frontend/js/sessionsCards.js
import { fetchSessions } from './api.js';

const grid = document.querySelector('.session-grid');

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatDateOnly(isoDate) {
  if (!isoDate) return '—';
  try {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      timeZone: 'Asia/Manila'
    }).format(new Date(isoDate));
  } catch {
    return isoDate;
  }
}

function formatTime(timeStr) {
  if (!timeStr) return '—';
  try {
    const [h, m, s] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(h, m, s || 0);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Manila'
    }).format(date);
  } catch {
    return timeStr;
  }
}

function computeStatus(openIso, closeIso) {
  if (!openIso || !closeIso) return { isActive: false, display: 'Closed' };
  const now = Date.now();
  const open = Date.parse(openIso);
  const close = Date.parse(closeIso);
  if (Number.isNaN(open) || Number.isNaN(close)) return { isActive: false, display: 'Closed' };
  const isActive = now >= open && now <= close;
  return { isActive, display: isActive ? 'Active' : 'Closed' };
}

function createSessionCard(session) {
  // Build ISO times for open/close window
  const openIso = `${session.publish_date}T${session.weekly_start}`;
  const closeIso = `${session.publish_date}T${session.pm_end}`;

  const publishDisplay = formatDateTime(openIso);
  const closeDisplay = formatDateTime(closeIso);
  const { isActive, display } = computeStatus(openIso, closeIso);
  const statusClass = isActive ? 'status-active' : 'status-closed';

  const card = document.createElement('div');
  card.className = 'session-card';
  card.dataset.sessionName = session.session_name ?? '';
  card.dataset.sessionId = session.session_id ?? '';
  card.dataset.publishDate = publishDisplay;
  card.dataset.closeDate = closeDisplay;
  card.dataset.openIso = openIso;
  card.dataset.closeIso = closeIso;
  card.dataset.status = display;

  card.innerHTML = `
    <div class="session-card-header">
      <h3>${session.session_name ?? 'Untitled Session'}</h3>
      <span class="session-id">ID: ${session.session_id ?? '—'}</span>
    </div>
    <div class="session-card-body">

      <div class="session-info">
        <i class='bx bx-calendar'></i>
        <span class="publish-date">DATE: ${formatDateOnly(session.publish_date) ?? '—'}</span>
      </div>

      <div class="session-info">
        <i class='bx bx-clock-3'></i>
        <span>Weekly Exam: ${formatTime(session.weekly_start)} → ${formatTime(session.weekly_end)}</span>
      </div>

      <div class="session-info">
        <i class='bx bx-clock-3'></i>
        <span>AM Session: ${formatTime(session.am_start)} → ${formatTime(session.am_end)}</span>
      </div>

      <div class="session-info">
        <i class='bx bx-clock-3'></i>
        <span>PM Session: ${formatTime(session.pm_start)} → ${formatTime(session.pm_end)}</span>
      </div>

    </div>
    <div class="session-card-footer">
      <span class="session-status ${statusClass}">${display}</span>
      <div class="session-actions">
        <i class='bx bx-edit-alt edit-session-btn'></i>
        <i class='bx bx-trash delete-session-btn'></i>
      </div>
    </div>
  `;

  return card;
}

async function renderSessions() {
  if (!grid) return;

  // Save the "Add Session" card so we can re-append it
  const addCard = grid.querySelector('#add-session-btn');
  grid.innerHTML = '';

  try {
    const res = await fetchSessions();
    const sessions = res?.data ?? res ?? [];

    if (sessions.length === 0) {
      grid.innerHTML = '<div class="empty">No sessions found.</div>';
    } else {
      const fragment = document.createDocumentFragment();
      sessions.forEach(sess => fragment.appendChild(createSessionCard(sess)));
      grid.appendChild(fragment);
    }

    if (addCard) grid.appendChild(addCard);
  } catch (err) {
    console.error('renderSessions error', err);
    grid.innerHTML = `<div class="error">Failed to load sessions.</div>`;
    if (addCard) grid.appendChild(addCard);
  }
}

function recheckStatuses() {
  const cards = grid?.querySelectorAll('.session-card') ?? [];
  cards.forEach(card => {
    const { isActive, display } = computeStatus(card.dataset.openIso, card.dataset.closeIso);
    const statusSpan = card.querySelector('.session-status');
    if (statusSpan) {
      statusSpan.textContent = display;
      statusSpan.classList.toggle('status-active', isActive);
      statusSpan.classList.toggle('status-closed', !isActive);
      card.dataset.status = display;
    }
  });
}

async function init() {
  await renderSessions();
  setInterval(recheckStatuses, 15000);
  setInterval(renderSessions, 60000);
}

document.addEventListener('DOMContentLoaded', init);