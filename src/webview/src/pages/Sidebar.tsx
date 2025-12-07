import { useState } from 'react';
import { Box, Stack } from '@mui/material';
import SidebarNav from '../components/Sidebar/SidebarNav';
import SidebarFooter from '../components/Sidebar/SidebarFooter';
import CollectionsTab from '../components/Sidebar/CollectionsTab';
import HistoryTab from '../components/Sidebar/HistoryTab';
import { getVsCodeApi } from '../utils/vscode';

const vscode = getVsCodeApi();

export default function Sidebar() {
    const [activeTab, setActiveTab] = useState<'collections' | 'history'>('collections');

    const handleImportClick = () => {
        vscode.postMessage({
            type: 'openImport'
        });
    };

    const handleSettingsClick = () => {
        vscode.postMessage({
            type: 'openSettings'
        });
    };

    return (
        <Stack sx={{ height: '100vh', bgcolor: 'background.default' }}>
            <Stack direction={'column'} flex={1} sx={{ overflow: 'hidden' }}>
                {/* Left Navigation Rail */}
                <SidebarNav activeTab={activeTab} setActiveTab={setActiveTab} />

                {/* Right Content Area */}
                <Box
                    sx={{
                        flexGrow: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden'
                    }}
                >
                    {/* Main List Content */}
                    <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                        {activeTab === 'collections' && <CollectionsTab />}
                        {activeTab === 'history' && <HistoryTab />}
                    </Box>
                </Box>
            </Stack>

            {/* Footer: Workspace & Actions */}
            <SidebarFooter onImportClick={handleImportClick} onSettingsClick={handleSettingsClick} />
        </Stack>
    );
}
