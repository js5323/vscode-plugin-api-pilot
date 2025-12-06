import { ListItemButton, Typography, Paper, Box } from '@mui/material';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import LayersIcon from '@mui/icons-material/Layers';
import HistoryIcon from '@mui/icons-material/History';

interface NavRailItemProps {
    icon: React.ReactNode;
    label: string;
    active: boolean;
    onClick: () => void;
}

function NavRailItem({ icon, label, active, onClick }: NavRailItemProps) {
    return (
        <ListItemButton 
            onClick={onClick}
            sx={{ 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center',
                py: 1.5,
                px: 0.5,
                flex: 0,
                position: 'relative',
                color: active ? 'primary.main' : 'text.secondary',
                '&:hover': {
                    backgroundColor: 'action.hover',
                },
                '&::before': active ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 3,
                    backgroundColor: 'primary.main',
                } : {}
            }}
        >
            {icon}
            <Typography variant="caption" sx={{ mt: 0.5, fontSize: '0.65rem', fontWeight: active ? 'bold' : 'normal' }}>
                {label}
            </Typography>
        </ListItemButton>
    );
}

interface SidebarNavProps {
    activeTab: 'collections' | 'environments' | 'history';
    setActiveTab: (tab: 'collections' | 'environments' | 'history') => void;
}

export default function SidebarNav({ activeTab, setActiveTab }: SidebarNavProps) {
    return (
        <Paper 
            elevation={0} 
            sx={{ 
                width: 80, 
                display: 'flex', 
                flexDirection: 'column', 
                borderRight: 1, 
                borderColor: 'divider',
                bgcolor: 'background.paper',
                zIndex: 1
            }}
        >
            <NavRailItem 
                icon={<CollectionsBookmarkIcon fontSize="small" />} 
                label="Collections" 
                active={activeTab === 'collections'} 
                onClick={() => setActiveTab('collections')} 
            />
            <NavRailItem 
                icon={<LayersIcon fontSize="small" />} 
                label="Environments" 
                active={activeTab === 'environments'} 
                onClick={() => setActiveTab('environments')} 
            />
            <NavRailItem 
                icon={<HistoryIcon fontSize="small" />} 
                label="History" 
                active={activeTab === 'history'} 
                onClick={() => setActiveTab('history')} 
            />
        </Paper>
    );
}
