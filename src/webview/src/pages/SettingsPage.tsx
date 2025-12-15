import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Paper, Button } from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { getVsCodeApi } from '../utils/vscode';
import { Settings, Environment, ClientCertificate, KeyValueItem } from '../types';
import { GeneralTab } from '../components/Settings/GeneralTab';
import { EnvironmentTab } from '../components/Settings/EnvironmentTab';
import { ProxyTab } from '../components/Settings/ProxyTab';
import { CertificatesTab } from '../components/Settings/CertificatesTab';
import { AboutTab } from '../components/Settings/AboutTab';

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
                            ca: [...(prev.certificates?.ca || []), payload]
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
