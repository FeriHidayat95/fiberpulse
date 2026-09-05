import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  
  if (!config) config = {};
  if (!config.headers) config.headers = {};
  
  const token = localStorage.getItem('sanctum_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await originalFetch(resource, config);
  
  if (response.status === 401) {
    localStorage.removeItem('sanctum_token');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_name');
    window.location.href = '/';
  }
  
  return response;
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
