import { useState, useEffect, useRef } from 'react';
import { Box, IconButton, Tooltip, Typography, Select, MenuItem, FormControl, InputLabel } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import { getVsCodeApi } from '../../utils/vscode';
import { ApiRequest } from '../../types';
import Editor from '@monaco-editor/react';
import { useVsCodeTheme } from '../../hooks/useVsCodeTheme';

interface RightSidebarProps {
    request: ApiRequest;
}

const vscode = getVsCodeApi();

export default function RightSidebar({ request }: RightSidebarProps) {
    const [expanded, setExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState<'code' | null>(null);
    const [language, setLanguage] = useState('curl');
    const [snippet, setSnippet] = useState('');
    const [width, setWidth] = useState(300);
    const theme = useVsCodeTheme();
    const isResizing = useRef(false);

    useEffect(() => {
        if (expanded && activeTab === 'code') {
            generateSnippet();
        }
    }, [request, language, expanded, activeTab]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'codeSnippetGenerated') {
                setSnippet(message.payload);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleMouseMove = (e: MouseEvent) => {
        if (!isResizing.current) return;
        // Calculate width based on mouse position from right edge of screen?
        // Or simply: e.clientX is where the mouse is.
        // The RightSidebar is anchored to the right.
        // Structure: [Main] [Icons] [Resizer] [Content]
        // Actually, RequestEditor renders: [Main] [RightSidebar].
        // RightSidebar renders: [Icons] [Content].
        // So visually: [Main] | [Icons] | [Content] | (Edge of screen)
        // If I drag Resizer (between Icons and Content), I am changing Content Width.
        // e.clientX increases -> move right -> Content Width decreases.
        // e.clientX decreases -> move left -> Content Width increases.
        // Wait, if Resizer is at [Icons]|[Resizer]|[Content].
        // If I move mouse right, Resizer moves right, Content gets smaller?
        // Let's assume Content is on the right.

        // We need the X position of the Right edge of the window.
        const windowWidth = document.body.clientWidth;
        const newWidth = windowWidth - e.clientX;
        // But e.clientX is at the resizer.
        // Distance from Resizer to Right Edge = Content Width.
        setWidth(Math.max(200, Math.min(newWidth, 800)));
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'default';
    };

    const startResizing = (e: React.MouseEvent) => {
        e.preventDefault();
        isResizing.current = true;
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = 'col-resize';
    };

    const generateSnippet = () => {
        vscode.postMessage({
            type: 'generateCodeSnippet',
            payload: {
                request,
                language
            }
        });
    };

    const handleIconClick = (tab: 'code') => {
        if (activeTab === tab && expanded) {
            setExpanded(false);
            setActiveTab(null);
        } else {
            setExpanded(true);
            setActiveTab(tab);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(snippet);
        // Could show toast
    };

    return (
        <Box sx={{ display: 'flex', height: '100%', borderLeft: 1, borderColor: 'divider' }}>
            {/* Icon Strip */}
            <Box
                sx={{
                    width: 48,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    pt: 1,
                    bgcolor: 'background.paper',
                    borderRight: expanded ? 1 : 0,
                    borderColor: 'divider'
                }}
            >
                <Tooltip title="Code Snippet" placement="left">
                    <IconButton
                        onClick={() => handleIconClick('code')}
                        color={activeTab === 'code' ? 'primary' : 'default'}
                    >
                        <CodeIcon />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Resizer */}
            {expanded && (
                <Box
                    onMouseDown={startResizing}
                    sx={{
                        width: 4,
                        cursor: 'col-resize',
                        bgcolor: 'divider',
                        transition: 'background-color 0.2s',
                        '&:hover': {
                            bgcolor: 'primary.main'
                        }
                    }}
                />
            )}

            {/* Content Panel */}
            {expanded && (
                <Box sx={{ width: width, display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
                    <Box
                        sx={{
                            p: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: 1,
                            borderColor: 'divider'
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight="bold">
                            Code Snippet
                        </Typography>
                        <IconButton size="small" onClick={() => setExpanded(false)}>
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>

                    {activeTab === 'code' && (
                        <Box sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <FormControl size="small" fullWidth sx={{ mb: 2 }}>
                                <InputLabel>Language</InputLabel>
                                <Select value={language} label="Language" onChange={(e) => setLanguage(e.target.value)}>
                                    <MenuItem value="curl">cURL</MenuItem>
                                    <MenuItem value="javascript">JavaScript Fetch</MenuItem>
                                    <MenuItem value="javascript-xhr">JavaScript XHR</MenuItem>
                                    <MenuItem value="axios">Axios</MenuItem>
                                    <MenuItem value="node">NodeJs Request</MenuItem>
                                </Select>
                            </FormControl>

                            <Box sx={{ position: 'relative', flexGrow: 1, border: 1, borderColor: 'divider' }}>
                                <Editor
                                    height="100%"
                                    language={language === 'curl' ? 'shell' : 'javascript'}
                                    value={snippet}
                                    theme={theme}
                                    options={{
                                        minimap: { enabled: false },
                                        readOnly: true,
                                        fontSize: 12,
                                        scrollBeyondLastLine: false
                                    }}
                                />
                                <IconButton
                                    sx={{
                                        position: 'absolute',
                                        top: 8,
                                        right: 8,
                                        bgcolor: 'background.paper',
                                        boxShadow: 1,
                                        '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                    size="small"
                                    onClick={handleCopy}
                                >
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                    )}
                </Box>
            )}
        </Box>
    );
}
