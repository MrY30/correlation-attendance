function processStudentId(studentId) {
    // Add scanner effect
    const rfidSection = document.querySelector('.rfid-section');
    rfidSection.classList.add('active');
    
    setTimeout(() => {
        rfidSection.classList.remove('active');
    }, 1000);

    // Simulate student data lookup (replace with your backend call)
    const studentData = getStudentData(studentId);
    
    if (studentData) {
        displayStudentInfo(studentData);
        
        // Check if student already attended
        if (attendedStudents.has(studentId)) {
            showAttendanceMessage('already-attended');
        } else {
            attendedStudents.add(studentId);
            showAttendanceMessage('present');
        }
    } else {
        // Handle student not found
        alert('Student ID not found: ' + studentId);
    };
}

function getStudentData(studentId) {
    // Mock student data - replace with actual API call
    const mockData = {
        '2024-0001': { name: 'John Doe', id: '2024-0001', section: 'A-1' },
        '2024-0002': { name: 'Jane Smith', id: '2024-0002', section: 'B-2' },
        '2024-0003': { name: 'Mike Johnson', id: '2024-0003', section: 'A-1' }
    };
    
    return mockData[studentId] || null;
}

function displayStudentInfo(student) {
    // Hide placeholder and show student info
    document.getElementById('student-placeholder').style.display = 'none';
    document.getElementById('student-info').classList.add('show');
    
    // Update student information
    document.getElementById('student-name').textContent = student.name;
    document.getElementById('student-id').textContent = student.id;
    document.getElementById('student-section').textContent = student.section;
}

function showAttendanceMessage(status) {
    const messageElement = document.getElementById('attendance-message');
    
    if (status === 'present') {
        messageElement.className = 'attendance-status status-present';
        messageElement.innerHTML = '<i class="bx bx-check-circle"></i> Attendance Recorded Successfully!';
    } else if (status === 'already-attended') {
        messageElement.className = 'attendance-status status-already-attended';
        messageElement.innerHTML = '<i class="bx bx-info-circle"></i> Already Attended';
    }
}

// Demo: Simulate scanning after 3 seconds
setTimeout(() => {
    processStudentId('2024-0001');
}, 3000);