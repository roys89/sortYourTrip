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

const lightTheme = createTheme({
  typography: commonTypography,
  palette: {
    mode: 'light',
    primary: {
      main: '#093923',
      light: '#093923',
      dark: '#04d190'
    },
    secondary: {
      main: '#13804e',
    },
    background: {
      default: '#f0f0f0',
      paper: '#ffffff',
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
      light: '#fee1ca',
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
      dark: '#004D40'
    },
    secondary: {
      main: '#264653',
    },
    background: {
      default: '#303030',
      paper: '#424242',
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
