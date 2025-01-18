import { Box, Grid, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTime } from "luxon";
import React, { useEffect, useState } from 'react';

const ModifyDates = ({ departureDates, onUpdate }) => {
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Travel Dates
        </Typography>
        <Grid container spacing={{ xs: 2, md: 3 }}>
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
                  sx: { width: '100%' }
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
                  sx: { width: '100%' }
                }
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {startDate && endDate && (
        <Box sx={{ 
          p: 2, 
          bgcolor: 'grey.100', 
          borderRadius: 1,
          width: '100%' 
        }}>
          <Typography variant="body2" color="text.secondary">
            Trip Duration: {Math.ceil(endDate.diff(startDate, 'days').days)} days
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default ModifyDates;