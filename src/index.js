import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';
import './index.css';

/*
 * `bootstrap/dist/js/bootstrap.bundle.min` used to be imported here. Nothing
 * needed it -- react-bootstrap ships its own behaviour -- and it dragged
 * Popper and the whole jQuery-free Bootstrap runtime into the bundle. See the
 * before/after figures in docs/build-and-test.md.
 */

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
