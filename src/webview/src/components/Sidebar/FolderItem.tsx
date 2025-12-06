import { useState } from 'react';
import { ListItem, ListItemButton, ListItemText, Collapse, Box, List, IconButton, Menu, MenuItem, Divider, ListItemIcon, Dialog, DialogTitle, DialogContent, TextField, DialogActions, Button } from '@mui/material';
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
}

export default function FolderItem({ folder, onDelete, onAddRequest, onAddFolder, onRename, onDuplicate, onRun, onShare, onAddExample }: FolderItemProps) {
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
                {open ? <ExpandLess sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} /> : <ExpandMore sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />}
                {open ? <FolderOpenIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} /> : <FolderIcon sx={{ mr: 1, fontSize: 18, color: 'text.secondary' }} />}
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
                        sx: { minWidth: 180 }
                    }}
                >
                    <MenuItem onClick={(e) => { handleAddRequest(e); }}>
                        <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Add request</ListItemText>
                    </MenuItem>
                    <MenuItem onClick={(e) => { handleAddFolder(e); }}>
                        <ListItemIcon><FolderIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Add folder</ListItemText>
                    </MenuItem>
                    <Divider />
                    <MenuItem onClick={handleRun}>
                        <ListItemIcon><PlayArrowIcon fontSize="small" /></ListItemIcon>
                        <ListItemText>Run</ListItemText>
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
                        if (onDelete) onDelete(folder.id); 
                        handleMenuClose(e); 
                    }}>
                        <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
                        <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
                    </MenuItem>
                </Menu>
            </ListItemButton>
            
            <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)} onClick={(e) => e.stopPropagation()}>
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
                                        />
                                    );
                                }
                                return (
                                    <RequestItem 
                                        key={child.id} 
                                        request={child as ApiRequest} 
                                        onClick={() => vscode.postMessage({ type: 'openRequest', payload: child })} 
                                        onDelete={onDelete}
                                        onRename={onRename}
                                        onDuplicate={onDuplicate}
                                        onShare={onShare}
                                        onAddExample={onAddExample}
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