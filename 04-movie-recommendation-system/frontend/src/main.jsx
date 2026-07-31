import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1D1D26',
              color: '#F2F0EA',
              border: '1px solid #2A2A35',
            },
            success: { iconTheme: { primary: '#E8A33D', secondary: '#0A0A0D' } },
            error: { iconTheme: { primary: '#C1272D', secondary: '#0A0A0D' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
