import { useState } from 'react';
import {
    ListItem,
    ListItemButton,
    ListItemText,
    Collapse,
    Box,
    List,
    IconButton,
    Menu,
    MenuItem,
    Divider,
    ListItemIcon,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Button
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AddIcon from '@mui/icons-material/Add';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ShareIcon from '@mui/icons-material/Share';
import RequestItem from './RequestItem';
import { getVsCodeApi } from '../../utils/vscode';
import { CollectionFolder, ApiRequest } from '../../types';

const vscode = getVsCodeApi();

interface FolderItemProps {
    folder: CollectionFolder;
    onDelete?: (id: string) => void;
    onAddRequest?: (folderId: string) => void;
    onAddFolder?: (folderId: string) => void;
    onRename?: (id: string, newName: string) => void;
    onDuplicate?: (id: string) => void;
    onRun?: (id: string) => void;
    onShare?: (id: string) => void;
    onAddExample?: (id: string) => void;
    onOpenRequest?: (request: ApiRequest) => void;
    onOpenExample?: (example: any, parentRequest: ApiRequest) => void;
    onDeleteExample?: (exampleId: string, requestId: string) => void;
    onRenameExample?: (exampleId: string, requestId: string, newName: string) => void;
    onDuplicateExample?: (exampleId: string, requestId: string) => void;
}

export default function FolderItem({
    folder,
    onDelete,
    onAddRequest,
    onAddFolder,
    onRename,
    onDuplicate,
    onRun,
    onShare,
    onAddExample,
    onOpenRequest,
    onOpenExample,
    onDeleteExample,
    onRenameExample,
    onDuplicateExample
}: FolderItemProps) {
    const [open, setOpen] = useState(false);
    const [hover, setHover] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState(folder.name);

    const menuOpen = Boolean(anchorEl);

    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setAnchorEl(null);
    };

    const handleAddRequest = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAddRequest) {
            onAddRequest(folder.id);
            setOpen(true);
        }
        handleMenuClose();
    };

    const handleAddFolder = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onAddFolder) {
            onAddFolder(folder.id);
            setOpen(true);
        }
        handleMenuClose();
    };

    const handleRenameOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNewName(folder.name);
        setRenameDialogOpen(true);
        handleMenuClose();
    };

    const handleRenameSubmit = () => {
        if (onRename && newName.trim()) {
            onRename(folder.id, newName.trim());
        }
        setRenameDialogOpen(false);
    };

    const handleDuplicate = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onDuplicate) {
            onDuplicate(folder.id);
        }
        handleMenuClose();
    };

    const handleRun = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onRun) {
            onRun(folder.id);
        }
        handleMenuClose();
    };

    const handleShare = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onShare) {
            onShare(folder.id);
        }
        handleMenuClose();
    };

    return (
        <>
            <ListItemButton
                onClick={() => setOpen(!open)}
                sx={{ py: 0.5 }}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                {open ? (
                    <ExpandLess sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                ) : (
                    <ExpandMore sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
                )}
                {open ? (
                    <FolderOpenIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                ) : (
                    <FolderIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />
                )}
                <ListItemText primary={folder.name} primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />

                {(hover || menuOpen) && (
                    <Box sx={{ display: 'flex' }}>
                        <IconButton
                            size="small"
                            onClick={handleAddRequest}
                            sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                        >
                            <AddIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                            size="small"
                            onClick={handleMenuClick}
                            sx={{ p: 0.5, color: 'text.secondary', '&:hover': { color: 'text.primary' } }}
                        >
                            <MoreHorizIcon fontSize="small" sx={{ fontSize: 16 }} />
                        </IconButton>
                    </Box>
                )}

                <Menu
                    anchorEl={anchorEl}
                    open={menuOpen}
                    onClose={() => handleMenuClose()}
                    onClick={(e) => e.stopPropagation()}
                    PaperProps={{
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
                    }}
                >
                    <MenuItem
                        onClick={(e) => {
                            handleAddRequest(e);
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            <AddIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Add request</ListItemText>
                    </MenuItem>
                    <MenuItem
                        onClick={(e) => {
                            handleAddFolder(e);
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            <FolderIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Add folder</ListItemText>
                    </MenuItem>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={handleRun}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            <PlayArrowIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Run</ListItemText>
                    </MenuItem>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem onClick={handleShare}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            <ShareIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Share</ListItemText>
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
                            if (onDelete) onDelete(folder.id);
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
            </ListItemButton>

            <Dialog
                open={renameDialogOpen}
                onClose={() => setRenameDialogOpen(false)}
                onClick={(e) => e.stopPropagation()}
            >
                <DialogTitle>Rename Folder</DialogTitle>
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

            <Collapse in={open} timeout="auto" unmountOnExit>
                <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', ml: 2, my: 0.5 }}>
                    <List component="div" disablePadding>
                        {folder.children.length > 0 ? (
                            folder.children.map((child) => {
                                if (child.type === 'folder') {
                                    return (
                                        <FolderItem
                                            key={child.id}
                                            folder={child as CollectionFolder}
                                            onDelete={onDelete}
                                            onAddRequest={onAddRequest}
                                            onAddFolder={onAddFolder}
                                            onRename={onRename}
                                            onDuplicate={onDuplicate}
                                            onRun={onRun}
                                            onShare={onShare}
                                            onAddExample={onAddExample}
                                            onOpenRequest={onOpenRequest}
                                            onOpenExample={onOpenExample}
                                            onDeleteExample={onDeleteExample}
                                            onRenameExample={onRenameExample}
                                            onDuplicateExample={onDuplicateExample}
                                        />
                                    );
                                }
                                return (
                                    <RequestItem
                                        key={child.id}
                                        request={child as ApiRequest}
                                        onClick={() => {
                                            if (onOpenRequest) onOpenRequest(child as ApiRequest);
                                            else vscode.postMessage({ type: 'openRequest', payload: child });
                                        }}
                                        onDelete={onDelete}
                                        onRename={onRename}
                                        onDuplicate={onDuplicate}
                                        onShare={onShare}
                                        onAddExample={onAddExample}
                                        onOpenExample={onOpenExample}
                                        onDeleteExample={onDeleteExample}
                                        onRenameExample={onRenameExample}
                                        onDuplicateExample={onDuplicateExample}
                                    />
                                );
                            })
                        ) : (
                            <ListItem>
                                <ListItemText
                                    secondary="Empty"
                                    secondaryTypographyProps={{ fontSize: '0.75rem', fontStyle: 'italic', pl: 2 }}
                                />
                            </ListItem>
                        )}
                    </List>
                </Box>
            </Collapse>
        </>
    );
}
