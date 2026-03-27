import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../../pages/auth/Auth.css';

const AuthModal = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-popup" onClick={(e) => e.stopPropagation()}>
        <span className="auth-close" onClick={onClose}>✕</span>
        {children}
      </div>
    </div>,
    document.body
  );
};

export default AuthModal;
