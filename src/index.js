import React from 'react';
import ReactDOM from 'react-dom';
import { Router, BrowserRouter } from 'react-router-dom';
import { CookiesProvider } from 'react-cookie';
import pagehistory from './pagehistory.js';
import './index.css';
import './style/app.css';
import './style/player.css';
import './style/page.css';
import './style/shop.css';
import App from './App';
import SearchForm from './App';
import registerServiceWorker from './registerServiceWorker';
import history from './methods/history.js';
import 'bootstrap/dist/css/bootstrap.css';

ReactDOM.render(
    <CookiesProvider>
        <Router history={history}>
            <App history={history} />
        </Router>
    </CookiesProvider>, document.getElementById('root'));
registerServiceWorker();

