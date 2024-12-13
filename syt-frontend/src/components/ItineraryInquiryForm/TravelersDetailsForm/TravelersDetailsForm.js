import { Add, Remove } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import "./TravelersDetailsForm.css";

const TravelersDetailsForm = ({ saveTravelersDetails, travelersDetails }) => {
  const [travelerType, setTravelerType] = useState("");
  const [rooms, setRooms] = useState([]);
  const [soloAge, setSoloAge] = useState("");
  const [coupleAdult1Age, setCoupleAdult1Age] = useState("");
  const [coupleAdult2Age, setCoupleAdult2Age] = useState("");

  const initialDataLoaded = useRef(false); // Flag to track initial data loading

  useEffect(() => {
    if (travelersDetails && !initialDataLoaded.current) {
      // Populate the form fields with initial data from travelersDetails
      setTravelerType(travelersDetails.type || "");
      setRooms(travelersDetails.rooms || []);
      setSoloAge(travelersDetails.soloAge || "");
      setCoupleAdult1Age(travelersDetails.coupleAdult1Age || "");
      setCoupleAdult2Age(travelersDetails.coupleAdult2Age || "");
      
      // Mark that initial data has been loaded to prevent further updates on mount
      initialDataLoaded.current = true;
    }
  }, [travelersDetails]);

  useEffect(() => {
    if (initialDataLoaded.current) {
      saveTravelersDetails({
        type: travelerType,
        rooms,
        soloAge,
        coupleAdult1Age,
        coupleAdult2Age,
      });
    }
  }, [travelerType, rooms, soloAge, coupleAdult1Age, coupleAdult2Age, saveTravelersDetails]);

  const handleTypeChange = (event, newType) => {
    setTravelerType(newType);
    setSoloAge("");
    setCoupleAdult1Age("");
    setCoupleAdult2Age("");
    if (newType === "family" || newType === "friends") {
      setRooms([{ adults: [], children: [] }]);
    } else {
      setRooms([]);
    }
  };

  const handleAddRoom = () => {
    setRooms([...rooms, { adults: [], children: [] }]);
  };

  const handleRemoveRoom = (index) => {
    const updatedRooms = rooms.filter((_, i) => i !== index);
    setRooms(updatedRooms);
  };

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

  const handleAddAdult = (roomIndex) => {
    const updatedRooms = rooms.map((room, index) => {
      if (index === roomIndex) {
        if (room.adults.length < 3 && room.children.length === 0) {
          return { ...room, adults: [...room.adults, ""] };
        } else if (room.adults.length < 2 && room.children.length < 2) {
          return { ...room, adults: [...room.adults, ""] };
        }
      }
      return room;
    });
    setRooms(updatedRooms);
  };

  const handleRemoveAdult = (roomIndex, adultIndex) => {
    const updatedRooms = rooms.map((room, index) =>
      index === roomIndex
        ? {
            ...room,
            adults: room.adults.filter((_, idx) => idx !== adultIndex),
          }
        : room
    );
    setRooms(updatedRooms);
  };

  const handleAddChild = (roomIndex) => {
    const updatedRooms = rooms.map((room, index) => {
      if (
        index === roomIndex &&
        room.children.length < 2 &&
        room.adults.length <= 2
      ) {
        return { ...room, children: [...room.children, ""] };
      }
      return room;
    });
    setRooms(updatedRooms);
  };

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
        }} // Center the buttons
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

      <Box sx={{ width: "100%" }}>
        {travelerType === "solo" && (
          <TextField
            label="Adult Age"
            type="number"
            fullWidth
            sx={{
              mb: 3,
              "& .MuiOutlinedInput-root": {
                borderRadius: '30px', // Add rounded corners to the adult input field
              },
            }}
            value={soloAge}
            onChange={(e) => setSoloAge(e.target.value)}
          />
        )}

        {travelerType === "couple" && (
          <>
            <TextField
              label="Adult 1 Age"
              type="number"
              fullWidth
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: '30px',
                },
              }}
              value={coupleAdult1Age}
              onChange={(e) => setCoupleAdult1Age(e.target.value)}
            />
            <TextField
              label="Adult 2 Age"
              type="number"
              fullWidth
              sx={{
                mb: 3,
                "& .MuiOutlinedInput-root": {
                  borderRadius: '30px',
                },
              }}
              value={coupleAdult2Age}
              onChange={(e) => setCoupleAdult2Age(e.target.value)}
            />
          </>
        )}

        {(travelerType === "family" || travelerType === "friends") &&
          rooms.map((room, roomIndex) => (
            <Box key={roomIndex} mt={3} className="room-container">
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <h4>Room {roomIndex + 1}</h4>
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

              {room.adults.map((adultAge, adultIndex) => (
                <Box key={adultIndex} display="flex" alignItems="center" mb={2}>
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
                    fullWidth
                    sx={{
                      mr: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: '30px',
                      },
                    }}
                  />
                  <IconButton
                    onClick={() => handleRemoveAdult(roomIndex, adultIndex)}
                    color="secondary"
                    size="small"
                    className="remove-button"
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              {room.children.map((childAge, childIndex) => (
                <Box key={childIndex} display="flex" alignItems="center" mb={2}>
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
                    fullWidth
                    sx={{
                      mr: 2,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: '30px',
                      },
                    }}
                  />
                  <IconButton
                    onClick={() => handleRemoveChild(roomIndex, childIndex)}
                    color="secondary"
                    size="small"
                    className="remove-button"
                  >
                    <Remove fontSize="small" />
                  </IconButton>
                </Box>
              ))}

              <Box className="add-buttons-container">
                {room.adults.length < 3 &&
                  room.adults.length + room.children.length < 4 && (
                    <Button
                      variant="outlined"
                      startIcon={<Add />}
                      onClick={() => handleAddAdult(roomIndex)}
                      className="add-button add-adult-button"
                      sx={{ borderRadius: '30px' }} // Add rounded corners to "Add Adult" button
                    >
                      Add Adult
                    </Button>
                  )}
                {room.children.length < 2 && room.adults.length <= 2 && (
                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={() => handleAddChild(roomIndex)}
                    className="add-button add-child-button"
                    sx={{ borderRadius: '30px' }} // Add rounded corners to "Add Child" button
                  >
                    Add Child
                  </Button>
                )}
              </Box>
            </Box>
          ))}

        {(travelerType === "family" || travelerType === "friends") && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleAddRoom}
            sx={{ mt: 3, borderRadius: '30px' }} // Add rounded corners to "Add Room" button
          >
            Add Room
          </Button>
        )}
      </Box>
    </Box>
  );
};

export default TravelersDetailsForm;
