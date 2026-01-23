import { useEffect } from 'react';

/**
 * Global UI Security Hardening Hook
 * Prevents casual inspection and creates a secure banking utility feel.
 * 
 * Features:
 * - Disables right-click context menu
 * - Blocks developer tools shortcuts (F12, Ctrl+Shift+I/J, Ctrl+U)
 * - Disables text selection and long-press on mobile
 * - Console flooding with security warning
 */
export function useSecurityHardening() {
  useEffect(() => {
    // === KEYBOARD SHORTCUT BLOCKING ===
    const handleKeyDown = (e: KeyboardEvent) => {
      // F12 - Developer Tools
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Ctrl+Shift+I - Developer Tools
      // Ctrl+Shift+J - Console
      // Ctrl+Shift+C - Element Inspector
      if (e.ctrlKey && e.shiftKey && ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Ctrl+U - View Source
      if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      // Cmd equivalents for Mac
      if (e.metaKey && e.altKey && ['I', 'i', 'J', 'j'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      
      if (e.metaKey && (e.key === 'U' || e.key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    // === CONTEXT MENU BLOCKING ===
    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Allow context menu on form inputs for accessibility
      const isFormElement = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.tagName === 'SELECT' ||
                           target.isContentEditable;
      
      if (!isFormElement) {
        e.preventDefault();
        return false;
      }
    };

    // === MOBILE LOCKDOWN ===
    const handleTouchStart = (e: TouchEvent) => {
      // Only prevent on long touches (not affecting normal taps)
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    // Prevent text selection except in form fields
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      const isFormElement = target.tagName === 'INPUT' || 
                           target.tagName === 'TEXTAREA' || 
                           target.isContentEditable;
      
      if (!isFormElement) {
        e.preventDefault();
        return false;
      }
    };

    // === CONSOLE FLOODING (The Vault Script) ===
    let consoleInterval: NodeJS.Timeout;
    
    const startConsoleFlood = () => {
      // Initial clear and warning
      console.clear();
      console.log(
        '%c⚠️ ALPHA SYSTEM: UNAUTHORIZED ACCESS ATTEMPT LOGGED ⚠️',
        'background: linear-gradient(90deg, #1a1a2e 0%, #0f0f1a 100%); color: #d4af37; font-size: 20px; font-weight: bold; padding: 20px 40px; border: 2px solid #d4af37; border-radius: 4px; text-shadow: 0 0 10px #d4af37;'
      );
      console.log(
        '%cThis session has been flagged. All activity is monitored.',
        'color: #888; font-size: 12px; padding: 5px;'
      );
      
      // Continuous clearing to maintain the warning
      consoleInterval = setInterval(() => {
        console.clear();
        console.log(
          '%c⚠️ ALPHA SYSTEM: UNAUTHORIZED ACCESS ATTEMPT LOGGED ⚠️',
          'background: linear-gradient(90deg, #1a1a2e 0%, #0f0f1a 100%); color: #d4af37; font-size: 20px; font-weight: bold; padding: 20px 40px; border: 2px solid #d4af37; border-radius: 4px; text-shadow: 0 0 10px #d4af37;'
        );
        console.log(
          '%cThis session has been flagged. All activity is monitored.',
          'color: #888; font-size: 12px; padding: 5px;'
        );
      }, 1000);
    };

    // Detect devtools opening (basic detection)
    const devToolsDetector = () => {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth > threshold;
      const heightDiff = window.outerHeight - window.innerHeight > threshold;
      
      if (widthDiff || heightDiff) {
        startConsoleFlood();
      }
    };

    // === APPLY CSS FOR SELECTION PREVENTION ===
    const style = document.createElement('style');
    style.id = 'alpha-security-style';
    style.textContent = `
      body:not(input):not(textarea) {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      input, textarea, [contenteditable="true"] {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
      
      /* Prevent image dragging */
      img {
        -webkit-user-drag: none !important;
        -khtml-user-drag: none !important;
        -moz-user-drag: none !important;
        -o-user-drag: none !important;
        user-drag: none !important;
        pointer-events: auto !important;
      }
    `;
    
    // Only add style if not already present
    if (!document.getElementById('alpha-security-style')) {
      document.head.appendChild(style);
    }

    // === ATTACH EVENT LISTENERS ===
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('selectstart', handleSelectStart, true);
    window.addEventListener('resize', devToolsDetector);

    // Initial devtools check
    devToolsDetector();

    // === CLEANUP ===
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('selectstart', handleSelectStart, true);
      window.removeEventListener('resize', devToolsDetector);
      
      if (consoleInterval) {
        clearInterval(consoleInterval);
      }
      
      const existingStyle = document.getElementById('alpha-security-style');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);
}

export default useSecurityHardening;
