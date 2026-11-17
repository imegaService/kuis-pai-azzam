import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { unlockAudio } from './lib/sound';

['pointerdown', 'touchstart', 'keydown'].forEach((ev) => document.addEventListener(ev, unlockAudio, { passive: true }));

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => undefined);
  });
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
