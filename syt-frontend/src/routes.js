import React, { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LoadingSpinner2 from "./components/common/LoadingSpinner2";

// Lazy load components
const Home = lazy(() => import("./pages/Home/Home"));
const AuthPage = lazy(() => import("./pages/Auth/AuthPage"));
const SetPasswordPage = lazy(() => import("./pages/Auth/SetPasswordPage"));
const Profile = lazy(() => import("./pages/Profile/Profile"));
const DestinationInput = lazy(() =>
  import("./pages/DestinationInput/DestinationInput")
);
const ItineraryInquiryPage = lazy(() =>
  import("./pages/ItineraryInquiryPage/ItineraryInquiryPage")
);
const AboutUs = lazy(() => import("./pages/AboutUs/AboutUs"));
const ContactUs = lazy(() => import("./pages/ContactUs/ContactUs"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions/TermsAndConditions"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy/PrivacyPolicy"));
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
        <Route path="/set-password" element={<SetPasswordPage />} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
        <Route
          path="/register"
          element={<Navigate to="/auth/register" replace />}
        />
        <Route path="/about" element={<AboutUs />} />
        <Route path="/contact" element={<ContactUs />} />
        <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/destination-input" element={<DestinationInput />} />
        <Route path="/itinerary-inquiry" element={<ItineraryInquiryPage />} />

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          {/* Itinerary Routes */}
          <Route path="/itinerary" element={<ItineraryPage />} />
          <Route path="/itinerary/new/:inquiryToken" element={<ItineraryPage />} />
          
          {/* Other Protected Routes */}
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/activities" element={<ActivitiesPage />} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/flights" element={<FlightPage />} />
          <Route path="/booking-form" element={<BookingForm />} />
          <Route path="/markup-management" element={<MarkupManagement />} />
          <Route path="/booking-confirmation" element={<BookingConfirmation />} />
          <Route path="/flight-voucher" element={<FlightVoucherPage />} />
          <Route path="/hotel-voucher" element={<HotelVoucherPage />} />
          <Route path="/transfer-voucher" element={<TransferVoucherPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
