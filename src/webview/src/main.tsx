import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { ThemeWrapper } from './components/ThemeWrapper';
import './index.css';
import { loader } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';

// Configure monaco loader to use the local monaco instance instead of CDN
loader.config({ monaco });

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
        <ThemeWrapper>
            <App />
        </ThemeWrapper>
    </React.StrictMode>
);
