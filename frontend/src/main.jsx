import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import App from './App.jsx';
import WakingServerBanner from './components/WakingServerBanner.jsx';
import { wakeServer } from './services/api';
import './index.css';

wakeServer();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <WakingServerBanner />
        <App />
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
