import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner2 from "./components/common/LoadingSpinner2";

// Lazy load components
const Home = lazy(() => import("./pages/Home/Home"));
const AuthPage = lazy(() => import("./pages/Auth/AuthPage"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const DestinationInput = lazy(() =>
  import("./pages/DestinationInput/DestinationInput")
);
const ItineraryInquiryPage = lazy(() =>
  import("./pages/ItineraryInquiryPage/ItineraryInquiryPage")
);
const AboutUs = lazy(() => import("./pages/AboutUs/AboutUs"));
const ContactUs = lazy(() => import("./pages/ContactUs/ContactUs"));
const ItineraryPage = lazy(() => import("./pages/ItineraryPage/ItineraryPage"));
const ActivitiesPage = lazy(() => import("./pages/ChangingPage/Activities"));
const HotelsPage = lazy(() => import("./pages/ChangingPage/Hotels"));
const FlightPage = lazy(() => import("./pages/ChangingPage/Flights"));
const BookingForm = lazy(() => import("./pages/BookingForm/BookingForm"));
const PaymentPage = lazy(() => import("./pages/Payment/PaymentPage"));
const MarkupManagement = lazy(() =>
  import("./pages/MarkupManagement/MarkupManagement")
);
const BookingConfirmation = lazy(() =>
  import("./pages/BookingConfirmation/BookingConfirmation")
);

const FlightVoucherPage = lazy(() =>
  import("./pages/FlightVoucherPage/FlightVoucherPage")
);
const HotelVoucherPage = lazy(() =>
  import("./pages/HotelVoucherPage/HotelVoucherPage")
);
const TransferVoucherPage = lazy(() =>
  import("./pages/TransferVoucherPage/TransferVoucherPage")
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner2 message="Loading page..." />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/auth/*" element={<AuthPage />} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route
          path="/register"
          element={<Navigate to="/auth/register" replace />}
        />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/destination-input" element={<DestinationInput />} />
        <Route path="/itinerary-inquiry" element={<ItineraryInquiryPage />} />

        {/* Protected Routes */}
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/itinerary"
          element={
            <ProtectedRoute>
              <ItineraryPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/activities"
          element={
            <ProtectedRoute>
              <ActivitiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotels"
          element={
            <ProtectedRoute>
              <HotelsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Flights"
          element={
            <ProtectedRoute>
              <FlightPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-form"
          element={
            <ProtectedRoute>
              <BookingForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/markup-management"
          element={
            <ProtectedRoute>
              <MarkupManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/booking-confirmation"
          element={
            <ProtectedRoute>
              <BookingConfirmation />
            </ProtectedRoute>
          }
        />
        <Route
          path="/flight-voucher"
          element={
            <ProtectedRoute>
              <FlightVoucherPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel-voucher"
          element={
            <ProtectedRoute>
              <HotelVoucherPage />
            </ProtectedRoute>
          }
        />
          <Route
          path="/transfer-voucher"
          element={
            <ProtectedRoute>
              <TransferVoucherPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
