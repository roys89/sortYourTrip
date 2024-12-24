import { createTheme } from '@mui/material/styles';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#004d30',
      light: '#004D40',
      dark: '#04d190'
    },
    secondary: {
      main: '#078d5b',
    },
    background: {
      default: '#fdf2e9',
      paper: '#ffffff',
    },
    text: {
      primary: '#004a27',
      secondary: '#2A9D8F'
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
      main: '#2A9D8F',
      contrastText: '#ffffff',
      hoverGradient: 'linear-gradient(135deg, #2A9D8F 0%, #264653 100%)',
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
      primary: '#4DB6A9',
      secondary: '#2A9D8F'
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
