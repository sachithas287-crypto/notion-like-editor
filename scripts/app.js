// Main application component
const { useState, useEffect, useRef, useCallback } = React;

function SimpleNotionWithCalendarAndModal() {
  const [notes, setNotes] = useState(loadNotes);
  const [selectedId, setSelectedId] = useState(notes[0]?.id || null);
  const [search, setSearch] = useState('');
  const [darkMode, setDarkMode] = useState(loadDarkMode);
  const [filterDate, setFilterDate] = useState(null);
  const [modalDelete, setModalDelete] = useState({ show: false, noteId: null });

  useEffect(() => {
    if (darkMode) document.body.classList.add('dark');
    else document.body.classList.remove('dark');
    saveDarkMode(darkMode);
  }, [darkMode]);

  const debouncedNotes = useDebounce(notes, 800);
  useEffect(() => {
    saveNotes(debouncedNotes);
  }, [debouncedNotes]);

  const addNote = useCallback(() => {
    const newNote = {
      id: generateId(),
      title: 'Untitled',
      content: '',
      modifiedAt: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
    setSelectedId(newNote.id);
    setFilterDate(null);
  }, []);

  const requestDeleteNote = useCallback((id) => {
    setModalDelete({ show: true, noteId: id });
  }, []);

  const confirmDelete = useCallback(() => {
    const id = modalDelete.noteId;
    if (!id) {
      setModalDelete({ show: false, noteId: null });
      return;
    }
    setNotes(prev => {
      let filtered = prev.filter(note => note.id !== id);
      if (filtered.length === 0) {
        const newNote = {
          id: generateId(),
          title: 'Untitled',
          content: '',
          modifiedAt: Date.now(),
        };
        filtered = [newNote];
        setSelectedId(newNote.id);
        setFilterDate(null);
      } else if (selectedId === id) {
        setSelectedId(filtered[0].id);
      }
      return filtered;
    });
    setModalDelete({ show: false, noteId: null });
  }, [modalDelete.noteId, selectedId]);

  const cancelDelete = useCallback(() => {
    setModalDelete({ show: false, noteId: null });
  }, []);

  const updateNote = useCallback((id, key, value) => {
    setNotes(prev =>
      prev.map(note =>
        note.id === id ? { ...note, [key]: value, modifiedAt: Date.now() } : note
      )
    );
  }, []);

  const onDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const onDrop = (e, dropIndex) => {
    e.preventDefault();
    const dragIndex = Number(e.dataTransfer.getData('text/plain'));
    if (dragIndex === dropIndex) return;
    setNotes(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(dropIndex, 0, moved);
      return updated;
    });
  };

  const searchLower = search.toLowerCase();
  const filteredNotes = notes.filter(note => {
    const matchesSearch =
      (note.title || '').toLowerCase().includes(searchLower) ||
      (note.content || '').toLowerCase().includes(searchLower);
    if (!matchesSearch) return false;
    if (filterDate) {
      const noteDate = new Date(note.modifiedAt);
      const fd = new Date(filterDate);
      return noteDate.getFullYear() === fd.getFullYear() &&
        noteDate.getMonth() === fd.getMonth() &&
        noteDate.getDate() === fd.getDate();
    }
    return true;
  });

  const selectedNote = filteredNotes.find(note => note.id === selectedId) || null;

  const exportNote = () => {
    if (!selectedNote) return;
    const element = document.createElement("a");
    const file = new Blob(
      [selectedNote.title + '\n\n' + selectedNote.content],
      { type: 'text/plain' }
    );
    element.href = URL.createObjectURL(file);
    element.download = (selectedNote.title || 'note') + ".txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  useEffect(() => {
    function onKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        addNote();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [addNote]);

  const notesDatesSet = new Set(
    notes.map(note => {
      const d = new Date(note.modifiedAt);
      return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    })
  );

  const [calendarDate, setCalendarDate] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const prevMonth = () => {
    setCalendarDate(({ year, month }) => {
      if (month === 0) {
        return { year: year -1, month: 11 };
      } else {
        return { year, month: month -1 };
      }
    });
  };
  
  const nextMonth = () => {
    setCalendarDate(({ year, month }) => {
      if (month === 11) {
        return { year: year +1, month: 0 };
      } else {
        return { year, month: month +1 };
      }
    });
  };

  const selectDate = (dateObj, currentMonth) => {
    if (!currentMonth) return;
    if (filterDate && filterDate.toDateString() === dateObj.toDateString()) {
      setFilterDate(null);
      return;
    }
    setFilterDate(new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()));
    setSearch('');
    const idForDay = notes.find(note => {
      const d = new Date(note.modifiedAt);
      return d.getFullYear() === dateObj.getFullYear() &&
        d.getMonth() === dateObj.getMonth() &&
        d.getDate() === dateObj.getDate();
    })?.id || null;
    if (idForDay) setSelectedId(idForDay);
  };

  const clearFilter = () => {
    setFilterDate(null);
  };

  const weeks = getCalendarGrid(calendarDate.year, calendarDate.month);
  const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      'div',
      { className: 'app', role: 'main', 'aria-busy': modalDelete.show },
      React.createElement(
        'nav',
        { className: 'sidebar', 'aria-label': 'Notes Navigation' },
        React.createElement(
          'div',
          { className: 'sidebar-header' },
          React.createElement('span', null, 'My Notes'),
          React.createElement(
            'button',
            {
              'aria-label': darkMode ? "Switch to Light Mode" : "Switch to Dark Mode",
              className: 'control-button',
              onClick: () => setDarkMode(!darkMode),
              title: darkMode ? "Light Mode" : "Dark Mode"
            },
            darkMode ? '☀️' : '🌙'
          )
        ),
        React.createElement(
          'div',
          { style: { padding: '0 0.75rem 0.625rem 0.75rem' } },
          React.createElement('input', {
            'aria-label': "Search notes",
            type: 'search',
            placeholder: 'Search notes...',
            className: 'search-input',
            value: search,
            onChange: e => setSearch(e.target.value),
            autoComplete: 'off',
            spellCheck: false,
            disabled: !!filterDate,
            title: filterDate ? 'Clear date filter to enable search' : 'Search notes'
          })
        ),
        React.createElement(
          'div',
          {
            className: 'note-list',
            role: 'list',
            'aria-label': 'Notes list - draggable reorder supported'
          },
          filteredNotes.length === 0 && React.createElement(
            'div',
            { style: { padding: '12px', textAlign: 'center', color: '#999' }, 'aria-live': 'polite' },
            'No notes found.'
          ),
          filteredNotes.map((note, index) =>
            React.createElement(
              'div',
              {
                key: note.id,
                role: 'listitem',
                tabIndex: 0,
                className: `note-item ${note.id === selectedId ? 'selected' : ''}`,
                onClick: () => setSelectedId(note.id),
                onKeyDown: e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setSelectedId(note.id);
                    e.preventDefault();
                  }
                },
                'aria-current': note.id === selectedId ? 'page' : undefined,
                draggable: true,
                onDragStart: e => onDragStart(e, index),
                onDragOver: onDragOver,
                onDrop: e => onDrop(e, index),
                'aria-grabbed': note.id === selectedId ? 'true' : 'false'
              },
              React.createElement(
                'div',
                { className: 'note-title-preview', title: note.title || 'Untitled' },
                note.title || 'Untitled'
              ),
              React.createElement(
                'div',
                { className: 'note-date-preview', 'aria-label': 'Last modified date' },
                formatDate(note.modifiedAt)
              ),
              React.createElement(
                'button',
                {
                  onClick: e => {
                    e.stopPropagation();
                    requestDeleteNote(note.id);
                  },
                  'aria-label': `Delete note titled ${note.title || 'Untitled'}`,
                  className: 'delete-btn',
                  title: "Delete Note"
                },
                '×'
              )
            )
          )
        ),
        React.createElement(
          'button',
          {
            onClick: addNote,
            className: 'add-note-button',
            'aria-label': "Add new note",
            title: "Add Note (Ctrl+N)"
          },
          '+ Add Note'
        ),
        React.createElement(
          'section',
          { className: 'calendar', 'aria-label': 'Calendar - click a date to filter notes' },
          React.createElement(
            'div',
            { className: 'calendar-header' },
            React.createElement(
              'button',
              {
                'aria-label': "Previous month",
                onClick: prevMonth,
                type: 'button'
              },
              '‹'
            ),
            React.createElement(
              'div',
              { 'aria-live': "polite", 'aria-atomic': "true", style: { fontWeight: "700" } },
              new Date(calendarDate.year, calendarDate.month).toLocaleString('default', { year: 'numeric', month: 'long' })
            ),
            React.createElement(
              'button',
              {
                'aria-label': "Next month",
                onClick: nextMonth,
                type: 'button'
              },
              '›'
            )
          ),
          React.createElement(
            'div',
            { className: 'calendar-grid' },
            weekdayLabels.map(day =>
              React.createElement(
                'div',
                { key: day, className: 'calendar-day', 'aria-hidden': 'true' },
                day
              )
            ),
            weeks.flat().map(({ dateObj, currentMonth }, idx) => {
              const isToday =
                dateObj.getFullYear() === today.getFullYear() &&
                dateObj.getMonth() === today.getMonth() &&
                dateObj.getDate() === today.getDate();

              const dateKey = dateObj.getFullYear() + '-' + (dateObj.getMonth() + 1) + '-' + dateObj.getDate();

              const hasNoteDot = notesDatesSet.has(dateKey);

              const isSelected = filterDate && (
                dateObj.getFullYear() === filterDate.getFullYear() &&
                dateObj.getMonth() === filterDate.getMonth() &&
                dateObj.getDate() === filterDate.getDate()
              );

              return React.createElement(
                'button',
                {
                  key: idx,
                  type: 'button',
                  className: 'calendar-date' +
                    (currentMonth ? '' : ' outside') +
                    (isToday ? ' today' : '') +
                    (isSelected ? ' selected' : ''),
                  'aria-pressed': isSelected,
                  'aria-label': dateObj.toLocaleDateString(undefined, {
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                  }) + (hasNoteDot ? ', has notes modified on this day' : ''),
                  onClick: () => selectDate(dateObj, currentMonth),
                  disabled: !currentMonth
                },
                dateObj.getDate(),
                hasNoteDot && React.createElement('span', { className: 'note-dot', 'aria-hidden': 'true' })
              );
            })
          ),
          filterDate && React.createElement(
            'button',
            {
              type: 'button',
              className: 'clear-filter-button',
              onClick: clearFilter,
              'aria-label': "Clear date filter",
              title: "Clear date filter"
            },
            'Clear date filter'
          )
        )
      ),
      React.createElement(
        'section',
        { className: 'main', 'aria-label': 'Note editor' },
        selectedNote ? React.createElement(
          React.Fragment,
          null,
          React.createElement(
            'div',
            { className: 'controls-row' },
            React.createElement(
              'button',
              {
                className: 'control-button',
                type: 'button',
                onClick: () => {
                  if (filterDate) clearFilter();
                  exportNote();
                },
                'aria-label': "Export current note as text file",
                title: filterDate ? "Clear filter then export note" : "Export Note"
              },
              'Export Note'
            )
          ),
          React.createElement('input', {
            'aria-label': "Note title",
            className: 'note-title-input',
            type: 'text',
            placeholder: 'Note Title',
            value: selectedNote.title,
            onChange: e => updateNote(selectedNote.id, 'title', e.target.value),
            spellCheck: false,
            autoComplete: 'off'
          }),
          React.createElement('textarea', {
            'aria-label': "Note content",
            className: 'note-content-textarea',
            placeholder: 'Start typing your note content...',
            value: selectedNote.content,
            onChange: e => updateNote(selectedNote.id, 'content', e.target.value),
            spellCheck: true
          })
        ) : React.createElement('p', null, 'Select or add a note to get started.')
      )
    ),
    modalDelete.show && React.createElement(ConfirmModal, {
      message: "Are you sure you want to delete this note?",
      onYes: confirmDelete,
      onNo: cancelDelete
    })
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(SimpleNotionWithCalendarAndModal));