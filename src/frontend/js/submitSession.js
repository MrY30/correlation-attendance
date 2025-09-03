import { addSession } from './api.js';

// Session popup functionality
const addSessionBtn = document.getElementById('add-session-btn');
const popupOverlay = document.getElementById('popup-overlay');
const popupClose = document.getElementById('popup-close');
const cancelBtn = document.getElementById('cancel-btn');
const sessionForm = document.querySelector('.session-form');

// Show popup
addSessionBtn.addEventListener('click', () => {
    popupOverlay.classList.remove('hidden');
});

// Hide popup
function hidePopup() {
    popupOverlay.classList.add('hidden');
    sessionForm.reset();
}

popupClose.addEventListener('click', hidePopup);
cancelBtn.addEventListener('click', hidePopup);

// Hide popup when clicking outside
popupOverlay.addEventListener('click', (e) => {
    if (e.target === popupOverlay) {
        hidePopup();
    }
});

// Handle form submission
sessionForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const sessionName = document.getElementById('session-name').value;
    const sessionId = document.getElementById('session-id').value;
    const publishDate = document.getElementById('publish-date').value;
    const publishTime = document.getElementById('publish-time').value;
    const closeDate = document.getElementById('close-date').value;
    const closeTime = document.getElementById('close-time').value;

    // Here you would typically send this data to your backend
    const sessionData = {
        session_name: sessionName,
        session_id: sessionId,
        open_date: `${publishDate}T${publishTime}`,
        close_date: `${closeDate}T${closeTime}`
    }
    try {
        const result = await addSession(sessionData);
        hidePopup();
        alert('Session added successfully!');
    } catch (error) {
        alert(`Error: ${error.message}`);
    }
});