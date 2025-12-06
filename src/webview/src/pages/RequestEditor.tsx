import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Tabs, Tab, TextField, Button, Stack, Select, MenuItem, InputLabel, FormControl, Divider, Chip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import { getVsCodeApi } from '../utils/vscode';
import { ApiRequest } from '../types';

const vscode = getVsCodeApi();

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ height: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function RequestEditor() {
    const initialData = (window as any).initialData as ApiRequest;
    const [request, setRequest] = useState<ApiRequest>(initialData || {
        id: '',
        name: 'New Request',
        method: 'GET',
        url: '',
        type: 'request'
    });
    const [tabValue, setTabValue] = useState(0);
    const [response, setResponse] = useState<any>(null);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'executeResponse') {
                setResponse(message.payload);
            } else if (message.type === 'updateRequest') {
                setRequest(message.payload);
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSend = () => {
        setResponse(null);
        vscode.postMessage({ type: 'executeRequest', payload: request });
    };

    const handleChange = (field: keyof ApiRequest, value: any) => {
        setRequest(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Header / URL Bar */}
            <Paper square sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                        value={request.method}
                        onChange={(e) => handleChange('method', e.target.value)}
                        displayEmpty
                    >
                        {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(method => (
                            <MenuItem key={method} value={method}>{method}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField 
                    fullWidth 
                    size="small" 
                    placeholder="Enter request URL" 
                    value={request.url} 
                    onChange={(e) => handleChange('url', e.target.value)}
                />
                <Button 
                    variant="contained" 
                    startIcon={<PlayArrowIcon />} 
                    onClick={handleSend}
                    disableElevation
                >
                    Send
                </Button>
                <Button 
                    variant="outlined" 
                    startIcon={<SaveIcon />}
                >
                    Save
                </Button>
            </Paper>

            {/* Main Content Area */}
            <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden' }}>
                {/* Left: Request Config */}
                <Box sx={{ width: '50%', borderRight: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
                            <Tab label="Params" />
                            <Tab label="Headers" />
                            <Tab label="Body" />
                            <Tab label="Auth" />
                        </Tabs>
                    </Box>
                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <CustomTabPanel value={tabValue} index={0}>
                            <Typography color="text.secondary">Query Params (Coming Soon)</Typography>
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={1}>
                            <Typography color="text.secondary">Headers (Coming Soon)</Typography>
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={2}>
                             <TextField
                                multiline
                                fullWidth
                                minRows={10}
                                placeholder="{}"
                                value={request.body || ''}
                                onChange={(e) => handleChange('body', e.target.value)}
                                sx={{ fontFamily: 'monospace' }}
                            />
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={3}>
                            <Typography color="text.secondary">Authorization (Coming Soon)</Typography>
                        </CustomTabPanel>
                    </Box>
                </Box>

                {/* Right: Response */}
                <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', p: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>Response</Typography>
                    {response ? (
                         <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                            <Stack direction="row" spacing={2} mb={1}>
                                <Chip label={`Status: ${response.status || 'Unknown'}`} size="small" color="primary" />
                                <Typography variant="caption" color="text.secondary">Time: {response.time || '0'}ms</Typography>
                            </Stack>
                            <Divider sx={{ my: 1 }} />
                            <pre style={{ margin: 0, fontSize: '0.85rem' }}>
                                {JSON.stringify(response.data || response, null, 2)}
                            </pre>
                        </Paper>
                    ) : (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexGrow: 1, color: 'text.secondary' }}>
                            Enter URL and click Send
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
