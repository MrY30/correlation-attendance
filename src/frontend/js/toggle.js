// TOGGLE DARK MODE
const darkModeButton = document.getElementById('dm-button');
const body = document.getElementById('main-body');

darkModeButton.addEventListener('click', ()=>{
    body.classList.toggle('dark-theme');
    darkModeButton.classList.toggle('bxs-moon');
    darkModeButton.classList.toggle('bxs-sun-dim');
});

// TOGGLE MAIN CONTENT
const registerBtn = document.getElementById('register-btn');
const sessionBtn = document.getElementById('session-btn');

const mainRegister = document.querySelector('.main-register');
const mainSessions = document.querySelector('.main-session');

registerBtn.addEventListener('click', ()=>{
    mainRegister.classList.remove('hidden');
    mainSessions.classList.add('hidden');
    registerBtn.classList.add('selected');
    sessionBtn.classList.remove('selected');
});

sessionBtn.addEventListener('click', ()=>{
    mainSessions.classList.remove('hidden');
    mainRegister.classList.add('hidden');
    registerBtn.classList.remove('selected');
    sessionBtn.classList.add('selected');
});

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