import { fetchSessions } from '../api.js';

async function populateSessionDropdowns() {
  try {
    // Get sessions from backend
    const sessions = await fetchSessions();

    // Get all dropdowns
    const dropdowns = document.querySelectorAll('.session-select');

    // For each dropdown
    dropdowns.forEach(select => {
      // Clear existing options first
      select.innerHTML = '';

      // Add the "null" option (can always be reselected)
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = 'Select Session';
      select.appendChild(defaultOption);

      // Add all session options dynamically
      sessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session.session_id;         // use session_id as value
        option.textContent = session.session_name; // show session_name
        select.appendChild(option);
      });

      // Optional: allow reselecting “Select Session” after choosing another
      select.addEventListener('change', () => {
        if (select.value === '') {
          select.selectedIndex = 0;
        }
      });
    });
  } catch (err) {
    console.error('Failed to populate session dropdowns:', err);
  }
}

// Run after DOM is loaded
document.addEventListener('DOMContentLoaded', populateSessionDropdowns);
