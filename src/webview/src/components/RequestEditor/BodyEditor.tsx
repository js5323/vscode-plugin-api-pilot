import React from 'react';
import Editor from '@monaco-editor/react';
import {
    Box,
    RadioGroup,
    FormControlLabel,
    Radio,
    Typography,
    TextField,
    Select,
    MenuItem,
    Button,
    Stack,
    IconButton,
    Divider
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import KeyValueTable from './KeyValueTable';
import { ApiRequestBody, KeyValueItem } from '../../types';
import { useVsCodeTheme } from '../../hooks/useVsCodeTheme';
import { getVsCodeApi } from '../../utils/vscode';

const vscode = getVsCodeApi();

interface BodyEditorProps {
    body: ApiRequestBody;
    onChange: (body: ApiRequestBody) => void;
}

export default function BodyEditor({ body, onChange }: BodyEditorProps) {
    const theme = useVsCodeTheme();

    const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...body, type: event.target.value as ApiRequestBody['type'] });
    };

    const handleFormDataChange = (items: KeyValueItem[]) => {
        onChange({ ...body, formData: items });
    };

    const handleUrlEncodedChange = (items: KeyValueItem[]) => {
        onChange({ ...body, urlencoded: items });
    };

    const handleRawChange = (value: string) => {
        onChange({ ...body, raw: value });
    };

    const handleSelectFile = (rowId: string) => {
        if (vscode) {
            vscode.postMessage({
                type: 'selectFile',
                context: { type: 'formData', rowId }
            });
        }
    };

    const handleSelectBinaryFile = () => {
        if (vscode) {
            vscode.postMessage({
                type: 'selectFile',
                context: { type: 'binary' }
            });
        }
    };

    const handleBeautify = () => {
        if (!body.raw) return;
        try {
            if (body.rawType === 'JSON' || !body.rawType || body.rawType === 'JavaScript') {
                const formatted = JSON.stringify(JSON.parse(body.raw), null, 2);
                onChange({ ...body, raw: formatted });
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box
                sx={{
                    borderBottom: 1,
                    borderColor: 'divider',
                    mb: 2,
                    pb: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 1
                }}
            >
                <RadioGroup row value={body.type} onChange={handleTypeChange}>
                    <FormControlLabel
                        value="none"
                        control={<Radio size="small" />}
                        label={<Typography variant="body2">none</Typography>}
                    />
                    <FormControlLabel
                        value="form-data"
                        control={<Radio size="small" />}
                        label={<Typography variant="body2">form-data</Typography>}
                    />
                    <FormControlLabel
                        value="x-www-form-urlencoded"
                        control={<Radio size="small" />}
                        label={<Typography variant="body2">x-www-form-urlencoded</Typography>}
                    />
                    <FormControlLabel
                        value="raw"
                        control={<Radio size="small" />}
                        label={<Typography variant="body2">raw</Typography>}
                    />
                    <FormControlLabel
                        value="binary"
                        control={<Radio size="small" />}
                        label={<Typography variant="body2">binary</Typography>}
                    />
                    <FormControlLabel
                        value="graphql"
                        control={<Radio size="small" />}
                        label={<Typography variant="body2">GraphQL</Typography>}
                    />
                </RadioGroup>

                {body.type === 'raw' && (
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Select
                            value={body.rawType || 'JSON'}
                            onChange={(e) =>
                                onChange({
                                    ...body,
                                    rawType: e.target.value as 'Text' | 'JavaScript' | 'JSON' | 'HTML' | 'XML'
                                })
                            }
                            size="small"
                            variant="standard"
                            disableUnderline
                            sx={{ fontSize: '0.85rem', fontWeight: 'bold', minWidth: 60 }}
                        >
                            {['Text', 'JavaScript', 'JSON', 'HTML', 'XML'].map((t) => (
                                <MenuItem key={t} value={t} dense>
                                    {t}
                                </MenuItem>
                            ))}
                        </Select>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Box
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    cursor: 'pointer',
                                    color: 'text.secondary'
                                }}
                            >
                                <Typography variant="caption">Schema</Typography>
                            </Box>
                            <Button
                                size="small"
                                onClick={handleBeautify}
                                sx={{ textTransform: 'none', fontWeight: 'bold' }}
                            >
                                Beautify
                            </Button>
                        </Box>
                    </Stack>
                )}
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {body.type === 'none' && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, color: 'text.secondary' }}>
                        This request does not have a body
                    </Box>
                )}

                {body.type === 'form-data' && (
                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <KeyValueTable
                            items={body.formData || []}
                            onChange={handleFormDataChange}
                            enableFileSupport={true}
                            onSelectFile={handleSelectFile}
                        />
                    </Box>
                )}

                {body.type === 'x-www-form-urlencoded' && (
                    <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                        <KeyValueTable items={body.urlencoded || []} onChange={handleUrlEncodedChange} />
                    </Box>
                )}

                {body.type === 'raw' && (
                    <Box sx={{ flexGrow: 1, border: 1, borderColor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
                        <Editor
                            height="100%"
                            theme={theme}
                            language={
                                body.rawType?.toLowerCase() === 'text'
                                    ? 'plaintext'
                                    : body.rawType?.toLowerCase() || 'json'
                            }
                            value={body.raw || ''}
                            onChange={(value) => handleRawChange(value || '')}
                            options={{
                                minimap: { enabled: false },
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                automaticLayout: true,
                                formatOnPaste: true,
                                formatOnType: true
                            }}
                        />
                    </Box>
                )}

                {body.type === 'binary' && (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleSelectBinaryFile}>
                            Select File
                        </Button>
                        {body.binary ? (
                            <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                Selected file: {body.binary}
                            </Typography>
                        ) : (
                            <Typography variant="body2" color="text.secondary">
                                No file selected
                            </Typography>
                        )}
                    </Box>
                )}

                {body.type === 'graphql' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 1 }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            sx={{ justifyContent: 'flex-end', mb: 0 }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 'auto' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <Typography variant="caption" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                        Auto Fetch
                                    </Typography>
                                </Box>
                                <IconButton size="small">
                                    <RefreshIcon fontSize="small" />
                                </IconButton>
                                <IconButton size="small">
                                    <WarningAmberIcon fontSize="small" color="warning" />
                                </IconButton>
                            </Box>
                        </Stack>

                        <Box sx={{ display: 'flex', flexGrow: 1, gap: 2, overflow: 'hidden' }}>
                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <Typography variant="caption" sx={{ mb: 1, fontWeight: 'bold' }}>
                                    QUERY
                                </Typography>
                                <TextField
                                    multiline
                                    fullWidth
                                    placeholder="Enter GraphQL Query"
                                    value={body.graphql?.query || ''}
                                    onChange={(e) =>
                                        onChange({
                                            ...body,
                                            graphql: {
                                                ...body.graphql,
                                                query: e.target.value,
                                                variables: body.graphql?.variables || ''
                                            }
                                        })
                                    }
                                    sx={{
                                        flexGrow: 1,
                                        fontFamily: 'monospace',
                                        '& .MuiInputBase-root': {
                                            fontFamily: 'monospace',
                                            height: '100%',
                                            alignItems: 'flex-start',
                                            bgcolor: 'background.paper'
                                        }
                                    }}
                                />
                            </Box>

                            <Divider orientation="vertical" flexItem />

                            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                        GRAPHQL VARIABLES
                                    </Typography>
                                </Box>
                                <TextField
                                    multiline
                                    fullWidth
                                    placeholder="JSON Variables"
                                    value={body.graphql?.variables || ''}
                                    onChange={(e) =>
                                        onChange({
                                            ...body,
                                            graphql: {
                                                ...body.graphql,
                                                query: body.graphql?.query || '',
                                                variables: e.target.value
                                            }
                                        })
                                    }
                                    sx={{
                                        flexGrow: 1,
                                        fontFamily: 'monospace',
                                        '& .MuiInputBase-root': {
                                            fontFamily: 'monospace',
                                            height: '100%',
                                            alignItems: 'flex-start',
                                            bgcolor: 'background.paper'
                                        }
                                    }}
                                />
                            </Box>
                        </Box>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
