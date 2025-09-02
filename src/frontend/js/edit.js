// Search functionality
const searchInput = document.querySelector('.search-input');
const tableRows = document.querySelectorAll('.table-row');

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    let visibleRows = 0;

    tableRows.forEach(row => {
        const name = row.children[0].textContent.toLowerCase();
        const schoolId = row.children[1].textContent.toLowerCase();
        
        if (name.includes(searchTerm) || schoolId.includes(searchTerm)) {
            row.style.display = 'grid';
            visibleRows++;
        } else {
            row.style.display = 'none';
        }
    });

    // Show/hide empty state
    const mainTable = document.querySelector('.main-table');
    const emptyState = document.querySelector('.main-table-empty');
    
    if (visibleRows === 0 && searchTerm !== '') {
        mainTable.style.display = 'none';
        emptyState.style.display = 'block';
    } else {
        mainTable.style.display = 'block';
        emptyState.style.display = 'none';
    }
});

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
sessionForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const sessionName = document.getElementById('session-name').value;
    const sessionId = document.getElementById('session-id').value;
    const publishDate = document.getElementById('publish-date').value;
    const publishTime = document.getElementById('publish-time').value;
    const closeDate = document.getElementById('close-date').value;
    const closeTime = document.getElementById('close-time').value;

    // Here you would typically send this data to your backend
    console.log('New session data:', {
        name: sessionName,
        id: sessionId,
        publishDateTime: `${publishDate} ${publishTime}`,
        closeDateTime: `${closeDate} ${closeTime}`
    });

    // For demo purposes, we'll just hide the popup
    hidePopup();
    alert('Session added successfully!');
});

// Session edit functionality
const editButtons = document.querySelectorAll('.edit-session-btn');
const mainSession = document.querySelector('.main-session');
const mainSessionInfo = document.querySelector('.main-session-information');
const backButton = document.getElementById('back-to-sessions');

editButtons.forEach(button => {
    button.addEventListener('click', (e) => {
        const sessionCard = e.target.closest('.session-card');
        
        // Get session data from data attributes
        const sessionName = sessionCard.dataset.sessionName;
        const sessionId = sessionCard.dataset.sessionId;
        const publishDate = sessionCard.dataset.publishDate;
        const closeDate = sessionCard.dataset.closeDate;
        const status = sessionCard.dataset.status;

        // Update session information display
        document.getElementById('session-detail-name').textContent = sessionName;
        document.getElementById('session-detail-id').textContent = `ID: ${sessionId}`;
        document.getElementById('session-detail-publish').textContent = publishDate;
        document.getElementById('session-detail-close').textContent = closeDate;
        document.getElementById('session-detail-status').textContent = status;

        // Hide main-session and show main-session-information
        mainSession.classList.add('hidden');
        mainSessionInfo.classList.remove('hidden');
    });
});

// Back to sessions functionality
backButton.addEventListener('click', () => {
    mainSessionInfo.classList.add('hidden');
    mainSession.classList.remove('hidden');
});

// Search functionality for session information table
const sessionSearchInput = document.querySelector('.session-search');
const sessionTableRows = document.querySelectorAll('.main-session-information .table-row');

if (sessionSearchInput) {
    sessionSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        let visibleRows = 0;

        sessionTableRows.forEach(row => {
            const name = row.children[0].textContent.toLowerCase();
            const schoolId = row.children[1].textContent.toLowerCase();
            
            if (name.includes(searchTerm) || schoolId.includes(searchTerm)) {
                row.style.display = 'grid';
                visibleRows++;
            } else {
                row.style.display = 'none';
            }
        });

        // Show/hide empty state for session table
        const sessionMainTable = document.querySelector('.main-session-information .main-table');
        const sessionEmptyState = document.querySelector('.main-session-information .main-table-empty');
        
        if (visibleRows === 0 && searchTerm !== '') {
            sessionMainTable.style.display = 'none';
            sessionEmptyState.style.display = 'block';
        } else {
            sessionMainTable.style.display = 'block';
            sessionEmptyState.style.display = 'none';
        }
    });
}