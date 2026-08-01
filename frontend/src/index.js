import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

// CRITICAL FIX: Attach native click handlers to all buttons
// This works around issues where React's synthetic event system doesn't receive browser events
// TEMPORARILY DISABLED - causing infinite loop issues
if (false && typeof window !== 'undefined' && typeof document !== 'undefined') {
  // Store for button click handlers
  const buttonHandlers = new WeakMap();

  // Function to attach native listener to a button
  function attachNativeListener(button) {
    if (buttonHandlers.has(button)) return; // Already attached

    // Create a native click handler
    const handler = function(e) {
      // Dispatch a synthetic mouse event that React will catch
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: e.clientX,
        clientY: e.clientY,
        screenX: e.screenX,
        screenY: e.screenY,
        button: e.button
      });

      // Dispatch the event on the button
      button.dispatchEvent(clickEvent);
    };

    // Attach the native click listener
    button.addEventListener('click', handler, true);
    buttonHandlers.set(button, handler);

    // Also handle pointer events
    button.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') {
        handler(e);
      }
    }, true);
  }

  // Use MutationObserver to watch for new buttons being added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.tagName === 'BUTTON') {
            attachNativeListener(node);
          } else if (node.querySelectorAll) {
            node.querySelectorAll('button').forEach(btn => {
              attachNativeListener(btn);
            });
          }
        });
      }
    });
  });

  // Start observing the document
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // Also attach to existing buttons
  setTimeout(() => {
    document.querySelectorAll('button').forEach(btn => {
      attachNativeListener(btn);
    });
  }, 100);
}
