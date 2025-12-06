import { Box, Typography, Button } from '@mui/material';

export default function WorkspaceHeader() {
    return (
        <Box sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mr: 1 }}>
                    Personal Workspace
                </Typography>
            </Box>
            <Box>
                <Button 
                    size="small" 
                    variant="contained" 
                    color="inherit" 
                    sx={{ minWidth: 'auto', px: 1.5, py: 0.2, fontSize: '0.7rem', mr: 1, textTransform: 'none', bgcolor: 'action.selected' }}
                >
                    Import
                </Button>
            </Box>
        </Box>
    );
}
