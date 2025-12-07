import React from 'react';
import { Box, RadioGroup, FormControlLabel, Radio, Typography, TextField, Button } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import KeyValueTable from './KeyValueTable';
import { ApiRequestBody, KeyValueItem } from '../../types';
import { getVsCodeApi } from '../../utils/vscode';

const vscode = getVsCodeApi();

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

    const handleSelectFile = () => {
        vscode.postMessage({ type: 'selectFile' });
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
                    <KeyValueTable items={body.formData || []} onChange={handleFormDataChange} />
                )}

                {body.type === 'x-www-form-urlencoded' && (
                    <KeyValueTable items={body.urlencoded || []} onChange={handleUrlEncodedChange} />
                )}

                {body.type === 'raw' && (
                    <TextField
                        multiline
                        fullWidth
                        minRows={10}
                        placeholder="Raw body content"
                        value={body.raw || ''}
                        onChange={(e) => handleRawChange(e.target.value)}
                        sx={{
                            fontFamily: 'monospace',
                            '& .MuiInputBase-root': { fontFamily: 'monospace' }
                        }}
                    />
                )}

                {body.type === 'binary' && (
                    <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}>
                        <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={handleSelectFile}>
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
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
                        <Typography variant="subtitle2">Query</Typography>
                        <TextField
                            multiline
                            fullWidth
                            minRows={6}
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
                            sx={{ fontFamily: 'monospace' }}
                        />
                        <Typography variant="subtitle2">Variables</Typography>
                        <TextField
                            multiline
                            fullWidth
                            minRows={4}
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
                            sx={{ fontFamily: 'monospace' }}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
}
