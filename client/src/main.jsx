import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// Inter là font thay thế được Linear DESIGN.md khuyến nghị; self-host để không phụ thuộc CDN ngoài.
import '@fontsource-variable/inter';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
