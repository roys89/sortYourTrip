import {
  Box,
  Button,
  Card,
  Chip,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
  styled
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Plane, ShoppingBag, User, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import {
  closeSeatModal,
  setActivePassengerIndex,
  updateFlightSeats
} from "../../redux/slices/flightSlice";
import "./SeatSelectionModal.css";

// Styled components using MUI theme
const ModalOverlay = styled(Box)(({ theme }) => ({
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
  padding: theme.spacing(2),
  overflowY: "auto",
  marginTop: theme.spacing(8)
}));

const ModalContainer = styled(Paper)(({ theme }) => ({
  width: "100%",
  maxWidth: "56rem",
  maxHeight: "90vh",
  display: "flex",
  flexDirection: "column",
  borderRadius: theme.spacing(2),
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  overflow: "hidden",
  transition: "all 0.3s ease",
  backgroundColor: theme.palette.background.paper
}));

const ModalHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.mode === 'light' ? 
    theme.palette.grey[100] : 
    theme.palette.grey[800],
  borderBottom: `1px solid ${theme.palette.divider}`
}));

const ModalContent = styled(Box)(({ theme }) => ({
  flexGrow: 1,
  overflowY: "auto",
  backgroundColor: theme.palette.background.paper
}));

const ModalFooter = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  backgroundColor: theme.palette.mode === 'light' ? 
    theme.palette.grey[100] : 
    theme.palette.grey[800],
  borderTop: `1px solid ${theme.palette.divider}`
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(2),
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: theme.spacing(1),
  color: theme.palette.text.primary,
  backgroundColor: theme.palette.background.paper,
  transition: "all 0.2s ease",
  "&:hover:not(.Mui-selected)": {
    backgroundColor: theme.palette.mode === 'light' ? 
      theme.palette.grey[100] : 
      theme.palette.grey[700]
  },
  "&.Mui-selected": {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText
  }
}));

const SeatButton = styled(Button)(({ theme, selected, isAisle, disabled }) => ({
  width: "3rem",
  height: "3rem",
  borderRadius: theme.spacing(1),
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: selected ? 
    theme.palette.primary.main : 
    theme.palette.background.paper,
  color: selected ? 
    theme.palette.primary.contrastText : 
    theme.palette.text.primary,
  transition: "all 0.2s ease",
  marginLeft: isAisle ? theme.spacing(2) : 0,
  "&:hover:not(:disabled)": {
    backgroundColor: selected ? 
      theme.palette.primary.main : 
      (theme.palette.mode === 'light' ? theme.palette.grey[100] : theme.palette.grey[700])
  },
  "&:disabled": {
    backgroundColor: theme.palette.grey[500],
    cursor: "not-allowed",
    opacity: 0.5
  }
}));

const OptionCard = styled(Button)(({ theme, selected }) => ({
  width: "100%",
  padding: theme.spacing(2),
  borderRadius: theme.spacing(1),
  backgroundColor: selected ? 
    theme.palette.primary.main : 
    (theme.palette.mode === 'light' ? theme.palette.grey[50] : theme.palette.grey[800]),
  border: `1px solid ${theme.palette.divider}`,
  color: selected ? 
    theme.palette.primary.contrastText : 
    theme.palette.text.primary,
  transition: "all 0.2s ease",
  textAlign: "left",
  textTransform: "none",
  "&:hover:not(.selected):not(:disabled)": {
    backgroundColor: theme.palette.mode === 'light' ? 
      theme.palette.grey[100] : 
      theme.palette.grey[700]
  }
}));

const ConfirmButton = styled(Button)(({ theme }) => ({
  padding: `${theme.spacing(1)} ${theme.spacing(3)}`,
  borderRadius: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  transition: "all 0.2s ease",
  "&:hover:not(:disabled)": {
    opacity: 0.9,
    backgroundColor: theme.palette.primary.main
  },
  "&:disabled": {
    opacity: 0.5,
    cursor: "not-allowed"
  }
}));

const SeatPrice = styled(Typography)(({ theme, selected }) => ({
  fontSize: "0.75rem",
  color: selected ? 
    theme.palette.primary.contrastText : 
    theme.palette.text.secondary
}));

const SeatSelectionModal = ({
  isOpen,
  flightData,
  maxSeats,
  isLoading,
  inquiryToken,
  itineraryToken,
}) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  
  // Get passengers and active passenger from Redux store
  const { passengers, activePassengerIndex } = useSelector(state => state.flights);
  
  // Debug logging
  console.log('SeatModal - Received Props:', {
    flightData,
    maxSeats,
    inquiryToken,
    itineraryToken
  });
  
  console.log('SeatModal - Passengers from Redux:', {
    passengers,
    activePassengerIndex
  });

  const [activeView, setActiveView] = useState("seats");
  const [activeFlightSegment, setActiveFlightSegment] = useState(0);

  // Initialize selections with passenger information
  const [selectedSeats, setSelectedSeats] = useState(() => {
    const initialSeatMap = flightData.seatMap?.map(segment => {
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
          seats: row.seats.filter(seat => seat.code !== null).map(seat => {
            const selectedSeat = matchingSelectedSegment?.rows
              ?.flatMap(r => r.seats)
              ?.find(s => s.code === seat.code);
            
            return {
              ...seat,
              isSelected: !!selectedSeat,
              passengerId: selectedSeat?.passengerId,
              passengerIndex: selectedSeat?.passengerIndex,
              passengerName: selectedSeat?.passengerName,
              passengerType: selectedSeat?.passengerType
            };
          })
        }))
      };
    });
  
    return initialSeatMap || [];
  });

  // --- Initialize Baggage per passenger ---
  const [selectedBaggage, setSelectedBaggage] = useState(() => {
    const initialBaggage = flightData.baggageOptions?.map(segment => ({
      origin: segment.origin,
      destination: segment.destination,
      resultIdentifier: segment.resultIdentifier,
      options: segment.options || [],
      // Initialize selection for each passenger
      passengerSelections: passengers.map(passenger => ({
        passengerId: passenger.id,
        selectedOption: null // Will be populated from existing selections if available
      }))
    })) || [];

    // Populate existing baggage selections
    if (flightData.selectedBaggage && flightData.selectedBaggage.length > 0) {
      flightData.selectedBaggage.forEach(selBag => {
        const segmentIndex = initialBaggage.findIndex(
          seg => seg.origin === selBag.origin && seg.destination === selBag.destination
        );
        if (segmentIndex >= 0 && selBag.options && selBag.options.length > 0) {
          selBag.options.forEach(option => {
            const passengerIdx = option.passengerIndex !== undefined ? option.passengerIndex : 0;
            if (passengerIdx < initialBaggage[segmentIndex].passengerSelections.length) {
              initialBaggage[segmentIndex].passengerSelections[passengerIdx].selectedOption = option;
            }
          });
        }
      });
    }
    return initialBaggage;
  });

  // --- Initialize Meals per passenger ---
  const [selectedMeal, setSelectedMeal] = useState(() => {
    const initialMeals = flightData.mealOptions?.map(segment => ({
      origin: segment.origin,
      destination: segment.destination,
      resultIdentifier: segment.resultIdentifier,
      options: segment.options || [],
      // Initialize selection for each passenger
      passengerSelections: passengers.map(passenger => ({
        passengerId: passenger.id,
        selectedOption: null // Will be populated from existing selections if available
      }))
    })) || [];

    // Populate existing meal selections
    if (flightData.selectedMeal && flightData.selectedMeal.length > 0) {
      flightData.selectedMeal.forEach(selMeal => {
        const segmentIndex = initialMeals.findIndex(
          seg => seg.origin === selMeal.origin && seg.destination === selMeal.destination
        );
        if (segmentIndex >= 0 && selMeal.options && selMeal.options.length > 0) {
          selMeal.options.forEach(option => {
            const passengerIdx = option.passengerIndex !== undefined ? option.passengerIndex : 0;
            if (passengerIdx < initialMeals[segmentIndex].passengerSelections.length) {
              initialMeals[segmentIndex].passengerSelections[passengerIdx].selectedOption = option;
            }
          });
        }
      });
    }
    return initialMeals;
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

  // Get passenger selections for current segment
  const getCurrentPassengerSelections = (segmentIndex) => {
    // Guard against undefined segment
    if (!selectedSeats || !selectedSeats[segmentIndex]) {
      return [];
    }
    
    const segment = selectedSeats[segmentIndex];
    return segment?.rows.reduce((acc, row) => {
      row.seats.forEach(seat => {
        if (seat.isSelected && seat.passengerId) {
          acc.push({
            passengerId: seat.passengerId,
            passengerIndex: seat.passengerIndex,
            passengerName: seat.passengerName || 'Passenger',
            seatCode: seat.code,
            price: seat.price
          });
        }
      });
      return acc;
    }, []) || [];
  };

  // Handle passenger tab change
  const handlePassengerChange = (passengerIndex) => {
    dispatch(setActivePassengerIndex(passengerIndex));
  };

  // Updated seat selection handler with passenger information
  const handleSeatClick = (segmentIndex, rowIndex, seatIndex, isBooked) => {
    if (isBooked) return;
    
    // Guard against empty passengers array
    if (!passengers || passengers.length === 0) {
      setError("No passenger information available");
      return;
    }
    
    // Guard against invalid passenger index
    if (activePassengerIndex < 0 || activePassengerIndex >= passengers.length) {
      setError("Invalid passenger selection");
      return;
    }

    setSelectedSeats((prev) => {
      const newSeats = [...prev];
      const segment = newSeats[segmentIndex];
      const currentPassenger = passengers[activePassengerIndex];
      
      // Ensure passenger data exists
      if (!currentPassenger) {
        setError("Passenger information not available");
        return prev;
      }
      
      // Count seats selected for current passenger
      const passengerSeatCount = segment.rows.reduce(
        (count, row) =>
          count + row.seats.filter((seat) => 
            seat.isSelected && seat.passengerIndex === activePassengerIndex
          ).length,
        0
      );

      const seat = segment.rows[rowIndex].seats[seatIndex];
      
      // If seat is already selected by this passenger, unselect it
      if (seat.isSelected && seat.passengerIndex === activePassengerIndex) {
        newSeats[segmentIndex] = {
          ...segment,
          rows: segment.rows.map((row, rIndex) => {
            if (rIndex !== rowIndex) return row;
            return {
              ...row,
              seats: row.seats.map((s, sIndex) => {
                if (sIndex !== seatIndex) return s;
                return {
                  ...s,
                  isSelected: false,
                  passengerId: null,
                  passengerIndex: null,
                  passengerName: null,
                  passengerType: null
                };
              }),
            };
          }),
        };
        setError("");
        return newSeats;
      }

      // Check if passenger already has a seat
      if (passengerSeatCount >= 1) {
        setError(`Each passenger can only select one seat per flight segment`);
        return prev;
      }

      // Check if seat is already selected by another passenger
      if (seat.isSelected) {
        setError(`This seat is already selected by ${seat.passengerName || 'another passenger'}`);
        return prev;
      }

      newSeats[segmentIndex] = {
        ...segment,
        rows: segment.rows.map((row, rIndex) => {
          if (rIndex !== rowIndex) return row;
          return {
            ...row,
            seats: row.seats.map((s, sIndex) => {
              if (sIndex !== seatIndex) return s;
              return {
                ...s,
                isSelected: true,
                passengerId: currentPassenger.id,
                passengerIndex: activePassengerIndex,
                passengerName: currentPassenger.name,
                passengerType: currentPassenger.type
              };
            }),
          };
        }),
      };

      setError("");
      return newSeats;
    });
  };

  // --- Updated Baggage selection handler per passenger ---
  const handleBaggageSelect = (segmentIndex, option) => {
    setSelectedBaggage((prev) => {
      const newBaggage = [...prev];
      if (!newBaggage[segmentIndex] || !newBaggage[segmentIndex].passengerSelections) return prev; // Guard clause
      
      const passengerSelections = [...newBaggage[segmentIndex].passengerSelections];
      if (activePassengerIndex >= passengerSelections.length) return prev; // Guard clause
      
      const currentPassengerSelection = passengerSelections[activePassengerIndex];
      const currentOption = currentPassengerSelection.selectedOption;

      // Update the selection for the active passenger
      passengerSelections[activePassengerIndex] = {
        ...currentPassengerSelection,
        // Toggle: if same option clicked, deselect; otherwise select new option
        selectedOption: currentOption?.code === option.code ? null : option,
      };

      newBaggage[segmentIndex] = {
        ...newBaggage[segmentIndex],
        passengerSelections: passengerSelections,
      };
      return newBaggage;
    });
  };

  // --- Updated Meal selection handler per passenger ---
  const handleMealSelect = (segmentIndex, option) => {
    setSelectedMeal((prev) => {
      const newMeal = [...prev];
      if (!newMeal[segmentIndex] || !newMeal[segmentIndex].passengerSelections) return prev; // Guard clause
      
      const passengerSelections = [...newMeal[segmentIndex].passengerSelections];
      if (activePassengerIndex >= passengerSelections.length) return prev; // Guard clause

      const currentPassengerSelection = passengerSelections[activePassengerIndex];
      const currentOption = currentPassengerSelection.selectedOption;

      // Update the selection for the active passenger
      passengerSelections[activePassengerIndex] = {
        ...currentPassengerSelection,
        // Toggle: if same option clicked, deselect; otherwise select new option
        selectedOption: currentOption?.code === option.code ? null : option,
      };
      
      newMeal[segmentIndex] = {
        ...newMeal[segmentIndex],
        passengerSelections: passengerSelections,
      };
      return newMeal;
    });
  };

  const handleSubmit = async () => {
    try {
      const transformedSelections = {
        flightCode: flightData.flightCode,
        seatMap: selectedSeats
          .filter(segment => segment.rows.some(row => 
            row.seats.some(seat => seat.isSelected)
          ))
          .map(segment => ({
            origin: segment.origin,
            destination: segment.destination,
            resultIdentifier: segment.resultIdentifier,
            rows: segment.rows.map(row => ({
              seats: row.seats.filter(seat => seat.isSelected).map(seat => ({
                code: seat.code,
                seatNo: seat.seatNo,
                price: seat.price,
                type: seat.type,
                priceBracket: seat.priceBracket,
                passengerId: seat.passengerId,
                passengerIndex: seat.passengerIndex,
                passengerName: seat.passengerName || 'Unknown',
                passengerType: seat.passengerType || 'Unknown'
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

  // Handle tab change
  const handleViewChange = (event, newValue) => {
    setActiveView(newValue);
  };

  return (
    <ModalOverlay>
      <ModalContainer>
        {/* Header */}
        <ModalHeader sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold' }}>
              Select Your Seats & Extras
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {flightData.airline} - Flight {flightData.flightCode}
            </Typography>
          </Box>
          <Button onClick={handleClose} sx={{ minWidth: 'auto', p: 1 }}>
            <X size={24} />
          </Button>
        </ModalHeader>

        {/* Passenger Selection */}
        <Box className="passenger-selector">
          <Box className="passenger-tabs">
            {passengers && passengers.length > 0 ? (
              passengers.map((passenger, index) => (
                <Button
                  key={passenger.id || index}
                  onClick={() => handlePassengerChange(index)}
                  className={`passenger-tab ${index === activePassengerIndex ? 'active' : ''}`}
                  startIcon={<User size={16} />}
                >
                  {passenger.name || `Passenger ${index + 1}`}
                </Button>
              ))
            ) : (
              <Typography variant="body2" color="text.secondary">
                No passenger information available
              </Typography>
            )}
          </Box>
          
          <Box className="selections-summary">
            {getCurrentPassengerSelections(activeFlightSegment).map((selection, index) => (
              <Chip
                key={selection.passengerId || `selection-${index}`}
                label={`${selection.passengerName || 'Passenger'}: ${selection.seatCode}`}
                className={`selection-chip ${selection.passengerIndex === activePassengerIndex ? 'active' : ''}`}
                onDelete={() => {
                  // Only change passenger if available
                  if (passengers && passengers.length > 0 && 
                      selection.passengerIndex >= 0 && 
                      selection.passengerIndex < passengers.length) {
                    handlePassengerChange(selection.passengerIndex);
                  }
                  
                  // Find and unselect the seat
                  const segmentData = selectedSeats[activeFlightSegment];
                  if (segmentData) {
                    segmentData.rows.forEach((row, rowIndex) => {
                      row.seats.forEach((seat, seatIndex) => {
                        if (seat.code === selection.seatCode) {
                          handleSeatClick(activeFlightSegment, rowIndex, seatIndex, false);
                        }
                      });
                    });
                  }
                }}
              />
            ))}
          </Box>
        </Box>

        {/* Error Alert */}
        {error && (
          <Box sx={{ p: 2 }}>
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </Box>
        )}
  
        {/* Main Tabs Navigation */}
        <Tabs 
          value={activeView}
          onChange={handleViewChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <StyledTab 
            value="seats" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Plane size={18} />
                <span>Seat Selection</span>
              </Box>
            }
          />
          <StyledTab 
            value="baggage" 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShoppingBag size={18} />
                <span>Baggage Options</span>
              </Box>
            }
          />
          {selectedMeal.length > 0 && (
            <StyledTab 
              value="meal" 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingBag size={18} />
                  <span>Meal Options</span>
                </Box>
              }
            />
          )}
        </Tabs>
  
        {/* Scrollable Content Area */}
        <ModalContent>
          {/* Seats View */}
          {activeView === "seats" && (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Flight segment tabs */}
              <Tabs
                value={activeFlightSegment}
                onChange={(e, newValue) => setActiveFlightSegment(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                {selectedSeats?.map((segment, index) => (
                  <StyledTab
                    key={`${segment.origin}-${segment.destination}`}
                    value={index}
                    label={`${segment.origin} → ${segment.destination}`}
                  />
                ))}
              </Tabs>
  
              {/* Active segment seat selection */}
              {selectedSeats?.[activeFlightSegment] && (
                <Card sx={{ p: 2 }}>
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    {selectedSeats[activeFlightSegment].origin} → {selectedSeats[activeFlightSegment].destination}
                  </Typography>
                  <Grid container spacing={2} justifyContent="center">
                    {selectedSeats[activeFlightSegment].rows.map((row, rowIndex) => (
                      <Grid item xs={12} key={rowIndex} sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                        {selectedSeats[activeFlightSegment].rows[rowIndex].seats.filter(seat => seat.code !== null).map((seat, seatIndex) => {
                          // Log the seat object being rendered
                          console.log(`Rendering SeatButton for seat:`, seat);
                          
                          return (
                            <SeatButton
                              key={seat.code}
                              onClick={() => handleSeatClick(activeFlightSegment, rowIndex, seatIndex, seat.isBooked)}
                              disabled={seat.isBooked || isLoading}
                              selected={seat.isSelected}
                              isAisle={seat.type?.isAisle || false}
                            >
                              <Typography variant="body2">{seat.code}</Typography>
                              {!seat.isBooked && (
                                <SeatPrice variant="caption" selected={seat.isSelected}>
                                  ₹{seat.price}
                                </SeatPrice>
                              )}
                              {seat.isSelected && seat.passengerName && (
                                <span className="passenger-name-tooltip">
                                  {seat.passengerName}
                                </span>
                              )}
                            </SeatButton>
                          );
                        })}
                      </Grid>
                    ))}
                  </Grid>
                </Card>
              )}
            </Box>
          )}
  
          {/* Baggage View */}
          {activeView === "baggage" && (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Flight segment tabs for baggage */}
              <Tabs
                value={activeFlightSegment}
                onChange={(e, newValue) => setActiveFlightSegment(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                {selectedBaggage.map((segment, index) => (
                  <StyledTab
                    key={`${segment.origin}-${segment.destination}`}
                    value={index}
                    label={`${segment.origin} → ${segment.destination}`}
                  />
                ))}
              </Tabs>
  
              {/* Active segment baggage options - Updated Logic */} 
              {selectedBaggage[activeFlightSegment] && (
                <Grid container spacing={2}>
                  <Typography variant="body2" sx={{ width: '100%', mb: 1, pl: 2, color: 'text.secondary' }}>
                    Select baggage for: {passengers[activePassengerIndex]?.name || `Passenger ${activePassengerIndex + 1}`}
                  </Typography>
                  {selectedBaggage[activeFlightSegment].options.map((option) => {
                    // Determine if this option is selected for the *active* passenger
                    const currentPassengerSelection = selectedBaggage[activeFlightSegment].passengerSelections?.[activePassengerIndex];
                    const isSelected = currentPassengerSelection?.selectedOption?.code === option.code;
                    
                    return (
                      <Grid item xs={12} key={option.code}>
                        <OptionCard
                          onClick={() => handleBaggageSelect(activeFlightSegment, option)}
                          disabled={isLoading}
                          selected={isSelected} // Use the correct isSelected status
                          fullWidth
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {option.description}
                              </Typography>
                              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                                Weight: {option.weight}kg
                              </Typography>
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              ₹{option.price.toLocaleString()}
                            </Typography>
                          </Box>
                        </OptionCard>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          )}
  
          {/* Meal View */}
          {activeView === "meal" && (
            <Box sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Flight segment tabs for meals */}
              <Tabs
                value={activeFlightSegment}
                onChange={(e, newValue) => setActiveFlightSegment(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider' }}
              >
                {selectedMeal.map((segment, index) => (
                  <StyledTab
                    key={`${segment.origin}-${segment.destination}`}
                    value={index}
                    label={`${segment.origin} → ${segment.destination}`}
                  />
                ))}
              </Tabs>
  
              {/* Active segment meal options - Updated Logic */} 
              {selectedMeal[activeFlightSegment] && (
                <Grid container spacing={2}>
                  <Typography variant="body2" sx={{ width: '100%', mb: 1, pl: 2, color: 'text.secondary' }}>
                    Select meal for: {passengers[activePassengerIndex]?.name || `Passenger ${activePassengerIndex + 1}`}
                  </Typography>
                  {selectedMeal[activeFlightSegment].options.map((option) => {
                    // Determine if this option is selected for the *active* passenger
                    const currentPassengerSelection = selectedMeal[activeFlightSegment].passengerSelections?.[activePassengerIndex];
                    const isSelected = currentPassengerSelection?.selectedOption?.code === option.code;
                    
                    return (
                      <Grid item xs={12} key={option.code}>
                        <OptionCard
                          onClick={() => handleMealSelect(activeFlightSegment, option)}
                          disabled={isLoading}
                          selected={isSelected} // Use the correct isSelected status
                          fullWidth
                        >
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                            <Box>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {option.description}
                              </Typography>
                              <Typography variant="body2" sx={{ opacity: 0.75 }}>
                                {option.details}
                              </Typography>
                            </Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              ₹{option.price.toLocaleString()}
                            </Typography>
                          </Box>
                        </OptionCard>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          )}
        </ModalContent>
  
        {/* Footer */}
        <ModalFooter>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Total Additional Cost:
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700, 
                  color: theme.palette.primary.main 
                }}
              >
                ₹{additionalCost.toLocaleString()}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                onClick={handleClose}
                disabled={isLoading}
                variant="text"
                sx={{ 
                  px: 2, 
                  py: 1, 
                  borderRadius: 2,
                  "&:hover": {
                    backgroundColor: theme.palette.mode === 'light' ? 
                      theme.palette.grey[100] : 
                      theme.palette.grey[700]
                  }
                }}
              >
                Cancel
              </Button>
              <ConfirmButton
                onClick={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Confirm Selection"}
              </ConfirmButton>
            </Box>
          </Box>
        </ModalFooter>
      </ModalContainer>
    </ModalOverlay>
  );
};

export default SeatSelectionModal;