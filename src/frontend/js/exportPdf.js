// src/frontend/js/exportPdf.js
// Requires: jspdf and jspdf-autotable loaded globally via CDN scripts.
// Uses global window.jspdf.jsPDF and doc.autoTable

import { fetchAttendanceData } from "./api.js";

const downloadModal = document.getElementById('popup-overlay-download');
const closeDownloadBtn = document.getElementById('popup-close-download');
const grid = document.querySelector('.session-grid');

// Store the active session ID here
let activeDownloadSessionId = null;

// Open modal when clicking download button in a card
grid.addEventListener('click', (e) => {
  if (e.target.closest('#download-session-btn')) {
    const card = e.target.closest('.session-card');
    if (card) {
      activeDownloadSessionId = card.dataset.sessionId;
      downloadModal.dataset.sessionId = activeDownloadSessionId;
      downloadModal.classList.remove('hidden');
      console.log("Download modal opened for session:", activeDownloadSessionId);
    }
  }
});

// Close modal
closeDownloadBtn.addEventListener('click', () => {
  downloadModal.classList.add('hidden');
  activeDownloadSessionId = null;
});

// helper: format date/time in Asia/Manila
function fmtLocal(dt) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric', month: 'short', day: '2-digit',
    hour: 'numeric', minute: '2-digit', hour12: true,
    timeZone: 'Asia/Manila'
  }).format(dt);
}

function formatFileDate(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

// Convert Blob → base64
async function blobToDataURL(blob) {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Main export
async function generatePdfForSession(sessionId, type = 'weekly') {
  const { session, logs } = await fetchAttendanceData(sessionId);

  const typeLabel = type === 'weekly' ? 'Weekly Exam'
                  : type === 'am' ? 'AM Session'
                  : 'PM Session';

  // Build table data
  const body = (logs || []).map(r => {
    let statusVal = '';
    if (type === 'weekly') statusVal = r.exam_status ?? '';
    else if (type === 'am') statusVal = r.am_status ?? '';
    else if (type === 'pm') statusVal = r.pm_status ?? '';

    const signaturePath = r.signature;
    const signatureUrl = signaturePath
      ? `https://zulkfodbfdgocghnqxuq.supabase.co/storage/v1/object/public/${signaturePath}`
      : null;

    return {
      student_id: r.student_id,
      student_name: r.student_name,
      section: r.section,
      status: statusVal,
      signature_url: signatureUrl
    };
  });

  async function tryLoadSignature(url) {
    if (!url) return null; // skip if no signature path at all
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null; // avoid 404 spam
      const blob = await resp.blob();
      return await blobToDataURL(blob);
    } catch {
      return null;
    }
  }



  // Preload images (leave null if not found)
  const images = await Promise.all(body.map(r => tryLoadSignature(r.signature_url)));

  // Create doc
  const doc = new window.jspdf.jsPDF('p', 'pt', 'a4');
  const marginLeft = 40;
  let y = 40;

  // Header
  doc.setFont("times","normal");
  doc.setFontSize(16);
  doc.text(`${session.session_name} - ${typeLabel}`, marginLeft, y);
  doc.setFontSize(11);
  y += 18;
  doc.text(`Session ID: ${session.session_id}`, marginLeft, y);

  // Duration
  y += 16;
  const open = fmtLocal(new Date(`${session.publish_date}T${type === 'weekly' ? session.weekly_start : type === 'am' ? session.am_start : session.pm_start}`));
  const close = fmtLocal(new Date(`${session.publish_date}T${type === 'weekly' ? session.weekly_end : type === 'am' ? session.am_end : session.pm_end}`));
  doc.text(`Duration: ${open} - ${close}`, marginLeft, y);
  y += 10;

  // Separator
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, doc.internal.pageSize.getWidth() - marginLeft, y);
  y += 10;

  // Columns
  const columns = [
    { header: 'Student ID', dataKey: 'student_id' },
    { header: 'Student Name', dataKey: 'student_name' },
    { header: 'Section', dataKey: 'section' },
    { header: 'Status', dataKey: 'status' },
    { header: 'Signature', dataKey: 'signature' }
  ];

  // Render table
  doc.autoTable({
    startY: y,
    columns,
    body,
    styles: { fontSize: 10, cellPadding: 6, valign: 'middle' },
    headStyles: { fillColor: [40, 49, 59], textColor: [255,255,255] },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didDrawCell: function (data) {
      // Draw signature images only if Present
      if (data.section === 'body' && data.column.dataKey === 'signature') {
        const rowStatus = (body[data.row.index].status || '').toLowerCase();
        const imgData = images[data.row.index];

        if ((rowStatus === 'present' || rowStatus === 'late') && imgData) {
          const maxW = Math.min(data.cell.width - 4, 70);
          const imgH = 20;
          const imgX = data.cell.x + 2;
          const imgY = data.cell.y + (data.cell.height - imgH) / 2;
          try {
            doc.addImage(imgData, 'PNG', imgX, imgY, maxW, imgH);
          } catch {}
        }
      }
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.dataKey === 'status') {
        const txt = (data.cell.raw || '').toString().toLowerCase();
        if (txt === 'present') {
          data.cell.styles.textColor = [56, 204, 121];
          data.cell.styles.fontStyle = 'bold';
        }
        if (txt === 'absent') {
          data.cell.styles.textColor = [240, 115, 97];
          data.cell.styles.fontStyle = 'bold';
        }
        if (txt === 'late') {
          data.cell.styles.textColor = [255, 165, 63];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: marginLeft, right: marginLeft }
  });

  // Save
  const filename = `${session.session_id}_${typeLabel.replace(/\s+/g, '')}_${formatFileDate(new Date())}.pdf`;
  doc.save(filename);
}

async function generateExcelForSession(sessionId) {
  const { session, logs } = await fetchAttendanceData(sessionId);

  // Create workbook and worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(`${session.session_name}`);

  // Define header row
  worksheet.columns = [
    { header: 'Student ID', key: 'student_id', width: 15 },
    { header: 'Student Name', key: 'student_name', width: 25 },
    { header: 'Exam Status', key: 'exam_status', width: 15 },
    { header: 'AM Status', key: 'am_status', width: 15 },
    { header: 'PM Status', key: 'pm_status', width: 15 },
  ];

  // Add rows
  logs.forEach(r => {
    worksheet.addRow({
      student_id: r.student_id,
      student_name: r.student_name,
      exam_status: r.exam_status ?? '',
      am_status: r.am_status ?? '',
      pm_status: r.pm_status ?? '',
    });
  });

  // Style header row
  worksheet.getRow(1).eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF28313B' } // dark gray like your PDF header
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // Apply conditional formatting (simple manual approach)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    ['C','D','E'].forEach(col => { // exam_status, am_status, pm_status
      const cell = row.getCell(col);
      const val = (cell.value || '').toString().toLowerCase();
      if (val === 'absent') {
        cell.font = { color: { argb: 'FFF07361' }, bold: true }; // red
      } else if (val === 'present') {
        cell.font = { color: { argb: 'FF38CC79' }, bold: true }; // green
      }
    });
  });

  // Export file
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `${session.session_id}_Attendance.xlsx`;
  saveAs(new Blob([buffer]), filename);
}


// Attach modal button handlers
document.getElementById('weekly-export').addEventListener('click', () => {
  if (activeDownloadSessionId) generatePdfForSession(activeDownloadSessionId, 'weekly');
});
document.getElementById('am-export').addEventListener('click', () => {
  if (activeDownloadSessionId) generatePdfForSession(activeDownloadSessionId, 'am');
});
document.getElementById('pm-export').addEventListener('click', () => {
  if (activeDownloadSessionId) generatePdfForSession(activeDownloadSessionId, 'pm');
});
document.getElementById('excel-export').addEventListener('click', () => {
  if (activeDownloadSessionId) generateExcelForSession(activeDownloadSessionId);
});