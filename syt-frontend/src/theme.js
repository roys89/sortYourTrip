import { createTheme } from '@mui/material/styles';

const commonTypography = {
  fontFamily: [
    'Poppins',
    'League Spartan',
    'Montserrat',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'Roboto',
    'Arial',
    'sans-serif'
  ].join(','),
  h1: {
    fontFamily: 'League Spartan, sans-serif',
    fontWeight: 700,
  },
  h2: {
    fontFamily: 'League Spartan, sans-serif',
    fontWeight: 600,
  },
  h3: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 600,
  },
  h4: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 500,
  },
  h5: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 500,
  },
  h6: {
    fontFamily: 'Montserrat, sans-serif',
    fontWeight: 500,
  },
  body1: {
    fontFamily: 'Poppins, sans-serif',
  },
  body2: {
    fontFamily: 'Poppins, sans-serif',
  },
  button: {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: 500,
  },
};

// Extended gray palette for light theme
const lightGrays = {
  50: '#f8fafc',
  100: '#f4f2f0',
  200: '#e2e8f0',
  300: '#cbd5e1',
  400: '#94a3b8',
  500: '#64748b',
  600: '#475569',
  700: '#334155',
  800: '#1e293b',
  900: '#0f172a',
};

// Extended gray palette for dark theme
const darkGrays = {
  900: '#0f172a',
  800: '#1e293b',
  700: '#334155',
  600: '#475569',
  500: '#64748b',
  400: '#94a3b8',
  300: '#cbd5e1',
  200: '#e2e8f0',
  100: '#f1f5f9',
  50: '#f8fafc',
};

const lightTheme = createTheme({
  typography: commonTypography,
  palette: {
    mode: 'light',
    primary: {
      main: '#093923',
      light: '#22c35e',
      dark: '#022316'
    },
    secondary: {
      main: '#13804e',
    },
    grey: lightGrays,
    background: {
      default: lightGrays[100],
      paper: lightGrays[50],
    },
    text: {
      primary: '#093923',
      secondary: '#016b36',
      special: '#025033',
    },
    footer: {
      light: '#ffffff',
      dark: '#333333',
    },
    navbar: {
      light: '#fbcbad',
      dark: '#333333',
    },
    newsletterCard: {
      main: '#fee1ca',
    },
    button: {
      main: '#093923',
      contrastText: '#ffffff',
      hoverGradient: 'linear-gradient(135deg, #2a9d8f 0%, #093923 100%)',
      hoverAnimation: `movingGradientLight 5s ease infinite`,
    },
    card: {
      background: 'rgba(255, 255, 255, 0.8)',
      border: 'rgba(9, 57, 35, 0.1)',
    }
  },
  components: {
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#2A9D8F',
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
  typography: commonTypography,
  palette: {
    mode: 'dark',
    primary: {
      main: '#2A9D8F',
      light: '#4DB6A9',
      dark: '#1C6B61'
    },
    secondary: {
      main: '#264653',
    },
    grey: darkGrays,
    background: {
      default: darkGrays[900],
      paper: darkGrays[800],
    },
    text: {
      primary: '#bcfff6',
      secondary: '#ffffff',
      special: '#3cd0be',
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
      main: '#2A9D8F',
      contrastText: '#ffffff',
      hoverGradient: 'linear-gradient(135deg, #2A9D8F 0%, #264653 100%)',
      hoverAnimation: `movingGradientDark 5s ease infinite`,
    },
    card: {
      background: 'rgba(30, 41, 59, 0.8)',
      border: 'rgba(42, 157, 143, 0.2)',
    }
  },
  components: {
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#2A9D8F',
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
