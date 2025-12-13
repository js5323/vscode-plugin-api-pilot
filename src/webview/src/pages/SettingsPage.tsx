import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Tabs,
    Tab,
    Paper,
    TextField,
    FormControlLabel,
    Switch,
    Button,
    Select,
    MenuItem,
    InputLabel,
    FormControl,
    Stack,
    Divider,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import { getVsCodeApi } from '../utils/vscode';
import { Settings, Environment, KeyValueItem, ClientCertificate } from '../types';

const vscode = getVsCodeApi();

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
            style={{ height: '100%', overflow: 'auto' }}
        >
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
}

// --- Tab Content Components ---

const GeneralTab = ({ settings, setSettings }: { settings: Settings; setSettings: (s: Settings) => void }) => (
    <Stack spacing={3}>
        <TextField
            label="Request Timeout (ms)"
            type="number"
            value={settings.general.timeout}
            onChange={(e) =>
                setSettings({
                    ...settings,
                    general: { ...settings.general, timeout: parseInt(e.target.value) || 0 }
                })
            }
            helperText="Set to 0 for no timeout"
        />
        <TextField
            label="Max Response Size (bytes)"
            type="number"
            value={settings.general.maxResponseSize}
            onChange={(e) =>
                setSettings({
                    ...settings,
                    general: { ...settings.general, maxResponseSize: parseInt(e.target.value) || 0 }
                })
            }
            helperText="Set to 0 for unlimited"
        />
        <FormControlLabel
            control={
                <Switch
                    checked={settings.general.sslVerification}
                    onChange={(e) =>
                        setSettings({
                            ...settings,
                            general: { ...settings.general, sslVerification: e.target.checked }
                        })
                    }
                />
            }
            label="SSL Certificate Verification"
        />
        <FormControlLabel
            control={
                <Switch
                    checked={settings.general.autoSave || false}
                    onChange={(e) =>
                        setSettings({
                            ...settings,
                            general: { ...settings.general, autoSave: e.target.checked }
                        })
                    }
                />
            }
            label="Auto Save"
        />

        <Divider />

        <Typography variant="subtitle2">Default Request Headers</Typography>
        {settings.general.defaultHeaders.map((header: KeyValueItem, index: number) => (
            <Stack direction="row" spacing={1} key={index}>
                <TextField
                    label="Key"
                    size="small"
                    fullWidth
                    value={header.key}
                    onChange={(e) => {
                        const newHeaders = [...settings.general.defaultHeaders];
                        newHeaders[index].key = e.target.value;
                        setSettings({ ...settings, general: { ...settings.general, defaultHeaders: newHeaders } });
                    }}
                />
                <TextField
                    label="Value"
                    size="small"
                    fullWidth
                    value={header.value}
                    onChange={(e) => {
                        const newHeaders = [...settings.general.defaultHeaders];
                        newHeaders[index].value = e.target.value;
                        setSettings({ ...settings, general: { ...settings.general, defaultHeaders: newHeaders } });
                    }}
                />
                <IconButton
                    onClick={() => {
                        const newHeaders = settings.general.defaultHeaders.filter(
                            (_: unknown, i: number) => i !== index
                        );
                        setSettings({ ...settings, general: { ...settings.general, defaultHeaders: newHeaders } });
                    }}
                >
                    <DeleteIcon />
                </IconButton>
            </Stack>
        ))}
        <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={() => {
                setSettings({
                    ...settings,
                    general: {
                        ...settings.general,
                        defaultHeaders: [
                            ...settings.general.defaultHeaders,
                            { id: Date.now().toString(), key: '', value: '', isEnabled: true }
                        ]
                    }
                });
            }}
        >
            Add Header
        </Button>
    </Stack>
);

const EnvironmentTab = ({
    defaultEnvId,
    setDefaultEnvId,
    environments
}: {
    defaultEnvId: string;
    setDefaultEnvId: (id: string) => void;
    environments: Environment[];
}) => (
    <Stack spacing={3}>
        <FormControl fullWidth>
            <InputLabel>Default Environment</InputLabel>
            <Select value={defaultEnvId} label="Default Environment" onChange={(e) => setDefaultEnvId(e.target.value)}>
                <MenuItem value="">
                    <em>None</em>
                </MenuItem>
                {environments.map((env) => (
                    <MenuItem key={env.id} value={env.id}>
                        {env.name}
                    </MenuItem>
                ))}
            </Select>
        </FormControl>

        <Divider />

        <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Environments</Typography>
            <Button
                startIcon={<AddIcon />}
                variant="outlined"
                onClick={() => vscode.postMessage({ type: 'createEnvironment' })}
            >
                Create New
            </Button>
        </Box>

        <List>
            {environments.map((env) => (
                <ListItem key={env.id} divider>
                    <ListItemText primary={env.name} secondary={`${env.variables?.length || 0} variables`} />
                    <ListItemSecondaryAction>
                        <IconButton
                            edge="end"
                            aria-label="edit"
                            onClick={() => vscode.postMessage({ type: 'editEnvironment', payload: env })}
                        >
                            <EditIcon />
                        </IconButton>
                        <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => vscode.postMessage({ type: 'deleteEnvironment', payload: env.id })}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </ListItemSecondaryAction>
                </ListItem>
            ))}
        </List>
    </Stack>
);

const ProxyTab = ({ settings, setSettings }: { settings: Settings; setSettings: (s: Settings) => void }) => (
    <Stack spacing={3}>
        <FormControlLabel
            control={
                <Switch
                    checked={settings.proxy.useSystemProxy}
                    onChange={(e) =>
                        setSettings({
                            ...settings,
                            proxy: { ...settings.proxy, useSystemProxy: e.target.checked }
                        })
                    }
                />
            }
            label="Use System Proxy"
        />

        {!settings.proxy.useSystemProxy && (
            <>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>
                    Custom Proxy Configuration
                </Typography>
                <FormControl fullWidth>
                    <InputLabel>Protocol</InputLabel>
                    <Select
                        value={settings.proxy.protocol}
                        label="Protocol"
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                proxy: { ...settings.proxy, protocol: e.target.value }
                            })
                        }
                    >
                        <MenuItem value="http">HTTP</MenuItem>
                        <MenuItem value="https">HTTPS</MenuItem>
                    </Select>
                </FormControl>
                <Stack direction="row" spacing={2}>
                    <TextField
                        label="Proxy Host"
                        fullWidth
                        value={settings.proxy.host}
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                proxy: { ...settings.proxy, host: e.target.value }
                            })
                        }
                    />
                    <TextField
                        label="Port"
                        sx={{ width: 150 }}
                        value={settings.proxy.port}
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                proxy: { ...settings.proxy, port: e.target.value }
                            })
                        }
                    />
                </Stack>

                <FormControlLabel
                    control={
                        <Switch
                            checked={settings.proxy.auth}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    proxy: { ...settings.proxy, auth: e.target.checked }
                                })
                            }
                        />
                    }
                    label="Proxy Authentication"
                />

                {settings.proxy.auth && (
                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Username"
                            fullWidth
                            value={settings.proxy.username}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    proxy: { ...settings.proxy, username: e.target.value }
                                })
                            }
                        />
                        <TextField
                            label="Password"
                            type="password"
                            fullWidth
                            value={settings.proxy.password}
                            onChange={(e) =>
                                setSettings({
                                    ...settings,
                                    proxy: { ...settings.proxy, password: e.target.value }
                                })
                            }
                        />
                    </Stack>
                )}

                <TextField
                    label="Proxy Bypass List"
                    placeholder="localhost, 127.0.0.1"
                    fullWidth
                    value={settings.proxy.bypass}
                    onChange={(e) =>
                        setSettings({
                            ...settings,
                            proxy: { ...settings.proxy, bypass: e.target.value }
                        })
                    }
                    helperText="Comma-separated list of hosts to bypass proxy"
                />
            </>
        )}
    </Stack>
);

const CertificatesTab = ({ settings, setSettings }: { settings: Settings; setSettings: (s: Settings) => void }) => {
    const [clientCertOpen, setClientCertOpen] = useState(false);
    const [newClientCert, setNewClientCert] = useState({
        host: '',
        crt: '',
        key: '',
        pfx: '',
        passphrase: ''
    });

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            const msg = event.data;
            if (msg.type === 'fileSelected') {
                const { payload, context } = msg;
                if (context === 'client_crt') {
                    setNewClientCert((prev) => ({ ...prev, crt: payload }));
                } else if (context === 'client_key') {
                    setNewClientCert((prev) => ({ ...prev, key: payload }));
                } else if (context === 'client_pfx') {
                    setNewClientCert((prev) => ({ ...prev, pfx: payload }));
                }
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    return (
        <Stack spacing={3}>
            <Box>
                <Typography variant="h6" gutterBottom>
                    CA Certificates
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Add custom CA certificates to avoid "Self signed certificate" errors.
                </Typography>
                <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => vscode.postMessage({ type: 'selectFile', context: 'ca' })}
                >
                    Add CA Certificate
                </Button>
                <List>
                    {settings.certificates.ca.map((cert: string, idx: number) => (
                        <ListItem key={idx} divider>
                            <ListItemText primary={cert} />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={() => {
                                        const newCa = settings.certificates.ca.filter(
                                            (_: unknown, i: number) => i !== idx
                                        );
                                        setSettings({
                                            ...settings,
                                            certificates: { ...settings.certificates, ca: newCa }
                                        });
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                    {settings.certificates.ca.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                            No CA certificates added.
                        </Typography>
                    )}
                </List>
            </Box>

            <Divider />

            <Box>
                <Typography variant="h6" gutterBottom>
                    Client Certificates
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    Add client certificates for mutual TLS (mTLS) authentication.
                </Typography>
                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setClientCertOpen(true)}>
                    Add Client Certificate
                </Button>
                <List>
                    {settings.certificates.client.map((cert: ClientCertificate, idx: number) => (
                        <ListItem key={idx} divider>
                            <ListItemText
                                primary={cert.host}
                                secondary={cert.pfx ? `PFX: ${cert.pfx}` : `CRT: ${cert.crt}`}
                            />
                            <ListItemSecondaryAction>
                                <IconButton
                                    edge="end"
                                    onClick={() => {
                                        const newClient = settings.certificates.client.filter(
                                            (_: unknown, i: number) => i !== idx
                                        );
                                        setSettings({
                                            ...settings,
                                            certificates: { ...settings.certificates, client: newClient }
                                        });
                                    }}
                                >
                                    <DeleteIcon />
                                </IconButton>
                            </ListItemSecondaryAction>
                        </ListItem>
                    ))}
                    {settings.certificates.client.length === 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                            No client certificates added.
                        </Typography>
                    )}
                </List>
            </Box>

            <Dialog open={clientCertOpen} onClose={() => setClientCertOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Add Client Certificate</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1 }}>
                        <TextField
                            label="Host"
                            fullWidth
                            placeholder="e.g. example.com"
                            value={newClientCert.host}
                            onChange={(e) => setNewClientCert({ ...newClientCert, host: e.target.value })}
                        />
                        <Typography variant="subtitle2" sx={{ mt: 1 }}>
                            Certificate Files
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                label="CRT File"
                                fullWidth
                                size="small"
                                value={newClientCert.crt}
                                InputProps={{ readOnly: true }}
                            />
                            <Button
                                variant="outlined"
                                onClick={() => vscode.postMessage({ type: 'selectFile', context: 'client_crt' })}
                            >
                                Select
                            </Button>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                label="Key File"
                                fullWidth
                                size="small"
                                value={newClientCert.key}
                                InputProps={{ readOnly: true }}
                            />
                            <Button
                                variant="outlined"
                                onClick={() => vscode.postMessage({ type: 'selectFile', context: 'client_key' })}
                            >
                                Select
                            </Button>
                        </Stack>
                        <Typography variant="caption" align="center">
                            - OR -
                        </Typography>
                        <Stack direction="row" spacing={1}>
                            <TextField
                                label="PFX File"
                                fullWidth
                                size="small"
                                value={newClientCert.pfx}
                                InputProps={{ readOnly: true }}
                            />
                            <Button
                                variant="outlined"
                                onClick={() => vscode.postMessage({ type: 'selectFile', context: 'client_pfx' })}
                            >
                                Select
                            </Button>
                        </Stack>
                        <TextField
                            label="Passphrase"
                            type="password"
                            fullWidth
                            value={newClientCert.passphrase}
                            onChange={(e) => setNewClientCert({ ...newClientCert, passphrase: e.target.value })}
                        />
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setClientCertOpen(false)}>Cancel</Button>
                    <Button
                        variant="contained"
                        onClick={() => {
                            setSettings({
                                ...settings,
                                certificates: {
                                    ...settings.certificates,
                                    client: [...settings.certificates.client, newClientCert]
                                }
                            });
                            setClientCertOpen(false);
                            setNewClientCert({ host: '', crt: '', key: '', pfx: '', passphrase: '' });
                        }}
                    >
                        Add
                    </Button>
                </DialogActions>
            </Dialog>
        </Stack>
    );
};

const AboutTab = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
            ApiPilot
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Version 1.0.0
        </Typography>
        <Typography variant="body1" paragraph>
            A powerful API client for VS Code.
        </Typography>
        <Button href="https://github.com/your-repo" target="_blank">
            Visit GitHub
        </Button>
    </Box>
);

export default function SettingsPage() {
    const [value, setValue] = useState(0);
    const [settings, setSettings] = useState<Settings>({
        general: {
            timeout: 0,
            maxResponseSize: 0,
            sslVerification: true,
            autoSave: true,
            defaultHeaders: [] as KeyValueItem[]
        },
        proxy: {
            useSystemProxy: true,
            protocol: 'http',
            host: '',
            port: '',
            auth: false,
            username: '',
            password: '',
            bypass: ''
        },
        certificates: {
            ca: [] as string[],
            client: [] as ClientCertificate[]
        }
    });

    const [environments, setEnvironments] = useState<Environment[]>([]);
    const [defaultEnvId, setDefaultEnvId] = useState<string>('');

    useEffect(() => {
        vscode.postMessage({ type: 'getSettings' });

        const handleMessage = (event: MessageEvent) => {
            const msg = event.data;
            if (msg.type === 'updateSettings') {
                setSettings(msg.payload.settings as Settings);
                setEnvironments(msg.payload.environments as Environment[]);
                setDefaultEnvId(msg.payload.defaultEnvId || '');
            } else if (msg.type === 'fileSelected') {
                const { payload, context } = msg;
                if (context === 'ca') {
                    setSettings((prev) => ({
                        ...prev,
                        certificates: {
                            ...prev.certificates,
                            ca: [...prev.certificates.ca, payload]
                        }
                    }));
                }
                // client certs are handled in CertificatesTab now
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    const handleSave = () => {
        vscode.postMessage({
            type: 'saveSettings',
            payload: {
                settings,
                defaultEnvId
            }
        });
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
            <Paper sx={{ width: 200, borderRight: 1, borderColor: 'divider', borderRadius: 0 }}>
                <Tabs
                    orientation="vertical"
                    variant="scrollable"
                    value={value}
                    onChange={handleChange}
                    sx={{ borderRight: 1, borderColor: 'divider', height: '100%' }}
                >
                    <Tab label="General" />
                    <Tab label="Environment" />
                    <Tab label="Proxy" />
                    <Tab label="Certificates" />
                    <Tab label="About" />
                </Tabs>
            </Paper>

            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    <CustomTabPanel value={value} index={0}>
                        <GeneralTab settings={settings} setSettings={setSettings} />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={1}>
                        <EnvironmentTab
                            defaultEnvId={defaultEnvId}
                            setDefaultEnvId={setDefaultEnvId}
                            environments={environments}
                        />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={2}>
                        <ProxyTab settings={settings} setSettings={setSettings} />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={3}>
                        <CertificatesTab settings={settings} setSettings={setSettings} />
                    </CustomTabPanel>
                    <CustomTabPanel value={value} index={4}>
                        <AboutTab />
                    </CustomTabPanel>
                </Box>

                <Paper
                    sx={{ p: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}
                    square
                >
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave}>
                        Save Settings
                    </Button>
                </Paper>
            </Box>
        </Box>
    );
}
