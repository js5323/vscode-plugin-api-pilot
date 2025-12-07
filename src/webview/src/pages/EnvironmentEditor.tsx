import { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button, Stack, Paper } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import KeyValueTable from '../components/RequestEditor/KeyValueTable';
import { Environment, KeyValueItem } from '../types';

export default function EnvironmentEditor() {
    const [environment, setEnvironment] = useState<Environment | null>(null);
    const [isDirty, setIsDirty] = useState(false);

    useEffect(() => {
        // Load initial data
        const initialData = (window as any).initialData;
        if (initialData) {
            setEnvironment(initialData);
        }

        // Listen for messages
        const handleMessage = (event: MessageEvent) => {
            const message = event.data;
            switch (message.type) {
                case 'updateEnvironment':
                    setEnvironment(message.payload);
                    setIsDirty(false);
                    break;
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleSave = () => {
        if (environment && (window as any).vscode) {
            (window as any).vscode.postMessage({
                type: 'saveEnvironment',
                payload: environment
            });
            setIsDirty(false);
        }
    };

    const handleNameChange = (name: string) => {
        if (environment) {
            setEnvironment({ ...environment, name });
            setIsDirty(true);
        }
    };

    const handleVariablesChange = (variables: KeyValueItem[]) => {
        if (environment) {
            setEnvironment({ ...environment, variables });
            setIsDirty(true);
        }
    };

    if (!environment) {
        return <Box sx={{ p: 3 }}>Loading...</Box>;
    }

    return (
        <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
            {/* Header */}
            <Box
                sx={{
                    p: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    bgcolor: 'background.paper'
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                    <Typography variant="h6" noWrap sx={{ maxWidth: 300 }}>
                        {environment.name || 'New Environment'}
                    </Typography>
                    {isDirty && (
                        <Typography variant="caption" color="text.secondary">
                            (Unsaved changes)
                        </Typography>
                    )}
                </Stack>
                <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    disabled={!isDirty}
                    size="small"
                >
                    Save
                </Button>
            </Box>

            {/* Content */}
            <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                <Paper sx={{ p: 3, mb: 3 }}>
                    <Stack spacing={3}>
                        <TextField
                            label="Environment Name"
                            value={environment.name}
                            onChange={(e) => handleNameChange(e.target.value)}
                            fullWidth
                            size="small"
                        />

                        <Box>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                                Variables
                            </Typography>
                            <KeyValueTable items={environment.variables || []} onChange={handleVariablesChange} />
                        </Box>
                    </Stack>
                </Paper>
            </Box>
        </Box>
    );
}
