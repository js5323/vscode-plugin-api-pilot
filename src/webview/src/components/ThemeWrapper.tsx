import React, { useMemo } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { useVsCodeTheme } from '../hooks/useVsCodeTheme';
import { getTheme } from '../theme';

interface ThemeWrapperProps {
    children: React.ReactNode;
}

export const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
    const vsCodeTheme = useVsCodeTheme();

    const theme = useMemo(() => {
        const mode = vsCodeTheme === 'light' ? 'light' : 'dark';
        return getTheme(mode);
    }, [vsCodeTheme]);

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {children}
        </ThemeProvider>
    );
};
