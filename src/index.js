import React from 'react';
import ReactDOM from 'react-dom';
import { Router, BrowserRouter } from 'react-router-dom';
import history from './pagehistory.js';
// import './style/bootstrap.css';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import './style/app.css';
import './videoplayer.css';
import 'shaka-player/dist/controls.css';
import './style/player.css';
import './style/page.css';
import './style/shop.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

// If we make a call to server here for some data we can speed up rendering and skip some later calls to server

ReactDOM.render(
        <Router history={history}>
            <App history={history} />
        </Router>, document.getElementById('root'));
registerServiceWorker();

