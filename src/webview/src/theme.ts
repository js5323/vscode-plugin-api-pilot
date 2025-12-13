import { createTheme, PaletteMode } from '@mui/material/styles';

export const getTheme = (mode: PaletteMode) =>
    createTheme({
        typography: {
            fontSize: 12,
            fontFamily:
                'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
            button: {
                textTransform: 'none'
            }
        },
        palette: {
            mode,
            primary: {
                main: '#007fd4' // VS Code blue
            },
            background: {
                default: mode === 'dark' ? '#1e1e1e' : '#ffffff',
                paper: mode === 'dark' ? '#252526' : '#f3f3f3'
            },
            text: {
                primary: mode === 'dark' ? '#cccccc' : '#333333',
                secondary: mode === 'dark' ? '#999999' : '#666666'
            }
        },
        components: {
            MuiButton: {
                defaultProps: {
                    size: 'small'
                },
                styleOverrides: {
                    root: {
                        minWidth: 0, // Allow smaller buttons
                        padding: '4px 8px'
                    }
                }
            },
            MuiIconButton: {
                defaultProps: {
                    size: 'small'
                },
                styleOverrides: {
                    root: {
                        padding: 4
                    }
                }
            },
            MuiListItemButton: {
                styleOverrides: {
                    root: {
                        paddingTop: 2,
                        paddingBottom: 2
                    }
                }
            },
            MuiTextField: {
                defaultProps: {
                    size: 'small'
                },
                styleOverrides: {
                    root: {
                        '& .MuiOutlinedInput-root': {
                            fontSize: '0.85rem',
                            '& fieldset': {
                                borderColor: mode === 'dark' ? '#3c3c3c' : '#cecece'
                            },
                            '&:hover fieldset': {
                                borderColor: '#007fd4'
                            }
                        },
                        '& .MuiInputLabel-root': {
                            fontSize: '0.85rem'
                        }
                    }
                }
            },
            MuiChip: {
                styleOverrides: {
                    sizeSmall: {
                        height: 20,
                        fontSize: '0.7rem'
                    }
                }
            },
            MuiSvgIcon: {
                styleOverrides: {
                    fontSizeSmall: {
                        fontSize: '1.1rem'
                    }
                }
            }
        }
    });

// For backward compatibility if needed, though we should use getTheme
export const theme = getTheme('dark');
