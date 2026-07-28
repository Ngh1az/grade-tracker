import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// Inter là font thay thế được Linear DESIGN.md khuyến nghị; self-host để không phụ thuộc CDN ngoài.
import '@fontsource-variable/inter';
import './index.css';
import { applyTheme, getTheme } from './theme.js';

// Áp trước khi React render lần đầu, không thì màn sẽ nháy sai theme 1 khung hình.
applyTheme(getTheme());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
