import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// AG Grid module registration
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
ModuleRegistry.registerModules([AllCommunityModule]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />,
)
