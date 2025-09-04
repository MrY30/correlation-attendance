// src/frontend/js/exportPdf.js
// Requires: jspdf and jspdf-autotable loaded globally via CDN scripts.
// Uses global window.jspdf.jsPDF and doc.autoTable

import { fetchAttendanceData } from "./api.js";

// helper: format date/time in Asia/Manila
function fmtLocal(dt) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Manila'
  }).format(dt);
}



function getSessionIdFromDOM() {
  // try dataset first (recommended)
  const el = document.getElementById('session-detail-id');
  if (el) {
    // If you set data-session-id on this element:
    if (el.dataset && el.dataset.sessionId) return el.dataset.sessionId;

    // otherwise try parsing text "ID: SAMP-2"
    const txt = el.textContent || '';
    const match = txt.match(/ID:\s*(\S+)/i);
    if (match) return match[1];
  }
  // Fallback: try global (if you set window.currentSessionId elsewhere)
  return window.currentSessionId || null;
}

function formatFileDate(d) {
  // yyyyMMdd_HHmm
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

async function generatePdfForSession(sessionId, options = {}) {
  const { session, logs } = await fetchAttendanceData(sessionId);

  // Create doc (A4 portrait)
  const doc = new window.jspdf.jsPDF('p', 'pt', 'a4');
  const marginLeft = 40;
  let y = 40;

  // Header
  doc.setFontSize(16);
  doc.text(session.session_name || 'Session', marginLeft, y);
  doc.setFontSize(11);
  y += 18;
  doc.text(`Session ID: ${session.session_id}`, marginLeft, y);
  y += 16;
    //   const exportedAt = fmtLocal(new Date());
    //doc.text(`Exported: ${exportedAt}`, marginLeft, y);
    // format open_date and close_date from session
    const open = fmtLocal(new Date(session.open_date));
    const close = fmtLocal(new Date(session.close_date));
    doc.text(`Duration: ${open}-${close}`, marginLeft, y);
    y += 10;

  // small separator line
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, doc.internal.pageSize.getWidth() - marginLeft, y);
  y += 10;

  // Prepare table columns and body (objects)
  const columns = [
    { header: 'Student ID', dataKey: 'student_id' },
    { header: 'Student Name', dataKey: 'student_name' },
    { header: 'Section', dataKey: 'section' },
    { header: 'Status', dataKey: 'status' }
  ];

  const body = (logs || []).map(r => ({
    student_id: r.student_id ?? r.student_id,    // adjust field names if different
    student_name: r.student_name ?? r.student_name,
    section: r.section ?? '',
    status: r.status ?? ''
  }));

  // Add table with AutoTable. Use columns + body form (so didParseCell can style status).
  doc.autoTable({
    startY: y,
    head: [columns.map(c => c.header)],
    body: body.map(r => [r.student_id, r.student_name, r.section, r.status]),
    // styles: { fontSize: 10, cellPadding: 6 },
    // headStyles: { fillColor: [230,230,230], halign: 'left' },
    styles: { fontSize: 10, cellPadding: 6 },
    headStyles: { fillColor: [40, 49, 59], textColor: [255,255,255], halign: 'left' },
    alternateRowStyles: { fillColor: [245, 245, 245], textColor: [45, 56, 69], halign: 'left' }, // light gray striping
    didParseCell: function (data) {
      // data.column.index -> 0..3; status is index 3 when using head/body approach
      if (data.column.index === 3) {
        const cellText = (data.cell.raw || data.cell.text || '').toString().trim().toLowerCase();
        if (cellText === 'present') {
          data.cell.styles.textColor = [56, 204, 121]; // green
        } else if (cellText === 'absent') {
          data.cell.styles.textColor = [240, 115, 97]; // red
        }
      }
    },
    margin: { left: marginLeft, right: marginLeft }
  });

  // Filename
  //const filename = `${session.session_id || 'attendance'}_${formatFileDate(new Date())}.pdf`;
  const filename = `${session.session_id}.pdf`;
  doc.save(filename);
}

async function onClickExport(e) {
  try {
    const btn = e.currentTarget;
    btn.setAttribute('disabled', 'disabled');
    const originalText = btn.textContent;
    btn.textContent = 'Exporting…';

    const sessionId = getSessionIdFromDOM();
    if (!sessionId) throw new Error('Could not determine session ID on the page.');

    await generatePdfForSession(sessionId);

    btn.textContent = originalText;
    btn.removeAttribute('disabled');
  } catch (err) {
    console.error('Export failed:', err);
    alert('Export failed: ' + (err.message || 'unknown'));
    const btn = document.querySelector('.pdf-export');
    if (btn) {
      btn.removeAttribute('disabled');
      btn.textContent = '📝 Export to PDF';
    }
  }
}

// attach handler (call after DOM loaded)
document.addEventListener('DOMContentLoaded', () => {
  const exportBtn = document.querySelector('.pdf-export');
  if (exportBtn) exportBtn.addEventListener('click', onClickExport);
});