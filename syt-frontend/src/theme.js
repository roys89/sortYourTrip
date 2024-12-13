import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2e7d32', // Green for primary input color like checkbox
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#fdf2e9',
      paper: '#ffffff',
    },
    text: {
      primary: '#000000',
    },
    footer: {
      light: '#ffffff',
      dark: '#333333',
    },
    navbar: {
      light: '#fee1ca',
      dark: '#333333',
    },
    newsletterCard: {
      main: '#fee1ca',
    },
    button: {
      main: '#2e7d32',
      contrastText: '#ffffff',
      hoverGradient: 'linear-gradient(270deg, #2e7d32, #90f998, #66bb6a)',
      hoverAnimation: `movingGradientLight 5s ease infinite`,
    },
  },
  components: {
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#2e7d32', // Set the unchecked color to green
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
        @keyframes movingGradientLight {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `,
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#4caf50', // Green for primary input color in dark mode
    },
    secondary: {
      main: '#f48fb1',
    },
    background: {
      default: '#303030',
      paper: '#424242',
    },
    text: {
      primary: '#ffffff',
    },
    footer: {
      light: '#333333',
      dark: '#ffffff',
    },
    navbar: {
      light: '#333333',
      dark: '#ffffff',
    },
    newsletterCard: {
      main: '#484848',
    },
    button: {
      main: '#4caf50',
      contrastText: '#000000',
      hoverGradient: 'linear-gradient(270deg, #4caf50, #b6ffbc, #a5d6a7)',
      hoverAnimation: `movingGradientDark 5s ease infinite`,
    },
  },
  components: {
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#4caf50', // Set the unchecked color to green in dark mode
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: `
        @keyframes movingGradientDark {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `,
    },
  },
});

export { darkTheme, lightTheme };
