import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Expand to full screen in Telegram
const tgApp = (window as any).Telegram?.WebApp;
if (tgApp) {
  tgApp.expand();
  tgApp.disableVerticalSwipes?.();
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
