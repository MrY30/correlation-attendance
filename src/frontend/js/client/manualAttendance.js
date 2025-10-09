const closeAttendanceBtn = document.getElementById('popup-close-attendance');
const popupOverlayAttendance = document.getElementById('popup-overlay-attendance');
const openAttendanceBtn = document.getElementById('click-button');

// Open modal
openAttendanceBtn.addEventListener('click', () => {
  popupOverlayAttendance.classList.remove('hidden');
});

// Close modal
closeAttendanceBtn.addEventListener('click', () => {
  popupOverlayAttendance.classList.add('hidden');
});

// Hide popup when clicking outside
popupOverlayAttendance.addEventListener('click', (e) => {
    if (e.target === popupOverlayAttendance) {
        popupOverlayAttendance.classList.add('hidden');
    }
});