import { useState } from 'react';
import { List, Box } from '@mui/material';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import RequestItem from './RequestItem';
import { MOCK_HISTORY } from '../../mockData';
import { getVsCodeApi } from '../../utils/vscode';
import SidebarSearch from './SidebarSearch';

const vscode = getVsCodeApi();

export default function HistoryTab() {
    const [searchTerm, setSearchTerm] = useState('');

    const handleClearHistory = () => {
         // TODO: Implement clear history logic
         console.log("Clear History");
    };

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
                <List dense>
                    {MOCK_HISTORY.map((req) => (
                        <RequestItem 
                            key={req.id} 
                            request={req as unknown as import('../../types').ApiRequest} 
                            onClick={() => vscode.postMessage({ type: 'openRequest', payload: req })} 
                        />
                    ))}
                </List>
            </Box>
        </Box>
    );
}
