import { useState, useEffect } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Checkbox,
    TextField,
    IconButton,
    Box,
    Typography,
    Button,
    Menu,
    MenuItem,
    Select
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { KeyValueItem } from '../../types';

interface KeyValueTableProps {
    items: KeyValueItem[];
    onChange: (items: KeyValueItem[]) => void;
    title?: string; // e.g. "Query Params"
    enablePresets?: boolean;
    enableFileSupport?: boolean;
    onSelectFile?: (rowId: string) => void;
}

export default function KeyValueTable({
    items,
    onChange,
    title,
    enablePresets,
    enableFileSupport,
    onSelectFile
}: KeyValueTableProps) {
    const [rows, setRows] = useState<KeyValueItem[]>([
        ...items,
        { id: Date.now().toString(), key: '', value: '', description: '', isEnabled: true } // Empty row at bottom
    ]);

    useEffect(() => {
        // Ensure there is always one empty row at the bottom
        const lastRow = rows[rows.length - 1];
        if (lastRow.key || lastRow.value || lastRow.description) {
            setRows([
                ...rows,
                { id: Date.now().toString() + Math.random(), key: '', value: '', description: '', isEnabled: true }
            ]);
        }
    }, [rows]);

    // Sync external items with internal rows (excluding the empty last row if it's truly empty)
    useEffect(() => {
        // This effect might cause loop if not careful.
        // Actually, we should drive state from props usually, but for a table with an "add new" row,
        // local state is easier to manage for the "empty row" logic.
        // However, to keep it simple and controlled:
        // Let's rely on props 'items' + one virtual empty row for rendering.
    }, [items]);

    const [isBulkEdit, setIsBulkEdit] = useState(false);
    const [bulkText, setBulkText] = useState('');

    const [presetAnchorEl, setPresetAnchorEl] = useState<null | HTMLElement>(null);

    const handlePresetClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setPresetAnchorEl(event.currentTarget);
    };

    const handlePresetClose = () => {
        setPresetAnchorEl(null);
    };

    const handleApplyPreset = (presetItems: { key: string; value: string }[]) => {
        const itemsToAdd = presetItems.map((p) => ({
            id: Date.now().toString() + Math.random(),
            key: p.key,
            value: p.value,
            description: '',
            isEnabled: true
        }));
        onChange([...items, ...itemsToAdd]);
        handlePresetClose();
    };

    const handleBulkEditToggle = () => {
        if (isBulkEdit) {
            // Parse bulk text -> items
            const newItems: KeyValueItem[] = bulkText
                .split('\n')
                .filter((line) => line.trim())
                .map((line) => {
                    const firstColonIndex = line.indexOf(':');
                    let key = line;
                    let value = '';

                    if (firstColonIndex !== -1) {
                        key = line.substring(0, firstColonIndex).trim();
                        value = line.substring(firstColonIndex + 1).trim();
                    } else {
                        key = line.trim();
                    }

                    return {
                        id: Date.now().toString() + Math.random(),
                        key,
                        value,
                        isEnabled: true,
                        description: ''
                    };
                });

            onChange(newItems);
            setIsBulkEdit(false);
        } else {
            // Items -> bulk text
            const text = items
                .filter((i) => i.key || i.value)
                .map((i) => `${i.key}:${i.value}`)
                .join('\n');
            setBulkText(text);
            setIsBulkEdit(true);
        }
    };

    const handleItemChange = (id: string, field: keyof KeyValueItem, value: any) => {
        let newItems = [...items];
        const itemIndex = newItems.findIndex((i) => i.id === id);

        if (itemIndex === -1) {
            // It's the empty row being edited
            const newItem = {
                id: Date.now().toString(),
                key: '',
                value: '',
                description: '',
                isEnabled: true,
                [field]: value
            };
            newItems.push(newItem);
        } else {
            newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
        }
        onChange(newItems);
    };

    const handleDelete = (id: string) => {
        onChange(items.filter((i) => i.id !== id));
    };

    const renderRows = [...items, { id: 'NEW_ROW', key: '', value: '', description: '', isEnabled: true }];

    return (
        <Box sx={{ width: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                {title && (
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {title}
                    </Typography>
                )}
                <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                    {enablePresets && (
                        <Button size="small" onClick={handlePresetClick} sx={{ textTransform: 'none' }}>
                            Presets
                        </Button>
                    )}
                    <Button size="small" onClick={handleBulkEditToggle} sx={{ textTransform: 'none' }}>
                        {isBulkEdit ? 'Key-Value Edit' : 'Bulk Edit'}
                    </Button>
                </Box>
            </Box>

            <Menu anchorEl={presetAnchorEl} open={Boolean(presetAnchorEl)} onClose={handlePresetClose}>
                <MenuItem onClick={() => handleApplyPreset([{ key: 'Content-Type', value: 'application/json' }])}>
                    Add JSON Header
                </MenuItem>
                <MenuItem
                    onClick={() =>
                        handleApplyPreset([{ key: 'Content-Type', value: 'application/x-www-form-urlencoded' }])
                    }
                >
                    Add Form Header
                </MenuItem>
                <MenuItem onClick={() => handleApplyPreset([{ key: 'Authorization', value: 'Bearer <token>' }])}>
                    Add Bearer Auth
                </MenuItem>
                <MenuItem onClick={() => handleApplyPreset([{ key: 'Accept', value: 'application/json' }])}>
                    Add Accept JSON
                </MenuItem>
            </Menu>

            {isBulkEdit ? (
                <TextField
                    multiline
                    minRows={5}
                    maxRows={15}
                    fullWidth
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder="key:value"
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            fontFamily: 'monospace',
                            fontSize: '0.85rem'
                        }
                    }}
                />
            ) : (
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                                <TableCell padding="checkbox" sx={{ width: 40 }}></TableCell>
                                <TableCell sx={{ width: '30%' }}>Key</TableCell>
                                <TableCell sx={{ width: '30%' }}>Value</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell padding="none" sx={{ width: 40 }}></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {renderRows.map((row) => (
                                <TableRow key={row.id}>
                                    <TableCell padding="checkbox">
                                        <Checkbox
                                            size="small"
                                            checked={row.isEnabled}
                                            onChange={(e) => handleItemChange(row.id, 'isEnabled', e.target.checked)}
                                            disabled={row.id === 'NEW_ROW'}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ p: 0.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                variant="standard"
                                                placeholder="Key"
                                                value={row.key}
                                                onChange={(e) => handleItemChange(row.id, 'key', e.target.value)}
                                                InputProps={{ disableUnderline: true }}
                                            />
                                            {enableFileSupport && (
                                                <Select
                                                    value={row.type || 'text'}
                                                    onChange={(e) => handleItemChange(row.id, 'type', e.target.value)}
                                                    size="small"
                                                    variant="standard"
                                                    disableUnderline
                                                    sx={{
                                                        fontSize: '0.75rem',
                                                        minWidth: 50,
                                                        '& .MuiSelect-select': { py: 0.5, pr: 2 }
                                                    }}
                                                >
                                                    <MenuItem value="text" dense>
                                                        Text
                                                    </MenuItem>
                                                    <MenuItem value="file" dense>
                                                        File
                                                    </MenuItem>
                                                </Select>
                                            )}
                                        </Box>
                                    </TableCell>
                                    <TableCell sx={{ p: 0.5 }}>
                                        {enableFileSupport && row.type === 'file' ? (
                                            <Button
                                                fullWidth
                                                variant="outlined"
                                                size="small"
                                                startIcon={<UploadFileIcon />}
                                                onClick={() => onSelectFile?.(row.id)}
                                                title={row.value}
                                                sx={{
                                                    flexGrow: 1,
                                                    justifyContent: 'flex-start',
                                                    textTransform: 'none',
                                                    borderColor: 'divider',
                                                    color: row.value ? 'text.primary' : 'text.secondary',
                                                    height: '32px',
                                                    overflow: 'hidden',
                                                    whiteSpace: 'nowrap'
                                                }}
                                            >
                                                {row.value ? row.value.split(/[/\\]/).pop() : 'Select File'}
                                            </Button>
                                        ) : (
                                            <TextField
                                                fullWidth
                                                size="small"
                                                variant="standard"
                                                placeholder="Value"
                                                value={row.value}
                                                onChange={(e) => handleItemChange(row.id, 'value', e.target.value)}
                                                InputProps={{ disableUnderline: true }}
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell sx={{ p: 0.5 }}>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            variant="standard"
                                            placeholder="Description"
                                            value={row.description || ''}
                                            onChange={(e) => handleItemChange(row.id, 'description', e.target.value)}
                                            InputProps={{ disableUnderline: true }}
                                        />
                                    </TableCell>
                                    <TableCell padding="none">
                                        {row.id !== 'NEW_ROW' && (
                                            <IconButton size="small" onClick={() => handleDelete(row.id)}>
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
