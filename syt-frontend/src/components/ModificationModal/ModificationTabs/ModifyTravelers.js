import {
  Add as AddIcon,
  ChildCare as ChildIcon,
  Hotel as HotelIcon,
  Person as PersonIcon,
  PersonOutline as PersonOutlineIcon,
  Remove as RemoveIcon
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
  useTheme
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';

const TravelerTypeButton = ({ type, active, onClick, icon, label, description }) => {
  const theme = useTheme();
  
  return (
    <Box
      component={motion.div}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      onClick={onClick}
      sx={{
        p: 2.5,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        borderRadius: '16px',
        backgroundColor: active 
          ? alpha(theme.palette.primary.main, 0.15) 
          : alpha(theme.palette.background.paper, 0.5),
        border: `2px solid ${active 
          ? theme.palette.primary.main 
          : alpha(theme.palette.divider, 0.1)}`,
        transition: 'all 0.2s ease',
        '&:hover': {
          backgroundColor: active 
            ? alpha(theme.palette.primary.main, 0.2) 
            : alpha(theme.palette.background.paper, 0.8),
          borderColor: alpha(theme.palette.primary.main, 0.5),
        }
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 50,
          height: 50,
          borderRadius: '50%',
          backgroundColor: alpha(theme.palette.primary.main, active ? 0.2 : 0.1),
          mb: 1.5
        }}
      >
        {icon}
      </Box>
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 600, 
          color: active 
            ? theme.palette.primary.main
            : theme.palette.text.primary,
          textTransform: 'capitalize'
        }}
      >
        {label}
      </Typography>
      <Typography 
        variant="body2" 
        sx={{ 
          color: theme.palette.text.secondary,
          mt: 0.5,
          textAlign: 'center'
        }}
      >
        {description}
      </Typography>
    </Box>
  );
};

const ModifyTravelers = ({ travelersDetails, onUpdate }) => {
  const theme = useTheme();
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
        newRooms = [{ adults: [''], children: [] }];
        break;
      default:
        newRooms = [];
    }
    setType(newType);
    setRooms(newRooms);
    onUpdate({ type: newType, rooms: newRooms });
  };

  const handleAddRoom = () => {
    const newRooms = [...rooms, { adults: [''], children: [] }];
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
    if (!newRooms[roomIndex].children) {
      newRooms[roomIndex].children = [];
    }
    
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

  const getTotalTravelers = () => {
    return rooms.reduce((total, room) => {
      const adultCount = room.adults?.length || 0;
      const childCount = room.children?.length || 0;
      return total + adultCount + childCount;
    }, 0);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: "12px",
          backgroundColor: theme.palette.mode === "dark" 
            ? alpha(theme.palette.primary.main, 0.05)
            : "rgba(251, 203, 173, 0.15)",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
          transition: "all 0.2s ease",
          mb: 4
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '12px',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <PersonIcon sx={{ color: theme.palette.primary.main }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
              Traveler Group Type
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select the option that best describes your travel group
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12} sm={6} md={3}>
            <TravelerTypeButton 
              type="solo" 
              active={type === 'solo'} 
              onClick={() => handleTypeChange('solo')}
              icon={<PersonOutlineIcon sx={{ color: theme.palette.primary.main, fontSize: 24 }} />}
              label="Solo"
              description="Traveling on your own"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TravelerTypeButton 
              type="couple" 
              active={type === 'couple'} 
              onClick={() => handleTypeChange('couple')}
              icon={
                <Box sx={{ display: 'flex' }}>
                  <PersonOutlineIcon 
                    sx={{ 
                      color: theme.palette.primary.main, 
                      fontSize: 24,
                      marginRight: -1
                    }} 
                  />
                  <PersonOutlineIcon 
                    sx={{ 
                      color: theme.palette.primary.main, 
                      fontSize: 24
                    }} 
                  />
                </Box>
              }
              label="Couple"
              description="Two adults sharing a room"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TravelerTypeButton 
              type="family" 
              active={type === 'family'} 
              onClick={() => handleTypeChange('family')}
              icon={
                <Box sx={{ position: 'relative', display: 'flex' }}>
                  <PersonOutlineIcon 
                    sx={{ 
                      color: theme.palette.primary.main, 
                      fontSize: 24 
                    }} 
                  />
                  <ChildIcon 
                    sx={{ 
                      color: theme.palette.primary.main, 
                      fontSize: 18,
                      marginLeft: -1
                    }} 
                  />
                </Box>
              }
              label="Family"
              description="Adults with children"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <TravelerTypeButton 
              type="friends" 
              active={type === 'friends'} 
              onClick={() => handleTypeChange('friends')}
              icon={
                <Box sx={{ position: 'relative', display: 'flex' }}>
                  <PersonOutlineIcon 
                    sx={{ 
                      color: theme.palette.primary.main, 
                      fontSize: 20,
                      marginRight: -0.5
                    }} 
                  />
                  <PersonOutlineIcon 
                    sx={{ 
                      color: theme.palette.primary.main, 
                      fontSize: 20,
                      marginLeft: -0.5
                    }} 
                  />
                </Box>
              }
              label="Friends"
              description="Multiple adults traveling together"
            />
          </Grid>
        </Grid>

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1,
          mt: 3,
          px: 2,
          py: 1.5,
          borderRadius: '10px',
          backgroundColor: alpha(theme.palette.background.paper, 0.6),
          border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            {type === 'solo' && "Perfect for individual travelers who want their own space."}
            {type === 'couple' && "Ideal for two adults traveling and sharing accommodations together."}
            {type === 'family' && "Great for parents traveling with children, with options for multiple rooms if needed."}
            {type === 'friends' && "Suitable for groups of adults traveling together, with flexible room arrangements."}
          </Typography>
        </Box>
      </Paper>

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        mb: 2
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              borderRadius: '12px',
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <HotelIcon sx={{ color: theme.palette.primary.main }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Room & Traveler Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: {getTotalTravelers()} travelers in {rooms.length} {rooms.length === 1 ? 'room' : 'rooms'}
            </Typography>
          </Box>
        </Box>
        
        {(type === 'family' || type === 'friends') && (
          <Button
            startIcon={<AddIcon />}
            variant="outlined"
            onClick={handleAddRoom}
            size="medium"
            sx={{
              borderRadius: '10px',
              height: 40,
              borderColor: alpha(theme.palette.primary.main, 0.5),
              color: theme.palette.primary.main,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderColor: theme.palette.primary.main,
                transform: 'translateY(-2px)',
              }
            }}
          >
            Add Room
          </Button>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <AnimatePresence>
          {rooms.map((room, roomIndex) => (
            <Paper
              component={motion.div}
              key={roomIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              elevation={0}
              sx={{
                p: 3,
                borderRadius: "12px",
                backgroundColor: theme.palette.mode === "dark" 
                  ? alpha(theme.palette.background.paper, 0.5)
                  : alpha(theme.palette.background.paper, 0.8),
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                transition: "all 0.2s ease",
                '&:hover': {
                  boxShadow: `0 4px 20px ${alpha(theme.palette.common.black, 0.03)}`,
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                mb: 2,
                pb: 2,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}>
                <Typography variant="h6" sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <HotelIcon sx={{ color: theme.palette.primary.main, fontSize: 20 }} />
                  Room {roomIndex + 1}
                </Typography>
                {rooms.length > 1 && (type === 'family' || type === 'friends') && (
                  <IconButton
                    onClick={() => handleRemoveRoom(roomIndex)}
                    sx={{
                      color: theme.palette.error.main,
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                      '&:hover': {
                        bgcolor: alpha(theme.palette.error.main, 0.2),
                      },
                      transition: 'all 0.2s ease',
                      width: 32,
                      height: 32
                    }}
                    size="small"
                  >
                    <RemoveIcon fontSize="small" />
                  </IconButton>
                )}
              </Box>

              <Grid container spacing={3}>
                {/* Adults Section */}
                <Grid item xs={12} md={6}>
                  <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                      Adults (18+)
                    </Typography>
                    {(type === 'family' || type === 'friends') && 
                     room.adults.length < 3 && 
                     room.adults.length + (room.children?.length || 0) < 4 && (
                      <Button
                        startIcon={<AddIcon />}
                        variant="outlined"
                        onClick={() => handleAddAdult(roomIndex)}
                        size="small"
                        sx={{
                          borderRadius: '8px',
                          height: 32,
                          borderColor: alpha(theme.palette.primary.main, 0.5),
                          color: theme.palette.primary.main,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                            borderColor: theme.palette.primary.main,
                          }
                        }}
                      >
                        Add Adult
                      </Button>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {room.adults.map((age, adultIndex) => (
                      <Box key={adultIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{ 
                          width: 28, 
                          height: 28, 
                          borderRadius: '50%', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                          color: theme.palette.primary.main,
                          fontWeight: 600,
                          fontSize: '0.75rem'
                        }}>
                          A{adultIndex + 1}
                        </Box>
                        <TextField
                          type="number"
                          value={age}
                          onChange={(e) => handleAgeChange(roomIndex, 'adults', adultIndex, e.target.value)}
                          placeholder="Age"
                          fullWidth
                          size="small"
                          InputProps={{
                            inputProps: { min: 18, max: 99 },
                            sx: {
                              borderRadius: '8px',
                              backgroundColor: alpha(theme.palette.background.paper, 0.5),
                              '&:hover': {
                                borderColor: theme.palette.primary.main,
                              },
                              '&.Mui-focused': {
                                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                              }
                            }
                          }}
                        />
                        {(type === 'family' || type === 'friends') && room.adults.length > 1 && (
                          <IconButton
                            onClick={() => handleRemovePerson(roomIndex, 'adults', adultIndex)}
                            sx={{
                              color: theme.palette.error.main,
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.2),
                              },
                              width: 28,
                              height: 28
                            }}
                            size="small"
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    ))}
                  </Box>
                </Grid>

                {/* Children Section */}
                {(type === 'family' || type === 'friends') && (
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Children (0-17)
                      </Typography>
                      {room.adults.length > 0 && 
                       (!room.children || room.children.length < 2) && 
                       room.adults.length + (room.children?.length || 0) < 4 && (
                        <Button
                          startIcon={<AddIcon />}
                          variant="outlined"
                          onClick={() => handleAddChild(roomIndex)}
                          size="small"
                          sx={{
                            borderRadius: '8px',
                            height: 32,
                            borderColor: alpha(theme.palette.secondary.main, 0.5),
                            color: theme.palette.secondary.main,
                            '&:hover': {
                              backgroundColor: alpha(theme.palette.secondary.main, 0.05),
                              borderColor: theme.palette.secondary.main,
                            }
                          }}
                        >
                          Add Child
                        </Button>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {room.children && room.children.map((age, childIndex) => (
                        <Box key={childIndex} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <Box sx={{ 
                            width: 28, 
                            height: 28, 
                            borderRadius: '50%', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                            color: theme.palette.secondary.main,
                            fontWeight: 600,
                            fontSize: '0.75rem'
                          }}>
                            C{childIndex + 1}
                          </Box>
                          <TextField
                            type="number"
                            value={age}
                            onChange={(e) => handleAgeChange(roomIndex, 'children', childIndex, e.target.value)}
                            placeholder="Age"
                            fullWidth
                            size="small"
                            InputProps={{
                              inputProps: { min: 0, max: 17 },
                              sx: {
                                borderRadius: '8px',
                                backgroundColor: alpha(theme.palette.background.paper, 0.5),
                                '&:hover': {
                                  borderColor: theme.palette.secondary.main,
                                },
                                '&.Mui-focused': {
                                  boxShadow: `0 0 0 2px ${alpha(theme.palette.secondary.main, 0.2)}`,
                                }
                              }
                            }}
                          />
                          <IconButton
                            onClick={() => handleRemovePerson(roomIndex, 'children', childIndex)}
                            sx={{
                              color: theme.palette.error.main,
                              bgcolor: alpha(theme.palette.error.main, 0.1),
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.2),
                              },
                              width: 28,
                              height: 28
                            }}
                            size="small"
                          >
                            <RemoveIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                      {(!room.children || room.children.length === 0) && (
                        <Box sx={{ 
                          py: 1, 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          gap: 1.5,
                          backgroundColor: alpha(theme.palette.background.paper, 0.3),
                          borderRadius: '8px',
                          border: `1px dashed ${alpha(theme.palette.divider, 0.3)}`,
                        }}>
                          <ChildIcon sx={{ color: alpha(theme.palette.text.secondary, 0.5), fontSize: 20 }} />
                          <Typography variant="body2" color="text.secondary">
                            No children added
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>

              <Box sx={{ 
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <Typography variant="body2" color="text.secondary">
                  Room capacity: {(room.adults?.length || 0) + (room.children?.length || 0)}/4 travelers
                </Typography>
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 0.5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                  borderRadius: '16px',
                  px: 1.5,
                  py: 0.5,
                  fontSize: '0.75rem',
                  fontWeight: 500
                }}>
                  <PersonIcon sx={{ fontSize: 16 }} />
                  <Typography variant="caption" fontWeight={600}>
                    {(room.adults?.length || 0) + (room.children?.length || 0)} travelers
                  </Typography>
                </Box>
              </Box>
            </Paper>
          ))}
        </AnimatePresence>
      </Box>
    </Box>
  );
};

export default ModifyTravelers;