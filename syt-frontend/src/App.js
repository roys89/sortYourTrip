// App.js
import { CssBaseline, ThemeProvider } from "@mui/material";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { Provider } from "react-redux"; // Add this
import {
  Route,
  BrowserRouter as Router,
  Routes
} from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";
import AboutUs from "./pages/AboutUs/AboutUs";
import BookingForm from "./pages/BookingForm/BookingForm";
import ActivitiesPage from "./pages/ChangingPage/Activities";
import HotelsPage from "./pages/ChangingPage/Hotels";
import ContactUs from "./pages/ContactUs/ContactUs";
import DestinationInput from "./pages/DestinationInput/DestinationInput";
import Home from "./pages/Home/Home";
import ItineraryInquiryPage from "./pages/ItineraryInquiryPage/ItineraryInquiryPage";
import ItineraryPage from "./pages/ItineraryPage/ItineraryPage";
import MarkupManagement from "./pages/MarkupManagement/MarkupManagement";
import Profile from "./pages/Profile/Profile";
import { store } from "./redux/store"; // Add this
import { darkTheme, lightTheme } from "./theme";
const App = () => {
  const [user, setUser] = useState(null);
  const [darkMode, setDarkMode] = useState(false);

  const checkAuthStatus = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const response = await axios.get(
          "http://localhost:5000/api/auth/profile",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setUser(response.data);
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("token");
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <Provider store={store}>
      <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
        <CssBaseline />
        <Router>
          <Navbar
            handleLogout={handleLogout}
            handleThemeToggle={handleThemeToggle}
            darkMode={darkMode}
            user={user}
            setUser={setUser}
            checkAuthStatus={checkAuthStatus}
          />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/DestinationInput" element={<DestinationInput />} />
            <Route
              path="/itinerary-inquiry"
              element={
                <ItineraryInquiryPage
                  user={user}
                  setUser={setUser}
                  checkAuthStatus={checkAuthStatus}
                />
              }
            />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<ContactUs />} />
            <Route path="/itinerary" element={<ItineraryPage />} />
            <Route path="/activities" element={<ActivitiesPage />} />
            <Route path="/hotels" element={<HotelsPage />} />
            <Route path="/booking-form" element={<BookingForm />} />
            <Route
              path="/markup-management"
              element={
               
                  <MarkupManagement />
              }
            />
          </Routes>
        </Router>
      </ThemeProvider>
    </Provider>
  );
};

export default App;
