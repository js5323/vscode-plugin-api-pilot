import { useState } from 'react';
import { Box, Typography, Breadcrumbs, TextField, IconButton, Tooltip } from '@mui/material';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import { ApiRequest } from '../../types';

interface RequestHeaderProps {
    request: ApiRequest;
    onNameChange: (name: string) => void;
    onSave: () => void;
}

export default function RequestHeader({ request, onNameChange, onSave }: RequestHeaderProps) {
    const [isEditingName, setIsEditingName] = useState(false);

    return (
        <Box
            sx={{
                p: 2,
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                bgcolor: 'background.default'
            }}
        >
            <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
                    {(request._folderPath || []).map((folder: any) => (
                        <Typography key={folder.id} color="text.secondary" variant="body2">
                            {folder.name}
                        </Typography>
                    ))}
                    {isEditingName ? (
                        <TextField
                            value={request.name}
                            onChange={(e) => onNameChange(e.target.value)}
                            onBlur={() => setIsEditingName(false)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') setIsEditingName(false);
                            }}
                            size="small"
                            variant="standard"
                            autoFocus
                            sx={{ minWidth: 150 }}
                            inputProps={{ style: { fontSize: '0.875rem', fontWeight: 'bold' } }}
                        />
                    ) : (
                        <Box
                            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
                            onClick={() => setIsEditingName(true)}
                        >
                            <Typography color="text.primary" variant="body2" fontWeight="bold">
                                {request.name}
                            </Typography>
                            <EditIcon
                                sx={{
                                    ml: 1,
                                    fontSize: 16,
                                    color: 'text.secondary',
                                    opacity: 0.5,
                                    '&:hover': { opacity: 1 }
                                }}
                            />
                        </Box>
                    )}
                </Breadcrumbs>
            </Box>
            <Box>
                <IconButton onClick={onSave} color="primary">
                    <SaveIcon /> Save
                </IconButton>
            </Box>
        </Box>
    );
}
