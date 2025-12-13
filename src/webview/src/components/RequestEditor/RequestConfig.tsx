import { useState } from 'react';
import { Box, Tabs, Tab, Tooltip, IconButton } from '@mui/material';
import VerticalSplitIcon from '@mui/icons-material/VerticalSplit';
import HorizontalSplitIcon from '@mui/icons-material/HorizontalSplit';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import Editor from '@monaco-editor/react';
import { ApiRequest, ApiRequestBody, KeyValueItem } from '../../types';
import KeyValueTable from './KeyValueTable';
import BodyEditor from './BodyEditor';
import { useVsCodeTheme } from '../../hooks/useVsCodeTheme';

interface RequestConfigProps {
    request: ApiRequest;
    onChange: (field: keyof ApiRequest, value: unknown) => void;
    layout: 'vertical' | 'horizontal';
    onLayoutChange: () => void;
}

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
            style={{ height: '100%' }}
        >
            {value === index && <Box sx={{ p: 2, height: '100%', boxSizing: 'border-box' }}>{children}</Box>}
        </div>
    );
}

export default function RequestConfig({ request, onChange, layout, onLayoutChange }: RequestConfigProps) {
    const [tabValue, setTabValue] = useState(1);
    const theme = useVsCodeTheme();

    const handleParamsChange = (items: KeyValueItem[]) => {
        onChange('queryParams', items);
    };

    const handleHeadersChange = (items: KeyValueItem[]) => {
        onChange('headers', items);
    };

    const handleBodyChange = (body: ApiRequestBody) => {
        onChange('body', body);
    };

    const hasContent = (index: number) => {
        switch (index) {
            case 0: // Docs
                return !!request.description;
            case 1: // Params
                return request.queryParams && request.queryParams.some((p) => p.isEnabled && p.key);
            case 2: // Headers
                return request.headers && request.headers.some((h) => h.isEnabled && h.key);
            case 3: // Body
                if (!request.body || request.body.type === 'none') return false;
                if (request.body.type === 'raw') return !!request.body.raw;
                if (request.body.type === 'form-data')
                    return request.body.formData && request.body.formData.some((f) => f.isEnabled && f.key);
                if (request.body.type === 'x-www-form-urlencoded')
                    return request.body.urlencoded && request.body.urlencoded.some((u) => u.isEnabled && u.key);
                if (request.body.type === 'binary') return !!request.body.binary;
                if (request.body.type === 'graphql') return !!request.body.graphql?.query;
                return false;
            default:
                return false;
        }
    };

    const renderTab = (label: string, index: number) => {
        const active = hasContent(index);
        return (
            <Tab
                label={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {label}
                        {active && (
                            <Box
                                sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: 'primary.main'
                                }}
                            />
                        )}
                    </Box>
                }
            />
        );
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', display: 'flex', alignItems: 'center' }}>
                <Tabs
                    value={tabValue}
                    onChange={(_, v) => setTabValue(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                    sx={{ minHeight: 48, flexGrow: 1 }}
                >
                    {renderTab('Docs', 0)}
                    {renderTab('Params', 1)}
                    {renderTab('Headers', 2)}
                    {renderTab('Body', 3)}
                </Tabs>
                <Tooltip title="Use {{variable}} to reference environment variables">
                    <IconButton size="small" sx={{ mr: 1 }}>
                        <HelpOutlineIcon fontSize="small" />
                    </IconButton>
                </Tooltip>
                <Tooltip title={`Switch to ${layout === 'vertical' ? 'Horizontal' : 'Vertical'} Layout`}>
                    <IconButton onClick={onLayoutChange} size="small" sx={{ mr: 1 }}>
                        {layout === 'vertical' ? <HorizontalSplitIcon /> : <VerticalSplitIcon />}
                    </IconButton>
                </Tooltip>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <CustomTabPanel value={tabValue} index={0}>
                    <Box
                        sx={{
                            height: '100%',
                            border: 1,
                            borderColor: 'divider',
                            borderRadius: 1,
                            overflow: 'hidden'
                        }}
                    >
                        <Editor
                            height="100%"
                            theme={theme}
                            language="markdown"
                            value={request.description || ''}
                            onChange={(value) => onChange('description', value || '')}
                            options={{
                                minimap: { enabled: false },
                                lineNumbers: 'off',
                                wordWrap: 'on',
                                automaticLayout: true
                            }}
                        />
                    </Box>
                </CustomTabPanel>
                <CustomTabPanel value={tabValue} index={1}>
                    <KeyValueTable
                        items={request.queryParams || []}
                        onChange={handleParamsChange}
                        title="Query Params"
                    />
                </CustomTabPanel>
                <CustomTabPanel value={tabValue} index={2}>
                    <KeyValueTable
                        items={request.headers || []}
                        onChange={handleHeadersChange}
                        title="Headers"
                        enablePresets={true}
                    />
                </CustomTabPanel>
                <CustomTabPanel value={tabValue} index={3}>
                    <BodyEditor body={request.body || { type: 'none' }} onChange={handleBodyChange} />
                </CustomTabPanel>
            </Box>
        </Box>
    );
}
