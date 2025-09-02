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