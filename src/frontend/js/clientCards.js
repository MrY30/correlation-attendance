// src/frontend/js/sessionsCards.js
import { fetchSessions } from './api.js';

const grid = document.querySelector('.session-grid'); // instead of #sessions-container
const mainSessionView = document.querySelector('.main-session');
const attendanceReaderView = document.querySelector('.attendance-reader');
const backButton = document.querySelector('.back-button');

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

function createSessionCards(session) {
  const cards = [];

  const defs = [
    { // WEEKLY EXAM
      title: `Weekly Exam`,
      subtitle: `${session.session_name}`,
      id: `${session.session_id}`,
      dateLabel: formatDateOnly(session.publish_date),
      openIso: `${session.publish_date}T${session.weekly_start}`,
      closeIso: `${session.publish_date}T${session.weekly_end}`,
      displayTimes: `${formatTime(session.weekly_start)} → ${formatTime(session.weekly_end)}`
    },
    { // AM SESSION
      title: `AM Session`,
      subtitle: `${session.session_name}`,
      id: `${session.session_id}`,
      dateLabel: formatDateOnly(session.publish_date),
      openIso: `${session.publish_date}T${session.am_start}`,
      closeIso: `${session.publish_date}T${session.am_end}`,
      displayTimes: `${formatTime(session.am_start)} → ${formatTime(session.am_end)}`
    },
    { // PM SESSION
      title: `PM Session`,
      subtitle: `${session.session_name}`,
      id: `${session.session_id}`,
      dateLabel: formatDateOnly(session.publish_date),
      openIso: `${session.publish_date}T${session.pm_start}`,
      closeIso: `${session.publish_date}T${session.pm_end}`,
      displayTimes: `${formatTime(session.pm_start)} → ${formatTime(session.pm_end)}`
    }
  ];

  defs.forEach(def => {
    const { isActive } = computeStatus(def.openIso, def.closeIso);
    if (isActive) {
      cards.push(makeCard({
        ...def,
        dateLabel: formatDateOnly(session.publish_date)
      }));
    }
  });

  return cards;
}

function makeCard({ title, subtitle, id, dateLabel, openIso, closeIso, displayTimes }) {
  const { isActive, display } = computeStatus(openIso, closeIso);
  const statusClass = isActive ? 'status-active' : 'status-closed';

  const card = document.createElement('div');
  card.className = 'session-card';
  card.dataset.sessionName = title;
  card.dataset.subtitle = subtitle;
  card.dataset.sessionId = id;
  card.dataset.openIso = openIso;
  card.dataset.closeIso = closeIso;
  card.dataset.status = display;

  card.innerHTML = `
    <div class="session-card-header">
      <h3>${title}</h3>
      <span class="session-id">${subtitle}</span>
    </div>
    <div class="session-card-body">
      <div class="session-info">
          <i class='bx bx bx-calendar'></i>
          <span class="publish-date">DATE: ${dateLabel}</span>
      </div>
      <div class="session-info">
        <i class='bx bx-clock-3'></i>
        <span>${displayTimes}</span>
      </div>
    </div>
    <div class="session-card-footer">
      <span class="session-status ${statusClass}">${display}</span>
    </div>
  `;

  return card;
}

async function renderSessions() {
  if (!grid) return;

  const addCard = grid.querySelector('#add-session-btn');
  grid.innerHTML = '';

  try {
    const res = await fetchSessions();
    const sessions = res?.data ?? res ?? [];

    const fragment = document.createDocumentFragment();
    sessions.forEach(sess => {
      const cards = createSessionCards(sess); // only active cards returned
      cards.forEach(c => fragment.appendChild(c));
    });

    if (fragment.children.length === 0) {
      grid.innerHTML = '<div class="empty">No active sessions found.</div>';
    } else {
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

// --- NEW: Function to handle view switching logic ---
function setupUIInteractions() {
  if (!grid || !mainSessionView || !attendanceReaderView || !backButton) return;

  // Use event delegation to listen for clicks on session cards
  grid.addEventListener('click', (event) => {
    // Find the closest .session-card parent from the clicked element
    const card = event.target.closest('.session-card');

    // Ignore clicks on the edit/delete buttons
    if (event.target.closest('.session-actions')) {
      return;
    }

    if (card) {
      // 1. Get data from the card's data-* attributes
      const { sessionName, sessionId, publishDate, closeDate } = card.dataset;

      // 2. Populate the attendance reader header
      document.getElementById('session-title').textContent = sessionName;
      document.getElementById('session-id').textContent = `ID: ${sessionId}`;
      document.getElementById('session-id').dataset.session = sessionId;
      document.getElementById('session-date').textContent = `${publishDate} - ${closeDate}`;

      // 3. Switch the view
      mainSessionView.classList.add('hidden');
      attendanceReaderView.classList.remove('hidden');
    }
  });

  // Add click listener for the back button
  backButton.addEventListener('click', () => {
    attendanceReaderView.classList.add('hidden');
    mainSessionView.classList.remove('hidden');
  });
}

async function init() {
  await renderSessions();
  setupUIInteractions();
  setInterval(recheckStatuses, 15000); // every 15s update status
  setInterval(renderSessions, 60000); // every 60s refetch
}

document.addEventListener('DOMContentLoaded', init);