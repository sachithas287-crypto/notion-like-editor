// Modal component for confirmation dialogs
function ConfirmModal({ message, onYes, onNo }) {
  const modalRef = React.useRef();

  React.useEffect(() => {
    // Focus trap and keyboard escape handling
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        onNo();
      }
      if (e.key === 'Tab') {
        // Trap tab inside modal
        const focusable = modalRef.current.querySelectorAll('button');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length -1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    }
    document.addEventListener('keydown', onKeyDown);
    // Focus the Yes button on mount
    const firstBtn = modalRef.current.querySelector('button.yes');
    firstBtn && firstBtn.focus();

    return () => {
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onNo]);

  return React.createElement(
    'div',
    { 
      className: 'modal-overlay', 
      role: 'dialog', 
      'aria-modal': 'true', 
      'aria-labelledby': 'modalLbl' 
    },
    React.createElement(
      'div',
      { className: 'modal', ref: modalRef, tabIndex: -1 },
      React.createElement(
        'div',
        { className: 'modal-message', id: 'modalLbl' },
        message
      ),
      React.createElement(
        'div',
        { className: 'modal-buttons' },
        React.createElement(
          'button',
          { 
            className: 'modal-button yes', 
            onClick: onYes 
          },
          'Yes'
        ),
        React.createElement(
          'button',
          { 
            className: 'modal-button no', 
            onClick: onNo 
          },
          'No'
        )
      )
    )
  );
}