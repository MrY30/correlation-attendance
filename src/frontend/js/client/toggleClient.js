// TOGGLE DARK MODE
const darkModeButton = document.getElementById('dm-button');
const body = document.getElementById('main-body');

darkModeButton.addEventListener('click', ()=>{
    body.classList.toggle('dark-theme');
    darkModeButton.classList.toggle('bxs-moon');
    darkModeButton.classList.toggle('bxs-sun-dim');
});