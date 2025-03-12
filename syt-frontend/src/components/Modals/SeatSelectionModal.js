import {
  Box,
  Button,
  Card,
  Grid,
  Paper,
  Tab,
  Tabs,
  Typography,
  styled
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Plane, ShoppingBag, X } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { Alert, AlertDescription, AlertTitle } from "../../components/ui/alert";
import {
  closeSeatModal,
  updateFlightSeats,
} from "../../redux/slices/flightSlice";

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
  const [activeView, setActiveView] = useState("seats");
  const [activeFlightSegment, setActiveFlightSegment] = useState(0);

  // Initialize selections maintaining exact flight data structure
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
          seats: row.seats.filter(seat => seat.code !== null).map(seat => ({
            ...seat,
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
                        {row.seats.filter(seat => seat.code !== null).map((seat, seatIndex) => (
                          <SeatButton
                            key={seat.code}
                            onClick={() => handleSeatClick(activeFlightSegment, rowIndex, seatIndex, seat.isBooked)}
                            disabled={seat.isBooked || isLoading}
                            selected={seat.isSelected}
                            isAisle={seat.type?.isAisle}
                          >
                            <Typography variant="body2">{seat.code}</Typography>
                            {!seat.isBooked && (
                              <SeatPrice variant="caption" selected={seat.isSelected}>
                                ₹{seat.price}
                              </SeatPrice>
                            )}
                          </SeatButton>
                        ))}
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
  
              {/* Active segment baggage options */}
              {selectedBaggage[activeFlightSegment] && (
                <Grid container spacing={2}>
                  {selectedBaggage[activeFlightSegment].options.map((option) => {
                    const isSelected = selectedBaggage[activeFlightSegment].selectedOption?.code === option.code;
                    return (
                      <Grid item xs={12} key={option.code}>
                        <OptionCard
                          onClick={() => handleBaggageSelect(activeFlightSegment, option)}
                          disabled={isLoading}
                          selected={isSelected}
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
  
              {/* Active segment meal options */}
              {selectedMeal[activeFlightSegment] && (
                <Grid container spacing={2}>
                  {selectedMeal[activeFlightSegment].options.map((option) => {
                    const isSelected = selectedMeal[activeFlightSegment].selectedOption?.code === option.code;
                    return (
                      <Grid item xs={12} key={option.code}>
                        <OptionCard
                          onClick={() => handleMealSelect(activeFlightSegment, option)}
                          disabled={isLoading}
                          selected={isSelected}
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