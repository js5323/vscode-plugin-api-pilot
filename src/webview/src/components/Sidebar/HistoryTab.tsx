import { useState, useEffect } from 'react';
import { List, Box, Typography } from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RequestItem from './RequestItem';
import { getVsCodeApi } from '../../utils/vscode';
import SidebarSearch from './SidebarSearch';

const vscode = getVsCodeApi();

export default function HistoryTab() {
    const [searchTerm, setSearchTerm] = useState('');
    const [history, setHistory] = useState<any[]>([]);

    useEffect(() => {
        vscode.postMessage({ type: 'getHistory' });

        const handleMessage = (event: MessageEvent) => {
            const msg = event.data;
            if (msg.type === 'updateHistory') {
                setHistory(msg.payload);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleClearHistory = () => {
        vscode.postMessage({ type: 'clearHistory' });
    };

    const filteredHistory = history.filter(
        (req) =>
            (req.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (req.url || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <SidebarSearch
                activeTab="history"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onAction={handleClearHistory}
                ActionIcon={DeleteSweepIcon}
            />
            <Box sx={{ flexGrow: 1, overflow: 'auto', px: 0.5 }}>
                {filteredHistory.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            No history found.
                        </Typography>
                    </Box>
                ) : (
                    <List dense>
                        {filteredHistory.map((req) => (
                            <RequestItem
                                key={req.id}
                                request={req}
                                onClick={() => vscode.postMessage({ type: 'openRequest', payload: req })}
                            />
                        ))}
                    </List>
                )}
            </Box>
        </Box>
    );
}
