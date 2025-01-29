// ReviewBookingModal.js
import {
    Alert,
    Box,
    Button,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Grid,
    Typography
} from '@mui/material';
import { Hotel, UserCheck, X } from 'lucide-react';
import React from 'react';

// Traveler Information Component
const TravelerInfo = ({ traveler }) => (
  <Box className="p-4 bg-gray-50 rounded mb-4">
    <Grid container spacing={3}>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle1" gutterBottom>Personal Details</Typography>
        <Typography>Name: {traveler.title} {traveler.firstName} {traveler.lastName}</Typography>
        <Typography>Gender: {traveler.gender}</Typography>
        <Typography>Date of Birth: {traveler.dateOfBirth}</Typography>
        <Typography>Type: {traveler.type}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle1" gutterBottom>Contact Details</Typography>
        <Typography>Email: {traveler.email}</Typography>
        <Typography>Phone: +{traveler.cellCountryCode} {traveler.phone}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle1" gutterBottom>Document Details</Typography>
        <Typography>Passport: {traveler.passportNumber}</Typography>
        <Typography>Issue Date: {traveler.passportIssueDate}</Typography>
        <Typography>Expiry Date: {traveler.passportExpiryDate}</Typography>
        <Typography>PAN: {traveler.panNumber}</Typography>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Typography variant="subtitle1" gutterBottom>Address</Typography>
        <Typography>{traveler.addressLineOne}</Typography>
        {traveler.addressLineTwo && <Typography>{traveler.addressLineTwo}</Typography>}
        <Typography>{traveler.city}, {traveler.country}</Typography>
      </Grid>
      {traveler.gstNumber && (
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom>GST Details</Typography>
          <Typography>GST Number: {traveler.gstNumber}</Typography>
          <Typography>Company: {traveler.gstCompanyName}</Typography>
          <Typography>Company Address: {traveler.gstCompanyAddress}</Typography>
        </Grid>
      )}
    </Grid>
  </Box>
);

// Room Information Component
const RoomInfo = ({ room }) => (
  <Box sx={{ mb: 4 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <Hotel size={24} sx={{ mr: 1 }} />
      <Typography variant="h6">Room {room.roomNumber}</Typography>
    </Box>
    {room.travelers.map((traveler, idx) => (
      <TravelerInfo key={idx} traveler={traveler} />
    ))}
  </Box>
);

// Main Review Booking Modal Component
const ReviewBookingModal = ({ 
  open, 
  onClose, 
  onConfirm,
  formData,
  isProcessing = false,
  error = null
}) => {
  return (
    <Dialog 
      open={open} 
      onClose={!isProcessing ? onClose : undefined}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <UserCheck size={24} />
            <Typography variant="h6">Review Your Booking Details</Typography>
          </Box>
          {!isProcessing && (
            <Button
              onClick={onClose}
              sx={{ minWidth: 'auto', p: 1 }}
            >
              <X size={20} />
            </Button>
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {isProcessing && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={20} />
              <Typography>
                Processing your booking...
              </Typography>
            </Box>
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          {formData.rooms.map((room, index) => (
            <RoomInfo key={index} room={room} />
          ))}
        </Box>

        {formData.specialRequirements && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Special Requirements
            </Typography>
            <Typography sx={{ p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              {formData.specialRequirements}
            </Typography>
          </Box>
        )}

        <Divider sx={{ my: 3 }} />

        <DialogActions>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={onConfirm}
            disabled={isProcessing}
            startIcon={isProcessing && <CircularProgress size={20} />}
          >
            {isProcessing ? 'Processing...' : 'Confirm & Continue'}
          </Button>
        </DialogActions>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewBookingModal;