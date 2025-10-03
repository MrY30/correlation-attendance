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
const summaryBtn = document.getElementById('summary-btn');

const mainRegister = document.querySelector('.main-register');
const mainSessions = document.querySelector('.main-session');
const mainSummary = document.querySelector('.main-summary');
// const mainSessionInformation = document.querySelector('.main-session-information');

registerBtn.addEventListener('click', ()=>{
    mainRegister.classList.remove('hidden');
    mainSessions.classList.add('hidden');
    mainSummary.classList.add('hidden');
    // mainSessionInformation.classList.add('hidden');

    registerBtn.classList.add('selected');
    sessionBtn.classList.remove('selected');
    summaryBtn.classList.remove('selected');
});

sessionBtn.addEventListener('click', ()=>{
    mainSessions.classList.remove('hidden');
    mainRegister.classList.add('hidden');
    mainSummary.classList.add('hidden');
    // mainSessionInformation.classList.add('hidden');

    registerBtn.classList.remove('selected');
    sessionBtn.classList.add('selected');
    summaryBtn.classList.remove('selected');
});

summaryBtn.addEventListener('click', ()=>{
    mainSummary.classList.remove('hidden');
    mainSessions.classList.add('hidden');
    mainRegister.classList.add('hidden');

    registerBtn.classList.remove('selected');
    sessionBtn.classList.remove('selected');
    summaryBtn.classList.add('selected');
});