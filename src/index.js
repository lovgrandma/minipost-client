import React from 'react';
import ReactDOM from 'react-dom';
import { CookiesProvider } from 'react-cookie';
import 'bootstrap/dist/css/bootstrap.css';
import './index.css';
import App from './App';
import SearchForm from './App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(
        <CookiesProvider><App /></CookiesProvider>, document.getElementById('root'));
registerServiceWorker();

