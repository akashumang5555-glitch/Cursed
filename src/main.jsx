import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Analytics } from '@vercel/analytics/react'
import './index.css'
import App from './App.jsx'
import DesktopOnlyGate from './components/DesktopOnlyGate.jsx'
import Loader from './components/Loader.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <DesktopOnlyGate>
      <Loader>
        <App />
      </Loader>
    </DesktopOnlyGate>
    {/* Vercel Web Analytics: page views, outside the desktop gate so phone visits count too */}
    <Analytics />
  </StrictMode>,
)
