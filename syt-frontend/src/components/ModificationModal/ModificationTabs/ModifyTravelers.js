import { Add as AddIcon, Remove as RemoveIcon } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    IconButton,
    TextField,
    Typography
} from '@mui/material';
import React, { useEffect, useState } from 'react';

const ModifyTravelers = ({ travelersDetails, onUpdate }) => {
  const [type, setType] = useState(travelersDetails?.type || 'solo');
  const [rooms, setRooms] = useState(travelersDetails?.rooms || []);

  useEffect(() => {
    if (travelersDetails) {
      setType(travelersDetails.type);
      setRooms(travelersDetails.rooms);
    }
  }, [travelersDetails]);

  const handleTypeChange = (newType) => {
    let newRooms = [];
    switch (newType) {
      case 'solo':
        newRooms = [{ adults: [''] }];
        break;
      case 'couple':
        newRooms = [{ adults: ['', ''] }];
        break;
      case 'family':
      case 'friends':
        newRooms = [{ adults: [], children: [] }];
        break;
      default:
        newRooms = [];
    }
    setType(newType);
    setRooms(newRooms);
    onUpdate({ type: newType, rooms: newRooms });
  };

  const handleAddRoom = () => {
    const newRooms = [...rooms, { adults: [], children: [] }];
    setRooms(newRooms);
    onUpdate({ type, rooms: newRooms });
  };

  const handleRemoveRoom = (roomIndex) => {
    const newRooms = rooms.filter((_, index) => index !== roomIndex);
    setRooms(newRooms);
    onUpdate({ type, rooms: newRooms });
  };

  const handleAddAdult = (roomIndex) => {
    const newRooms = [...rooms];
    const room = newRooms[roomIndex];
    const totalOccupants = room.adults.length + (room.children?.length || 0);
    
    if (room.adults.length < 3 && totalOccupants < 4) {
      newRooms[roomIndex].adults.push('');
      setRooms(newRooms);
      onUpdate({ type, rooms: newRooms });
    }
  };

  const handleAddChild = (roomIndex) => {
    const newRooms = [...rooms];
    if (!newRooms[roomIndex].children) return;
    
    if (newRooms[roomIndex].children.length < 2 && 
        newRooms[roomIndex].adults.length + newRooms[roomIndex].children.length < 4) {
      newRooms[roomIndex].children.push('');
      setRooms(newRooms);
      onUpdate({ type, rooms: newRooms });
    }
  };

  const handleRemovePerson = (roomIndex, personType, personIndex) => {
    const newRooms = [...rooms];
    if (personType === 'children' && !newRooms[roomIndex].children) return;
    
    newRooms[roomIndex][personType].splice(personIndex, 1);
    setRooms(newRooms);
    onUpdate({ type, rooms: newRooms });
  };

  const handleAgeChange = (roomIndex, personType, personIndex, value) => {
    const newRooms = [...rooms];
    if (personType === 'children' && !newRooms[roomIndex].children) return;
    
    newRooms[roomIndex][personType][personIndex] = value;
    setRooms(newRooms);
    onUpdate({ type, rooms: newRooms });
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Traveler Type
        </Typography>
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { 
            xs: 'repeat(2, 1fr)', 
            sm: 'repeat(4, 1fr)' 
          },
          gap: 2 
        }}>
          {['solo', 'couple', 'family', 'friends'].map((travelType) => (
            <Button
              key={travelType}
              variant={type === travelType ? 'contained' : 'outlined'}
              onClick={() => handleTypeChange(travelType)}
              sx={{ 
                height: '48px',
                textTransform: 'capitalize'
              }}
            >
              {travelType}
            </Button>
          ))}
        </Box>
      </Box>

      {(type === 'family' || type === 'friends') && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 2
        }}>
          <Typography variant="h6">
            Rooms
          </Typography>
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={handleAddRoom}
            size="small"
          >
            Add Room
          </Button>
        </Box>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {rooms.map((room, roomIndex) => (
          <Card key={roomIndex} sx={{ p: 3 }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 2 
            }}>
              <Typography variant="h6">
                Room {roomIndex + 1}
              </Typography>
              {rooms.length > 1 && (type === 'family' || type === 'friends') && (
                <IconButton
                  onClick={() => handleRemoveRoom(roomIndex)}
                  color="error"
                  size="small"
                >
                  <RemoveIcon />
                </IconButton>
              )}
            </Box>

            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
              gap: 3
            }}>
              {/* Adults Section */}
              <Card variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  mb: 2 
                }}>
                  <Typography variant="subtitle1">Adults</Typography>
                  {(type === 'family' || type === 'friends') && 
                   room.adults.length < 3 && 
                   room.adults.length + (room.children?.length || 0) < 4 && (
                    <>
                      {/* Desktop Button */}
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        onClick={() => handleAddAdult(roomIndex)}
                        size="small"
                        sx={{ 
                          display: { xs: 'none', sm: 'inline-flex' },
                          minWidth: 'auto'
                        }}
                      >
                        Add Adult
                      </Button>
                      {/* Mobile Square Button */}
                      <IconButton
                        onClick={() => handleAddAdult(roomIndex)}
                        sx={{ 
                          display: { xs: 'flex', sm: 'none' },
                          border: '1px solid',
                          borderColor: 'primary.main',
                          borderRadius: 1,
                          p: 0.5
                        }}
                        size="small"
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {room.adults.map((age, adultIndex) => (
                    <Box key={adultIndex} sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        type="number"
                        value={age}
                        onChange={(e) => handleAgeChange(roomIndex, 'adults', adultIndex, e.target.value)}
                        placeholder="Age"
                        fullWidth
                        size="small"
                      />
                      {(type === 'family' || type === 'friends') && (
                        <IconButton
                          onClick={() => handleRemovePerson(roomIndex, 'adults', adultIndex)}
                          color="error"
                          size="small"
                        >
                          <RemoveIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))}
                </Box>
              </Card>

              {/* Children Section */}
              {(type === 'family' || type === 'friends') && room.children && (
                <Card variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    mb: 2 
                  }}>
                    <Typography variant="subtitle1">Children</Typography>
                    {room.children.length < 2 && 
                     room.adults.length + room.children.length < 4 && (
                      <>
                        {/* Desktop Button */}
                        <Button
                          startIcon={<AddIcon />}
                          variant="outlined"
                          onClick={() => handleAddChild(roomIndex)}
                          size="small"
                          sx={{ 
                            display: { xs: 'none', sm: 'inline-flex' },
                            minWidth: 'auto'
                          }}
                        >
                          Add Child
                        </Button>
                        {/* Mobile Square Button */}
                        <IconButton
                          onClick={() => handleAddChild(roomIndex)}
                          sx={{ 
                            display: { xs: 'flex', sm: 'none' },
                            border: '1px solid',
                            borderColor: 'primary.main',
                            borderRadius: 1,
                            p: 0.5
                          }}
                          size="small"
                        >
                          <AddIcon fontSize="small" />
                        </IconButton>
                      </>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {room.children.map((age, childIndex) => (
                      <Box key={childIndex} sx={{ display: 'flex', gap: 1 }}>
                        <TextField
                          type="number"
                          value={age}
                          onChange={(e) => handleAgeChange(roomIndex, 'children', childIndex, e.target.value)}
                          placeholder="Age"
                          fullWidth
                          size="small"
                        />
                        <IconButton
                          onClick={() => handleRemovePerson(roomIndex, 'children', childIndex)}
                          color="error"
                          size="small"
                        >
                          <RemoveIcon />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                </Card>
              )}
            </Box>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default ModifyTravelers;