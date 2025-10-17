import { fetchAttendanceData } from "../api.js";



// Helper: convert status text to numeric value
function mapStatus(status) {
  const val = (status ?? '').toString().trim().toLowerCase();
  if (val === 'absent') return 0;
  if (val === 'late') return 0.5;
  if (val === 'present') return 1;
  return null;
}

async function generateMonthlySummaryExcel() {
  // 1) Collect selected sessions
  const selects = Array.from(document.querySelectorAll('.session-select'));
  const weekSelections = selects
    .map(s => ({ week: s.dataset.week, sessionId: s.value }))
    .filter(x => x.sessionId && x.sessionId.trim() !== '');

  if (weekSelections.length === 0) {
    alert('Please select at least one session.');
    return;
  }

  // 2) Fetch data
  const fetchPromises = weekSelections.map(ws =>
    fetchAttendanceData(ws.sessionId).then(result => ({ ...result, week: ws.week }))
  );
  const results = await Promise.all(fetchPromises);

  // 3) Aggregate students
  const students = new Map();
  const weeksUsed = weekSelections.map(ws => ws.week).sort((a, b) => a - b);

  for (const res of results) {
    const week = res.week;
    const logs = res.logs || [];

    for (const r of logs) {
      const sid = r.student_id;
      if (!students.has(sid)) {
        students.set(sid, {
          student_id: sid,
          student_name: r.student_name ?? '',
          weeks: {}
        });
      }

      const entry = students.get(sid);
      entry.weeks[week] = {
        exam: mapStatus(r.exam_status),
        am: mapStatus(r.am_status),
        pm: mapStatus(r.pm_status)
      };
    }
  }

  // 4) Create workbook & worksheet
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Monthly Summary');

  // 5) Define columns WITHOUT 'header' to avoid ExcelJS auto header row
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

  // 6) Build the two header rows (row 1 = merged Week labels, row 2 = subheaders)
  // Important: because 'header' was omitted above, row 1 is currently empty and we can safely fill it.
  const weekHeaderRow = worksheet.addRow([]); // will become row 1
  const subHeaderRow = worksheet.addRow([]);  // will become row 2

  // Fill fixed headers in the left columns
  weekHeaderRow.getCell(1).value = 'Student ID';
  weekHeaderRow.getCell(2).value = 'Student Name';
  subHeaderRow.getCell(1).value = ''; // leave subheader empty for ID/Name
  subHeaderRow.getCell(2).value = '';

  // Add week merged headers and subheaders
  let currentCol = 3;
  for (const w of weeksUsed) {
    // Merge row1 currentCol..currentCol+2
    worksheet.mergeCells(1, currentCol, 1, currentCol + 2);
    const mergedCell = worksheet.getRow(1).getCell(currentCol);
    mergedCell.value = `Week ${w}`;
    mergedCell.alignment = { vertical: 'middle', horizontal: 'center' };

    // Subheaders on row 2
    subHeaderRow.getCell(currentCol).value = 'Exam';
    subHeaderRow.getCell(currentCol + 1).value = 'AM';
    subHeaderRow.getCell(currentCol + 2).value = 'PM';

    currentCol += 3;
  }

  // Total and Average headers: merge vertically across row 1..2 (single column each)
  worksheet.mergeCells(1, currentCol, 2, currentCol);
  worksheet.mergeCells(1, currentCol + 1, 2, currentCol + 1);
  worksheet.getRow(1).getCell(currentCol).value = 'Total';
  worksheet.getRow(1).getCell(currentCol + 1).value = 'Average';

  // Style header rows
  [weekHeaderRow, subHeaderRow].forEach(row => {
    row.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF28313B' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        left: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        bottom: { style: 'thin', color: { argb: 'FFBFBFBF' } },
        right: { style: 'thin', color: { argb: 'FFBFBFBF' } }
      };
    });
  });

  // 7) Add student rows starting from row 3
  for (const [, s] of students) {
    const rowObj = {
      student_id: s.student_id,
      student_name: s.student_name
    };

    for (const w of weeksUsed) {
      const weekData = s.weeks[w] || {};
      rowObj[`w${w}_exam`] = weekData.exam ?? '';
      rowObj[`w${w}_am`] = weekData.am ?? '';
      rowObj[`w${w}_pm`] = weekData.pm ?? '';
    }

    const row = worksheet.addRow(rowObj);

    // Add formulas for Total & Average
    const firstWeekCol = 3;
    const lastWeekCol = firstWeekCol + weeksUsed.length * 3 - 1;
    const totalCol = lastWeekCol + 1;
    const avgCol = totalCol + 1;
    const rowNum = row.number;

    // Build cell addresses for formula (e.g. C3:K3)
    const startCellAddr = worksheet.getRow(rowNum).getCell(firstWeekCol)._address;
    const endCellAddr = worksheet.getRow(rowNum).getCell(lastWeekCol)._address;

    row.getCell(totalCol).value = { formula: `SUM(${startCellAddr}:${endCellAddr})` };
    row.getCell(avgCol).value = { formula: `AVERAGE(${startCellAddr}:${endCellAddr})` };
  }

  // 8) Conditional coloring & numeric formatting (skip header rows)
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= 2) return;

    const firstWeekCol = 3;
    const lastWeekCol = firstWeekCol + weeksUsed.length * 3 - 1;

    for (let i = firstWeekCol; i <= lastWeekCol; i++) {
      const cell = row.getCell(i);
      if (typeof cell.value === 'number') {
        cell.numFmt = '0.00';
        if (cell.value === 0) {
          cell.font = { color: { argb: 'FFF07361' }, bold: true }; // red
        } else if (cell.value === 0.5) {
          cell.font = { color: { argb: 'FFF7B32B' }, bold: true }; // yellow
        } else if (cell.value === 1) {
          cell.font = { color: { argb: 'FF38CC79' }, bold: true }; // green
        }
      }
    }

    const totalCell = row.getCell(lastWeekCol + 1);
    const avgCell = row.getCell(lastWeekCol + 2);
    if (typeof totalCell.value === 'number' || totalCell.value?.formula) totalCell.numFmt = '0.00';
    if (typeof avgCell.value === 'number' || avgCell.value?.formula) avgCell.numFmt = '0.00';
  });

  // 9) Layout tweaks
  worksheet.getRow(1).height = 24;
  worksheet.getRow(2).height = 18;
  worksheet.columns.forEach(col => {
    col.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // 10) Export
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), 'Monthly_Summary_Attendance.xlsx');
}

document.getElementById('summary-export').addEventListener('click', () => {
  generateMonthlySummaryExcel();
});