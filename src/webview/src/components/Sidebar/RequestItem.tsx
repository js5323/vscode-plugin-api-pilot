import {
    ListItem,
    ListItemButton,
    ListItemText,
    Box,
    Chip,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Button,
    Collapse,
    List
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ShareIcon from '@mui/icons-material/Share';
import CodeIcon from '@mui/icons-material/Code';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import { useState } from 'react';
import { METHOD_COLORS } from '../../constants';
import { ApiRequest, ApiExample } from '../../types';
import ExampleItem from './ExampleItem';

interface RequestItemProps {
    request: ApiRequest;
    onClick: () => void;
    onDelete?: (id: string) => void;
    onRename?: (id: string, newName: string) => void;
    onDuplicate?: (id: string) => void;
    onMove?: (id: string) => void;
    onShare?: (id: string) => void;
    onAddExample?: (id: string) => void;
    onOpenExample?: (example: ApiExample, parentRequest: ApiRequest) => void;
    onDeleteExample?: (exampleId: string, requestId: string) => void;
    onRenameExample?: (exampleId: string, requestId: string, newName: string) => void;
    onDuplicateExample?: (exampleId: string, requestId: string) => void;
    onDrop?: (draggedId: string, targetFolderId: string) => void;
}

export default function RequestItem({
    request,
    onClick,
    onDelete,
    onRename,
    onDuplicate,
    onMove,
    onShare,
    onAddExample,
    onOpenExample,
    onDeleteExample,
    onRenameExample,
    onDuplicateExample,
    onDrop
}: RequestItemProps) {
    const [hover, setHover] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState(request.name);
    const [expanded, setExpanded] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

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

    const handleMove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onMove) {
            onMove(request.id);
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

    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.setData('application/json', JSON.stringify({ id: request.id, type: 'request' }));
        e.dataTransfer.effectAllowed = 'move';
        // Ensure only the item is shown as drag image
        if (e.currentTarget) {
            const target = e.currentTarget as HTMLElement;
            e.dataTransfer.setDragImage(target, 0, 0);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (isDragOver) setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        const data = e.dataTransfer.getData('application/json');
        if (data) {
            try {
                const { id } = JSON.parse(data);
                // If dropped on a request, we might want to move to the same parent folder?
                // Or maybe just ignore?
                // The user requirement is to move directories/files.
                // If I drop on a request, it's ambiguous.
                // But for usability, dropping on a sibling often means "move here".
                // Since I don't have easy access to parentId here (it is in request object but...),
                // I will just use the parentId of the current request if available.
                if (id !== request.id && onDrop && request.parentId) {
                    onDrop(id, request.parentId);
                }
            } catch (e) {
                console.error('Invalid drag data', e);
            }
        }
    };

    return (
        <>
            <ListItem
                disablePadding
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
                sx={{
                    bgcolor: isDragOver ? 'action.hover' : 'transparent',
                    border: isDragOver ? '1px dashed' : 'none',
                    borderColor: 'primary.main'
                }}
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
                            label={request.method.charAt(0).toUpperCase()}
                            size="small"
                            color={
                                (METHOD_COLORS[request.method as keyof typeof METHOD_COLORS] || 'default') as
                                    | 'default'
                                    | 'primary'
                                    | 'secondary'
                                    | 'error'
                                    | 'info'
                                    | 'success'
                                    | 'warning'
                            }
                            sx={{ mr: 1, height: 14, fontSize: '10px', fontWeight: 'bold', minWidth: 15 }}
                        />
                        <ListItemText
                            primary={request.name}
                            primaryTypographyProps={{ noWrap: true, variant: 'body2', fontSize: '12px' }}
                        />
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
                    <MenuItem onClick={handleAddExample}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            <CodeIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Add example</ListItemText>
                    </MenuItem>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={handleShare}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            <ShareIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Share</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleMove}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            <DriveFileMoveIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Move</ListItemText>
                    </MenuItem>
                    <Divider sx={{ my: 0.5 }} />
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
                    <MenuItem
                        onClick={(e) => {
                            if (onDelete) onDelete(request.id);
                            handleMenuClose(e);
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            <DeleteIcon fontSize="small" color="error" sx={{ fontSize: '1.2rem' }} />
                        </ListItemIcon>
                        <ListItemText sx={{ color: 'error.main' }} primaryTypographyProps={{ fontSize: '0.75rem' }}>
                            Delete
                        </ListItemText>
                    </MenuItem>
                </Menu>
            </ListItem>

            {hasExamples && (
                <Collapse in={expanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                        {request.examples!.map((example) => (
                            <ExampleItem
                                key={example.id}
                                example={example}
                                parentRequest={request}
                                onClick={() => onOpenExample && onOpenExample(example, request)}
                                onDelete={onDeleteExample}
                                onRename={onRenameExample}
                                onDuplicate={onDuplicateExample}
                            />
                        ))}
                    </List>
                </Collapse>
            )}

            <Dialog
                open={renameDialogOpen}
                onClose={() => setRenameDialogOpen(false)}
                onClick={(e) => e.stopPropagation()}
            >
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
        </>
    );
}
