import { CssBaseline, ThemeProvider } from "@mui/material";
import React, { useState } from "react";
import { Provider } from "react-redux";
import { BrowserRouter as Router } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import { AuthProvider } from "./context/AuthContext";
import { store } from "./redux/store";
import AppRoutes from "./routes";
import { darkTheme, lightTheme } from "./theme";

const AppContent = () => {
  const [darkMode, setDarkMode] = useState(false);

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Navbar handleThemeToggle={handleThemeToggle} darkMode={darkMode} />
      <AppRoutes />
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </Provider>
  );
};

export default App;