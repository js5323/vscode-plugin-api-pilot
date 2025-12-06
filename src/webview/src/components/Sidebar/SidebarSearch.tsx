import { Paper, IconButton, InputBase, Stack, SvgIconTypeMap } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { OverridableComponent } from '@mui/material/OverridableComponent';

interface SidebarSearchProps {
    activeTab: string;
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    onAction?: () => void;
    ActionIcon?: OverridableComponent<SvgIconTypeMap<{}, "svg">> & { muiName: string };
}

export default function SidebarSearch({ 
    activeTab, 
    searchTerm, 
    setSearchTerm, 
    onAction, 
    ActionIcon = AddIcon 
}: SidebarSearchProps) {
    
    return (
        <Stack direction="row" alignItems="center" sx={{ p: 1, gap: 0.5 }}>
             {onAction && (
                 <IconButton 
                    size="small" 
                    onClick={onAction}
                    sx={{ 
                        p: 0.5,
                        color: 'text.secondary',
                        '&:hover': { color: 'text.primary', bgcolor: 'action.hover' }
                    }}
                >
                    <ActionIcon sx={{ fontSize: '1.1rem' }} />
                </IconButton>
             )}
            <Paper
                variant="outlined"
                sx={{ p: '0px 2px', display: 'flex', alignItems: 'center', bgcolor: 'background.paper', flexGrow: 1, height: 28 }}
            >
                <IconButton sx={{ p: 0.5 }} aria-label="search" disabled>
                    <SearchIcon sx={{ fontSize: '1rem' }} />
                </IconButton>
                <InputBase
                    sx={{ ml: 0.5, flex: 1, fontSize: '0.75rem' }}
                    placeholder={`Search ${activeTab}...`}
                    inputProps={{ 'aria-label': 'search' }}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Paper>
        </Stack>
    );
}
