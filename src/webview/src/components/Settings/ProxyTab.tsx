import {
    Stack,
    FormControlLabel,
    Switch,
    Typography,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    TextField
} from '@mui/material';
import { Settings } from '../../types';

interface ProxyTabProps {
    settings: Settings;
    setSettings: (s: Settings) => void;
}

export const ProxyTab = ({ settings, setSettings }: ProxyTabProps) => (
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
