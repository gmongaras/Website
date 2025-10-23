import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, useLocation } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// Component to scroll to top on route changes
const ScrollToTop = () => {
  const { pathname } = useLocation()

  React.useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
