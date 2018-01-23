import React from 'react';
import ReactDOM from 'react-dom';
// index.css - css for component
import './index.css';
// App - react component
import App from './App';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
