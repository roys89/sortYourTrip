import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";

import { Plane, ShoppingBag, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  closeSeatModal,
  updateFlightSeats,
} from "../../redux/slices/flightSlice";
import './SeatSelectionModal.css';

const SeatSelectionModal = ({
  isOpen,
  flightData,
  maxSeats,
  isLoading,
  inquiryToken,
  itineraryToken,
}) => {
  const dispatch = useDispatch();
  const [activeView, setActiveView] = useState("seats");
  const [activeFlightSegment, setActiveFlightSegment] = useState(0);

  // Initialize selections maintaining exact flight data structure
  const [selectedSeats, setSelectedSeats] = useState(() => {
    // Create a deep copy of the seatMap with proper segment matching
    const initialSeatMap = flightData.seatMap?.map(segment => {
      // Find the matching selected segment for this origin/destination pair
      const matchingSelectedSegment = flightData.selectedSeats?.find(
        selectedSegment => 
          selectedSegment.origin === segment.origin && 
          selectedSegment.destination === segment.destination
      );
  
      return {
        origin: segment.origin,
        destination: segment.destination,
        resultIdentifier: segment.resultIdentifier,
        rows: segment.rows.map(row => ({
          seats: row.seats.map(seat => ({
            ...seat,
            // Check if this seat is selected in the matching segment
            isSelected: matchingSelectedSegment?.rows.some(selectedRow => 
              selectedRow.seats.some(selectedSeat => 
                selectedSeat.code === seat.code
              )
            ) || false
          }))
        }))
      };
    });
  
    return initialSeatMap || [];
  });
  
  // Also update the baggage initialization to match segments correctly
  const [selectedBaggage, setSelectedBaggage] = useState(() => {
    return flightData.baggageOptions?.map(segment => {
      const matchingSelected = flightData.selectedBaggage?.find(
        selected => 
          selected.origin === segment.origin && 
          selected.destination === segment.destination
      );
  
      return {
        origin: segment.origin,
        destination: segment.destination,
        resultIdentifier: segment.resultIdentifier,
        options: segment.options,
        selectedOption: matchingSelected?.options[0] || null
      };
    }) || [];
  });
  
  // And update the meal initialization similarly
  const [selectedMeal, setSelectedMeal] = useState(() => {
    return flightData.mealOptions?.map(segment => {
      const matchingSelected = flightData.selectedMeal?.find(
        selected => 
          selected.origin === segment.origin && 
          selected.destination === segment.destination
      );
  
      return {
        origin: segment.origin,
        destination: segment.destination,
        resultIdentifier: segment.resultIdentifier,
        options: segment.options,
        selectedOption: matchingSelected?.options[0] || null
      };
    }) || [];
  });

  const [error, setError] = useState("");

  // Calculate total additional cost
  const additionalCost = useMemo(() => {
    let total = 0;

    // Add seat costs
    selectedSeats?.forEach((segment) => {
      segment.rows.forEach((row) => {
        row.seats.forEach((seat) => {
          if (seat.isSelected) {
            total += seat.price;
          }
        });
      });
    });

    // Add baggage costs
    selectedBaggage.forEach((segment) => {
      if (segment.selectedOption) {
        total += segment.selectedOption.price;
      }
    });

    // Add meal costs
    selectedMeal.forEach((segment) => {
      if (segment.selectedOption) {
        total += segment.selectedOption.price;
      }
    });

    return total;
  }, [selectedSeats, selectedBaggage, selectedMeal]);

  // Seat selection handler
  const handleSeatClick = (segmentIndex, rowIndex, seatIndex, isBooked) => {
    if (isBooked) return;

    setSelectedSeats((prev) => {
      const newSeats = [...prev];
      const segment = newSeats[segmentIndex];
      const currentSelectedCount = segment.rows.reduce(
        (count, row) =>
          count + row.seats.filter((seat) => seat.isSelected).length,
        0
      );

      const seat = segment.rows[rowIndex].seats[seatIndex];
      const isCurrentlySelected = seat.isSelected;

      if (!isCurrentlySelected && currentSelectedCount >= maxSeats) {
        setError(`You can only select ${maxSeats} seats per flight segment`);
        return prev;
      }

      newSeats[segmentIndex] = {
        ...segment,
        rows: segment.rows.map((row, rIndex) => {
          if (rIndex !== rowIndex) return row;
          return {
            ...row,
            seats: row.seats.map((seat, sIndex) => {
              if (sIndex !== seatIndex) return seat;
              return {
                ...seat,
                isSelected: !seat.isSelected,
              };
            }),
          };
        }),
      };

      setError("");
      return newSeats;
    });
  };

  // Baggage selection handler
  const handleBaggageSelect = (segmentIndex, option) => {
    setSelectedBaggage((prev) => {
      const newBaggage = [...prev];
      newBaggage[segmentIndex] = {
        ...newBaggage[segmentIndex],
        selectedOption:
          newBaggage[segmentIndex].selectedOption?.code === option.code
            ? null
            : option,
      };
      return newBaggage;
    });
  };

  // Meal selection handler
  const handleMealSelect = (segmentIndex, option) => {
    setSelectedMeal((prev) => {
      const newMeal = [...prev];
      newMeal[segmentIndex] = {
        ...newMeal[segmentIndex],
        selectedOption:
          newMeal[segmentIndex].selectedOption?.code === option.code
            ? null
            : option,
      };
      return newMeal;
    });
  };

  const handleSubmit = async () => {
  
    try {
      const transformedSelections = {
        flightCode: flightData.flightCode,
        seatMap: selectedSeats.map(segment => ({
          origin: segment.origin,
          destination: segment.destination,
          resultIdentifier: segment.resultIdentifier,
          rows: segment.rows.map(row => ({
            seats: row.seats.filter(seat => seat.isSelected).map(seat => ({
              code: seat.code,
              seatNo:seat.seatNo,
              price: seat.price,
              type: seat.type,
              priceBracket: seat.priceBracket
            }))
          })).filter(row => row.seats.length > 0)
        })),
        baggageOptions: selectedBaggage
          .filter(segment => segment.selectedOption)
          .map(segment => ({
            origin: segment.origin,
            destination: segment.destination,
            resultIdentifier: segment.resultIdentifier,
            options: [segment.selectedOption]
          })),
        mealOptions: selectedMeal
          .filter(segment => segment.selectedOption)
          .map(segment => ({
            origin: segment.origin,
            destination: segment.destination,
            resultIdentifier: segment.resultIdentifier,
            options: [segment.selectedOption]
          }))
      };
    
      await dispatch(updateFlightSeats({
        itineraryToken,
        inquiryToken,
        selections: transformedSelections
      })).unwrap();
      
      dispatch(closeSeatModal());
    } catch (error) {
      setError(error.message || 'Failed to update selections');
    }
  };

  const handleClose = () => {
    dispatch(closeSeatModal());
  };


  return (
    <div className="seat-modal-overlay">
      <div className="seat-modal-container">
        {/* Header - Remains the same */}
        <div className="seat-modal-header">
          <div>
            <h2 className="seat-modal-title">Select Your Seats & Extras</h2>
            <p className="seat-modal-subtitle">
              {flightData.airline} - Flight {flightData.flightCode}
            </p>
          </div>
          <button onClick={handleClose} className="modal-close-btn">
            <X size={24} />
          </button>
        </div>
  
        {/* Error Alert - Remains the same */}
        {error && (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}
  
        {/* Main Tabs Navigation - Remains the same */}
        <div className="seat-modal-tabs">
          <button
            onClick={() => setActiveView("seats")}
            className={`seat-modal-tab ${activeView === "seats" ? 'active' : ''}`}
          >
            <Plane size={18} />
            Seat Selection
          </button>
          <button
            onClick={() => setActiveView("baggage")}
            className={`seat-modal-tab ${activeView === "baggage" ? 'active' : ''}`}
          >
            <ShoppingBag size={18} />
            Baggage Options
          </button>
          {selectedMeal.length > 0 && (
            <button
              onClick={() => setActiveView("meal")}
              className={`seat-modal-tab ${activeView === "meal" ? 'active' : ''}`}
            >
              <ShoppingBag size={18} />
              Meal Options
            </button>
          )}
        </div>
  
        {/* Scrollable Content Area */}
        <div className="seat-modal-content">
          {/* Seats View */}
          {activeView === "seats" && (
            <div className="p-6 space-y-6">
              {/* Flight segment tabs */}
              <div className="flex space-x-2 border-b border-modal-border">
                {selectedSeats?.map((segment, index) => (
                  <button
                    key={`${segment.origin}-${segment.destination}`}
                    onClick={() => setActiveFlightSegment(index)}
                    className={`seat-modal-tab ${activeFlightSegment === index ? 'active' : ''}`}
                  >
                    {segment.origin} → {segment.destination}
                  </button>
                ))}
              </div>
  
              {/* Active segment seat selection */}
              {selectedSeats?.[activeFlightSegment] && (
                <div className="option-card">
                  <h3 className="text-lg font-semibold mb-4">
                    {selectedSeats[activeFlightSegment].origin} → {selectedSeats[activeFlightSegment].destination}
                  </h3>
                  <div className="grid gap-4">
                    {selectedSeats[activeFlightSegment].rows.map((row, rowIndex) => (
                      <div key={rowIndex} className="flex justify-center items-center gap-2">
                        {row.seats.map((seat, seatIndex) => (
                          <button
                            key={seat.code}
                            onClick={() => handleSeatClick(activeFlightSegment, rowIndex, seatIndex, seat.isBooked)}
                            disabled={seat.isBooked || isLoading}
                            className={`seat-button ${seat.isSelected ? 'selected' : ''} ${seat.type.isAisle ? 'aisle' : ''}`}
                          >
                            <span>{seat.code}</span>
                            {!seat.isBooked && (
                              <span className="seat-price">₹{seat.price}</span>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
  
          {/* Baggage View - Updated with tabs */}
          {activeView === "baggage" && (
            <div className="p-6 space-y-6">
              {/* Flight segment tabs for baggage */}
              <div className="flex space-x-2 border-b border-modal-border">
                {selectedBaggage.map((segment, index) => (
                  <button
                    key={`${segment.origin}-${segment.destination}`}
                    onClick={() => setActiveFlightSegment(index)}
                    className={`seat-modal-tab ${activeFlightSegment === index ? 'active' : ''}`}
                  >
                    {segment.origin} → {segment.destination}
                  </button>
                ))}
              </div>
  
              {/* Active segment baggage options */}
              {selectedBaggage[activeFlightSegment] && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {selectedBaggage[activeFlightSegment].options.map((option) => {
                      const isSelected = selectedBaggage[activeFlightSegment].selectedOption?.code === option.code;
                      return (
                        <button
                          key={option.code}
                          onClick={() => handleBaggageSelect(activeFlightSegment, option)}
                          disabled={isLoading}
                          className={`option-card ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">
                                {option.description}
                              </div>
                              <div className="text-sm opacity-75">
                                Weight: {option.weight}kg
                              </div>
                            </div>
                            <div className="font-bold">
                              ₹{option.price.toLocaleString()}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
  
          {/* Meal View - Updated with tabs */}
          {activeView === "meal" && (
            <div className="p-6 space-y-6">
              {/* Flight segment tabs for meals */}
              <div className="flex space-x-2 border-b border-modal-border">
                {selectedMeal.map((segment, index) => (
                  <button
                    key={`${segment.origin}-${segment.destination}`}
                    onClick={() => setActiveFlightSegment(index)}
                    className={`seat-modal-tab ${activeFlightSegment === index ? 'active' : ''}`}
                  >
                    {segment.origin} → {segment.destination}
                  </button>
                ))}
              </div>
  
              {/* Active segment meal options */}
              {selectedMeal[activeFlightSegment] && (
                <div className="space-y-4">
                  <div className="grid gap-4">
                    {selectedMeal[activeFlightSegment].options.map((option) => {
                      const isSelected = selectedMeal[activeFlightSegment].selectedOption?.code === option.code;
                      return (
                        <button
                          key={option.code}
                          onClick={() => handleMealSelect(activeFlightSegment, option)}
                          disabled={isLoading}
                          className={`option-card ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <div className="font-semibold">
                                {option.description}
                              </div>
                              <div className="text-sm opacity-75">
                                {option.details}
                              </div>
                            </div>
                            <div className="font-bold">
                              ₹{option.price.toLocaleString()}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
  
        {/* Footer - Remains the same */}
        <div className="seat-modal-footer">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-semibold">Total Additional Cost:</p>
              <p className="text-lg font-bold text-[#2A9D8F]">
                ₹{additionalCost.toLocaleString()}
              </p>
            </div>
            <div className="space-x-4">
              <button
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="confirm-button"
              >
                {isLoading ? "Processing..." : "Confirm Selection"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeatSelectionModal;
