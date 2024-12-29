import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Custom from './Custom';

const rootEl = document.getElementById('root');
if (rootEl) {
  const root = ReactDOM.createRoot(rootEl);
  root.render(
    <React.StrictMode>
      <div style={{ display: 'flex', gap: '10px' }}>
        <Custom />
        <App />
      </div>
    </React.StrictMode>,
  );
}
