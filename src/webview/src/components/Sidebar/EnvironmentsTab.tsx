import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import SidebarSearch from './SidebarSearch';

export default function EnvironmentsTab() {
    const [searchTerm, setSearchTerm] = useState('');

    const handleCreateEnvironment = () => {
        console.log('Create Environment');
        // TODO: Implement create environment logic
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
             <SidebarSearch 
                activeTab="environments" 
                searchTerm={searchTerm} 
                setSearchTerm={setSearchTerm} 
                onAction={handleCreateEnvironment}
            />
            <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary', flexGrow: 1, overflow: 'auto' }}>
                <Typography variant="body2">No environments active.</Typography>
                <Button size="small" sx={{ mt: 1 }} onClick={handleCreateEnvironment}>Create Environment</Button>
            </Box>
        </Box>
    );
}
