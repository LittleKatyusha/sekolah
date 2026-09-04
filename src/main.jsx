import ReactDOM from 'react-dom/client'
import '@ag-grid-community/styles/ag-grid.css'
import '@ag-grid-community/styles/ag-theme-alpine.css'
import App from './App.jsx'
import './index.css'
import { recoverFromStaleChunk } from './utils/staleChunkRecovery'

window.addEventListener('vite:preloadError', recoverFromStaleChunk)

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />,
)
