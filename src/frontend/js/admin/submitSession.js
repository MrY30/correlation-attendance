import { addSession } from '../api.js';

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

    // Clear old errors
    const errorBox = document.getElementById('time-errors');
    errorBox.innerHTML = "";
    errorBox.classList.add("hidden");

    // Remove red borders from all inputs
    const timeInputs = sessionForm.querySelectorAll(".form-input");
    timeInputs.forEach(input => input.classList.remove("input-error"));
    
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

// ===== Session Validation =====

// function validateTimes() {
//     const errors = [];

//     // Grab values
//     const weeklyStart = document.getElementById('weekly-start-time').value;
//     const weeklyLate = document.getElementById('weekly-late-time').value;
//     const weeklyEnd = document.getElementById('weekly-end-time').value;

//     const amStart = document.getElementById('am-start-time').value;
//     const amLate = document.getElementById('am-late-time').value;
//     const amEnd = document.getElementById('am-end-time').value;

//     const pmStart = document.getElementById('pm-start-time').value;
//     const pmLate = document.getElementById('pm-late-time').value;
//     const pmEnd = document.getElementById('pm-end-time').value;

//     // Helper function to compare times
//     const toMinutes = (t) => {
//         const [h, m] = t.split(":").map(Number);
//         return h * 60 + m;
//     };

//     const ws = toMinutes(weeklyStart);
//     const wl = toMinutes(weeklyLate);
//     const we = toMinutes(weeklyEnd);
//     const ams = toMinutes(amStart);
//     const aml = toMinutes(amLate);
//     const ame = toMinutes(amEnd);
//     const pms = toMinutes(pmStart);
//     const pml = toMinutes(pmLate);
//     const pme = toMinutes(pmEnd);

//     // Weekly session checks
//     if (!(ws < wl && wl < we)) {
//         errors.push("Weekly Exam is not in proper time format");
//     }

//     // AM session checks
//     if (!(ams < aml && aml < ame)) {
//         errors.push("AM session is not in proper time format");
//     }

//     // PM session checks
//     if (!(pms < pml && pml < pme)) {
//         errors.push("PM session is not in proper time format");
//     }

//     // Cross-session logic
//     if (!(we <= ams)) {
//         errors.push("Weekly end time must be before AM start time");
//     }
//     if (!(ame <= pms)) {
//         errors.push("AM end time must be before PM start time");
//     }

//     return errors;
// }

function validateTimes() {
  const errors = [];
  
  const inputs = {
    weeklyStart: document.getElementById('weekly-start-time'),
    weeklyLate: document.getElementById('weekly-late-time'),
    weeklyEnd: document.getElementById('weekly-end-time'),
    amStart: document.getElementById('am-start-time'),
    amLate: document.getElementById('am-late-time'),
    amEnd: document.getElementById('am-end-time'),
    pmStart: document.getElementById('pm-start-time'),
    pmLate: document.getElementById('pm-late-time'),
    pmEnd: document.getElementById('pm-end-time')
  };

  // clear old highlights
  Object.values(inputs).forEach(input => input.classList.remove('input-error'));

  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const weeklyStart = toMinutes(inputs.weeklyStart.value);
  const weeklyLate  = toMinutes(inputs.weeklyLate.value);
  const weeklyEnd   = toMinutes(inputs.weeklyEnd.value);

  const amStart = toMinutes(inputs.amStart.value);
  const amLate  = toMinutes(inputs.amLate.value);
  const amEnd   = toMinutes(inputs.amEnd.value);

  const pmStart = toMinutes(inputs.pmStart.value);
  const pmLate  = toMinutes(inputs.pmLate.value);
  const pmEnd   = toMinutes(inputs.pmEnd.value);

  // Weekly validation
  if (!(weeklyStart < weeklyLate && weeklyLate < weeklyEnd)) {
    errors.push("Weekly times must follow Start < Late < End.");
    [inputs.weeklyStart, inputs.weeklyLate, inputs.weeklyEnd].forEach(i => i.classList.add('input-error'));
  }

  // AM validation
  if (!(amStart < amLate && amLate < amEnd)) {
    errors.push("AM times must follow Start < Late < End.");
    [inputs.amStart, inputs.amLate, inputs.amEnd].forEach(i => i.classList.add('input-error'));
  }

  // PM validation
  if (!(pmStart < pmLate && pmLate < pmEnd)) {
    errors.push("PM times must follow Start < Late < End.");
    [inputs.pmStart, inputs.pmLate, inputs.pmEnd].forEach(i => i.classList.add('input-error'));
  }

  // Logical ordering CONSIDERING TO CHANGE UPON REQUESTED [ALTERATION]
//   if (!(weeklyEnd <= amStart)) {
//     errors.push("Weekly time should end before AM session starts.");
//     [inputs.weeklyEnd, inputs.amStart].forEach(i => i.classList.add('input-error'));
//   }

//   if (!(amEnd <= pmStart)) {
//     errors.push("AM session should end before PM session starts.");
//     [inputs.amEnd, inputs.pmStart].forEach(i => i.classList.add('input-error'));
//   }

  return errors; // return array of error messages
}


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
    
    // Clear old errors
    const errorBox = document.getElementById('time-errors');
    errorBox.innerHTML = "";
    errorBox.classList.add("hidden");

    // Run validation
    const errors = validateTimes();
    if (errors.length > 0) {
        errorBox.innerHTML = errors.map(err => `<p>${err}</p>`).join("");
        errorBox.classList.remove("hidden");
        return; // stop submission
    }

    // --- continue with your existing sessionData + addSession() code ---
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
        if(error.message === 'duplicate key value violates unique constraint "sessions_v2_session_id_key"'){
            alert(`Session ID has been used. Please delete the session with the same ID or use DEMO mode.`)
        }else{
            alert(`Error: ${error.message}`);
        }   
    }
});