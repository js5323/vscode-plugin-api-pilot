import { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip, Paper, Breadcrumbs } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import { getVsCodeApi } from '../utils/vscode';
import { ApiExample, ApiRequest } from '../types';

const vscode = getVsCodeApi();

export default function ExampleEditor() {
    const [example, setExample] = useState<ApiExample | null>(null);
    const [parentRequest, setParentRequest] = useState<ApiRequest | null>(null);
    const [pathInfo, setPathInfo] = useState<{ path: any[]; parentName: string }>({ path: [], parentName: '' });

    useEffect(() => {
        // Get initial data from window
        const initialData = (window as any).initialData;
        if (initialData) {
            setPathInfo({
                path: initialData._folderPath || [],
                parentName: initialData._parentRequestName || ''
            });

            if (initialData.example) {
                setExample(initialData.example);
                setParentRequest(initialData.parentRequest);
            } else {
                // Fallback if data structure is different
                setExample(initialData);
            }
        }

        const handleMessage = () => {
            // Handle updates if needed
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleTry = () => {
        if (parentRequest && example) {
            const requestToRun = {
                ...parentRequest,
                body: example.body // Apply example body to request
            };
            vscode.postMessage({ type: 'openRequest', payload: requestToRun });
        }
    };

    if (!example) {
        return <Box sx={{ p: 3 }}>Loading example...</Box>;
    }

    return (
        <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 2 }}>
                {pathInfo.path.map((folder: any) => (
                    <Typography key={folder.id} color="text.secondary" variant="body2">
                        {folder.name}
                    </Typography>
                ))}
                {pathInfo.parentName && (
                    <Typography color="text.secondary" variant="body2">
                        {pathInfo.parentName}
                    </Typography>
                )}
                <Typography color="text.primary" variant="body2" fontWeight="bold">
                    {example.name}
                </Typography>
            </Breadcrumbs>

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5" sx={{ mr: 2 }}>
                    {example.name}
                </Typography>
                <Chip
                    label={example.status}
                    color={example.status >= 200 && example.status < 300 ? 'success' : 'error'}
                    size="small"
                />
                <Box sx={{ flexGrow: 1 }} />
                <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={handleTry} disabled={!parentRequest}>
                    Try
                </Button>
            </Box>

            {parentRequest && (
                <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
                    Parent Request: {parentRequest.method} {parentRequest.name}
                </Typography>
            )}

            <Paper sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="subtitle1" gutterBottom>
                    Response Body (Example)
                </Typography>
                <Box
                    component="pre"
                    sx={{
                        bgcolor: 'background.default',
                        p: 2,
                        borderRadius: 1,
                        overflow: 'auto',
                        fontSize: '0.875rem',
                        fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
                    }}
                >
                    {example.body || 'No content'}
                </Box>
            </Paper>
        </Box>
    );
}
