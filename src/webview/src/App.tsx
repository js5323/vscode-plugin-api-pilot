import Sidebar from './pages/Sidebar';
import RequestEditor from './pages/RequestEditor';
import ExampleEditor from './pages/ExampleEditor';
import EnvironmentEditor from './pages/EnvironmentEditor';

// Get the view type from the window object (injected by the extension)
const viewType = (window as any).viewType || 'sidebar';

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
  
  return <Sidebar />;
}

export default App;
