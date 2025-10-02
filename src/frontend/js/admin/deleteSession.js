// deleteSession.js
import { deleteSession } from '../api.js';

/* ---------- Confirm dialog helper (create once) ---------- */
function ensureConfirmDialog() {
  if (document.getElementById('confirm-overlay-delete')) return;

  const html = `
  <div id="confirm-overlay-delete" class="confirm-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
    <div class="confirm-modal">
      <h3 id="confirm-title">Confirm deletion</h3>
      <p class="confirm-message">Are you sure you want to delete the session?</p>
      <div class="confirm-buttons">
        <button type="button" class="confirm-no btn">No</button>
        <button type="button" class="confirm-yes btn">Yes</button>
      </div>
    </div>
  </div>
  `;
  document.body.insertAdjacentHTML('beforeend', html);

  const overlay = document.getElementById('confirm-overlay-delete');
  const yes = overlay.querySelector('.confirm-yes');
  const no = overlay.querySelector('.confirm-no');

  let resolver = null;

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      overlay.classList.add('hidden');
      if (resolver) { resolver(false); resolver = null; }
    }
  });

  yes.addEventListener('click', () => {
    overlay.classList.add('hidden');
    if (resolver) { resolver(true); resolver = null; }
  });

  no.addEventListener('click', () => {
    overlay.classList.add('hidden');
    if (resolver) { resolver(false); resolver = null; }
  });

  // Expose a function to show the confirm dialog and return a promise<boolean>
  window.__showConfirmDialog = (message) => {
    overlay.querySelector('.confirm-message').textContent =
      message || 'Are you sure?';
    overlay.classList.remove('hidden');
    return new Promise((res) => { resolver = res; });
  };
}

/* ---------- Delete click handler (event delegation) ---------- */
function attachDeleteHandler(sessionGridSelector = '.session-grid') {
  ensureConfirmDialog();
  const grid = document.querySelector(sessionGridSelector);
  if (!grid) {
    console.warn('[deleteSession] session grid not found');
    return;
  }

  grid.addEventListener('click', async (ev) => {
    const delBtn = ev.target.closest('.delete-session-btn');
    if (!delBtn) return;

    const card = delBtn.closest('.session-card');
    if (!card) return;

    const sessionId = card.dataset.sessionId;
    if (!sessionId) {
      alert('Cannot determine session id for deletion.');
      return;
    }

    // Show confirm dialog
    const confirmed = await window.__showConfirmDialog(
      'Are you sure you want to delete the session?'
    );
    if (!confirmed) return;

    try {
      await deleteSession(sessionId);

      // Close edit modal if open
      const editOverlay = document.getElementById('popup-overlay-edit');
      if (editOverlay && !editOverlay.classList.contains('hidden')) {
        editOverlay.classList.add('hidden');
      }

      // Remove the card from the DOM
      card.remove();

      console.log(`Session ${sessionId} deleted`);
    } catch (err) {
      console.error('Failed to delete session:', err);
      alert(`Failed to delete session: ${err.message || err}`);
    }
  });
}

/* ---------- Initialize when DOM is ready ---------- */
document.addEventListener('DOMContentLoaded', () => {
  attachDeleteHandler();
});