import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import DesktopOnlyGate from './components/DesktopOnlyGate.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DesktopOnlyGate>
      <App />
    </DesktopOnlyGate>
  </StrictMode>,
)
