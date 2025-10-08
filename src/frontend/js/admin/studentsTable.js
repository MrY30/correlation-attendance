// src/frontend/js/studentsTable.js
import { fetchStudents, registerStudentRFID } from '../api.js';

const tbody = document.querySelector('#students-table-body');
const loadingEl = document.querySelector('#students-loading');
const searchInput = document.querySelector('.search-input');

let allStudents = []; // cache so we can search without backend

function openModalWithStudent(student) {
  const overlay = document.getElementById('popup-overlay-std-info');
  const nameEl = document.querySelector('#student-info-name .student-info-info');
  const idEl = document.querySelector('#student-info-school-id .student-info-info');
  const sectionEl = document.querySelector('#student-info-section .student-info-info');
  const rfidInput = document.querySelector('#student-info-rfid input.form-input');
  const confirmBtn = document.getElementById('rfid-submit-btn');

  // fill modal fields
  nameEl.textContent = student.name ?? '';
  idEl.textContent = student.school_id ?? '';
  sectionEl.textContent = student.section ?? '';
  rfidInput.value = ''; // clear previous

  // store the student identifier on the confirm button so handler knows who
  confirmBtn.dataset.studentId = student.id ?? student.school_id;

  // show modal
  overlay.classList.remove('hidden');

  // focus the input for convenience
  rfidInput.focus();
}

function renderRow(student) {
  const name = student.name ?? '';
  const schoolId = student.school_id ?? '';
  const section = student.section ?? '';

  let status = 'UNREGISTERED';
  let statusClassName = 'status-not-registered';
  if (student.rfid_code != schoolId) {
    status = 'REGISTERED';
    statusClassName = 'status-registered';
  }

  const row = document.createElement('div');
  row.className = 'table-row';

  // store id + status for any later use
  const studentId = student.id ?? student.school_id;
  row.dataset.studentId = studentId;
  row.dataset.status = student.rfid_code != schoolId ? 'registered' : 'unregistered';

  // make row keyboard accessible only when unregistered
  if (student.rfid_code === schoolId) {
    row.tabIndex = 0;
    row.style.cursor = 'pointer';
  } else {
    row.title = 'Already registered';
  }

  const nameCell = document.createElement('div');
  nameCell.className = 'table-cell';
  nameCell.textContent = name;

  const idCell = document.createElement('div');
  idCell.className = 'table-cell';
  idCell.textContent = schoolId;

  const sectionCell = document.createElement('div');
  sectionCell.className = 'table-cell';
  sectionCell.textContent = section;

  const statusCell = document.createElement('div');
  statusCell.className = 'table-cell';
  const badge = document.createElement('span');
  badge.className = `status-badge ${statusClassName}`;
  badge.textContent = status;
  statusCell.appendChild(badge);

  row.appendChild(nameCell);
  row.appendChild(idCell);
  row.appendChild(sectionCell);
  row.appendChild(statusCell);

  // Attach click + keyboard open handlers only for UNREGISTERED rows
  if (student.rfid_code === schoolId) {
    const openFn = (e) => {
      // ignore clicks that originate from inside inner interactive elements (if any)
      // but since our row has none besides registering button inside modal, it's safe
      openModalWithStudent(student);
    };
    row.addEventListener('click', openFn);

    row.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModalWithStudent(student);
      }
    });
  }

  return row;
}

function renderTable(students) {
  tbody.innerHTML = '';

  if (!students.length) {
    const emptyRow = document.createElement('div');
    emptyRow.className = 'table-row';
    const cell = document.createElement('div');
    cell.className = 'table-cell';
    cell.style.gridColumn = '1 / -1';
    cell.textContent = 'No students found.';
    emptyRow.appendChild(cell);
    tbody.appendChild(emptyRow);
    return;
  }

  const fragment = document.createDocumentFragment();
  students.forEach(s => fragment.appendChild(renderRow(s)));
  tbody.appendChild(fragment);
}

async function initTable() {
  try {
    if (loadingEl) loadingEl.style.display = 'block';
    tbody.innerHTML = '';

    allStudents = await fetchStudents(); // keep full list
    renderTable(allStudents);
  } catch (err) {
    console.error(err);
    const errorRow = document.createElement('div');
    errorRow.className = 'table-row';
    const cell = document.createElement('div');
    cell.className = 'table-cell';
    cell.style.gridColumn = '1 / -1';
    cell.textContent = 'Failed to load students.';
    errorRow.appendChild(cell);
    tbody.appendChild(errorRow);
  } finally {
    if (loadingEl) loadingEl.style.display = 'none';
  }
}

// 🔍 live search on every keystroke
searchInput.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase().trim();

  const filtered = allStudents.filter(student => {
    const name = (student.name ?? '').toLowerCase();
    const schoolId = String(student.school_id ?? '').toLowerCase();
    return name.includes(query) || schoolId.includes(query);
  });

  renderTable(filtered);
});

document.addEventListener('DOMContentLoaded', initTable);

/* ---------- Modal: close + click-outside (you already had these) ---------- */
const closeStdInfoBtn = document.getElementById('popup-close-std-info');
const popupOverlayStdInfo = document.getElementById('popup-overlay-std-info');

// Close modal (X)
if (closeStdInfoBtn) {
  closeStdInfoBtn.addEventListener('click', () => {
    popupOverlayStdInfo.classList.add('hidden');
  });
}

// Hide popup when clicking outside the modal content
if (popupOverlayStdInfo) {
  popupOverlayStdInfo.addEventListener('click', (e) => {
    if (e.target === popupOverlayStdInfo) {
      popupOverlayStdInfo.classList.add('hidden');
    }
  });
}

/* ---------- Confirm RFID button handler ---------- */
const rfidSubmitBtn = document.getElementById('rfid-submit-btn');
if (rfidSubmitBtn) {
  rfidSubmitBtn.addEventListener('click', async (e) => {
    const studentId = rfidSubmitBtn.dataset.studentId;
    const rfidInput = document.querySelector('#student-info-rfid input.form-input');
    if (!rfidInput) return;
    const rfidValue = rfidInput.value.trim();
    if (!rfidValue) {
      // basic validation
      alert('Please enter an RFID value.');
      rfidInput.focus();
      return;
    }

    try {
      // ------------- replace this block with your real API call -------------
      // Example:
      // await fetch(`/api/students/${studentId}/register-rfid`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ rfid: rfidValue }),
      // });
      // ---------------------------------------------------------------------
      await registerStudentRFID(studentId, rfidValue);

      // update local cache so UI matches immediately
      const idx = allStudents.findIndex(s => (s.id ?? s.school_id) == studentId);
      if (idx !== -1) {
        allStudents[idx].rfid_code = rfidValue;
      }

      // re-render (you can be smarter and update only that row instead)
      renderTable(allStudents);

      // close modal
      popupOverlayStdInfo.classList.add('hidden');
    } catch (err) {
      if (err.message.includes('409')) {
        alert('That RFID is already registered to another student.');
      } else {
        alert('Failed to register RFID. Please try again.');
      }
    }
  });
}