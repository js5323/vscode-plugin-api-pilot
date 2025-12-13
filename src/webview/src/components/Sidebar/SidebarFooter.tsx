import { Box, IconButton, Tooltip } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import InputIcon from '@mui/icons-material/Input';

interface SidebarFooterProps {
    onImportClick: () => void;
    onSettingsClick: () => void;
}

export default function SidebarFooter({ onImportClick, onSettingsClick }: SidebarFooterProps) {
    return (
        <Box
            sx={{
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderTop: 1,
                borderColor: 'divider',
                bgcolor: 'background.paper'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Import">
                    <IconButton size="small" onClick={onImportClick}>
                        <InputIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Tooltip title="Settings" placement="left">
                    <IconButton size="small" onClick={onSettingsClick}>
                        <SettingsIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
            </Box>
        </Box>
    );
}
