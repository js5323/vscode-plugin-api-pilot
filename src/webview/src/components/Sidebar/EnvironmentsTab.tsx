import { useState, useEffect } from 'react';
import { Box, List, ListItem, ListItemText, IconButton, Radio } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SidebarSearch from './SidebarSearch';
import { getVsCodeApi } from '../../utils/vscode';
import { Environment } from '../../types';

const vscode = getVsCodeApi();

export default function EnvironmentsTab() {
    const [searchTerm, setSearchTerm] = useState('');
    const [environments, setEnvironments] = useState<Environment[]>([]);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            if (message.type === 'updateEnvironments') {
                setEnvironments(message.payload || []);
            }
        };
        window.addEventListener('message', handleMessage);
        vscode.postMessage({ type: 'getEnvironments' });
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const saveEnvironments = (envs: Environment[]) => {
        setEnvironments(envs);
        vscode.postMessage({ type: 'saveEnvironments', payload: envs });
    };

    const handleCreateEnvironment = () => {
        const newEnv: Environment = {
            id: Date.now().toString(),
            name: 'New Environment',
            variables: [],
            isActive: false
        };
        // Save first so it exists in the list
        saveEnvironments([...environments, newEnv]);
        // Then open editor
        vscode.postMessage({ type: 'openEnvironmentEditor', payload: newEnv });
    };

    const handleDeleteEnvironment = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // Confirm delete? Ideally yes, but adhering to minimal changes for now unless requested.
        // User requested delete confirmation for collections, probably good here too but not explicitly asked for this specific tab in this turn.
        // I'll stick to simple delete for now to match previous behavior minus dialog.
        const newEnvs = environments.filter((env) => env.id !== id);
        saveEnvironments(newEnvs);
    };

    const handleEditEnvironment = (env: Environment, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        vscode.postMessage({ type: 'openEnvironmentEditor', payload: env });
    };

    const handleActivateEnvironment = (id: string) => {
        const newEnvs = environments.map((env) => ({
            ...env,
            isActive: env.id === id
        }));
        saveEnvironments(newEnvs);
    };

    const filteredEnvironments = environments.filter((env) =>
        env.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <SidebarSearch
                activeTab="environments"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onAction={handleCreateEnvironment}
                ActionIcon={AddIcon}
            />
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <List dense>
                    {filteredEnvironments.map((env) => (
                        <ListItem
                            key={env.id}
                            secondaryAction={
                                <Box>
                                    <IconButton size="small" onClick={(e) => handleEditEnvironment(env, e)}>
                                        <EditIcon fontSize="small" />
                                    </IconButton>
                                    <IconButton size="small" onClick={(e) => handleDeleteEnvironment(env.id, e)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            }
                            disablePadding
                        >
                            <Radio
                                checked={env.isActive}
                                onChange={() => handleActivateEnvironment(env.id)}
                                size="small"
                            />
                            <ListItemText
                                primary={env.name}
                                secondary={`${env.variables.length} variables`}
                                onClick={() => handleEditEnvironment(env)}
                                sx={{ cursor: 'pointer' }}
                            />
                        </ListItem>
                    ))}
                    {filteredEnvironments.length === 0 && (
                        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>No environments found.</Box>
                    )}
                </List>
            </Box>
        </Box>
    );
}
