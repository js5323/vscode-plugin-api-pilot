import { useState } from 'react';
import { Box, Stack } from '@mui/material';
import SidebarNav from '../components/Sidebar/SidebarNav';
import WorkspaceHeader from '../components/Sidebar/WorkspaceHeader';
import CollectionsTab from '../components/Sidebar/CollectionsTab';
import EnvironmentsTab from '../components/Sidebar/EnvironmentsTab';
import HistoryTab from '../components/Sidebar/HistoryTab';

export default function Sidebar() {
    const [activeTab, setActiveTab] = useState<'collections' | 'environments' | 'history'>('collections');

    return (
        <Stack sx={{ height: '100vh', bgcolor: 'background.default' }}>
            {/* Header: Workspace & Actions */}
            <WorkspaceHeader />

            <Stack direction={'column'} flex={1}>
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
                        {activeTab === 'environments' && <EnvironmentsTab />}
                        {activeTab === 'history' && <HistoryTab />}
                    </Box>
                </Box>
            </Stack>
        </Stack>
    );
}
