// Storage management functions
function loadNotes() {
  const saved = localStorage.getItem('simple-notes-enhanced');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [
    {
      id: generateId(),
      title: 'Welcome Note',
      content: 'Start editing your notes here!',
      modifiedAt: Date.now()
    }
  ];
}

function saveNotes(notes) {
  localStorage.setItem('simple-notes-enhanced', JSON.stringify(notes));
}

function loadDarkMode() {
  try {
    return JSON.parse(localStorage.getItem('simple-notion-darkmode')) || false;
  } catch {
    return false;
  }
}

function saveDarkMode(isDarkMode) {
  localStorage.setItem('simple-notion-darkmode', JSON.stringify(isDarkMode));
}