// sessionModal.js
import { updateSession } from '../api.js';

document.addEventListener('DOMContentLoaded', () => {
//   console.log('[sessionModal] DOM ready — initializing');

  // ---- DOM refs ----
  const popupOverlayEdit = document.getElementById('popup-overlay-edit');
  const popupClose = document.getElementById('popup-close-edit');
  const sessionForm = document.getElementById('edit-session-form');
  const saveBtn = document.getElementById('session-edit-btn');
  const sessionGrid = document.querySelector('.session-grid');

  // Inputs (IDs with -edit suffix as you posted)
  const inputSessionId = document.getElementById('session-id-edit');
  const inputSessionName = document.getElementById('session-name-edit');
  const inputPublishDate = document.getElementById('publish-date-edit');

  const inputWeeklyStart = document.getElementById('weekly-start-time-edit');
  const inputWeeklyLate  = document.getElementById('weekly-late-time-edit');
  const inputWeeklyEnd   = document.getElementById('weekly-end-time-edit');

  const inputAmStart = document.getElementById('am-start-time-edit');
  const inputAmLate  = document.getElementById('am-late-time-edit');
  const inputAmEnd   = document.getElementById('am-end-time-edit');

  const inputPmStart = document.getElementById('pm-start-time-edit');
  const inputPmLate  = document.getElementById('pm-late-time-edit');
  const inputPmEnd   = document.getElementById('pm-end-time-edit');

  // Defensive checks
  if (!sessionForm) return console.error('[sessionModal] .session-form not found — cannot attach handlers.');
  if (!saveBtn) return console.error('[sessionModal] #session-edit-btn not found.');
  if (!sessionGrid) console.warn('[sessionModal] .session-grid not found (edit buttons will not work).');

  // Session ID should be readonly (submit-able, but not editable)
  if (inputSessionId) inputSessionId.readOnly = true;

  // ---- helpers ----
  function toDateInputValue(dateStr) {
    if (!dateStr) return '';
    if (dateStr.includes('T')) return dateStr.split('T')[0];
    const m = dateStr.match(/(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
    const d = new Date(dateStr);
    if (!isNaN(d)) {
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return '';
  }

  function toTimeInputValue(timeStr) {
    if (!timeStr) return '';
    if (timeStr.includes('T')) timeStr = timeStr.split('T')[1];
    timeStr = timeStr.split(' ')[0];
    const m = timeStr.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?/);
    if (!m) return '';
    const hh = String(m[1]).padStart(2, '0');
    const mm = m[2];
    return `${hh}:${mm}`;
  }

  function formatDateOnly(isoDate) {
    if (!isoDate) return '—';
    try {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric', month: 'short', day: '2-digit', timeZone: 'Asia/Manila'
      }).format(new Date(isoDate));
    } catch { return isoDate; }
  }

  function formatTime(timeStr) {
    if (!timeStr) return '—';
    try {
      const [h, m, s] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(h ?? 0, m ?? 0, s ?? 0);
      return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' }).format(date);
    } catch { return timeStr; }
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

  // ---- state & change-detection ----
  let initialFormState = null;
  let currentEditingCard = null;

  const watchedInputs = [
    inputSessionId, inputSessionName, inputPublishDate,
    inputWeeklyStart, inputWeeklyLate, inputWeeklyEnd,
    inputAmStart, inputAmLate, inputAmEnd,
    inputPmStart, inputPmLate, inputPmEnd
  ].filter(Boolean); // drop any missing refs

  function getFormSnapshot() {
    return {
      sessionId: inputSessionId?.value || '',
      sessionName: inputSessionName?.value || '',
      publishDate: inputPublishDate?.value || '',
      weeklyStart: inputWeeklyStart?.value || '',
      weeklyLate: inputWeeklyLate?.value || '',
      weeklyEnd: inputWeeklyEnd?.value || '',
      amStart: inputAmStart?.value || '',
      amLate: inputAmLate?.value || '',
      amEnd: inputAmEnd?.value || '',
      pmStart: inputPmStart?.value || '',
      pmLate: inputPmLate?.value || '',
      pmEnd: inputPmEnd?.value || ''
    };
  }

  function isSnapshotDifferent(a, b) {
    return JSON.stringify(a) !== JSON.stringify(b);
  }

  function setSaveButtonEnabled(enabled) {
    saveBtn.disabled = !enabled;
    saveBtn.classList.toggle('disabled', !enabled);
    if (enabled) saveBtn.removeAttribute('aria-disabled');
    else saveBtn.setAttribute('aria-disabled', 'true');
  }

  function onInputChanged() {
    const current = getFormSnapshot();
    setSaveButtonEnabled(isSnapshotDifferent(initialFormState, current));
  }

  // Attach change listeners
  watchedInputs.forEach(inp => {
    inp.addEventListener('input', onInputChanged);
    inp.addEventListener('change', onInputChanged);
  });

  // ---- modal open/close ----
  function openEditModalWithCard(card) {
    currentEditingCard = card;
    inputSessionId.value = card.dataset.sessionId || '';
    inputSessionName.value = card.dataset.sessionName || '';
    inputPublishDate.value = toDateInputValue(card.dataset.publishDate || '');

    inputWeeklyStart.value = toTimeInputValue(card.dataset.weeklyStart || '');
    inputWeeklyLate.value  = toTimeInputValue(card.dataset.weeklyLate || '');
    inputWeeklyEnd.value   = toTimeInputValue(card.dataset.weeklyEnd || '');

    inputAmStart.value = toTimeInputValue(card.dataset.amStart || '');
    inputAmLate.value  = toTimeInputValue(card.dataset.amLate || '');
    inputAmEnd.value   = toTimeInputValue(card.dataset.amEnd || '');

    inputPmStart.value = toTimeInputValue(card.dataset.pmStart || '');
    inputPmLate.value  = toTimeInputValue(card.dataset.pmLate || '');
    inputPmEnd.value   = toTimeInputValue(card.dataset.pmEnd || '');

    initialFormState = getFormSnapshot();
    setSaveButtonEnabled(false);

    popupOverlayEdit.classList.remove('hidden');
    // console.log('[sessionModal] opened modal for card', card.dataset.sessionId);
  }

  function hidePopupEdit() {
    popupOverlayEdit.classList.add('hidden');
    currentEditingCard = null;
  }

  // event delegation: edit icons
  if (sessionGrid) {
    sessionGrid.addEventListener('click', (ev) => {
      const editBtn = ev.target.closest('.edit-session-btn');
      if (!editBtn) return;
      const card = editBtn.closest('.session-card');
      if (!card) return;
      openEditModalWithCard(card);
    });
  }

  popupClose.addEventListener('click', hidePopupEdit);
  popupOverlayEdit.addEventListener('click', (ev) => {
    if (ev.target === popupOverlayEdit) hidePopupEdit();
  });

  // Important: ensure clicking the Save button doesn't trigger native reload.
  // We'll call requestSubmit to trigger the form's submit event (our handler).
  saveBtn.addEventListener('click', (ev) => {
    // Prevent default native submit (which can cause reload if no JS handler attached)
    ev.preventDefault();
    // Trigger the form submit programmatically (works with built-in validation)
    if (typeof sessionForm.requestSubmit === 'function') {
      sessionForm.requestSubmit();
    } else {
      // older browsers fallback
      sessionForm.dispatchEvent(new Event('submit', { cancelable: true }));
    }
  });

  // ---- form submit handler ----
  sessionForm.addEventListener('submit', async (ev) => {
    ev.preventDefault(); // MUST prevent native submit
    // console.log('[sessionModal] form submit handler invoked');

    // Safety: if Save is disabled, bail
    if (saveBtn.disabled) {
    //   console.log('[sessionModal] saveBtn disabled - abort submit');
      return;
    }

    // Build payload
    const payload = {
      session_id: inputSessionId.value,
      session_name: inputSessionName.value,
      publish_date: inputPublishDate.value,
      weekly_start: inputWeeklyStart.value,
      weekly_late: inputWeeklyLate.value,
      weekly_end: inputWeeklyEnd.value,
      am_start: inputAmStart.value,
      am_late: inputAmLate.value,
      am_end: inputAmEnd.value,
      pm_start: inputPmStart.value,
      pm_late: inputPmLate.value,
      pm_end: inputPmEnd.value
    };

  try {
      setSaveButtonEnabled(false);
      const prevText = saveBtn.textContent;
      saveBtn.textContent = 'Saving...';
    //   console.log('[sessionModal] sending updateSession', payload);

      const serverResponse = await updateSession(payload.session_id, payload);
      const updated = serverResponse || payload;
    //   console.log('[sessionModal] updateSession response', updated);

      // Update the card in-place so UI shows immediate change
      const card = currentEditingCard;
      if (card) {
        card.dataset.sessionName = updated.session_name ?? updated.sessionName ?? payload.session_name;
        card.dataset.publishDate = updated.publish_date ?? payload.publish_date;

        card.dataset.weeklyStart = updated.weekly_start ?? payload.weekly_start;
        card.dataset.weeklyLate  = updated.weekly_late  ?? payload.weekly_late;
        card.dataset.weeklyEnd   = updated.weekly_end   ?? payload.weekly_end;

        card.dataset.amStart = updated.am_start ?? payload.am_start;
        card.dataset.amLate  = updated.am_late  ?? payload.am_late;
        card.dataset.amEnd   = updated.am_end   ?? payload.am_end;

        card.dataset.pmStart = updated.pm_start ?? payload.pm_start;
        card.dataset.pmLate  = updated.pm_late  ?? payload.pm_late;
        card.dataset.pmEnd   = updated.pm_end   ?? payload.pm_end;

        // visible updates
        const headerH3 = card.querySelector('.session-card-header h3');
        if (headerH3) headerH3.textContent = card.dataset.sessionName || 'Untitled Session';

        const idSpan = card.querySelector('.session-id');
        if (idSpan) idSpan.textContent = `ID: ${card.dataset.sessionId ?? payload.session_id ?? '—'}`;

        const infoDivs = card.querySelectorAll('.session-info');
        if (infoDivs[0]) {
          const pubSpan = infoDivs[0].querySelector('.publish-date');
          if (pubSpan) pubSpan.textContent = `DATE: ${formatDateOnly(card.dataset.publishDate) ?? '—'}`;
        }
        if (infoDivs[1]) {
          const span = infoDivs[1].querySelector('span');
          if (span) span.textContent = `Weekly Exam: ${formatTime(card.dataset.weeklyStart)} → ${formatTime(card.dataset.weeklyEnd)}`;
        }
        if (infoDivs[2]) {
          const span = infoDivs[2].querySelector('span');
          if (span) span.textContent = `AM Session: ${formatTime(card.dataset.amStart)} → ${formatTime(card.dataset.amEnd)}`;
        }
        if (infoDivs[3]) {
          const span = infoDivs[3].querySelector('span');
          if (span) span.textContent = `PM Session: ${formatTime(card.dataset.pmStart)} → ${formatTime(card.dataset.pmEnd)}`;
        }

        // update computed status
        const openIso = `${card.dataset.publishDate}T${card.dataset.weeklyStart}`;
        const closeIso = `${card.dataset.publishDate}T${card.dataset.pmEnd}`;
        const { isActive, display } = computeStatus(openIso, closeIso);
        card.dataset.openIso = openIso;
        card.dataset.closeIso = closeIso;
        card.dataset.status = display;
        const statusSpan = card.querySelector('.session-status');
        if (statusSpan) {
          statusSpan.textContent = display;
          statusSpan.classList.toggle('status-active', isActive);
          statusSpan.classList.toggle('status-closed', !isActive);
        }
      }

      hidePopupEdit();
      saveBtn.textContent = prevText;
    } catch (err) {
      console.error('[sessionModal] Failed saving session:', err);
      // show simple feedback — replace with toast if you have one
      alert(`Failed to save session: ${err.message || err}`);
      saveBtn.textContent = 'Save Changes';
      setSaveButtonEnabled(true);
    }
  });

  // Final log so we know initialization completed
//   console.log('[sessionModal] initialized — listeners attached');
});