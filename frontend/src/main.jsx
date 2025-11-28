import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import SimpleApp from './SimpleApp.jsx'
import BasicApp from './BasicApp.jsx'
import StartupDiagnostic from './components/StartupDiagnostic.jsx'
import './index.css'

console.log('🚀 main.jsx loading');

// Check URL parameters for different modes
const urlParams = new URLSearchParams(window.location.search);
const isSimple = urlParams.has('simple');
const isDiagnostic = urlParams.has('diagnostic');
const isBasic = urlParams.has('basic');

let AppToRender = App;
if (isBasic) {
    AppToRender = BasicApp;
} else if (isSimple) {
    AppToRender = SimpleApp;
} else if (isDiagnostic) {
    AppToRender = () => <StartupDiagnostic />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AppToRender />
    </React.StrictMode>,
)