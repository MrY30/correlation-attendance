import { fetchAttendanceData } from "../api.js";


// Helper: convert status text to numeric value
function mapStatus(status) {
  const val = (status ?? '').toString().trim().toLowerCase();
  if (val === 'absent') return 0;
  if (val === 'late') return 0.5;
  if (val === 'present') return 1;
  return 0; // Default 0 for missing/unknown status
}

async function generateMonthlySummaryExcel() {
  // 1️⃣ Collect all possible weeks (even if not selected)
  const selects = Array.from(document.querySelectorAll('.session-select'));
  const weekSelections = selects.map(s => ({
    week: s.dataset.week,
    sessionId: s.value || null
  }));

  // Determine all weeks (1..4, etc.)
  const weeksUsed = weekSelections.map(ws => ws.week).sort((a, b) => a - b);

  // 2️⃣ Fetch all available sessions (only for non-empty)
  const fetchPromises = weekSelections.map(async ws => {
    if (ws.sessionId) {
      const result = await fetchAttendanceData(ws.sessionId);
      return { ...result, week: ws.week };
    } else {
      return { session: null, logs: [], week: ws.week }; // empty placeholder
    }
  });

  const results = await Promise.all(fetchPromises);

  // 3️⃣ Collect all students from any week (so empty weeks still appear)
  const students = new Map();

  // First, collect all unique students from sessions with data
  for (const res of results) {
    for (const r of res.logs || []) {
      if (!students.has(r.student_id)) {
        students.set(r.student_id, {
          student_id: r.student_id,
          student_name: r.student_name ?? '',
          weeks: {}
        });
      }
    }
  }

  // If there were no students at all, add a placeholder
  if (students.size === 0) {
    students.set('N/A', {
      student_id: 'N/A',
      student_name: 'No students found',
      weeks: {}
    });
  }

  // 4️⃣ Fill attendance per week (default 0s for missing sessions)
  for (const [, student] of students) {
    for (const res of results) {
      const week = res.week;
      const log = (res.logs || []).find(l => l.student_id === student.student_id);
      if (log) {
        student.weeks[week] = {
          exam: mapStatus(log.exam_status),
          am: mapStatus(log.am_status),
          pm: mapStatus(log.pm_status)
        };
      } else {
        // No session or no data → default 0s
        student.weeks[week] = { exam: 0, am: 0, pm: 0 };
      }
    }
  }

  // 5️⃣ Create workbook & worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Summary');

  // 6️⃣ Define columns without headers (to build custom multi-row header)
  const columns = [
    { key: 'student_id', width: 15 },
    { key: 'student_name', width: 25 }
  ];

  for (const w of weeksUsed) {
    columns.push({ key: `w${w}_exam`, width: 12 });
    columns.push({ key: `w${w}_am`, width: 12 });
    columns.push({ key: `w${w}_pm`, width: 12 });
  }

  columns.push({ key: 'total', width: 12 });
  columns.push({ key: 'average', width: 12 });
  worksheet.columns = columns;

  // 7️⃣ Build custom headers
  const weekHeaderRow = worksheet.addRow([]);
  const subHeaderRow = worksheet.addRow([]);

  weekHeaderRow.getCell(1).value = 'Student ID';
  weekHeaderRow.getCell(2).value = 'Student Name';
  subHeaderRow.getCell(1).value = '';
  subHeaderRow.getCell(2).value = '';

  let currentCol = 3;
  for (const w of weeksUsed) {
    worksheet.mergeCells(1, currentCol, 1, currentCol + 2);
    const mergedCell = worksheet.getRow(1).getCell(currentCol);
    mergedCell.value = `Week ${w}`;
    mergedCell.alignment = { vertical: 'middle', horizontal: 'center' };

    subHeaderRow.getCell(currentCol).value = 'Exam';
    subHeaderRow.getCell(currentCol + 1).value = 'AM';
    subHeaderRow.getCell(currentCol + 2).value = 'PM';

    currentCol += 3;
  }

  worksheet.mergeCells(1, currentCol, 2, currentCol);
  worksheet.mergeCells(1, currentCol + 1, 2, currentCol + 1);
  worksheet.getRow(1).getCell(currentCol).value = 'Total';
  worksheet.getRow(1).getCell(currentCol + 1).value = 'Average';

  // 8️⃣ Header styling
  [weekHeaderRow, subHeaderRow].forEach(row => {
    row.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF28313B' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
  });

  // 9️⃣ Add student rows
  for (const [, s] of students) {
    const rowObj = {
      student_id: s.student_id,
      student_name: s.student_name
    };

    for (const w of weeksUsed) {
      const weekData = s.weeks[w] || { exam: 0, am: 0, pm: 0 };
      rowObj[`w${w}_exam`] = weekData.exam;
      rowObj[`w${w}_am`] = weekData.am;
      rowObj[`w${w}_pm`] = weekData.pm;
    }

    const row = worksheet.addRow(rowObj);

    // Add Excel formulas
    const firstWeekCol = 3;
    const lastWeekCol = firstWeekCol + weeksUsed.length * 3 - 1;
    const totalCol = lastWeekCol + 1;
    const avgCol = totalCol + 1;
    const rowNum = row.number;
    const startCell = worksheet.getRow(rowNum).getCell(firstWeekCol)._address;
    const endCell = worksheet.getRow(rowNum).getCell(lastWeekCol)._address;

    row.getCell(totalCol).value = { formula: `SUM(${startCell}:${endCell})` };
    row.getCell(avgCol).value = { formula: `AVERAGE(${startCell}:${endCell})` };
  }

  // 🔟 Apply conditional coloring
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return;
    const firstWeekCol = 3;
    const lastWeekCol = firstWeekCol + weeksUsed.length * 3 - 1;

    for (let i = firstWeekCol; i <= lastWeekCol; i++) {
      const cell = row.getCell(i);
      if (typeof cell.value === 'number') {
        cell.numFmt = '0.00';
        if (cell.value === 0) {
          cell.font = { color: { argb: 'FFF07361' }, bold: true };
        } else if (cell.value === 0.5) {
          cell.font = { color: { argb: 'FFF7B32B' }, bold: true };
        } else if (cell.value === 1) {
          cell.font = { color: { argb: 'FF38CC79' }, bold: true };
        }
      }
    }
  });

  // 11️⃣ Layout tweaks
  worksheet.getRow(1).height = 24;
  worksheet.getRow(2).height = 18;
  worksheet.columns.forEach(col => {
    col.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // 12️⃣ Export file
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'Summary_Attendance.xlsx');
}


document.getElementById('summary-export').addEventListener('click', () => {
  generateMonthlySummaryExcel();
});