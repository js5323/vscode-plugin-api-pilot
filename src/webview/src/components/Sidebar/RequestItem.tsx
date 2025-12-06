import { ListItem, ListItemButton, ListItemText, Box, Chip, IconButton, Menu, MenuItem, ListItemIcon, Divider, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button, Collapse, List } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import CodeIcon from '@mui/icons-material/Code';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useState } from 'react';
import { METHOD_COLORS } from '../../constants';
import { ApiRequest } from '../../types';

interface RequestItemProps {
    request: ApiRequest;
    onClick: () => void;
    onDelete?: (id: string) => void;
    onRename?: (id: string, newName: string) => void;
    onDuplicate?: (id: string) => void;
    onShare?: (id: string) => void;
    onAddExample?: (id: string) => void;
}

export default function RequestItem({ request, onClick, onDelete, onRename, onDuplicate, onShare, onAddExample }: RequestItemProps) {
    const [hover, setHover] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState(request.name);
    const [expanded, setExpanded] = useState(false);

    const menuOpen = Boolean(anchorEl);
    const hasExamples = request.examples && request.examples.length > 0;

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setAnchorEl(null);
    };

    const handleRenameOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNewName(request.name);
        setRenameDialogOpen(true);
        handleMenuClose();
    };

    const handleRenameSubmit = () => {
        if (onRename && newName.trim()) {
            onRename(request.id, newName.trim());
        }
        setRenameDialogOpen(false);
    };

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDuplicate) {
            onDuplicate(request.id);
        }
        handleMenuClose();
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onShare) onShare(request.id);
        handleMenuClose();
    };

    const handleAddExample = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAddExample) {
             onAddExample(request.id);
             setExpanded(true); // Auto expand when adding
        }
        handleMenuClose();
    };

    const handleToggleExpand = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExpanded(!expanded);
    };

    return (
        <>
            <ListItem 
                disablePadding
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                secondaryAction={
                    (hover || menuOpen) && (
                        <IconButton 
                            edge="end" 
                            aria-label="menu" 
                            size="small" 
                            onClick={handleMenuClick}
                            sx={{ color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                        >
                            <MoreHorizIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                    )
                }
            >
                <ListItemButton 
                    onClick={onClick} 
                    sx={{ 
                        pl: hasExamples ? 2 : 4, 
                        py: 0.5 
                    }}
                >
                     <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        {hasExamples && (
                            <Box 
                                component="span" 
                                onClick={handleToggleExpand}
                                sx={{ 
                                    mr: 0.5, 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    cursor: 'pointer',
                                    '&:hover': { color: 'text.primary' },
                                    color: 'text.secondary'
                                }}
                            >
                                {expanded ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
                            </Box>
                        )}
                        
                        <Chip 
                            label={request.method} 
                            size="small" 
                            color={METHOD_COLORS[request.method as keyof typeof METHOD_COLORS] || 'default'} 
                            sx={{ mr: 1, height: 16, fontSize: '0.6rem', fontWeight: 'bold', minWidth: 35 }} 
                        />
                        <ListItemText 
                            primary={request.name} 
                            primaryTypographyProps={{ noWrap: true, variant: 'body2', fontSize: '0.75rem' }}
                        />
                    </Box>
                </ListItemButton>
                
                 <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={() => handleMenuClose()}
                    onClick={(e) => e.stopPropagation()}
                    PaperProps={{
                        elevation: 3,
                        sx: { minWidth: 180 }
                    }}
                >
                    <MenuItem onClick={handleAddExample}>
                        <ListItemIcon><CodeIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Add example</ListItemText>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleShare}>
                        <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Share</ListItemText>
                    </MenuItem>
                    <Divider />
                     <MenuItem onClick={handleRenameOpen}>
                        <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Rename</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleDuplicate}>
                        <ListItemIcon><ContentCopyIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Duplicate</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={(e) => {
                        if (onDelete) onDelete(request.id);
                        handleMenuClose(e);
                    }}>
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
                    </MenuItem>
                </Menu>
            </ListItem>

            <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} onClick={(e) => e.stopPropagation()}>
                <DialogTitle>Rename Request</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        type="text"
                        fullWidth
                        variant="outlined"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleRenameSubmit();
                                e.preventDefault();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRenameSubmit}>Save</Button>
                </DialogActions>
            </Dialog>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                    {request.examples?.map((example: any) => (
                        <ListItemButton key={example.id} sx={{ pl: 8, py: 0.5 }}>
                             <ListItemText 
                                primary={example.name} 
                                primaryTypographyProps={{ variant: 'body2', fontSize: '0.7rem', color: 'text.secondary' }} 
                             />
                             <Chip label={example.status || 200} size="small" variant="outlined" sx={{ height: 16, fontSize: '0.6rem', ml: 1 }} />
                        </ListItemButton>
                    ))}
                </List>
            </Collapse>
        </>
    );
}