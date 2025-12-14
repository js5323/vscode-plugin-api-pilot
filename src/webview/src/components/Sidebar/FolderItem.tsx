import { useState } from 'react';
import {
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
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import RequestItem from './RequestItem';
import { getVsCodeApi } from '../../utils/vscode';
import { CollectionFolder, ApiRequest, ApiExample } from '../../types';

const vscode = getVsCodeApi();

interface FolderItemProps {
    folder: CollectionFolder;
    onDelete?: (id: string) => void;
    onAddRequest?: (folderId: string) => void;
    onAddFolder?: (folderId: string) => void;
    onRename?: (id: string, newName: string) => void;
    onDuplicate?: (id: string) => void;
    onMove?: (id: string) => void;
    onRun?: (id: string) => void;
    onShare?: (id: string) => void;
    onAddExample?: (id: string) => void;
    onOpenRequest?: (request: ApiRequest) => void;
    onOpenExample?: (example: ApiExample, parentRequest: ApiRequest) => void;
    onDeleteExample?: (exampleId: string, requestId: string) => void;
    onRenameExample?: (exampleId: string, requestId: string, newName: string) => void;
    onDuplicateExample?: (exampleId: string, requestId: string) => void;
    onDrop?: (draggedId: string, targetFolderId: string) => void;
}

export default function FolderItem({
    folder,
    onDelete,
    onAddRequest,
    onAddFolder,
    onRename,
    onDuplicate,
    onMove,
    onRun,
    onShare,
    onAddExample,
    onOpenRequest,
    onOpenExample,
    onDeleteExample,
    onRenameExample,
    onDuplicateExample,
    onDrop
}: FolderItemProps) {
    const [open, setOpen] = useState(false);
    const [hover, setHover] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [newName, setNewName] = useState(folder.name);
    const [isDragOver, setIsDragOver] = useState(false);

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

    const handleMove = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onMove) {
            onMove(folder.id);
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

    const handleDragStart = (e: React.DragEvent) => {
        e.stopPropagation();
        e.dataTransfer.setData('application/json', JSON.stringify({ id: folder.id, type: 'folder' }));
        e.dataTransfer.effectAllowed = 'move';
        // Ensure only the item is shown as drag image
        if (e.currentTarget) {
            const target = e.currentTarget as HTMLElement;
            // We can clone it or just use it. Using it directly is standard.
            // If the user sees "whole list", maybe the browser is grabbing a parent?
            // Explicitly setting it helps.
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
                // Prevent dropping folder into itself or its children is handled by backend logic usually,
                // but we should avoid obvious self-drops here if possible.
                // However, 'folder' object here doesn't know its parents.
                // So we just pass it up.
                if (id !== folder.id && onDrop) {
                    onDrop(id, folder.id);
                }
            } catch (e) {
                console.error('Invalid drag data', e);
            }
        }
    };

    return (
        <>
            <ListItemButton
                draggable
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => setOpen(!open)}
                sx={{
                    py: 0.5,
                    bgcolor: isDragOver ? 'action.hover' : 'transparent',
                    border: isDragOver ? '1px dashed' : 'none',
                    borderColor: 'primary.main'
                }}
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
                    <MenuItem
                        onClick={(e) => {
                            vscode.postMessage({ type: 'exportCollection', payload: folder });
                            handleMenuClose(e);
                        }}
                    >
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            <FileDownloadIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>
                            Export to Swagger YAML
                        </ListItemText>
                    </MenuItem>
                    <MenuItem onClick={handleDuplicate}>
                        <ListItemIcon sx={{ minWidth: 30 }}>
                            <ContentCopyIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Duplicate</ListItemText>
                    </MenuItem>
                    <Divider sx={{ my: 0.5 }} />
                    <MenuItem
                        onClick={() => {
                            if (onDelete) onDelete(folder.id);
                            handleMenuClose();
                        }}
                        sx={{ color: 'error.main' }}
                    >
                        <ListItemIcon sx={{ minWidth: 30, color: 'error.main' }}>
                            <DeleteIcon fontSize="small" sx={{ fontSize: '1.2rem' }} />
                        </ListItemIcon>
                        <ListItemText primaryTypographyProps={{ fontSize: '0.75rem' }}>Delete</ListItemText>
                    </MenuItem>
                </Menu>
            </ListItemButton>

            <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding sx={{ pl: 2, borderLeft: '1px solid', borderColor: 'divider' }}>
                    {folder.children && folder.children.length > 0 ? (
                        folder.children.map((item) =>
                            item.type === 'folder' ? (
                                <FolderItem
                                    key={item.id}
                                    folder={item as CollectionFolder}
                                    onDelete={onDelete}
                                    onAddRequest={onAddRequest}
                                    onAddFolder={onAddFolder}
                                    onRename={onRename}
                                    onDuplicate={onDuplicate}
                                    onMove={onMove}
                                    onRun={onRun}
                                    onShare={onShare}
                                    onAddExample={onAddExample}
                                    onOpenRequest={onOpenRequest}
                                    onOpenExample={onOpenExample}
                                    onDeleteExample={onDeleteExample}
                                    onRenameExample={onRenameExample}
                                    onDuplicateExample={onDuplicateExample}
                                    onDrop={onDrop}
                                />
                            ) : (
                                <RequestItem
                                    key={item.id}
                                    request={item as ApiRequest}
                                    onClick={() => onOpenRequest && onOpenRequest(item as ApiRequest)}
                                    onDelete={onDelete}
                                    onRename={onRename}
                                    onDuplicate={onDuplicate}
                                    onMove={onMove}
                                    onShare={onShare}
                                    onAddExample={onAddExample}
                                    onOpenExample={onOpenExample}
                                    onDeleteExample={onDeleteExample}
                                    onRenameExample={onRenameExample}
                                    onDuplicateExample={onDuplicateExample}
                                    onDrop={onDrop}
                                />
                            )
                        )
                    ) : (
                        <ListItemButton
                            onClick={handleAddRequest}
                            sx={{
                                pl: 2,
                                py: 0.5,
                                opacity: 0.7,
                                '&:hover': { opacity: 1, bgcolor: 'action.hover' }
                            }}
                        >
                            <ListItemIcon sx={{ minWidth: 30 }}>
                                <AddIcon fontSize="small" sx={{ fontSize: 16 }} />
                            </ListItemIcon>
                            <ListItemText
                                primary="Add request"
                                primaryTypographyProps={{ variant: 'body2', fontSize: '0.8rem' }}
                            />
                        </ListItemButton>
                    )}
                </List>
            </Collapse>

            <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
                <DialogTitle>Rename Folder</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Folder Name"
                        type="text"
                        fullWidth
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                handleRenameSubmit();
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleRenameSubmit}>Rename</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
