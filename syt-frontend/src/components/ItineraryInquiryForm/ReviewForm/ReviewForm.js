import {
  DirectionsBoat as BoatIcon,
  AttachMoney as BudgetIcon,
  CalendarMonth as CalendarIcon,
  LocationCity as CityIcon,
  Flight as FlightIcon,
  Public as GlobalIcon,
  Person as PersonIcon,
  Interests as PreferencesIcon,
  DirectionsBus as TransportIcon
} from "@mui/icons-material";
import {
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  Paper,
  Typography,
  useTheme
} from "@mui/material";
import { DateTime } from "luxon";
import React from "react";

const ReviewForm = ({ itineraryData }) => {
  const theme = useTheme();
  const {
    selectedCities,
    departureCity,
    departureDates,
    travelersDetails,
    preferences,
    includeInternational,
    includeGroundTransfer,
    includeFerryTransport,
  } = itineraryData;

  // Brand accent color
  const accentColor = '#fbcbad';

  const formatDate = (date) => {
    return DateTime.fromISO(date).toLocaleString(DateTime.DATE_MED);
  };

  const truncateCountry = (country) => {
    if (!country) return "";
    return country.split(" ")[0] + (country.split(" ").length > 1 ? "..." : "");
  };

  const IconWrapper = ({ icon: Icon, color = theme.palette.primary.main }) => (
    <Box 
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 50,
        height: 50,
        borderRadius: '16px',
        backgroundColor: alpha(color, 0.15),
        mr: 2,
        transition: 'transform 0.3s ease',
        '&:hover': {
          transform: 'scale(1.1)'
        }
      }}
    >
      <Icon 
        sx={{ 
          color: color,
          fontSize: 28 
        }} 
      />
    </Box>
  );

  const SectionHeader = ({ icon, title, color = theme.palette.primary.main }) => (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      mb: 3,
      position: 'relative',
      '&::after': {
        content: '""',
        position: 'absolute',
        bottom: -8,
        left: 0,
        width: '100%',
        height: '1px',
        background: `linear-gradient(to right, ${alpha(color, 0.4)}, transparent)`,
        borderRadius: '2px'
      }
    }}>
      <IconWrapper icon={icon} color={color} />
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 700,
          color: theme.palette.text.primary,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: -4,
            left: 0,
            width: '40%',
            height: '3px',
            backgroundColor: color,
            borderRadius: '2px'
          }
        }}
      >
        {title}
      </Typography>
    </Box>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ 
        mb: 5, 
        textAlign: 'center',
        position: 'relative',
        pb: 3
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            fontWeight: 800,
            color: theme.palette.text.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            mb: 1
          }}
        >
          <GlobalIcon sx={{ fontSize: 42, color: theme.palette.primary.main }} />
          Your Travel Overview
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ 
            color: theme.palette.text.secondary,
            maxWidth: '700px',
            mx: 'auto'
          }}
        >
          Review your travel details and preferences before finalizing your itinerary
        </Typography>
        <Box 
          sx={{ 
            position: 'absolute', 
            bottom: 0, 
            left: '50%', 
            transform: 'translateX(-50%)', 
            width: '120px', 
            height: '4px', 
            borderRadius: '2px',
            backgroundColor: theme.palette.primary.main,
            opacity: 0.7
          }}
        />
      </Box>

      <Grid container spacing={5}>
        {/* Destinations Section */}
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '24px',
              background: alpha(theme.palette.primary.main, 0.03),
              mb: 2
            }}
          >
            <SectionHeader icon={CityIcon} title="Selected Destinations" />
            
            <Box sx={{
              display: 'flex',
              overflowX: 'auto',
              gap: 3,
              pb: 2,
              pt: 1,
              '&::-webkit-scrollbar': { 
                height: 10,
                backgroundColor: 'transparent'
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.primary.main, 0.4),
                borderRadius: 20
              },
              scrollbarWidth: 'thin',
              scrollBehavior: 'smooth',
              px: 1
            }}>
              {selectedCities.length > 0 ? (
                selectedCities.map((city, index) => (
                  <Card
                    key={index}
                    elevation={0}
                    sx={{ 
                      minWidth: 320,
                      maxWidth: 320,
                      flexShrink: 0,
                      borderRadius: 6,
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      background: 'transparent',
                      position: 'relative',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: `0 20px 30px ${alpha(theme.palette.common.black, 0.07)}`
                      },
                      '&:hover .city-overlay': {
                        opacity: 0.75
                      }
                    }}
                  >
                    <Box 
                      component="div"
                      className="city-overlay"
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '100%',
                        background: `linear-gradient(to top, ${theme.palette.common.black}, transparent)`,
                        opacity: 0.6,
                        transition: 'opacity 0.3s ease',
                        zIndex: 1
                      }}
                    />
                    <Box 
                      component="img"
                      src={city.imageUrl || "/default-city-image.jpg"}
                      alt={city.name}
                      sx={{
                        width: '100%',
                        height: 220,
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                        '&:hover': {
                          transform: 'scale(1.05)'
                        }
                      }}
                    />
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        bottom: 0, 
                        left: 0, 
                        right: 0,
                        p: 2.5,
                        zIndex: 2
                      }}
                    >
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700,
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                        mb: 0.5
                      }}>
                        {city.name}
                      </Typography>
                      {city.country && (
                        <Chip 
                          label={city.country}
                          size="small"
                          sx={{
                            backgroundColor: alpha(accentColor, 0.7),
                            color: theme.palette.text.primary,
                            fontWeight: 500,
                            backdropFilter: 'blur(4px)'
                          }}
                        />
                      )}
                    </Box>
                  </Card>
                ))
              ) : (
                <Typography 
                  variant="body1" 
                  sx={{ 
                    textAlign: 'center', 
                    width: '100%',
                    color: theme.palette.text.secondary,
                    py: 4
                  }}
                >
                  No cities selected.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Travel Details Section */}
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '24px',
              background: alpha(theme.palette.secondary.main, 0.03)
            }}
          >
            <SectionHeader icon={FlightIcon} title="Travel Details" color={theme.palette.secondary.main} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card 
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    p: 1,
                    backgroundColor: 'transparent',
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 8px 20px ${alpha(theme.palette.primary.main, 0.15)}`,
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start', 
                    height: '100%',
                    p: 2
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2 
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                        mr: 1.5
                      }}>
                        <FlightIcon fontSize="small" sx={{ color: theme.palette.primary.main }} />
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: theme.palette.text.primary 
                        }}
                      >
                        Departure City
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      mt: 1, 
                      width: '100%', 
                      p: 1.5, 
                      borderRadius: 3, 
                      backgroundColor: alpha(theme.palette.primary.main, 0.05) 
                    }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500, 
                          color: alpha(theme.palette.text.primary, 0.9)
                        }}
                      >
                        {departureCity 
                          ? `${departureCity.city} - ${departureCity.name} (${departureCity.iata})` 
                          : "Not specified"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    p: 1,
                    backgroundColor: 'transparent',
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 8px 20px ${alpha(theme.palette.secondary.main, 0.15)}`,
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start', 
                    height: '100%',
                    p: 2
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2 
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(theme.palette.secondary.main, 0.15),
                        mr: 1.5
                      }}>
                        <CalendarIcon fontSize="small" sx={{ color: theme.palette.secondary.main }} />
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: theme.palette.text.primary 
                        }}
                      >
                        Departure Date
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      mt: 1, 
                      width: '100%', 
                      p: 1.5, 
                      borderRadius: 3, 
                      backgroundColor: alpha(theme.palette.secondary.main, 0.05) 
                    }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500, 
                          color: alpha(theme.palette.text.primary, 0.9)
                        }}
                      >
                        {departureDates.startDate 
                          ? formatDate(departureDates.startDate) 
                          : "Not selected"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    p: 1,
                    backgroundColor: 'transparent',
                    border: `1px solid ${alpha(accentColor, 0.3)}`,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: `0 8px 20px ${alpha(accentColor, 0.15)}`,
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-start', 
                    height: '100%',
                    p: 2
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      mb: 2 
                    }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(accentColor, 0.15),
                        mr: 1.5
                      }}>
                        <CalendarIcon fontSize="small" sx={{ color: theme.palette.text.primary }} />
                      </Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontSize: '1.1rem',
                          fontWeight: 600,
                          color: theme.palette.text.primary 
                        }}
                      >
                        Return Date
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      mt: 1, 
                      width: '100%', 
                      p: 1.5, 
                      borderRadius: 3, 
                      backgroundColor: alpha(accentColor, 0.05) 
                    }}>
                      <Typography 
                        variant="body1" 
                        sx={{ 
                          fontWeight: 500, 
                          color: alpha(theme.palette.text.primary, 0.9)
                        }}
                      >
                        {departureDates.endDate 
                          ? formatDate(departureDates.endDate) 
                          : "Not selected"}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Traveler Details */}
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '24px',
              background: alpha(theme.palette.primary.light, 0.03)
            }}
          >
            <SectionHeader icon={PersonIcon} title="Traveler Information" color={theme.palette.primary.main} />
            
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Chip 
                label={`${travelersDetails.type.charAt(0).toUpperCase() + travelersDetails.type.slice(1)} Travel`} 
                color="primary" 
                variant="outlined"
                sx={{ fontWeight: 600, px: 2, py: 2.5, fontSize: '1rem' }}
              />
            </Box>
            
            {(travelersDetails.type === "solo" || 
              travelersDetails.type === "couple" || 
              travelersDetails.type === "family" ||
              travelersDetails.type === "friends") && (
              <Box sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 3,
                justifyContent: 'center'
              }}>
                {travelersDetails.rooms.map((room, index) => (
                  <Card
                    key={index}
                    elevation={0}
                    sx={{
                      width: {xs: '100%', sm: 'calc(50% - 16px)', md: 'calc(33.33% - 16px)'},
                      borderRadius: '16px',
                      transition: 'all 0.3s ease',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                      overflow: 'visible',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-6px)',
                        boxShadow: `0 12px 28px ${alpha(theme.palette.common.black, 0.08)}`
                      },
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: -8,
                        left: 20,
                        width: 60,
                        height: 24,
                        borderRadius: '12px',
                        backgroundColor: theme.palette.primary.main,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2
                      },
                      '&::after': {
                        content: `"Room ${index + 1}"`,
                        position: 'absolute',
                        top: -8,
                        left: 20,
                        width: 60,
                        height: 24,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        zIndex: 3
                      }
                    }}
                  >
                    <CardContent sx={{ textAlign: 'left', p: 3 }}>
                      <Box sx={{ mt: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ 
                          color: theme.palette.text.secondary,
                          mb: 1
                        }}>
                          Adults
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {room.adults.map((adult, i) => (
                            <Chip 
                              key={i}
                              label={adult}
                              size="small"
                              sx={{
                                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                                color: theme.palette.primary.main,
                                fontWeight: 500
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                      
                      {room.children.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ 
                            color: theme.palette.text.secondary,
                            mb: 1
                          }}>
                            Children
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {room.children.map((child, i) => (
                              <Chip 
                                key={i}
                                label={child}
                                size="small"
                                sx={{
                                  backgroundColor: alpha(accentColor, 0.2),
                                  color: theme.palette.text.primary,
                                  fontWeight: 500
                                }}
                              />
                            ))}
                          </Box>
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Preferences and Budget */}
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '24px',
              height: '100%',
              background: alpha(theme.palette.secondary.main, 0.03)
            }}
          >
            <SectionHeader icon={PreferencesIcon} title="Travel Preferences" color={theme.palette.secondary.main} />
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
              {preferences.selectedInterests.length > 0 ? (
                preferences.selectedInterests.map((interest, index) => (
                  <Chip 
                    key={index}
                    label={interest}
                    sx={{
                      backgroundColor: alpha(theme.palette.secondary.main, 0.08),
                      color: theme.palette.secondary.main,
                      fontWeight: 500,
                      px: 1,
                      borderRadius: '8px',
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.secondary.main, 0.15),
                        transform: 'scale(1.05)'
                      },
                      transition: 'all 0.2s ease'
                    }}
                  />
                ))
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No specific preferences selected
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '24px',
              height: '100%',
              background: alpha(accentColor, 0.1)
            }}
          >
            <SectionHeader icon={BudgetIcon} title="Budget" color={theme.palette.text.primary} />
            
            <Box 
              sx={{ 
                mt: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center' 
              }}
            >
              <Card 
                elevation={0}
                sx={{ 
                  borderRadius: 4,
                  py: 3,
                  px: 4,
                  backgroundColor: alpha(accentColor, 0.2),
                  border: `1px dashed ${alpha(theme.palette.primary.main, 0.3)}`
                }}
              >
                <Typography 
                  variant="h5" 
                  sx={{ 
                    fontWeight: 700,
                    color: theme.palette.text.primary,
                    textAlign: 'center'
                  }}
                >
                  {preferences.budget || "Budget not specified"}
                </Typography>
              </Card>
            </Box>
          </Paper>
        </Grid>

        {/* Transport Options */}
        <Grid item xs={12}>
          <Paper 
            elevation={0} 
            sx={{ 
              p: 3, 
              borderRadius: '24px',
              background: alpha(theme.palette.primary.main, 0.03)
            }}
          >
            <SectionHeader icon={TransportIcon} title="Transportation Options" color={theme.palette.primary.main} />
            
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Card 
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    backgroundColor: 'transparent',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: `0 10px 25px ${alpha(theme.palette.primary.main, 0.15)}`,
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      height: 6, 
                      width: '100%', 
                      backgroundColor: theme.palette.primary.main 
                    }}
                  />
                  <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 3,
                    pb: 3
                  }}>
                    <Box 
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                        mb: 2
                      }}
                    >
                      <GlobalIcon fontSize="medium" sx={{ color: theme.palette.primary.main }} />
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 1.5
                      }}
                    >
                      International Flights
                    </Typography>
                    <Chip 
                      label={includeInternational ? "Included" : "Not Included"}
                      color="primary"
                      variant={includeInternational ? "filled" : "outlined"}
                      sx={{ 
                        fontWeight: 600,
                        px: 1
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                    backgroundColor: 'transparent',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: `0 10px 25px ${alpha(theme.palette.secondary.main, 0.15)}`,
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      height: 6, 
                      width: '100%', 
                      backgroundColor: theme.palette.secondary.main 
                    }}
                  />
                  <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 3,
                    pb: 3
                  }}>
                    <Box 
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(theme.palette.secondary.main, 0.12),
                        mb: 2
                      }}
                    >
                      <TransportIcon fontSize="medium" sx={{ color: theme.palette.secondary.main }} />
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 1.5
                      }}
                    >
                      Ground Transfers
                    </Typography>
                    <Chip 
                      label={includeGroundTransfer ? "Included" : "Not Included"}
                      color="secondary"
                      variant={includeGroundTransfer ? "filled" : "outlined"}
                      sx={{ 
                        fontWeight: 600,
                        px: 1
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    border: `1px solid ${alpha(accentColor, 0.4)}`,
                    backgroundColor: 'transparent',
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    '&:hover': {
                      boxShadow: `0 10px 25px ${alpha(accentColor, 0.2)}`,
                      transform: 'translateY(-5px)'
                    }
                  }}
                >
                  <Box 
                    sx={{ 
                      height: 6, 
                      width: '100%', 
                      backgroundColor: accentColor
                    }}
                  />
                  <CardContent sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    p: 3,
                    pb: 3
                  }}>
                    <Box 
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: alpha(accentColor, 0.12),
                        mb: 2
                      }}
                    >
                      <BoatIcon fontSize="medium" sx={{ color: theme.palette.text.primary }} />
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                        mb: 1.5
                      }}
                    >
                      Ferry Transport
                    </Typography>
                    <Chip 
                      label={includeFerryTransport ? "Included" : "Not Included"}
                      sx={{ 
                        fontWeight: 600,
                        px: 1,
                        backgroundColor: includeFerryTransport ? alpha(accentColor, 0.7) : 'transparent',
                        color: includeFerryTransport ? theme.palette.text.primary : theme.palette.text.secondary,
                        border: `1px solid ${includeFerryTransport ? 'transparent' : alpha(accentColor, 0.4)}`
                      }}
                    />
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReviewForm;