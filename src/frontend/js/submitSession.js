import { addSession } from './api.js';

// Session popup functionality
const addSessionBtn = document.getElementById('add-session-btn');
const popupOverlay = document.getElementById('popup-overlay');
const popupClose = document.getElementById('popup-close');
const cancelBtn = document.getElementById('cancel-btn');
const sessionForm = document.querySelector('.session-form');

// Inputs
const sessionIdInput = document.getElementById('session-id');
const sessionNameInput = document.getElementById('session-name');
const weekNumberInput = document.getElementById('session-week-number');

// Demo Mode toggle
const demoToggle = document.querySelector('.toggle-area .switch input');

// Show popup
addSessionBtn.addEventListener('click', () => {
    popupOverlay.classList.remove('hidden');
    updateSessionFields(); // Auto-update session ID & name based on week number
    setDefaultDisabledState();
});

// Hide popup
function hidePopup() {
    popupOverlay.classList.add('hidden');
    sessionForm.reset();
    setDefaultDisabledState();
}

popupClose.addEventListener('click', hidePopup);
cancelBtn.addEventListener('click', hidePopup);

// Hide popup when clicking outside
popupOverlay.addEventListener('click', (e) => {
    if (e.target === popupOverlay) {
        hidePopup();
    }
});

// ===== Session ID & Name Handling =====

// Keep them disabled by default
function setDefaultDisabledState() {
    sessionIdInput.disabled = true;
    sessionNameInput.disabled = true;
    demoToggle.checked = false;
}

// Update Session ID & Name when week number changes
function updateSessionFields() {
    if (!demoToggle.checked) { // only auto-generate if NOT in demo mode
        const weekNumber = weekNumberInput.value;
        if (weekNumber) {
            sessionIdInput.value = `2025-COR1-W${weekNumber}`;
            sessionNameInput.value = `Week ${weekNumber}`;
        } else {
            sessionIdInput.value = '';
            sessionNameInput.value = '';
        }
    }
}

weekNumberInput.addEventListener('input', updateSessionFields);

// Toggle Demo Mode
demoToggle.addEventListener('change', () => {
    if (demoToggle.checked) {
        // Enable editing
        sessionIdInput.disabled = false;
        sessionNameInput.disabled = false;
    } else {
        // Disable editing and reset to auto values
        sessionIdInput.disabled = true;
        sessionNameInput.disabled = true;
        updateSessionFields();
    }
});

// Handle form submission
sessionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sessionData = {
        session_name: sessionNameInput.value,
        session_id: sessionIdInput.value,
        publish_date: document.getElementById('publish-date').value,
        weekly_start: document.getElementById('weekly-start-time').value,
        weekly_late: document.getElementById('weekly-late-time').value,
        weekly_end: document.getElementById('weekly-end-time').value,
        am_start: document.getElementById('am-start-time').value,
        am_late: document.getElementById('am-late-time').value,
        am_end: document.getElementById('am-end-time').value,
        pm_start: document.getElementById('pm-start-time').value,
        pm_late: document.getElementById('pm-late-time').value,
        pm_end: document.getElementById('pm-end-time').value
    };

    try {
        const result = await addSession(sessionData);
        hidePopup();
        alert('Session added successfully!');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }

});