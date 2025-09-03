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

// Session edit functionality
const mainSession = document.querySelector('.main-session');
const mainSessionInfo = document.querySelector('.main-session-information');
const backButton = document.getElementById('back-to-sessions');

const grid = document.querySelector('.session-grid');

grid.addEventListener('click', (e) => {
  if (e.target.closest('.edit-session-btn')) {
    const sessionCard = e.target.closest('.session-card');

    if (!sessionCard) return;

    const sessionName = sessionCard.dataset.sessionName;
    const sessionId = sessionCard.dataset.sessionId;
    const publishDate = sessionCard.dataset.publishDate;
    const closeDate = sessionCard.dataset.closeDate;
    const status = sessionCard.dataset.status;

    document.getElementById('session-detail-name').textContent = sessionName;
    document.getElementById('session-detail-id').textContent = `ID: ${sessionId}`;
    document.getElementById('session-detail-publish').textContent = publishDate;
    document.getElementById('session-detail-close').textContent = closeDate;
    document.getElementById('session-detail-status').textContent = status;

    mainSession.classList.add('hidden');
    mainSessionInfo.classList.remove('hidden');
  }
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