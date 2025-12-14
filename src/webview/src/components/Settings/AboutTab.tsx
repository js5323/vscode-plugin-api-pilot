import { Box, Typography, Button } from '@mui/material';

export const AboutTab = () => (
    <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="h5" gutterBottom>
            ApiPilot
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Version 1.0.0
        </Typography>
        <Typography variant="body1" paragraph>
            A powerful API client for VS Code.
        </Typography>
        <Button href="https://github.com/your-repo" target="_blank">
            Visit GitHub
        </Button>
    </Box>
);
