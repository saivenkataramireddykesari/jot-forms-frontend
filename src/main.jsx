import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// StrictMode removed to prevent double useEffect calls in dev
// (which caused double API calls on the auth page)
createRoot(document.getElementById('root')).render(<App />)
