import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Prevent theme flash by setting data-theme before first paint
function initTheme() {
  try {
    const theme = localStorage.getItem('snakeTheme');
    if (theme) {
      document.documentElement.dataset.theme = theme;
    }
  } catch {
    // ignore
  }
}

initTheme();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
