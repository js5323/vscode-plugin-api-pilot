import { useState, useEffect } from 'react';
import { 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
    Checkbox, TextField, IconButton, Box, Typography, Button 
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { KeyValueItem } from '../../types';

interface KeyValueTableProps {
    items: KeyValueItem[];
    onChange: (items: KeyValueItem[]) => void;
    title?: string; // e.g. "Query Params"
}

export default function KeyValueTable({ items, onChange, title }: KeyValueTableProps) {
    const [rows, setRows] = useState<KeyValueItem[]>([
        ...items,
        { id: Date.now().toString(), key: '', value: '', description: '', isEnabled: true } // Empty row at bottom
    ]);

    useEffect(() => {
        // Ensure there is always one empty row at the bottom
        const lastRow = rows[rows.length - 1];
        if (lastRow.key || lastRow.value || lastRow.description) {
            setRows([...rows, { id: Date.now().toString() + Math.random(), key: '', value: '', description: '', isEnabled: true }]);
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

    const handleItemChange = (id: string, field: keyof KeyValueItem, value: any) => {
        let newItems = [...items];
        const itemIndex = newItems.findIndex(i => i.id === id);

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
        onChange(items.filter(i => i.id !== id));
    };

    const renderRows = [
        ...items,
        { id: 'NEW_ROW', key: '', value: '', description: '', isEnabled: true }
    ];

    return (
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
            {title && (
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                    {title}
                </Typography>
            )}
            <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'action.hover' }}>
                            <TableCell padding="checkbox" sx={{ width: 40 }}></TableCell>
                            <TableCell sx={{ width: '30%' }}>Key</TableCell>
                            <TableCell sx={{ width: '30%' }}>Value</TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    Description
                                    <Button 
                                        size="small" 
                                        sx={{ 
                                            textTransform: 'none', 
                                            color: 'text.secondary',
                                            minWidth: 'auto',
                                            p: 0.5,
                                            fontSize: '0.75rem'
                                        }}
                                    >
                                        ... Bulk Edit
                                    </Button>
                                </Box>
                            </TableCell>
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
                                    <TextField
                                        fullWidth
                                        size="small"
                                        variant="standard"
                                        placeholder="Key"
                                        value={row.key}
                                        onChange={(e) => handleItemChange(row.id, 'key', e.target.value)}
                                        InputProps={{ disableUnderline: true }}
                                    />
                                </TableCell>
                                <TableCell sx={{ p: 0.5 }}>
                                    <TextField
                                        fullWidth
                                        size="small"
                                        variant="standard"
                                        placeholder="Value"
                                        value={row.value}
                                        onChange={(e) => handleItemChange(row.id, 'value', e.target.value)}
                                        InputProps={{ disableUnderline: true }}
                                    />
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
        </Box>
    );
}
