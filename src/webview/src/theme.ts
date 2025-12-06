import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  typography: {
    fontSize: 12,
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
    button: {
      textTransform: 'none',
    },
  },
  palette: {
    mode: 'dark', // Default to dark, VS Code handles overrides usually
    primary: {
      main: '#007fd4', // VS Code blue
    },
    background: {
      default: '#1e1e1e',
      paper: '#252526',
    },
    text: {
      primary: '#cccccc',
      secondary: '#999999',
    },
  },
  components: {
    MuiButton: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          minWidth: 0, // Allow smaller buttons
          padding: '4px 8px',
        },
      },
    },
    MuiIconButton: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          padding: 4,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          paddingTop: 2,
          paddingBottom: 2,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            fontSize: '0.85rem',
            '& fieldset': {
              borderColor: '#3c3c3c',
            },
            '&:hover fieldset': {
              borderColor: '#007fd4',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '0.85rem',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        sizeSmall: {
          height: 20,
          fontSize: '0.7rem',
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        fontSizeSmall: {
          fontSize: '1.1rem',
        },
      },
    },
  },
});
