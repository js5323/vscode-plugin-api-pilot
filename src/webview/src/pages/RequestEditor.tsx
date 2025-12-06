import { useState, useEffect } from 'react';
import { 
  Box, 
  TextField, 
  Select, 
  MenuItem, 
  Button, 
  Tabs, 
  Tab, 
  Typography,
  Paper,
  CircularProgress,
  Grid
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CurlImportDialog from '../components/CurlImportDialog';
import { getVsCodeApi } from '../utils/vscode';

// Acquire the VS Code API
const vscode = getVsCodeApi();

// Placeholder for method selection
const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

export default function RequestEditor() {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [importOpen, setImportOpen] = useState(false);

  useEffect(() => {
      // Check for initial data injected by the extension
      const initialData = (window as any).initialData;
      if (initialData) {
          console.log('Initial Data:', initialData);
          setMethod(initialData.method || 'GET');
          setUrl(initialData.url || '');
      }

      const handleMessage = (event: any) => {
          const message = event.data;
          if (message.type === 'executeResponse') {
              setResponse(message.payload);
              setLoading(false);
          } else if (message.type === 'parseCurlSuccess') {
              const data = message.payload;
              setMethod(data.method.toUpperCase());
              setUrl(data.url);
              // TODO: Set headers and body
              console.log('Imported cURL:', data);
          }
      };

      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSendRequest = () => {
    if (!url) {
        // Basic validation
        return; 
    }
    setLoading(true);
    setResponse(null);
    
    vscode.postMessage({
        type: 'executeRequest',
        payload: {
            method,
            url,
            // TODO: Add params, headers, body
        }
    });
  };

  const handleExport = () => {
      let cmd = `curl -X ${method} "${url}"`;
      // TODO: Add headers and body
      
      navigator.clipboard.writeText(cmd).then(() => {
          vscode.postMessage({ type: 'onInfo', value: 'cURL copied to clipboard!' });
      });
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', p: 2 }}>
      <CurlImportDialog 
        open={importOpen} 
        onClose={() => setImportOpen(false)} 
      />
      {/* Header / Request Bar */}
      <Paper sx={{ p: 2, mb: 2 }} elevation={2}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12 }} sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button 
                startIcon={<CloudUploadIcon />} 
                size="small" 
                onClick={() => setImportOpen(true)}
              >
                  Import cURL
              </Button>
              <Button 
                startIcon={<ContentCopyIcon />} 
                size="small" 
                onClick={handleExport}
              >
                  Export cURL
              </Button>
          </Grid>
          <Grid size={{ xs: 3, sm: 2 }}>
             <Select
                fullWidth
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                size="small"
              >
                {HTTP_METHODS.map((m) => (
                  <MenuItem key={m} value={m}>{m}</MenuItem>
                ))}
              </Select>
          </Grid>
          <Grid size={{ xs: 7, sm: 8 }}>
            <TextField 
              fullWidth 
              placeholder="Enter URL" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 2, sm: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              fullWidth
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PlayArrowIcon />}
              onClick={handleSendRequest}
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Main Content Area: Request Config & Response */}
      <Grid container spacing={2} sx={{ flexGrow: 1, overflow: 'hidden' }}>
        {/* Left Panel: Request Configuration */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Paper sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Params" />
              <Tab label="Headers" />
              <Tab label="Body" />
              <Tab label="Auth" />
            </Tabs>
            <Box sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
              {activeTab === 0 && <Typography>Query Params Config (Coming Soon)</Typography>}
              {activeTab === 1 && <Typography>Headers Config (Coming Soon)</Typography>}
              {activeTab === 2 && <Typography>Body Config (Coming Soon)</Typography>}
              {activeTab === 3 && <Typography>Auth Config (Coming Soon)</Typography>}
            </Box>
          </Paper>
        </Grid>

        {/* Right Panel: Response Viewer */}
        <Grid size={{ xs: 12, md: 6 }} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
           <Paper sx={{ flexGrow: 1, p: 2, overflow: 'auto' }}>
              <Typography variant="h6" gutterBottom>Response</Typography>
              {response ? (
                  <>
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                        <Typography variant="caption" color={response.status >= 400 ? 'error' : 'success.main'}>
                            Status: {response.status} {response.statusText}
                        </Typography>
                        <Typography variant="caption">Time: {response.duration} ms</Typography>
                        <Typography variant="caption">Size: {(response.size / 1024).toFixed(2)} KB</Typography>
                    </Box>
                    <Box sx={{ 
                        border: '1px solid #333', 
                        borderRadius: 1, 
                        p: 1, 
                        flexGrow: 1,
                        backgroundColor: '#1e1e1e',
                        fontFamily: 'monospace',
                        whiteSpace: 'pre-wrap',
                        overflow: 'auto',
                        maxHeight: 'calc(100vh - 250px)'
                    }}>
                        {JSON.stringify(response.data, null, 2)}
                    </Box>
                  </>
              ) : (
                <Box sx={{ 
                    border: '1px solid #333', 
                    borderRadius: 1, 
                    p: 1, 
                    minHeight: '200px',
                    backgroundColor: '#1e1e1e',
                    fontFamily: 'monospace'
                }}>
                    <Typography color="text.secondary">Hit Send to see response...</Typography>
                </Box>
              )}
           </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
