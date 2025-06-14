import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import '@solana/wallet-adapter-react-ui/styles.css'
import App from './App'
import { Buffer } from 'buffer'

// Initialize polyfills
window.Buffer = Buffer
window.global = window
window.process = {
  env: {},
  browser: true,
  version: '',
  nextTick: (cb: Function) => setTimeout(cb, 0),
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Failed to find the root element')

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
