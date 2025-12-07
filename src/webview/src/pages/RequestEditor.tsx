import { useState, useEffect, useRef } from 'react';
import {
    Box,
    Typography,
    Paper,
    Tabs,
    Tab,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    IconButton,
    Tooltip
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit';
import HorizontalSplitIcon from '@mui/icons-material/HorizontalSplit';
import Editor from '@monaco-editor/react';
import { getVsCodeApi } from '../utils/vscode';
import { ApiRequest, ApiRequestBody, KeyValueItem } from '../types';
import KeyValueTable from '../components/RequestEditor/KeyValueTable';
import BodyEditor from '../components/RequestEditor/BodyEditor';

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
            {value === index && <Box sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>{children}</Box>}
        </div>
    );
}

export default function RequestEditor() {
    const initialData = (window as any).initialData;
    const [request, setRequest] = useState<ApiRequest>(migrateRequest(initialData));
    const [tabValue, setTabValue] = useState(0);
    const [response, setResponse] = useState<any>(null);
    const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');
    const [splitPos, setSplitPos] = useState(50); // percentage
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    const handleMouseDown = (e: React.MouseEvent) => {
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

    const copyToClipboard = () => {
        if (response) {
            const text =
                typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data);
            navigator.clipboard.writeText(text);
        }
    };

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'executeResponse') {
                setResponse(message.payload);
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
        vscode.postMessage({ type: 'executeRequest', payload: request });
    };

    const handleSave = () => {
        vscode.postMessage({ type: 'saveRequest', payload: request });
    };

    const handleChange = (field: keyof ApiRequest, value: any) => {
        setRequest((prev) => ({ ...prev, [field]: value }));
    };

    const handleParamsChange = (items: KeyValueItem[]) => {
        handleChange('queryParams', items);
    };

    const handleHeadersChange = (items: KeyValueItem[]) => {
        handleChange('headers', items);
    };

    const handleBodyChange = (body: ApiRequestBody) => {
        handleChange('body', body);
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
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                        <Tabs
                            value={tabValue}
                            onChange={(_, v) => setTabValue(v)}
                            variant="scrollable"
                            scrollButtons="auto"
                            sx={{ minHeight: 48, flexGrow: 1 }}
                        >
                            <Tab label="Docs" />
                            <Tab label="Params" />
                            <Tab label="Authorization" />
                            <Tab label="Headers" />
                            <Tab label="Body" />
                            <Tab label="Scripts" />
                            <Tab label="Tests" />
                            <Tab label="Settings" />
                        </Tabs>
                        <Tooltip title={`Switch to ${layout === 'vertical' ? 'Horizontal' : 'Vertical'} Layout`}>
                            <IconButton onClick={toggleLayout} size="small" sx={{ mr: 1 }}>
                                {layout === 'vertical' ? <HorizontalSplitIcon /> : <VerticalSplitIcon />}
                            </IconButton>
                        </Tooltip>
                    </Box>
                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <CustomTabPanel value={tabValue} index={0}>
                            <Typography color="text.secondary">Documentation (Coming Soon)</Typography>
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={1}>
                            <KeyValueTable
                                items={request.queryParams || []}
                                onChange={handleParamsChange}
                                title="Query Params"
                            />
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={2}>
                            <Typography color="text.secondary">Authorization (Coming Soon)</Typography>
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={3}>
                            <KeyValueTable
                                items={request.headers || []}
                                onChange={handleHeadersChange}
                                title="Headers"
                                enablePresets={true}
                            />
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={4}>
                            <BodyEditor body={request.body || { type: 'none' }} onChange={handleBodyChange} />
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={5}>
                            <Typography color="text.secondary">Scripts (Coming Soon)</Typography>
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={6}>
                            <Typography color="text.secondary">Tests (Coming Soon)</Typography>
                        </CustomTabPanel>
                        <CustomTabPanel value={tabValue} index={7}>
                            <Typography color="text.secondary">Settings (Coming Soon)</Typography>
                        </CustomTabPanel>
                    </Box>
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
                        display: 'flex',
                        flexDirection: 'column',
                        bgcolor: 'background.default'
                    }}
                >
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            p: 1,
                            borderBottom: 1,
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="subtitle2">Response</Typography>
                        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                            <Typography variant="caption" color="text.secondary">
                                Status: {response ? response.status : '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Time: {response ? response.time + 'ms' : '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Size: {response ? response.size + 'B' : '-'}
                            </Typography>
                            <Tooltip title="Copy Response">
                                <IconButton size="small" onClick={copyToClipboard} disabled={!response}>
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </Box>
                    </Box>
                    {response ? (
                        <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                            <Editor
                                height="100%"
                                language="json"
                                value={
                                    typeof response.data === 'object'
                                        ? JSON.stringify(response.data, null, 2)
                                        : String(response.data)
                                }
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'on',
                                    automaticLayout: true
                                }}
                            />
                        </Box>
                    ) : (
                        <Box
                            sx={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexGrow: 1,
                                color: 'text.secondary'
                            }}
                        >
                            <Typography variant="body1">Enter the URL and click Send to get a response</Typography>
                        </Box>
                    )}
                </Box>
            </Box>
        </Box>
    );
}
