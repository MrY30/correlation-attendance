let attendedStudents = new Set(); // Track students who have already attended

// Auto-focus the input when page loads
window.onload = function() {
    focusInput();
};

function focusInput() {
    document.getElementById('rfid-input').focus();
}

function refocusInput() {
    // Automatically refocus the input after a short delay
    setTimeout(() => {
        document.getElementById('rfid-input').focus();
    }, 100);
}

function handleRFIDInput(event) {
    if (event.key === 'Enter') {
        const studentId = event.target.value.trim();
        if (studentId) {
            processStudentId(studentId);
            event.target.value = ''; // Clear input
        }
    }
}

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
    }

    // Refocus input for next scan
    refocusInput();
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
    
    // Update avatar with initials
    const initials = student.name.split(' ').map(n => n[0]).join('');
    document.getElementById('student-avatar').textContent = initials;
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

function goBack() {
    // This function should hide attendance reader and show main session
    // Implementation depends on your main application structure
    console.log('Going back to sessions...');
    alert('Back button clicked - implement navigation logic here');
}

// Keep input focused at all times
document.addEventListener('click', function(event) {
    if (!event.target.matches('button') && !event.target.matches('input')) {
        focusInput();
    }
});

// Demo: Simulate scanning after 3 seconds
setTimeout(() => {
    processStudentId('2024-0001');
}, 3000);