// App.js
import { CssBaseline, ThemeProvider } from "@mui/material";
import React, { useEffect, useState } from "react";
import { Provider, useDispatch } from "react-redux"; // Add this
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
import { checkAuthStatus } from "./redux/slices/authSlice";
import { store } from "./redux/store"; // Add this
import { darkTheme, lightTheme } from "./theme";


const AppContent = () => {
  const dispatch = useDispatch();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    dispatch(checkAuthStatus());
  }, [dispatch]);

  const handleThemeToggle = () => {
    setDarkMode(!darkMode);
  };

  return (
    <ThemeProvider theme={darkMode ? darkTheme : lightTheme}>
      <CssBaseline />
      <Router>
        <Navbar
          handleThemeToggle={handleThemeToggle}
          darkMode={darkMode}
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/DestinationInput" element={<DestinationInput />} />
          <Route path="/itinerary-inquiry" element={<ItineraryInquiryPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/contact" element={<ContactUs />} />
          <Route path="/itinerary" element={<ItineraryPage />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/booking-form" element={<BookingForm />} />
          <Route path="/markup-management" element={<MarkupManagement />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
};

export default App;
