// src/frontend/js/studentsTable.js
import { fetchStudents } from '../api.js';

const tbody = document.querySelector('#students-table-body');
const loadingEl = document.querySelector('#students-loading');
const searchInput = document.querySelector('.search-input');

let allStudents = []; // cache so we can search without backend

function renderRow(student) {
  const name = student.name ?? '';
  const schoolId = student.school_id ?? '';
  const section = student.section ?? '';

  let status = 'UNREGISTERED';
  let statusClassName = 'status-not-registered';
  if (student.rfid_code) {
    status = 'REGISTERED';
    statusClassName = 'status-registered';
  }

  const row = document.createElement('div');
  row.className = 'table-row';

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