import ReactDOM from 'react-dom/client'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import App from './App.jsx'
import './index.css'

if (import.meta.env.PROD) {
  const noop = () => {}
  console.log = noop
  console.debug = noop
  console.info = noop
  console.warn = noop
  console.error = noop
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />,
)
