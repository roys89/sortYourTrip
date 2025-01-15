import { Button, useTheme } from "@mui/material";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Plus } from "lucide-react";
import { DateTime } from "luxon";
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setChangeActivity } from "../../redux/slices/activitySlice";
import ActivityCard from "../Cards/ActivityCard";
import FlightCard from "../Cards/FlightCard";
import HotelCard from "../Cards/HotelCard";
import TransferCard from "../Cards/TransferCard";
import "./DayAccordion.css";

const DayAccordion = ({ day, city, inquiryToken, travelersDetails }) => {
  const theme = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { itineraryToken } = useSelector((state) => state.itinerary);

  const formatDate = (dateString) => {
    return DateTime.fromISO(dateString)
      .toLocal()
      .toLocaleString(DateTime.DATE_HUGE);
  };

  const handleAddActivity = () => {
    dispatch(
      setChangeActivity({
        city,
        date: day.date,
        inquiryToken,
        travelersDetails,
        isNewActivity: true,
      })
    );

    navigate("/activities", {
      state: {
        city,
        date: day.date,
        inquiryToken,
        travelersDetails,
        isNewActivity: true,
      },
    });
  };

  return (
    <div className="day-accordion">
      <button className="day-header" onClick={() => setIsOpen(!isOpen)}>
        <span
          className="day-date"
          style={{ color: theme.palette.text.primary }}
        >
          {formatDate(day.date)}
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown
            className="day-icon"
            style={{ color: theme.palette.text.secondary }}
          />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { height: 0, opacity: 0 },
              visible: { height: "auto", opacity: 1 },
            }}
            transition={{ duration: 0.2 }}
            className="day-content"
          >
            {/* Flights Section */}
            {day.flights?.length > 0 && (
              <div className="section-container">
                <h3
                  className="section-title"
                  style={{ color: theme.palette.primary.main }}
                >
                  Flights
                </h3>
                <div className="cards-container">
                  {day.flights.map((flight, index) => (
                    <FlightCard
                      key={`flight-${index}`}
                      flight={flight}
                      inquiryToken={inquiryToken}
                      itineraryToken={itineraryToken}
                      travelersDetails={travelersDetails}
                      showChange={true} // Add this
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Hotels Section */}
            {day.hotels?.length > 0 && (
              <div className="section-container">
                <h3
                  className="section-title"
                  style={{ color: theme.palette.primary.main }}
                >
                  Accommodations
                </h3>
                <div className="cards-container">
                  {day.hotels.map((hotel, index) => (
                    <HotelCard
                      key={`hotel-${index}`}
                      hotel={hotel}
                      city={city}
                      date={day.date}
                      inquiryToken={inquiryToken}
                      itineraryToken={itineraryToken}
                      travelersDetails={travelersDetails}
                      showChange={true}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Transfers Section */}
            {day.transfers?.length > 0 && (
              <div className="section-container">
                <h3
                  className="section-title"
                  style={{ color: theme.palette.primary.main }}
                >
                  Transfers
                </h3>
                <div className="cards-container">
                  {day.transfers.map((transfer, index) => (
                    <TransferCard
                      key={`transfer-${index}`}
                      transfer={transfer}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Activities Section */}
            <div className="section-container">
              <h3
                className="section-title"
                style={{ color: theme.palette.primary.main }}
              >
                Activities
              </h3>
              <div className="cards-container">
                {day.activities?.map((activity, index) => (
                  <ActivityCard
                    key={`activity-${index}`}
                    activity={activity}
                    city={city}
                    date={day.date}
                    inquiryToken={inquiryToken}
                    itineraryToken={itineraryToken}
                    travelersDetails={travelersDetails}
                    showRemove={true}
                  />
                ))}
              </div>

              {(!day.activities || day.activities.length < 3) && (
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="outlined"
                    startIcon={
                      <Plus
                        className="w-4 h-4"
                        style={{ color: theme.palette.text.primary }}
                      />
                    }
                    onClick={handleAddActivity}
                    className="add-activity-button"
                    sx={{ color: theme.palette.text.primary }}
                  >
                    Add Activity ({3 - (day.activities?.length || 0)} remaining)
                  </Button>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DayAccordion;
