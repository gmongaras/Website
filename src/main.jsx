import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'

const compilingPdf = new URLSearchParams(window.location.search).has('compilePdf')
const app = (
  <HelmetProvider>
    <App />
  </HelmetProvider>
)

createRoot(document.getElementById('root')).render(
  compilingPdf ? app : <StrictMode>{app}</StrictMode>,
)
