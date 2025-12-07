import { useState } from 'react';
import {
    ListItemButton,
    ListItemText,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Button,
    Box
} from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { ApiExample, ApiRequest } from '../../types';

interface ExampleItemProps {
    example: ApiExample;
    parentRequest: ApiRequest;
    onClick: () => void;
    onDelete?: (exampleId: string, requestId: string) => void;
    onRename?: (exampleId: string, requestId: string, newName: string) => void;
    onDuplicate?: (exampleId: string, requestId: string) => void;
}

export default function ExampleItem({
    example,
    parentRequest,
    onClick,
    onDelete,
    onRename,
    onDuplicate
}: ExampleItemProps) {
    const [hover, setHover] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState(example.name);

    const menuOpen = Boolean(anchorEl);

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
        setNewName(example.name);
        setRenameDialogOpen(true);
        handleMenuClose();
    };

    const handleRenameSubmit = () => {
        if (onRename && newName.trim()) {
            onRename(example.id, parentRequest.id, newName.trim());
        }
        setRenameDialogOpen(false);
    };

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDuplicate) {
            onDuplicate(example.id, parentRequest.id);
        }
        handleMenuClose();
    };

    const handleDelete = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDelete) {
            onDelete(example.id, parentRequest.id);
        }
        handleMenuClose();
    };

    return (
        <>
            <ListItemButton
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                onClick={onClick}
                sx={{
                    pl: 6,
                    py: 0.5,
                    pr: 1
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <ListItemText
                        primary={example.name}
                        primaryTypographyProps={{
                            variant: 'body2',
                            fontSize: '11px',
                            color: 'text.secondary',
                            noWrap: true
                        }}
                    />

                    {(hover || menuOpen) && (
                        <IconButton
                            edge="end"
                            aria-label="menu"
                            size="small"
                            onClick={handleMenuClick}
                            sx={{
                                p: 0,
                                color: 'text.secondary',
                                '&:hover': { color: 'text.primary' }
                            }}
                        >
                            <MoreHorizIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                    )}
                </Box>
            </ListItemButton>

            <Menu
                anchorEl={anchorEl}
                open={menuOpen}
                onClose={() => handleMenuClose()}
                onClick={(e) => e.stopPropagation()}
                slotProps={{
                    paper: {
                        elevation: 3,
                        sx: {
                            minWidth: 140,
                            padding: '4px 0',
                            '& .MuiMenuItem-root': {
                                fontSize: '0.75rem',
                                padding: '6px 16px',
                                minHeight: 'auto'
                            }
                        }
                    }
                }}
            >
                <MenuItem onClick={handleRenameOpen}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                        <EditIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Rename</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDuplicate}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                        <ContentCopyIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Duplicate</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleDelete}>
                    <ListItemIcon sx={{ minWidth: 30 }}>
                        <DeleteIcon fontSize="small" color="error" sx={{ fontSize: '1.2rem' }} />
                    </ListItemIcon>
                    <ListItemText sx={{ color: 'error.main' }} primaryTypographyProps={{ fontSize: '0.75rem' }}>
                        Delete
                    </ListItemText>
                </MenuItem>
            </Menu>

            <Dialog
                open={renameDialogOpen}
                onClose={() => setRenameDialogOpen(false)}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle>Rename Example</DialogTitle>
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
        </>
    );
}
