import React from 'react';
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

const vscode = (window as any).vscode;

interface BodyEditorProps {
    body: ApiRequestBody;
    onChange: (body: ApiRequestBody) => void;
}

export default function BodyEditor({ body, onChange }: BodyEditorProps) {
    const handleTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        onChange({ ...body, type: event.target.value as any });
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
            // console.error(e);
        }
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2, pb: 1 }}>
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
            </Box>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                {body.type === 'none' && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, color: 'text.secondary' }}>
                        This request does not have a body
                    </Box>
                )}

                {body.type === 'form-data' && (
                    <KeyValueTable
                        items={body.formData || []}
                        onChange={handleFormDataChange}
                        enableFileSupport={true}
                        onSelectFile={handleSelectFile}
                    />
                )}

                {body.type === 'x-www-form-urlencoded' && (
                    <KeyValueTable items={body.urlencoded || []} onChange={handleUrlEncodedChange} />
                )}

                {body.type === 'raw' && (
                    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                        <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            sx={{ mb: 1, justifyContent: 'flex-end' }}
                        >
                            <Select
                                value={body.rawType || 'JSON'}
                                onChange={(e) => onChange({ ...body, rawType: e.target.value as any })}
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
                        <TextField
                            multiline
                            fullWidth
                            minRows={10}
                            placeholder="Raw body content"
                            value={body.raw || ''}
                            onChange={(e) => handleRawChange(e.target.value)}
                            sx={{
                                flexGrow: 1,
                                fontFamily: 'monospace',
                                '& .MuiInputBase-root': {
                                    fontFamily: 'monospace',
                                    height: '100%',
                                    alignItems: 'flex-start'
                                }
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
