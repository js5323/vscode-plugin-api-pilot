import { ListItemButton, Typography, Paper } from '@mui/material';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
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
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                py: 1.5,
                flex: 1,
                gap: 0.5,
                position: 'relative',
                color: active ? 'primary.main' : 'text.secondary',
                '&:hover': {
                    backgroundColor: 'action.hover'
                },
                '&::before': active
                    ? {
                          content: '""',
                          position: 'absolute',
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 2,
                          backgroundColor: 'primary.main'
                      }
                    : {}
            }}
        >
            {icon}
            <Typography variant="caption" sx={{ fontSize: '12px', fontWeight: active ? 'bold' : 'normal' }}>
                {label}
            </Typography>
        </ListItemButton>
    );
}

interface SidebarNavProps {
    activeTab: 'collections' | 'history';
    setActiveTab: (tab: 'collections' | 'history') => void;
}

export default function SidebarNav({ activeTab, setActiveTab }: SidebarNavProps) {
    return (
        <Paper
            elevation={0}
            sx={{
                // width: 80,
                display: 'flex',
                flexDirection: 'row',
                // borderRight: 1,
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
                icon={<HistoryIcon fontSize="small" />}
                label="History"
                active={activeTab === 'history'}
                onClick={() => setActiveTab('history')}
            />
        </Paper>
    );
}
