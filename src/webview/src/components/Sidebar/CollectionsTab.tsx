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
    DialogActions
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
    const [filteredCollections, setFilteredCollections] = useState<CollectionItem[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<string | null>(null);
    const [exampleToDelete, setExampleToDelete] = useState<{ exampleId: string; requestId: string } | null>(null);

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
        const newCollection: CollectionFolder = {
            id: Date.now().toString(),
            name: 'New Collection',
            type: 'folder',
            children: []
        };
        saveCollections([...collections, newCollection]);
    };

    const handleAddRequestToFolder = (folderId: string) => {
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
                    return { ...item, children: [newRequest, ...item.children] } as CollectionFolder;
                }
                if (item.type === 'folder') {
                    return { ...item, children: addRequest(item.children) } as CollectionFolder;
                }
                return item;
            });
        };
        saveCollections(addRequest(collections));
    };

    const handleAddFolderToFolder = (folderId: string) => {
        const addFolder = (items: CollectionItem[]): CollectionItem[] => {
            return items.map((item) => {
                if (item.id === folderId && item.type === 'folder') {
                    const newFolder: CollectionFolder = {
                        id: Date.now().toString(),
                        name: 'New Folder',
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
                        const newItem = {
                            ...original,
                            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
                            name: original.name + ' Copy'
                        } as any;
                        if (original.type === 'folder') {
                            (newItem as CollectionFolder).children = (original as CollectionFolder).children.map(
                                (child) => cloneItem(child)
                            );
                        }
                        return newItem;
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

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <SidebarSearch
                activeTab="collections"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onAction={handleCreateCollection}
            />
            <Box sx={{ flexGrow: 1, overflow: 'auto', px: 0.5 }}>
                {collections.length === 0 ? (
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
                                    onOpenRequest={(req) => vscode.postMessage({ type: 'openRequest', payload: req })}
                                    onOpenExample={(ex, req) =>
                                        vscode.postMessage({
                                            type: 'openExample',
                                            payload: { example: ex, parentRequest: req }
                                        })
                                    }
                                    onDeleteExample={handleDeleteExampleClick}
                                    onRenameExample={handleRenameExample}
                                    onDuplicateExample={handleDuplicateExample}
                                />
                            ) : (
                                <RequestItem
                                    key={item.id}
                                    request={item}
                                    onClick={() => vscode.postMessage({ type: 'openRequest', payload: item })}
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
                                />
                            )
                        )}
                    </List>
                )}
            </Box>

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
        </Box>
    );
}
