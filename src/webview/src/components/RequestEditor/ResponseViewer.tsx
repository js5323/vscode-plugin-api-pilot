import { useState } from 'react';
import {
    Box,
    Typography,
    Tooltip,
    IconButton,
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    List,
    ListItem,
    ListItemText,
    ListItemButton
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import HistoryIcon from '@mui/icons-material/History';
import Editor from '@monaco-editor/react';
import { useVsCodeTheme } from '../../hooks/useVsCodeTheme';

interface ResponseViewerProps {
    response: any;
    loading: boolean;
    history?: any[];
    onSelectHistory?: (item: any) => void;
}

export default function ResponseViewer({ response, loading, history = [], onSelectHistory }: ResponseViewerProps) {
    const theme = useVsCodeTheme();
    const [historyOpen, setHistoryOpen] = useState(false);

    const copyToClipboard = () => {
        if (response) {
            const text =
                typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data);
            navigator.clipboard.writeText(text);
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp).toLocaleString();
    };

    return (
        <Box
            sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                bgcolor: 'background.default',
                overflow: 'hidden'
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
                    <Tooltip title="Response History">
                        <span>
                            <IconButton
                                size="small"
                                onClick={() => setHistoryOpen(true)}
                                disabled={!history || history.length === 0}
                            >
                                <HistoryIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                    <Tooltip title="Copy Response">
                        <span>
                            <IconButton size="small" onClick={copyToClipboard} disabled={!response}>
                                <ContentCopyIcon fontSize="small" />
                            </IconButton>
                        </span>
                    </Tooltip>
                </Box>
            </Box>

            <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Response History</DialogTitle>
                <DialogContent>
                    <List>
                        {history.map((item, index) => (
                            <ListItem
                                key={index}
                                disablePadding
                                divider
                                secondaryAction={
                                    <Typography variant="caption" color="text.secondary">
                                        {item.time}ms / {item.size}B
                                    </Typography>
                                }
                            >
                                <ListItemButton
                                    onClick={() => {
                                        if (onSelectHistory) onSelectHistory(item);
                                        setHistoryOpen(false);
                                    }}
                                >
                                    <ListItemText
                                        primary={`Status: ${item.status}`}
                                        secondary={formatDate(item.timestamp || Date.now())}
                                    />
                                </ListItemButton>
                            </ListItem>
                        ))}
                    </List>
                </DialogContent>
            </Dialog>

            {loading ? (
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        flexDirection: 'column',
                        gap: 2
                    }}
                >
                    <CircularProgress />
                    <Typography variant="body2" color="text.secondary">
                        Sending Request...
                    </Typography>
                </Box>
            ) : response ? (
                <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <Editor
                        height="100%"
                        theme={theme}
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
    );
}
