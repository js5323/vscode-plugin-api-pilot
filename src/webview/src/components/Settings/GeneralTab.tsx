import { TextField, FormControlLabel, Switch, Divider, Typography, Stack, Button, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { Settings, KeyValueItem } from '../../types';

interface GeneralTabProps {
    settings: Settings;
    setSettings: (s: Settings) => void;
}

export const GeneralTab = ({ settings, setSettings }: GeneralTabProps) => (
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
