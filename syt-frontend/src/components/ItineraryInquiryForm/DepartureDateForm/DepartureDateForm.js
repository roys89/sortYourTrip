import { Box, Grid, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { DateTime } from "luxon";
import React, { useEffect, useState } from "react";
import "./DepartureDateForm.css"; // Import specific CSS for this component

const DepartureDateForm = ({ saveDateData, initialStartDate, initialEndDate }) => {
  const [startDate, setStartDate] = useState(initialStartDate || null);
  const [endDate, setEndDate] = useState(initialEndDate || null);

  // Ensure only the date part is used
  const formatDate = (date) => (date ? DateTime.fromJSDate(date.toJSDate()).toISODate() : null);

  // Save the date data in the parent component
  useEffect(() => {
    if (startDate && endDate) {
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
      console.log("Selected Dates:", { startDate: formattedStartDate, endDate: formattedEndDate });
      saveDateData({ startDate: formattedStartDate, endDate: formattedEndDate });
    }
  }, [startDate, endDate, saveDateData]);

  return (
    <Box className="departure-date-form form-container">
      <Typography variant="h6" gutterBottom>
        Select your departure and return dates
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Departure Date"
            value={startDate}
            onChange={(newDate) => setStartDate(newDate)}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  borderRadius: "30px",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "30px",
                  },
                },
              },
            }}
          />
        </Grid>

        <Grid item xs={12} sm={6}>
          <DatePicker
            label="Return Date"
            value={endDate}
            onChange={(newDate) => setEndDate(newDate)}
            minDate={startDate || DateTime.now()}
            slotProps={{
              textField: {
                fullWidth: true,
                sx: {
                  borderRadius: "30px",
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "30px",
                  },
                },
              },
            }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default DepartureDateForm;
