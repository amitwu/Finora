import React from 'react';
import { createRoot } from 'react-dom/client'; // שימוש ב-createRoot
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Standard React root rendering setup for Canvas environment
// Ensures the root element exists and handles initial render.
window.onload = function() {
    const container = document.getElementById('root');
    if (!container) {
        // If root element doesn't exist, create it (e.g., for direct browser access)
        const appDiv = document.createElement('div');
        appDiv.id = 'root';
        document.body.appendChild(appDiv);
    }
    
    try {
        const root = createRoot(document.getElementById('root'));
        root.render(
            <React.StrictMode>
                <BrowserRouter>
                    <App />
                </BrowserRouter>
            </React.StrictMode>
        );
    } catch (e) {
        console.error("שגיאה קריטית ברינדור React:", e);
    }
};
