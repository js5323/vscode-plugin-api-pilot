import { useState, useEffect, useRef } from 'react';
import { Box, Paper, TextField, Button, Select, MenuItem, FormControl } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import { getVsCodeApi } from '../utils/vscode';
import { ApiRequest, ApiRequestBody } from '../types';
import RequestConfig from '../components/RequestEditor/RequestConfig';
import ResponseViewer from '../components/RequestEditor/ResponseViewer';

const vscode = getVsCodeApi();

const migrateRequest = (data: any): ApiRequest => {
    if (!data)
        return {
            id: '',
            name: 'New Request',
            method: 'GET',
            url: '',
            type: 'request',
            headers: [],
            queryParams: [],
            body: { type: 'none' }
        };

    const newData = { ...data };

    // Migrate params -> queryParams
    if (data.params && !Array.isArray(data.params) && !data.queryParams) {
        newData.queryParams = Object.entries(data.params).map(([key, value]) => ({
            id: Math.random().toString(),
            key,
            value: String(value),
            isEnabled: true
        }));
        delete newData.params;
    }

    // Migrate headers (record to array)
    if (data.headers && !Array.isArray(data.headers)) {
        newData.headers = Object.entries(data.headers).map(([key, value]) => ({
            id: Math.random().toString(),
            key,
            value: String(value),
            isEnabled: true
        }));
    }

    // Migrate body
    if (data.body && (typeof data.body === 'string' || (typeof data.body === 'object' && !data.body.type))) {
        if (typeof data.body === 'string') {
            newData.body = { type: 'raw', raw: data.body };
        } else {
            newData.body = { type: 'raw', raw: JSON.stringify(data.body, null, 2) };
        }
    }

    // Ensure arrays exist
    if (!newData.queryParams) newData.queryParams = [];
    if (!newData.headers) newData.headers = [];
    if (!newData.body) newData.body = { type: 'none' };

    return newData as ApiRequest;
};

export default function RequestEditor() {
    const initialData = (window as any).initialData;
    const [request, setRequest] = useState<ApiRequest>(migrateRequest(initialData));
    const [response, setResponse] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');
    const [splitPos, setSplitPos] = useState(50); // percentage
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = () => {
        isDragging.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging.current || !containerRef.current) return;

        const containerRect = containerRef.current.getBoundingClientRect();
        let newPos = 0;

        if (layout === 'vertical') {
            // Vertical layout: Top / Bottom
            const relativeY = e.clientY - containerRect.top;
            newPos = (relativeY / containerRect.height) * 100;
        } else {
            // Horizontal layout: Left / Right
            const relativeX = e.clientX - containerRect.left;
            newPos = (relativeX / containerRect.width) * 100;
        }

        // Clamp between 20% and 80%
        newPos = Math.min(Math.max(newPos, 20), 80);
        setSplitPos(newPos);
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    const toggleLayout = () => {
        setLayout((prev) => (prev === 'vertical' ? 'horizontal' : 'vertical'));
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'executeResponse') {
                setResponse(message.payload);
                setLoading(false);
            } else if (message.type === 'updateRequest') {
                setRequest(migrateRequest(message.payload));
            } else if (message.type === 'fileSelected') {
                const context = message.context;
                if (context && context.type === 'formData' && context.rowId) {
                    setRequest((prev) => {
                        const newFormData =
                            prev.body?.formData?.map((item) =>
                                item.id === context.rowId ? { ...item, value: message.payload } : item
                            ) || [];

                        return {
                            ...prev,
                            body: {
                                ...prev.body,
                                formData: newFormData
                            } as ApiRequestBody
                        };
                    });
                } else {
                    setRequest((prev) => ({
                        ...prev,
                        body: {
                            ...prev.body,
                            type: 'binary',
                            binary: message.payload
                        } as ApiRequestBody
                    }));
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSend = () => {
        setResponse(null);
        setLoading(true);
        vscode.postMessage({ type: 'executeRequest', payload: request });
    };

    const handleSave = () => {
        vscode.postMessage({ type: 'saveRequest', payload: request });
    };

    const handleChange = (field: keyof ApiRequest, value: any) => {
        setRequest((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
            {/* Header / URL Bar */}
            <Paper square sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <FormControl size="small" sx={{ minWidth: 100 }}>
                    <Select
                        value={request.method}
                        onChange={(e) => handleChange('method', e.target.value)}
                        displayEmpty
                    >
                        {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map((method) => (
                            <MenuItem key={method} value={method}>
                                {method}
                            </MenuItem>
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
                    size="medium"
                    sx={{ padding: '8px 16px' }}
                    startIcon={<PlayArrowIcon />}
                    onClick={handleSend}
                    disableElevation
                >
                    Send
                </Button>
                <Button
                    size="medium"
                    sx={{ padding: '8px 16px' }}
                    variant="outlined"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                >
                    Save
                </Button>
            </Paper>

            {/* Main Content Area */}
            <Box
                ref={containerRef}
                sx={{
                    display: 'flex',
                    flexDirection: layout === 'vertical' ? 'column' : 'row',
                    flexGrow: 1,
                    overflow: 'hidden'
                }}
            >
                {/* Request Config */}
                <Box
                    sx={{
                        height: layout === 'vertical' ? `${splitPos}%` : '100%',
                        width: layout === 'horizontal' ? `${splitPos}%` : '100%',
                        overflow: 'hidden'
                    }}
                >
                    <RequestConfig
                        request={request}
                        onChange={handleChange}
                        layout={layout}
                        onLayoutChange={toggleLayout}
                    />
                </Box>

                {/* Separator */}
                <Box
                    onMouseDown={handleMouseDown}
                    sx={{
                        cursor: layout === 'vertical' ? 'row-resize' : 'col-resize',
                        height: layout === 'vertical' ? '4px' : '100%',
                        width: layout === 'horizontal' ? '4px' : '100%',
                        bgcolor: 'divider',
                        zIndex: 1,
                        transition: 'background-color 0.2s',
                        '&:hover': {
                            bgcolor: 'primary.main'
                        }
                    }}
                />

                {/* Response */}
                <Box
                    sx={{
                        height: layout === 'vertical' ? `${100 - splitPos}%` : '100%',
                        width: layout === 'horizontal' ? `${100 - splitPos}%` : '100%',
                        overflow: 'hidden'
                    }}
                >
                    <ResponseViewer response={response} loading={loading} />
                </Box>
            </Box>
        </Box>
    );
}
