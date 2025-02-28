import { Add, Info, Remove } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import "./TravelersDetailsForm.css";

const TravelersDetailsForm = ({ saveTravelersDetails, travelersDetails }) => {
  const theme = useTheme();
  const [travelerType, setTravelerType] = useState("family");
  const [rooms, setRooms] = useState([]);
  const [isAnimationReady, setIsAnimationReady] = useState(false);

  // Maximum number of travelers allowed per room
  const MAX_TRAVELERS_PER_ROOM = 4;

  const initialDataLoaded = useRef(false);

  // Load initial data from passed props
  useEffect(() => {
    if (travelersDetails && !initialDataLoaded.current) {
      setTravelerType(travelersDetails.type || "family");
      setRooms(travelersDetails.rooms || []);
      initialDataLoaded.current = true;
    }
  }, [travelersDetails]);

  // Initialize rooms based on traveler type
  useEffect(() => {
    if (initialDataLoaded.current && rooms.length === 0) {
      if (travelerType === "solo") {
        setRooms([{ adults: [""], children: [] }]);
      } else if (travelerType === "couple") {
        setRooms([{ adults: ["", ""], children: [] }]);
      } else if (travelerType === "family" || travelerType === "friends") {
        setRooms([{ adults: [""], children: [] }]);
      }

      // Trigger animation
      setIsAnimationReady(false);
      setTimeout(() => setIsAnimationReady(true), 50);
    }
  }, [travelerType, rooms]);

  // Save travelers details whenever rooms or type change
  useEffect(() => {
    if (initialDataLoaded.current) {
      saveTravelersDetails({
        type: travelerType,
        rooms,
      });
    }
  }, [travelerType, rooms, saveTravelersDetails]);

  // Handle traveler type change
  const handleTypeChange = (event, newType) => {
    if (newType !== null) {
      setTravelerType(newType);
      if (newType === "solo") {
        setRooms([{ adults: [""], children: [] }]);
      } else if (newType === "couple") {
        setRooms([{ adults: ["", ""], children: [] }]);
      } else if (newType === "family" || newType === "friends") {
        setRooms([{ adults: [""], children: [] }]);
      } else {
        setRooms([]);
      }
    }
  };

  // Add a new room
  const handleAddRoom = () => {
    setRooms([...rooms, { adults: [""], children: [] }]);

    // Trigger animation
    setIsAnimationReady(false);
    setTimeout(() => setIsAnimationReady(true), 50);
  };

  // Remove a specific room
  const handleRemoveRoom = (index) => {
    const updatedRooms = rooms.filter((_, i) => i !== index);
    setRooms(updatedRooms);
  };

  // Update room details (adults/children ages)
  const handleRoomChange = (index, field, subIndex, value) => {
    const updatedRooms = rooms.map((room, i) =>
      i === index
        ? {
            ...room,
            [field]: room[field].map((item, idx) =>
              idx === subIndex ? value : item
            ),
          }
        : room
    );
    setRooms(updatedRooms);
  };

  // Count total travelers in a room
  const getTotalTravelersInRoom = (room) => {
    return room.adults.length + room.children.length;
  };

  // Add an adult to a specific room
  const handleAddAdult = (roomIndex) => {
    const updatedRooms = rooms.map((room, index) => {
      if (index === roomIndex) {
        // Allow adding adults as long as the total doesn't exceed the maximum
        if (getTotalTravelersInRoom(room) < MAX_TRAVELERS_PER_ROOM) {
          return { ...room, adults: [...room.adults, ""] };
        }
      }
      return room;
    });
    setRooms(updatedRooms);
  };

  // Remove an adult from a specific room
  const handleRemoveAdult = (roomIndex, adultIndex) => {
    const updatedRooms = rooms.map((room, index) => {
      // Ensure at least one adult remains in the room
      if (index === roomIndex && room.adults.length > 1) {
        return {
          ...room,
          adults: room.adults.filter((_, idx) => idx !== adultIndex),
        };
      }
      return room;
    });
    setRooms(updatedRooms);
  };

  // Add a child to a specific room
  const handleAddChild = (roomIndex) => {
    const updatedRooms = rooms.map((room, index) => {
      if (index === roomIndex) {
        // Allow adding children as long as there's at least one adult and the total doesn't exceed the maximum
        if (room.adults.length >= 1 && getTotalTravelersInRoom(room) < MAX_TRAVELERS_PER_ROOM) {
          return { ...room, children: [...room.children, ""] };
        }
      }
      return room;
    });
    setRooms(updatedRooms);
  };

  // Remove a child from a specific room
  const handleRemoveChild = (roomIndex, childIndex) => {
    const updatedRooms = rooms.map((room, index) =>
      index === roomIndex
        ? {
            ...room,
            children: room.children.filter((_, idx) => idx !== childIndex),
          }
        : room
    );
    setRooms(updatedRooms);
  };

  return (
    <Box className="form-container">
      {/* Helper Text */}
      <Box 
        sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          mb: 3,
          backgroundColor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.05)" : `rgba(${theme.palette.primary.main}, 0.05)`,
          p: 2,
          borderRadius: "10px"
        }}
      >
        <Info sx={{ color: theme.palette.primary.main, mr: 1 }} />
        <Typography variant="body2" color="text.secondary">
          Select your travel group type and specify ages for accurate pricing.
        </Typography>
      </Box>
  
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 600, textAlign: "center" }}>
        Traveler Group & Ages
      </Typography>
  
      {/* Traveler Type Selection */}
      <ToggleButtonGroup
        value={travelerType}
        exclusive
        onChange={handleTypeChange}
        aria-label="Traveler Type"
        sx={{
          mt: 3,
          width: "100%",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <ToggleButton value="solo" sx={{ flex: 1, borderRadius: '30px' }}>
          Solo
        </ToggleButton>
        <ToggleButton value="couple" sx={{ flex: 1, borderRadius: '30px' }}>
          Couple
        </ToggleButton>
        <ToggleButton value="family" sx={{ flex: 1, borderRadius: '30px' }}>
          Family
        </ToggleButton>
        <ToggleButton value="friends" sx={{ flex: 1, borderRadius: '30px' }}>
          Friends
        </ToggleButton>
      </ToggleButtonGroup>
  
      <Typography variant="caption" color="textSecondary" sx={{ mt: 2, display: 'block', textAlign: 'center' }}>
        {travelerType === "solo" && "Individual traveler booking single accommodation"}
        {travelerType === "couple" && "Two adults sharing one room"}
        {(travelerType === "family" || travelerType === "friends") && 
          "Each room requires at least one adult, with a maximum of 4 travelers per room"}
      </Typography>
  
      {/* Room and Traveler Details */}
      <Box sx={{ width: "100%", mt: 4 }}>
        {/* Solo and Couple Views */}
        {(travelerType === "solo" || travelerType === "couple") && rooms[0] && (
          <Box 
            className={`solo-couple-container ${isAnimationReady ? 'visible' : ''}`} 
            sx={{ mb: 4 }}
          >
            {rooms[0].adults.map((adultAge, index) => (
              <TextField
                key={index}
                label={`Adult ${index + 1} Age`}
                type="number"
                className={`age-input-half ${isAnimationReady ? 'visible' : ''}`}
                sx={{
                  mb: 3,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: '30px',
                  },
                }}
                value={adultAge}
                onChange={(e) =>
                  handleRoomChange(0, "adults", index, e.target.value)
                }
                InputProps={{
                  inputProps: { 
                    min: 18, 
                    max: 99 
                  }
                }}
              />
            ))}
          </Box>
        )}
  
        {/* Family and Friends Views */}
        {(travelerType === "family" || travelerType === "friends") &&
          rooms.map((room, roomIndex) => (
            <Box 
              key={roomIndex} 
              className={`room-container ${isAnimationReady ? 'visible' : ''}`} 
              mt={3}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6" sx={{ margin: 0 }}>Room {roomIndex + 1}</Typography>
                {rooms.length > 1 && (
                  <IconButton
                    onClick={() => handleRemoveRoom(roomIndex)}
                    color="secondary"
                    size="small"
                    className="remove-button"
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                )}
              </Box>
  
              {/* Adult Inputs */}
              {room.adults.map((adultAge, adultIndex) => (
                <Box key={adultIndex} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <TextField
                    label={`Adult ${adultIndex + 1} Age`}
                    type="number"
                    value={adultAge}
                    onChange={(e) =>
                      handleRoomChange(
                        roomIndex,
                        "adults",
                        adultIndex,
                        e.target.value
                      )
                    }
                    sx={{
                      flexGrow: 1,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: '30px',
                      },
                    }}
                    InputProps={{
                      inputProps: { 
                        min: 18, 
                        max: 99 
                      }
                    }}
                  />
                  {room.adults.length > 1 && (
                    <IconButton
                      onClick={() => handleRemoveAdult(roomIndex, adultIndex)}
                      color="secondary"
                      size="small"
                      className="remove-button"
                      sx={{ ml: 1 }}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              ))}
  
              {/* Child Inputs */}
              {room.children.map((childAge, childIndex) => (
                <Box key={childIndex} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <TextField
                    label={`Child ${childIndex + 1} Age`}
                    type="number"
                    value={childAge}
                    onChange={(e) =>
                      handleRoomChange(
                        roomIndex,
                        "children",
                        childIndex,
                        e.target.value
                      )
                    }
                    sx={{
                      flexGrow: 1,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: '30px',
                      },
                    }}
                    InputProps={{
                      inputProps: { 
                        min: 0, 
                        max: 17 
                      }
                    }}
                  />
                  <IconButton
                    onClick={() => handleRemoveChild(roomIndex, childIndex)}
                    color="secondary"
                    size="small"
                    className="remove-button"
                    sx={{ ml: 1 }}
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                </Box>
              ))}
  
              {/* Display current count */}
              <Typography variant="caption" color="textSecondary" sx={{ mb: 2, display: 'block' }}>
                Room capacity: {getTotalTravelersInRoom(room)}/{MAX_TRAVELERS_PER_ROOM} travelers
              </Typography>
  
              {/* Add Adult/Child Buttons */}
              <Box className="add-buttons-container">
                {/* Show Add Adult button if room isn't full */}
                {getTotalTravelersInRoom(room) < MAX_TRAVELERS_PER_ROOM && (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => handleAddAdult(roomIndex)}
                    className="add-button add-adult-button"
                    sx={{ borderRadius: '30px' }}
                  >
                    Add Adult
                  </Button>
                )}
                {/* Show Add Child button if there's at least one adult and room isn't full */}
                {room.adults.length >= 1 && getTotalTravelersInRoom(room) < MAX_TRAVELERS_PER_ROOM && (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => handleAddChild(roomIndex)}
                    className="add-button add-child-button"
                    sx={{ borderRadius: '30px' }}
                  >
                    Add Child
                  </Button>
                )}
              </Box>
            </Box>
          ))}
  
        {/* Add Room Button for Family/Friends */}
        {(travelerType === "family" || travelerType === "friends") && (
          <Button
            variant="contained"
            onClick={handleAddRoom}
            className="add-room-button"
            sx={{ 
              mt: 3, 
              borderRadius: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Add fontSize="small" />
            <span>Add Room</span>
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default TravelersDetailsForm;