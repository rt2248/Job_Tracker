import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
// import('https://cdn.jsdelivr.net/npm/eruda').then(() => window.eruda.init());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
