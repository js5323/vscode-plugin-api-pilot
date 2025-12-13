import Sidebar from './pages/Sidebar';
import RequestEditor from './pages/RequestEditor';
import ExampleEditor from './pages/ExampleEditor';
import EnvironmentEditor from './pages/EnvironmentEditor';
import ImportPage from './pages/ImportPage';
import SettingsPage from './pages/SettingsPage';

// Get the view type from the window object (injected by the extension)
const viewType = (window as unknown as { viewType?: string }).viewType || 'sidebar';

function App() {
    if (viewType === 'editor') {
        return <RequestEditor />;
    }
    if (viewType === 'example-editor') {
        return <ExampleEditor />;
    }
    if (viewType === 'environment-editor') {
        return <EnvironmentEditor />;
    }
    if (viewType === 'import') {
        return <ImportPage />;
    }
    if (viewType === 'settings') {
        return <SettingsPage />;
    }

    return <Sidebar />;
}

export default App;
