function getStoredUserName() {
  const persistence = window.TimelessPagesUserPersistence;
  if (persistence) {
    const session = persistence.getSessionSnapshot();
    return (session.userName || '').trim();
  }

  const userName = localStorage.getItem('timelessPagesUserName');
  return userName ? userName.trim() : '';
}

// Session management is now handled globally by catalog.js
// This script now handles home-specific logic only.

function initHome() {
  // Add any home-specific initialization here
}

document.addEventListener('DOMContentLoaded', initHome);
