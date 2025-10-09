import { scanAttendance } from '../api.js';
import { openSignatureModal } from './signatureHandler.js';

// one global timer so every new scan resets it
let inactivityTimer = null;

function startResetTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(resetToPlaceholder, 5000); // 5s after the LAST scan
}

function resetToPlaceholder() {
  // hide student info panel
  const info = document.getElementById('student-info');
  if (info) info.classList.remove('show');

  // hide not-found
  const nf = document.getElementById('not-found');
  if (nf) nf.style.display = 'none';

  // show placeholder
  const placeholder = document.getElementById('student-placeholder');
  if (placeholder) placeholder.style.display = 'flex';

  // clear attendance message
  const msg = document.getElementById('attendance-message');
  if (msg) {
    msg.className = 'attendance-status';
    msg.innerHTML = '';
  }
}

// === RFID Scanner Logic Without Input Field ===
let scanBuffer = '';
let scanTimeout;

document.addEventListener('keydown', (event) => {

    // Prevent scanner from reading while typing into an input or textarea
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.isContentEditable)) {
      return; // ignore scanner keystrokes while typing manually
    }

    // Case 1: Scanner sends Enter key to mark the end
    if (event.key === 'Enter') {
        if (scanBuffer) {
            // console.log("Scanned RFID (Enter):", scanBuffer);
            processStudentId(scanBuffer);
            scanBuffer = ''; // reset buffer
        }
        return;
    }

    // Case 2: Scanner types characters quickly without Enter
    if (event.key.length === 1) { 
        scanBuffer += event.key;
    }

    // Reset the timeout every keystroke
    clearTimeout(scanTimeout);
    scanTimeout = setTimeout(() => {
        if (scanBuffer) {
            // console.log("Scanned RFID (Timeout):", scanBuffer);
            processStudentId(scanBuffer);
            scanBuffer = ''; // reset buffer
        }
    }, 200); // 200ms idle gap = scan complete
});

async function processStudentId(rfidCode) {
  const rfidSection = document.querySelector('.rfid-section');
  rfidSection.classList.add('active');
  setTimeout(() => rfidSection.classList.remove('active'), 1000);

  try {
    // Example: assume you know current sessionId from global or dataset
    const sessionCard = document.getElementById("session-id")
    const sessionId = sessionCard.dataset.session;
    const statusColumn = sessionCard.dataset.titleStatus;
    // console.log(sessionId)

    const result = await scanAttendance(rfidCode, sessionId, statusColumn);

    if (result.status === 'not-found') {
        // alert("Student Not Found")
        notFound();
        return;
    }

    if (result.status === 'already-attended') {
      displayStudentInfo(result.student);
      showAttendanceMessage('already-attended');
      return;
    }
    
    if (result.status === 'sign-first') {
      displayStudentInfo(result.student);
      showAttendanceMessage('sign-first');

      const sessionCard = document.getElementById("session-id");
      const sessionId = sessionCard.dataset.session;
      const statusColumn = sessionCard.dataset.titleStatus;

      openSignatureModal(result.student, sessionId, statusColumn);
      return;
    }

    if (result.status === 'present') {
      displayStudentInfo(result.student);
      showAttendanceMessage('present');
      return;
    }
  } catch (err) {
    console.error('Scan error:', err);
    document.getElementById('attendance-message').className = 'attendance-status status-error';
    document.getElementById('attendance-message').innerHTML = '<i class="bx bx-error"></i> Error processing attendance';
  } finally{
    startResetTimer();
  }
}

function displayStudentInfo(student) {
  // Hide placeholder
  document.getElementById('student-placeholder').style.display = 'none';
  document.getElementById('not-found').style.display = 'none';

  const info = document.getElementById('student-info');

  // Reset animation
  info.classList.remove('show');
  void info.offsetWidth; // 🔥 reflow forces browser to reset CSS
  info.classList.add('show');

  // Update student information
  document.getElementById('student-name').textContent = student.name;
  document.getElementById('student-id').textContent = student.school_id || student.id;
  document.getElementById('student-section').textContent = student.section;
}

function showAttendanceMessage(status) {
  const messageElement = document.getElementById('attendance-message');

  // Reset animation
  messageElement.style.animation = 'none';
  messageElement.offsetHeight; // 🔥 trigger reflow
  messageElement.style.animation = null;

  if (status === 'present') {
    messageElement.className = 'attendance-status status-present';
    messageElement.innerHTML = '<i class="bx bx-check-circle"></i> Attendance Recorded Successfully!';
  } else if (status === 'already-attended') {
    messageElement.className = 'attendance-status status-already-attended';
    messageElement.innerHTML = '<i class="bx bx-info-circle"></i> Already Attended';
  } else if (status === 'not-found') {
    messageElement.className = 'attendance-status status-not-found';
    messageElement.innerHTML = '<i class="bx bx-x-circle"></i> ID not found';
  } else if (status === 'error') {
    messageElement.className = 'attendance-status status-error';
    messageElement.innerHTML = '<i class="bx bx-error"></i> Error processing attendance';
  } else if (status === 'sign-first') {
    messageElement.className = 'attendance-status status-please-sign';
    messageElement.innerHTML = '<i class="bx bx-error"></i> Please sign to Continue';
  }
}

function notFound() {
  // Hide placeholder and student info
  document.getElementById('student-placeholder').style.display = 'none';
  document.getElementById('student-info').classList.remove('show');

  // Show not-found
  const nf = document.getElementById('not-found');
  nf.style.display = 'flex';

  // Reset animation for re-trigger
  nf.style.animation = 'none';
  nf.offsetHeight; // 🔥 force reflow
  nf.style.animation = null;
}

// --- Manual School ID handlers for the "Not Registered? Click Here!" modal ---

document.addEventListener('DOMContentLoaded', () => {
  const openBtn = document.getElementById('click-button'); // your "Not Registered? Click Here!"
  const overlay = document.getElementById('popup-overlay-attendance');
  const closeBtn = document.getElementById('popup-close-attendance');
  const input = document.getElementById('attendance-input');
  const submitBtn = document.getElementById('attendance-btn');
  const errorBox = document.getElementById('attendance-error');

  if (!openBtn || !overlay || !closeBtn || !input || !submitBtn) {
    console.warn('Manual attendance elements missing; check IDs in HTML.');
    return;
  }

  // helper to show/hide overlay
  function openManualOverlay() {
    overlay.classList.remove('hidden');
    input.value = '';
    errorBox && (errorBox.style.display = 'none');
    setTimeout(() => input.focus(), 50);
  }
  function closeManualOverlay() {
    overlay.classList.add('hidden');
    input.blur();
  }

  // Open modal
  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openManualOverlay();
  });

  // Close modal (close icon)
  closeBtn.addEventListener('click', (e) => {
    e.preventDefault();
    closeManualOverlay();
  });

  // Close when clicking outside modal content
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeManualOverlay();
  });

  // Submit on Enter inside the input
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submitBtn.click();
    }
  });

  // Main submit handler
  submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const raw = input.value.trim();
    if (!raw) {
      if (errorBox) {
        errorBox.textContent = 'Please enter an ID';
        errorBox.style.display = 'block';
      }
      // brief shake animation hint (optional)
      input.classList.remove('shake');
      void input.offsetWidth;
      input.classList.add('shake');
      return;
    }

    // sanitize: uppercase and trim — change if your IDs are case-sensitive
    const schoolId = raw.toUpperCase();

    // disable UI while processing
    submitBtn.disabled = true;
    input.disabled = true;

    // hide modal (so main UI shows student info similar to RFID)
    closeManualOverlay();

    try {
      // re-use existing processStudentId which calls scanAttendance(...) internally
      await processStudentId(schoolId);
    } catch (err) {
      console.error('Manual attendance error:', err);
      const msg = document.getElementById('attendance-message');
      if (msg) {
        msg.className = 'attendance-status status-error';
        msg.innerHTML = '<i class="bx bx-error"></i> Error processing attendance';
      }
    } finally {
      submitBtn.disabled = false;
      input.disabled = false;
      input.value = '';
    }
  });

  // Optional: ESC to close the modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !overlay.classList.contains('hidden')) {
      closeManualOverlay();
    }
  });
});