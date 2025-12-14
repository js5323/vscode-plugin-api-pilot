import { useState, useEffect } from 'react';
import { Box, Typography, Button, Chip, Paper, Breadcrumbs } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import SaveIcon from '@mui/icons-material/Save';
import { getVsCodeApi } from '../utils/vscode';
import { ApiExample, ApiRequest, KeyValueItem, ApiRequestBody, ExampleInitialData } from '../types';
import KeyValueTable from '../components/RequestEditor/KeyValueTable';
import BodyEditor from '../components/RequestEditor/BodyEditor';

const vscode = getVsCodeApi();

export default function ExampleEditor() {
    const [example, setExample] = useState<ApiExample | null>(null);
    const [parentRequest, setParentRequest] = useState<ApiRequest | null>(null);
    const [pathInfo, setPathInfo] = useState<{ path: { id: string; name: string }[]; parentName: string }>({
        path: [],
        parentName: ''
    });

    // Request config state for the example
    const [requestParams, setRequestParams] = useState<KeyValueItem[]>([]);
    const [requestHeaders, setRequestHeaders] = useState<KeyValueItem[]>([]);
    const [requestBody, setRequestBody] = useState<ApiRequestBody>({ type: 'none' });

    useEffect(() => {
        // Get initial data from window
        const initialData = window.initialData;

        // Type guard for ExampleInitialData
        const isExampleData = (data: unknown): data is ExampleInitialData => {
            return data !== null && typeof data === 'object' && 'example' in data;
        };

        if (initialData && isExampleData(initialData)) {
            setPathInfo({
                path: initialData._folderPath || [],
                parentName: initialData._parentRequestName || ''
            });

            if (initialData.example) {
                setExample(initialData.example);
                setParentRequest(initialData.parentRequest || null);

                // Initialize request config from example or defaults
                const req = initialData.example.request || {};
                setRequestParams(req.queryParams || []);
                setRequestHeaders(req.headers || []);
                setRequestBody(req.body || { type: 'none' });
            } else {
                setExample(null);
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
                queryParams: requestParams,
                headers: requestHeaders,
                body: requestBody
            };
            vscode.postMessage({ type: 'openRequest', payload: requestToRun });
        }
    };

    const handleSave = () => {
        // We need to save the example updates back to the collection
        // This requires sending a message to update the example in the global state
        if (parentRequest && example) {
            const updatedExample = {
                ...example,
                request: {
                    queryParams: requestParams,
                    headers: requestHeaders,
                    body: requestBody
                }
            };
            // We need a way to save this. SidebarProvider handles 'saveCollections'.
            // But we need to update the specific example in the tree.
            // Usually, we modify the collection and save it.
            // Since we don't have the full collection tree here, we might need a specific 'updateExample' message
            // or just rely on the user manually saving?
            // The prompt didn't explicitly ask for "Save Example changes", but "Example supports modifying".
            // If we modify, we probably want to save or at least use it for "Try".
            // For now, "Try" uses the modified values.
            // Let's implement a save if we can, or just keep it in memory for "Try".
            // Given "Example supports modifying request parameters", persistence is implied.
            // I'll emit an 'updateExample' message.
            vscode.postMessage({
                type: 'updateExample',
                payload: {
                    requestId: parentRequest.id,
                    example: updatedExample
                }
            });
        }
    };

    if (!example) {
        return <Box sx={{ p: 3 }}>Loading example...</Box>;
    }

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb" sx={{ mb: 1 }}>
                    {pathInfo.path.map((folder: { id: string; name: string }) => (
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

                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" sx={{ mr: 2 }}>
                        {example.name}
                    </Typography>
                    <Chip
                        label={example.status}
                        color={example.status >= 200 && example.status < 300 ? 'success' : 'error'}
                        size="small"
                        sx={{ mr: 2 }}
                    />
                    <Box sx={{ flexGrow: 1 }} />
                    <Button variant="outlined" startIcon={<SaveIcon />} onClick={handleSave} sx={{ mr: 1 }}>
                        Save
                    </Button>
                    <Button
                        variant="contained"
                        startIcon={<PlayArrowIcon />}
                        onClick={handleTry}
                        disabled={!parentRequest}
                    >
                        Try
                    </Button>
                </Box>
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
                <Box sx={{ mb: 4 }}>
                    <KeyValueTable items={requestParams} onChange={setRequestParams} title="Query Params" />
                </Box>

                <Box sx={{ mb: 4 }}>
                    <KeyValueTable
                        items={requestHeaders}
                        onChange={setRequestHeaders}
                        title="Headers"
                        enablePresets={true}
                    />
                </Box>

                <Box sx={{ mb: 4 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Request Body
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 0 }}>
                        <BodyEditor body={requestBody} onChange={setRequestBody} />
                    </Paper>
                </Box>

                <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                        Response Body
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 0, minHeight: '100px', maxHeight: '400px', overflow: 'hidden' }}>
                        <Box
                            component="pre"
                            sx={{
                                m: 0,
                                p: 2,
                                height: '100%',
                                maxHeight: '400px',
                                overflow: 'auto',
                                fontSize: '0.875rem',
                                fontFamily: 'Consolas, Monaco, "Andale Mono", "Ubuntu Mono", monospace'
                            }}
                        >
                            {example.body || 'No content'}
                        </Box>
                    </Paper>
                </Box>
            </Box>
        </Box>
    );
}
