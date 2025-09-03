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
  const publishDisplay = formatDateTime(session.open_date);
  const closeDisplay = formatDateTime(session.close_date);
  const { isActive, display } = computeStatus(session.open_date, session.close_date);
  const statusClass = isActive ? 'status-active' : 'status-closed';

  const card = document.createElement('div');
  card.className = 'session-card';
  card.dataset.sessionName = session.session_name ?? '';
  card.dataset.sessionId = session.session_id ?? '';
  card.dataset.publishDate = publishDisplay;
  card.dataset.closeDate = closeDisplay;
  card.dataset.openIso = session.open_date ?? '';
  card.dataset.closeIso = session.close_date ?? '';
  card.dataset.status = display;

  card.innerHTML = `
    <div class="session-card-header">
      <h3>${session.session_name ?? 'Untitled Session'}</h3>
      <span class="session-id">ID: ${session.session_id ?? '—'}</span>
    </div>
    <div class="session-card-body">
      <div class="session-info">
        <i class='bx bx-calendar'></i>
        <span>Published: ${publishDisplay}</span>
      </div>
      <div class="session-info">
        <i class='bx bx-time-five'></i>
        <span>Closes: ${closeDisplay}</span>
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
    const sessions = await fetchSessions();
    // Filter the sessions array to only include active ones
    const activeSessions = sessions.filter(sess => 
      computeStatus(sess.open_date, sess.close_date).isActive
    );

    if (activeSessions.length === 0) {
      grid.innerHTML = '<div class="empty">No active sessions found.</div>';
    } else {
      const fragment = document.createDocumentFragment();
      // Now, we only iterate over the active sessions
      activeSessions.forEach(sess => fragment.appendChild(createSessionCard(sess)));
      grid.appendChild(fragment);
    }

    // Re-append the "Add Session" card at the end
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