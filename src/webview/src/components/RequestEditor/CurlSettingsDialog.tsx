import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    FormControlLabel,
    Switch,
    Typography,
    Box,
    FormControl,
    Select,
    MenuItem,
    TextField,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { CurlSettings } from '../../../../shared/types';
export { DEFAULT_CURL_SETTINGS } from '../../../../shared/types';

interface CurlSettingsDialogProps {
    open: boolean;
    onClose: () => void;
    settings: CurlSettings;
    onSave: (settings: CurlSettings) => void;
}

export default function CurlSettingsDialog({ open, onClose, settings, onSave }: CurlSettingsDialogProps) {
    const [localSettings, setLocalSettings] = React.useState<CurlSettings>(settings);

    React.useEffect(() => {
        if (open) {
            setLocalSettings(settings);
        }
    }, [open, settings]);

    const handleChange = (field: keyof CurlSettings, value: unknown) => {
        setLocalSettings((prev) => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(localSettings);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                Settings for cURL
                <IconButton onClick={onClose} size="small">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localSettings.multiline}
                                    onChange={(e) => handleChange('multiline', e.target.checked)}
                                />
                            }
                            label={<Typography variant="subtitle2">Generate multiline snippet</Typography>}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
                            Split cURL command across multiple lines
                        </Typography>
                    </Box>

                    <Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localSettings.longForm}
                                    onChange={(e) => handleChange('longForm', e.target.checked)}
                                />
                            }
                            label={<Typography variant="subtitle2">Use long form options</Typography>}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
                            Use the long form for cURL options (--header instead of -H)
                        </Typography>
                    </Box>

                    <Box>
                        <FormControl fullWidth size="small">
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                                Line continuation character
                            </Typography>
                            <Select
                                value={localSettings.lineContinuation}
                                onChange={(e) => handleChange('lineContinuation', e.target.value)}
                            >
                                <MenuItem value="\">\</MenuItem>
                                <MenuItem value="^">^</MenuItem>
                                <MenuItem value="`">`</MenuItem>
                            </Select>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                Character used to mark the continuation of a statement on the next line
                            </Typography>
                        </FormControl>
                    </Box>

                    <Box>
                        <FormControl fullWidth size="small">
                            <Typography variant="caption" color="text.secondary" gutterBottom>
                                Quote Type
                            </Typography>
                            <Select
                                value={localSettings.quoteType}
                                onChange={(e) => handleChange('quoteType', e.target.value)}
                            >
                                <MenuItem value="single">single</MenuItem>
                                <MenuItem value="double">double</MenuItem>
                            </Select>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                                String denoting the quote type to use for URL
                            </Typography>
                        </FormControl>
                    </Box>

                    <Box>
                        <Typography variant="subtitle2" gutterBottom>
                            Set request timeout (in seconds)
                        </Typography>
                        <TextField
                            fullWidth
                            size="small"
                            type="number"
                            value={localSettings.timeout}
                            onChange={(e) => handleChange('timeout', Number(e.target.value))}
                            helperText="Set number of seconds the request should wait for a response before timing out (use 0 for infinity)"
                        />
                    </Box>

                    <Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localSettings.followRedirects}
                                    onChange={(e) => handleChange('followRedirects', e.target.checked)}
                                />
                            }
                            label={<Typography variant="subtitle2">Follow redirects</Typography>}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
                            Automatically follow HTTP redirects
                        </Typography>
                    </Box>

                    <Box>
                        <FormControlLabel
                            control={
                                <Switch
                                    checked={localSettings.silent}
                                    onChange={(e) => handleChange('silent', e.target.checked)}
                                />
                            }
                            label={<Typography variant="subtitle2">Use Silent Mode</Typography>}
                        />
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ ml: 4 }}>
                            Display the requested data without showing the cURL progress meter or error messages
                        </Typography>
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button onClick={handleSave} variant="contained">
                    Done
                </Button>
            </DialogActions>
        </Dialog>
    );
}
