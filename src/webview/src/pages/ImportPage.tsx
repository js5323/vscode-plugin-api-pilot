import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Paper,
    Alert,
    Snackbar,
    Stack,
    Divider
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { getVsCodeApi } from '../utils/vscode';

const vscode = getVsCodeApi();

interface Collection {
    id: string;
    name: string;
    type: 'folder';
    children: any[];
}

export default function ImportPage() {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [collectionId, setCollectionId] = useState('');
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isNewCollection, setIsNewCollection] = useState(false);
    const [content, setContent] = useState('');
    const [dragActive, setDragActive] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showSuccessOptions, setShowSuccessOptions] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        // Request collections on mount
        vscode.postMessage({ type: 'getCollections' });

        const handleMessage = (event: MessageEvent) => {
            const msg = event.data;
            if (msg.type === 'updateCollections') {
                setCollections(msg.payload);
                // Select first collection by default if available and not creating new
                if (msg.payload.length > 0 && !collectionId && !isNewCollection) {
                    setCollectionId(msg.payload[0].id);
                }
            } else if (msg.type === 'importSuccess') {
                setMessage({ type: 'success', text: 'Import successful!' });
                setShowSuccessOptions(true);
            } else if (msg.type === 'importError') {
                setMessage({ type: 'error', text: msg.message || 'Import failed' });
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const file = e.dataTransfer.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setContent(e.target.result as string);
                }
            };
            reader.readAsText(file);
        }
    }, []);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target?.result) {
                    setContent(e.target.result as string);
                }
            };
            reader.readAsText(file);
        }
        // Reset value so same file can be selected again if needed
        e.target.value = '';
    };

    const handleBoxClick = () => {
        fileInputRef.current?.click();
    };

    const handleImport = () => {
        if ((!isNewCollection && !collectionId) || (isNewCollection && !newCollectionName.trim())) {
            setMessage({ type: 'error', text: 'Please select or create a collection.' });
            return;
        }
        if (!content.trim()) {
            setMessage({ type: 'error', text: 'Please provide content to import.' });
            return;
        }

        vscode.postMessage({
            type: 'importData',
            payload: {
                collectionId: isNewCollection ? null : collectionId,
                newCollectionName: isNewCollection ? newCollectionName : null,
                content
            }
        });
    };

    const handleContinue = () => {
        setShowSuccessOptions(false);
        setContent('');
        setMessage(null);
    };

    const handleExit = () => {
        vscode.postMessage({ type: 'close' });
    };

    if (showSuccessOptions) {
        return (
            <Box
                sx={{
                    p: 4,
                    height: '100vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <Typography variant="h4" gutterBottom color="success.main">
                    Import Successful!
                </Typography>
                <Typography variant="body1" paragraph color="text.secondary">
                    Your requests have been imported to the collection.
                </Typography>
                <Stack direction="row" spacing={3} sx={{ mt: 4 }}>
                    <Button variant="outlined" size="large" onClick={handleContinue}>
                        Continue Import
                    </Button>
                    <Button variant="contained" size="large" onClick={handleExit}>
                        Exit Import Page
                    </Button>
                </Stack>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, maxWidth: 800, mx: 'auto', height: '100vh', boxSizing: 'border-box', overflow: 'auto' }}>
            <Typography variant="h4" gutterBottom>
                Import Requests
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                Import your API requests from OpenAPI, Swagger, Postman, or cURL.
            </Typography>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Stack spacing={3}>
                    <FormControl fullWidth>
                        <InputLabel>Target Collection</InputLabel>
                        <Select
                            value={isNewCollection ? 'new' : collectionId}
                            label="Target Collection"
                            onChange={(e) => {
                                if (e.target.value === 'new') {
                                    setIsNewCollection(true);
                                    setCollectionId('');
                                } else {
                                    setIsNewCollection(false);
                                    setCollectionId(e.target.value);
                                }
                            }}
                        >
                            <MenuItem value="new">
                                <em>+ Create New Collection</em>
                            </MenuItem>
                            {collections.map((col) => (
                                <MenuItem key={col.id} value={col.id}>
                                    {col.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>

                    {isNewCollection && (
                        <TextField
                            label="New Collection Name"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            fullWidth
                            required
                        />
                    )}

                    <Divider />

                    <Box
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={handleBoxClick}
                        sx={{
                            border: '2px dashed',
                            borderColor: dragActive ? 'primary.main' : 'divider',
                            borderRadius: 2,
                            p: 4,
                            textAlign: 'center',
                            bgcolor: dragActive ? 'action.hover' : 'background.paper',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            '&:hover': {
                                borderColor: 'primary.main',
                                bgcolor: 'action.hover'
                            }
                        }}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                            accept=".json,.yaml,.yml,.txt"
                        />
                        <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                        <Typography variant="h6" color="text.primary">
                            Drag and drop file here or click to select
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Supports JSON, YAML, TXT
                        </Typography>
                    </Box>

                    <TextField
                        label="Import Content"
                        multiline
                        rows={12}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Paste your OpenAPI definition, Postman collection JSON, or cURL commands here..."
                        fullWidth
                        variant="outlined"
                        sx={{ fontFamily: 'monospace' }}
                    />

                    <Button variant="contained" size="large" onClick={handleImport} disabled={!content.trim()}>
                        Import
                    </Button>
                </Stack>
            </Paper>

            <Snackbar
                open={!!message}
                autoHideDuration={6000}
                onClose={() => setMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setMessage(null)} severity={message?.type || 'info'} sx={{ width: '100%' }}>
                    {message?.text}
                </Alert>
            </Snackbar>
        </Box>
    );
}
