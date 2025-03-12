import { CalendarMonth, DateRange, Info } from "@mui/icons-material";
import { alpha, Box, Grid, Paper, Typography, useTheme } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTime } from "luxon";
import React, { useEffect, useState } from 'react';

const ModifyDates = ({ departureDates, onUpdate }) => {
  const theme = useTheme();
  const [startDate, setStartDate] = useState(
    departureDates?.startDate 
      ? DateTime.fromISO(departureDates.startDate) 
      : null
  );
  const [endDate, setEndDate] = useState(
    departureDates?.endDate 
      ? DateTime.fromISO(departureDates.endDate) 
      : null
  );

  useEffect(() => {
    setStartDate(
      departureDates?.startDate 
        ? DateTime.fromISO(departureDates.startDate) 
        : null
    );
    setEndDate(
      departureDates?.endDate 
        ? DateTime.fromISO(departureDates.endDate) 
        : null
    );
  }, [departureDates]);

  const handleStartDateChange = (date) => {
    setStartDate(date);
    if (date && endDate) {
      onUpdate({
        startDate: date.toISODate(),
        endDate: endDate.toISODate(),
      });
    }
  };

  const handleEndDateChange = (date) => {
    setEndDate(date);
    if (startDate && date) {
      onUpdate({
        startDate: startDate.toISODate(),
        endDate: date.toISODate(),
      });
    }
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
            <DateRange sx={{ color: theme.palette.primary.main }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5, fontWeight: 600 }}>
              Travel Dates
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Select your trip's departure and return dates
            </Typography>
          </Box>
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Departure Date"
              value={startDate}
              onChange={handleStartDateChange}
              minDate={DateTime.now()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  size: 'medium',
                  sx: { 
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                      }
                    }
                  }
                },
                day: {
                  sx: {
                    '&.Mui-selected': {
                      backgroundColor: `${theme.palette.primary.main} !important`,
                    }
                  }
                }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Return Date"
              value={endDate}
              onChange={handleEndDateChange}
              minDate={startDate || DateTime.now()}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined',
                  size: 'medium',
                  sx: { 
                    width: '100%',
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '10px',
                      backgroundColor: alpha(theme.palette.background.paper, 0.8),
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        borderColor: theme.palette.primary.main,
                      },
                      '&.Mui-focused': {
                        boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
                      }
                    }
                  }
                },
                day: {
                  sx: {
                    '&.Mui-selected': {
                      backgroundColor: `${theme.palette.primary.main} !important`,
                    }
                  }
                }
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {startDate && endDate && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: "12px",
            backgroundColor: theme.palette.mode === "dark" 
              ? alpha(theme.palette.background.paper, 0.5)
              : alpha(theme.palette.background.paper, 0.8),
            border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "flex-start",
            gap: 2
          }}
        >
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
            <CalendarMonth sx={{ color: theme.palette.primary.main }} />
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Trip Duration: {Math.ceil(endDate.diff(startDate, 'days').days)} days
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
              <Info sx={{ color: theme.palette.primary.main, fontSize: '1rem' }} />
              <Typography variant="body2" color="text.secondary">
                Your selected trip spans from {startDate.toFormat('MMMM d, yyyy')} to {endDate.toFormat('MMMM d, yyyy')}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ModifyDates;