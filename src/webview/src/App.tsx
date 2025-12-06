import Sidebar from './pages/Sidebar';
import RequestEditor from './pages/RequestEditor';

// Get the view type from the window object (injected by the extension)
const viewType = (window as any).viewType || 'sidebar';

function App() {
  if (viewType === 'editor') {
    return <RequestEditor />;
  }
  
  return <Sidebar />;
}

export default App;
