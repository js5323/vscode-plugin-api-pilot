import { useState, useEffect } from 'react';
import {
    List,
    Box,
    Typography,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    ListItemButton,
    ListItemText,
    CircularProgress,
    TextField
} from '@mui/material';
import FolderItem from './FolderItem';
import RequestItem from './RequestItem';
import SidebarSearch from './SidebarSearch';
import { getVsCodeApi } from '../../utils/vscode';
import { CollectionFolder, ApiRequest, CollectionItem } from '../../types';

const vscode = getVsCodeApi();

export default function CollectionsTab() {
    const [searchTerm, setSearchTerm] = useState('');
    const [collections, setCollections] = useState<CollectionItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filteredCollections, setFilteredCollections] = useState<CollectionItem[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [exampleToDelete, setExampleToDelete] = useState<{ exampleId: string; requestId: string } | null>(null);
    const [moveDialogOpen, setMoveDialogOpen] = useState(false);
    const [itemToMove, setItemToMove] = useState<string | null>(null);
    const [targetFolderId, setTargetFolderId] = useState<string>('');
    const [createFolderDialogOpen, setCreateFolderDialogOpen] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [createFolderParentId, setCreateFolderParentId] = useState<string | null>(null);

    const getFolderPath = (items: CollectionItem[], targetId: string): { id: string; name: string }[] => {
        for (const item of items) {
            if (item.id === targetId) {
                return [{ id: item.id, name: item.name }];
            }
            if (item.type === 'folder') {
                const path = getFolderPath((item as CollectionFolder).children, targetId);
                if (path.length > 0) {
                    return [{ id: item.id, name: item.name }, ...path];
                }
            }
        }
        return [];
    };

    useEffect(() => {
        if (searchTerm.trim() === '') {
            setFilteredCollections(collections);
            return;
        }
        const filterItems = (items: CollectionItem[]): CollectionItem[] => {
            return items.filter((item) => {
                // Check current item
                let match = item.name.toLowerCase().includes(searchTerm.toLowerCase());

                // For requests, also search URL and method
                if (!match && item.type === 'request') {
                    const req = item as ApiRequest;
                    if (
                        req.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        req.method.toLowerCase().includes(searchTerm.toLowerCase())
                    ) {
                        match = true;
                    }
                }

                if (match) {
                    return true;
                }

                // If folder, check children
                if (item.type === 'folder') {
                    const filteredChildren = filterItems((item as CollectionFolder).children);
                    if (filteredChildren.length > 0) {
                        return { ...item, children: filteredChildren } as CollectionFolder;
                    }
                }
                return false;
            });
        };
        setFilteredCollections(filterItems(collections));
    }, [searchTerm, collections]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'updateCollections') {
                setCollections(message.payload || []);
                setIsLoading(false);
            }
        };

        window.addEventListener('message', handleMessage);
        vscode.postMessage({ type: 'getCollections' });

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    const saveCollections = (newCollections: CollectionItem[]) => {
        setCollections(newCollections);
        vscode.postMessage({ type: 'saveCollections', payload: newCollections });
    };

    const handleCreateCollection = () => {
        setNewFolderName('');
        setCreateFolderParentId(null);
        setCreateFolderDialogOpen(true);
    };

    const confirmCreateFolder = () => {
        if (!newFolderName.trim()) return;

        if (createFolderParentId === null) {
            // Create root collection
            const newCollection: CollectionFolder = {
                id: Date.now().toString(),
                name: newFolderName,
                type: 'folder',
                children: []
            };
            saveCollections([...collections, newCollection]);
        } else {
            // Add folder to folder
            const addFolder = (items: CollectionItem[]): CollectionItem[] => {
                return items.map((item) => {
                    if (item.id === createFolderParentId && item.type === 'folder') {
                        const newFolder: CollectionFolder = {
                            id: Date.now().toString(),
                            name: newFolderName,
                            type: 'folder',
                            children: []
                        };
                        return { ...item, children: [newFolder, ...item.children] } as CollectionFolder;
                    }
                    if (item.type === 'folder') {
                        return { ...item, children: addFolder(item.children) } as CollectionFolder;
                    }
                    return item;
                });
            };
            saveCollections(addFolder(collections));
        }
        setCreateFolderDialogOpen(false);
    };

    const handleAddRequestToFolder = (folderId: string) => {
        let newRequestToOpen: ApiRequest | null = null;
        const addRequest = (items: CollectionItem[]): CollectionItem[] => {
            return items.map((item) => {
                if (item.id === folderId && item.type === 'folder') {
                    const newRequest: ApiRequest = {
                        id: Date.now().toString(),
                        name: 'New Request',
                        method: 'GET',
                        url: '',
                        type: 'request',
                        parentId: folderId
                    };
                    newRequestToOpen = newRequest;
                    return { ...item, children: [newRequest, ...item.children] } as CollectionFolder;
                }
                if (item.type === 'folder') {
                    return { ...item, children: addRequest(item.children) } as CollectionFolder;
                }
                return item;
            });
        };
        saveCollections(addRequest(collections));

        if (newRequestToOpen) {
            const folderPath = getFolderPath(collections, folderId);
            const requestWithMeta = {
                ...(newRequestToOpen as ApiRequest),
                _folderPath: folderPath
            };
            vscode.postMessage({ type: 'openRequest', payload: requestWithMeta });
        }
    };

    const handleAddFolderToFolder = (folderId: string) => {
        setNewFolderName('');
        setCreateFolderParentId(folderId);
        setCreateFolderDialogOpen(true);
    };

    const handleRenameItem = (id: string, newName: string) => {
        const renameInTree = (items: CollectionItem[]): CollectionItem[] => {
            return items.map((item) => {
                if (item.id === id) {
                    return { ...item, name: newName };
                }
                if (item.type === 'folder') {
                    return { ...item, children: renameInTree(item.children) } as CollectionFolder;
                }
                return item;
            });
        };
        saveCollections(renameInTree(collections));
    };

    const handleDuplicateItem = (id: string) => {
        const duplicateInTree = (items: CollectionItem[]): CollectionItem[] => {
            let newItems: CollectionItem[] = [];
            for (const item of items) {
                newItems.push(item);
                if (item.id === id) {
                    const cloneItem = (original: CollectionItem): CollectionItem => {
                        if (original.type === 'folder') {
                            const newFolder: CollectionFolder = {
                                ...original,
                                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                name: original.name + ' Copy',
                                children: original.children.map((child) => cloneItem(child))
                            };
                            return newFolder;
                        } else {
                            const newRequest: ApiRequest = {
                                ...original,
                                id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                                name: original.name + ' Copy'
                            };
                            return newRequest;
                        }
                    };
                    newItems.push(cloneItem(item));
                } else if (item.type === 'folder') {
                    (item as CollectionFolder).children = duplicateInTree((item as CollectionFolder).children);
                }
            }
            return newItems;
        };
        saveCollections(duplicateInTree(collections));
    };

    const handleRunItem = (id: string) => {
        vscode.postMessage({ type: 'run', payload: id });
    };

    const handleShareItem = (id: string) => {
        const findItem = (items: CollectionItem[]): CollectionItem | undefined => {
            for (const item of items) {
                if (item.id === id) return item;
                if (item.type === 'folder') {
                    const found = findItem(item.children);
                    if (found) return found;
                }
            }
            return undefined;
        };

        const item = findItem(collections);
        if (item) {
            navigator.clipboard.writeText(JSON.stringify(item, null, 2));
            // Optionally notify user
        }
    };

    const handleAddExampleItem = (id: string) => {
        const addExampleInTree = (items: CollectionItem[]): CollectionItem[] => {
            return items.map((item) => {
                if (item.id === id && item.type === 'request') {
                    const request = item as ApiRequest;
                    const newExample = {
                        id: Date.now().toString(),
                        name: 'New Example',
                        status: 200,
                        body: '{}'
                    };
                    return { ...request, examples: [...(request.examples || []), newExample] };
                }
                if (item.type === 'folder') {
                    return { ...item, children: addExampleInTree(item.children) } as CollectionFolder;
                }
                return item;
            });
        };
        saveCollections(addExampleInTree(collections));
    };

    const handleRenameExample = (exampleId: string, requestId: string, newName: string) => {
        const updateExampleInTree = (items: CollectionItem[]): CollectionItem[] => {
            return items.map((item) => {
                if (item.id === requestId && item.type === 'request') {
                    const request = item as ApiRequest;
                    const newExamples = request.examples?.map((ex) =>
                        ex.id === exampleId ? { ...ex, name: newName } : ex
                    );
                    return { ...request, examples: newExamples };
                }
                if (item.type === 'folder') {
                    return { ...item, children: updateExampleInTree(item.children) } as CollectionFolder;
                }
                return item;
            });
        };
        saveCollections(updateExampleInTree(collections));
    };

    const handleDuplicateExample = (exampleId: string, requestId: string) => {
        const updateExampleInTree = (items: CollectionItem[]): CollectionItem[] => {
            return items.map((item) => {
                if (item.id === requestId && item.type === 'request') {
                    const request = item as ApiRequest;
                    const example = request.examples?.find((ex) => ex.id === exampleId);
                    if (example) {
                        const newExample = {
                            ...example,
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                            name: example.name + ' Copy'
                        };
                        return { ...request, examples: [...(request.examples || []), newExample] };
                    }
                }
                if (item.type === 'folder') {
                    return { ...item, children: updateExampleInTree(item.children) } as CollectionFolder;
                }
                return item;
            });
        };
        saveCollections(updateExampleInTree(collections));
    };

    const handleDeleteExampleClick = (exampleId: string, requestId: string) => {
        setExampleToDelete({ exampleId, requestId });
        setDeleteDialogOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setItemToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (exampleToDelete) {
            const deleteExampleInTree = (items: CollectionItem[]): CollectionItem[] => {
                return items.map((item) => {
                    if (item.id === exampleToDelete.requestId && item.type === 'request') {
                        const request = item as ApiRequest;
                        const newExamples = request.examples?.filter((ex) => ex.id !== exampleToDelete.exampleId);
                        return { ...request, examples: newExamples };
                    }
                    if (item.type === 'folder') {
                        return { ...item, children: deleteExampleInTree(item.children) } as CollectionFolder;
                    }
                    return item;
                });
            };
            saveCollections(deleteExampleInTree(collections));
            setExampleToDelete(null);
        } else if (itemToDelete) {
            const deleteFromTree = (items: CollectionItem[]): CollectionItem[] => {
                return items
                    .filter((item) => item.id !== itemToDelete)
                    .map((item) => {
                        if (item.type === 'folder') {
                            return { ...item, children: deleteFromTree(item.children) } as CollectionFolder;
                        }
                        return item;
                    });
            };
            const newCollections = deleteFromTree(collections);
            saveCollections(newCollections);
            setItemToDelete(null);
        }

        setDeleteDialogOpen(false);
    };

    const handleDeleteCancel = () => {
        setDeleteDialogOpen(false);
        setItemToDelete(null);
        setExampleToDelete(null);
    };

    // Move functionality
    const handleMoveItem = (id: string) => {
        setItemToMove(id);
        setMoveDialogOpen(true);
    };

    const handleMoveConfirm = () => {
        if (itemToMove) {
            vscode.postMessage({
                type: 'moveItem',
                payload: {
                    itemId: itemToMove,
                    targetFolderId: targetFolderId || null
                }
            });
        }
        setMoveDialogOpen(false);
        setItemToMove(null);
        setTargetFolderId('');
    };

    const handleMoveCancel = () => {
        setMoveDialogOpen(false);
        setItemToMove(null);
        setTargetFolderId('');
    };

    const handleDrop = (itemId: string, targetId: string | null) => {
        // Prevent dropping onto itself or its children
        if (itemId === targetId) return;

        vscode.postMessage({
            type: 'moveItem',
            payload: {
                itemId: itemId,
                targetFolderId: targetId
            }
        });
    };

    const getAllFolders = (items: CollectionItem[], depth = 0): { id: string; name: string; depth: number }[] => {
        let folders: { id: string; name: string; depth: number }[] = [];
        items.forEach((item) => {
            if (item.type === 'folder') {
                // Don't include the item itself or its children if it's the item being moved
                if (item.id === itemToMove) return;

                folders.push({ id: item.id, name: item.name, depth });
                if ((item as CollectionFolder).children) {
                    const childrenFolders = getAllFolders((item as CollectionFolder).children, depth + 1);
                    // Filter out children if parent is the item being moved (already handled by skip above, but recursively)
                    folders = [...folders, ...childrenFolders];
                }
            }
        });
        return folders;
    };

    const availableFolders = getAllFolders(collections);

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <SidebarSearch
                activeTab="collections"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onAction={handleCreateCollection}
            />
            <Box sx={{ flexGrow: 1, overflow: 'auto', px: 0.5 }}>
                {isLoading ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: '100%' }}>
                        <CircularProgress />
                    </Stack>
                ) : collections.length === 0 ? (
                    <Stack
                        alignItems="center"
                        justifyContent="center"
                        spacing={2}
                        sx={{ height: '100%', color: 'text.secondary', px: 2, textAlign: 'center' }}
                    >
                        <Typography variant="subtitle1" fontWeight="bold">
                            Create a collection for your requests
                        </Typography>
                        <Typography variant="body2">
                            A collection lets you group related requests and easily set common authorization, tests,
                            scripts, and variables for all requests in it.
                        </Typography>
                        <Button variant="outlined" onClick={handleCreateCollection}>
                            Create Collection
                        </Button>
                    </Stack>
                ) : (
                    <List dense>
                        {filteredCollections.map((item) =>
                            item.type === 'folder' ? (
                                <FolderItem
                                    key={item.id}
                                    folder={item as CollectionFolder}
                                    onDelete={handleDeleteClick}
                                    onAddRequest={handleAddRequestToFolder}
                                    onAddFolder={handleAddFolderToFolder}
                                    onRename={handleRenameItem}
                                    onDuplicate={handleDuplicateItem}
                                    onRun={handleRunItem}
                                    onShare={handleShareItem}
                                    onAddExample={handleAddExampleItem}
                                    onOpenRequest={(req) => {
                                        const folderPath = getFolderPath(collections, req.parentId || '');
                                        vscode.postMessage({
                                            type: 'openRequest',
                                            payload: { ...req, _folderPath: folderPath }
                                        });
                                    }}
                                    onOpenExample={(ex, req) =>
                                        vscode.postMessage({
                                            type: 'openExample',
                                            payload: { example: ex, parentRequest: req }
                                        })
                                    }
                                    onDeleteExample={handleDeleteExampleClick}
                                    onRenameExample={handleRenameExample}
                                    onDuplicateExample={handleDuplicateExample}
                                    onMove={handleMoveItem}
                                    onDrop={handleDrop}
                                />
                            ) : (
                                <RequestItem
                                    key={item.id}
                                    request={item}
                                    onClick={() => {
                                        // Root request has no parent folder path
                                        vscode.postMessage({
                                            type: 'openRequest',
                                            payload: { ...item, _folderPath: [] }
                                        });
                                    }}
                                    onDelete={handleDeleteClick}
                                    onRename={handleRenameItem}
                                    onDuplicate={handleDuplicateItem}
                                    onAddExample={handleAddExampleItem}
                                    onShare={handleShareItem}
                                    onOpenExample={(ex, req) =>
                                        vscode.postMessage({
                                            type: 'openExample',
                                            payload: { example: ex, parentRequest: req }
                                        })
                                    }
                                    onDeleteExample={handleDeleteExampleClick}
                                    onRenameExample={handleRenameExample}
                                    onDuplicateExample={handleDuplicateExample}
                                    onMove={handleMoveItem}
                                />
                            )
                        )}
                    </List>
                )}
            </Box>

            <Dialog open={createFolderDialogOpen} onClose={() => setCreateFolderDialogOpen(false)}>
                <DialogTitle>{createFolderParentId ? 'New Folder' : 'New Collection'}</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter a name for the new {createFolderParentId ? 'folder' : 'collection'}.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Name"
                        fullWidth
                        variant="standard"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') confirmCreateFolder();
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateFolderDialogOpen(false)}>Cancel</Button>
                    <Button onClick={confirmCreateFolder}>Create</Button>
                </DialogActions>
            </Dialog>

            <Dialog
                open={deleteDialogOpen}
                onClose={handleDeleteCancel}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{'Confirm Delete'}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete this item? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleDeleteCancel}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={moveDialogOpen} onClose={handleMoveCancel} maxWidth="xs" fullWidth>
                <DialogTitle>Move Item</DialogTitle>
                <DialogContent dividers sx={{ height: 300, p: 0 }}>
                    <List dense>
                        <ListItemButton selected={targetFolderId === ''} onClick={() => setTargetFolderId('')}>
                            <ListItemText primary="Root" />
                        </ListItemButton>
                        {availableFolders.map((folder) => (
                            <ListItemButton
                                key={folder.id}
                                selected={targetFolderId === folder.id}
                                onClick={() => setTargetFolderId(folder.id)}
                                sx={{ pl: folder.depth * 2 + 2 }}
                            >
                                <ListItemText primary={folder.name} />
                            </ListItemButton>
                        ))}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleMoveCancel}>Cancel</Button>
                    <Button onClick={handleMoveConfirm} variant="contained" autoFocus>
                        Move
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
