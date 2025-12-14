import { useState, useEffect } from 'react';
import {
    Stack,
    Box,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { getVsCodeApi } from '../../utils/vscode';
import { Settings, ClientCertificate } from '../../types';

const vscode = getVsCodeApi();

interface CertificatesTabProps {
    settings: Settings;
    setSettings: (s: Settings) => void;
}

export const CertificatesTab = ({ settings, setSettings }: CertificatesTabProps) => {
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
                        <ListItem
                            key={idx}
                            divider
                            secondaryAction={
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
                            }
                        >
                            <ListItemText primary={cert} />
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
                        <ListItem
                            key={idx}
                            divider
                            secondaryAction={
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
                            }
                        >
                            <ListItemText
                                primary={cert.host}
                                secondary={cert.pfx ? `PFX: ${cert.pfx}` : `CRT: ${cert.crt}`}
                            />
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
