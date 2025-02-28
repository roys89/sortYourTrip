import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BedIcon from '@mui/icons-material/Bed';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EmailIcon from '@mui/icons-material/Email';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import RoomServiceIcon from '@mui/icons-material/RoomService';
import StarIcon from '@mui/icons-material/Star';
import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Box,
    Button,
    Chip,
    Grid,
    Paper,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography
} from '@mui/material';
import { Download } from 'lucide-react';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';

const HotelVoucher = () => {
  const location = useLocation();
  const voucherData = location.state?.voucherData;
  const hotelData = voucherData?.data?.results?.hotel_itinerary?.[0];
  const [expandedSection, setExpandedSection] = useState(false);

  if (!hotelData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6" color="text.secondary">No voucher data available</Typography>
      </Box>
    );
  }

  const roomDetails = hotelData.items[0].selectedRoomsAndRates[0];
  const room = roomDetails.room;
  const rate = roomDetails.rate;
  const staticContent = hotelData.staticContent[0];

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const DetailAccordion = ({ title, content, printHide = true }) => (
    <Accordion 
      expanded={expandedSection === title}
      onChange={handleAccordionChange(title)}
      className={printHide ? 'print:hidden' : ''}
      sx={{ 
        '&:before': { display: 'none' },
        boxShadow: 'none',
        bgcolor: 'transparent',
        mb: 2
      }}
    >
      <AccordionSummary 
        expandIcon={<ExpandMoreIcon sx={{ color: 'white' }} />}
        sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          borderRadius: '4px',
          '&:hover': { bgcolor: 'primary.dark' }
        }}
      >
        <Typography variant="subtitle1">{title}</Typography>
      </AccordionSummary>
      <AccordionDetails sx={{ pt: 2, px: 3, bgcolor: '#f8f9fa', borderRadius: '0 0 4px 4px' }}>
        {content}
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Box sx={{ maxWidth: '1200px', mx: 'auto', p: 3, mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        {/* Header Section */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          mb: 4, 
          pb: 2, 
          borderBottom: '2px solid', 
          borderColor: 'primary.main' 
        }}>
          <Box>
            <Typography variant="h4" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
              Hotel Voucher
            </Typography>
            <Stack spacing={1}>
              <Typography variant="subtitle2">
                Booking Reference: {hotelData.code}
              </Typography>
              <Typography variant="subtitle2">
                Provider Reference: {voucherData.data.results.providerConfirmationNumber}
              </Typography>
              {/* <Typography variant="subtitle2">
                Total Amount: {formatCurrency(hotelData.totalAmount)}
              </Typography> */}
              <Typography variant="subtitle2">
                Trace ID: {hotelData.traceId}
              </Typography>
              <Chip 
                label={voucherData.data.results.status} 
                color="success" 
                size="small"
              />
            </Stack>
          </Box>
        </Box>

        {/* Essential Information */}
        <Paper elevation={1} sx={{ p: 3, mb: 4, bgcolor: '#f8f9fa' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <BedIcon color="primary" sx={{ mr: 1, fontSize: 28 }} />
            <Typography variant="h5" color="primary">
              {staticContent.name}
            </Typography>
          </Box>

          <Grid container spacing={4}>
            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" alignItems="flex-start" spacing={1}>
                    <LocationOnIcon color="primary" sx={{ mt: 0.5 }} />
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {staticContent.contact.address.line1}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {staticContent.contact.address.city.name}, {staticContent.contact.address.country.name}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CalendarTodayIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Stay Duration</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {formatDate(hotelData.searchRequestLog.checkIn)} - {formatDate(hotelData.searchRequestLog.checkOut)}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <AccessTimeIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Check-in/out Times</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {staticContent.checkinInfo.beginTime} / {staticContent.checkoutInfo.time}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={6}>
              <Stack spacing={3}>
                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <RoomServiceIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Board Basis</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {rate.boardBasis.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                <Box>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <StarIcon color="primary" />
                    <Box>
                      <Typography variant="body2" color="text.secondary">Category</Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {staticContent.starRating} Star Hotel • {staticContent.chainName}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>

                {staticContent.contact.phones && (
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <PhoneIcon color="primary" />
                      <Box>
                        <Typography variant="body2" color="text.secondary">Contact</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 500 }}>
                          {staticContent.contact.phones.join(', ')}
                        </Typography>
                      </Box>
                    </Stack>
                  </Box>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Paper>

        {/* Room Details */}
        <Paper elevation={1} sx={{ mb: 4 }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'white',
            borderRadius: '4px 4px 0 0'
          }}>
            <Typography variant="h6">Room Details</Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom color="primary">
              {room.name}
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Bed Configuration
                </Typography>
                {room.beds.map((bed, index) => (
                  <Chip
                    key={index}
                    icon={<BedIcon />}
                    label={`${bed.count} ${bed.type}`}
                    sx={{ mr: 1, mb: 1 }}
                  />
                ))}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Key Features
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {room.facilities.slice(0, 5).map((facility, index) => (
                    <Chip
                      key={index}
                      label={facility.name}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>

        {/* Rate Details */}
        {/* <Paper elevation={1} sx={{ mb: 4 }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'white',
            borderRadius: '4px 4px 0 0'
          }}>
            <Typography variant="h6">Rate Details</Typography>
          </Box>
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Price Breakdown</Typography>
                <Stack spacing={1} sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2">Base Rate</Typography>
                    <Typography variant="body2">{formatCurrency(rate.baseRate)}</Typography>
                  </Box>
                  {rate.taxes?.map((tax, index) => (
                    <Box key={index} display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        {tax.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(tax.amount)}
                      </Typography>
                    </Box>
                  ))}
                  <Divider />
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" fontWeight="bold">Total Rate</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {formatCurrency(rate.totalRate)}
                    </Typography>
                  </Box>
                </Stack>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>Daily Rates</Typography>
                <Stack spacing={1} sx={{ bgcolor: '#f8f9fa', p: 2, borderRadius: 1 }}>
                  {rate.dailyRates.map((dailyRate, index) => (
                    <Box key={index} display="flex" justifyContent="space-between">
                      <Typography variant="body2">{formatDate(dailyRate.date)}</Typography>
                      <Typography variant="body2">{formatCurrency(dailyRate.amount)}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Grid>
            </Grid>

            {rate.allowedCreditCards && (
              <Box mt={3}>
                <Typography variant="subtitle2" gutterBottom>Accepted Payment Methods</Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {rate.allowedCreditCards.map((card, index) => (
                    <Chip
                      key={index}
                      icon={<CreditCardIcon />}
                      label={card.code}
                      variant="outlined"
                      size="small"
                      sx={{ mb: 1 }}
                    />
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        </Paper> */}

        {/* Guest Details */}
        <Paper elevation={1} sx={{ mb: 4 }}>
          <Box sx={{ 
            p: 2, 
            bgcolor: 'primary.main', 
            color: 'white',
            borderRadius: '4px 4px 0 0'
          }}>
            <Typography variant="h6">Guest Details</Typography>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Guest Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Documents</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {room.guests.map((guest, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {guest.title} {guest.firstName} {guest.lastName}
                          </Typography>{guest.isLeadGuest && (
                            <Chip 
                              label="Lead Guest" 
                              size="small" 
                              color="primary" 
                              sx={{ mt: 1 }} 
                            />
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {guest.type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {guest.hms_guestadditionaldetail && (
                        <Stack spacing={1}>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <PhoneIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                            +{guest.hms_guestadditionaldetail.isdCode} {guest.hms_guestadditionaldetail.contactNumber}
                          </Typography>
                          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                            <EmailIcon sx={{ fontSize: 16, mr: 0.5, color: 'primary.main' }} />
                            {guest.hms_guestadditionaldetail.email}
                          </Typography>
                        </Stack>
                      )}
                    </TableCell>
                    <TableCell>
                      {guest.hms_guestadditionaldetail && (
                        <Stack spacing={1}>
                          {guest.hms_guestadditionaldetail.panCardNumber && (
                            <Typography variant="body2">
                              PAN: {guest.hms_guestadditionaldetail.panCardNumber}
                            </Typography>
                          )}
                          {guest.hms_guestadditionaldetail.passportNumber && (
                            <>
                              <Typography variant="body2">
                                Passport: {guest.hms_guestadditionaldetail.passportNumber}
                              </Typography>
                              {guest.hms_guestadditionaldetail.passportExpiry && (
                                <Typography variant="caption" color="text.secondary">
                                  Expires: {new Date(guest.hms_guestadditionaldetail.passportExpiry).toLocaleDateString()}
                                </Typography>
                              )}
                            </>
                          )}
                        </Stack>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Cancellation Policy */}
        {rate.cancellationPolicies && (
          <Paper elevation={1} sx={{ mb: 4 }}>
            <Box sx={{ 
              p: 2, 
              bgcolor: 'primary.main', 
              color: 'white',
              borderRadius: '4px 4px 0 0'
            }}>
              <Typography variant="h6">Cancellation Policy</Typography>
            </Box>
            <Box sx={{ p: 3 }}>
              {rate.cancellationPolicies.map((policy, index) => (
                policy.rules.map((rule, ruleIndex) => (
                  <Box key={`${index}-${ruleIndex}`} sx={{ mb: 2, p: 2, bgcolor: '#f8f9fa', borderRadius: 1 }}>
                    <Typography variant="body1" color="error.main" gutterBottom>
                      {rule.value}% cancellation charge
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Applicable from {new Date(rule.start).toLocaleDateString()} to {new Date(rule.end).toLocaleDateString()}
                    </Typography>
                    {rule.estimatedValue && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Estimated charge: {formatCurrency(rule.estimatedValue)}
                      </Typography>
                    )}
                  </Box>
                ))
              ))}
            </Box>
          </Paper>
        )}

        {/* Hotel Policies */}
        <DetailAccordion
          title="Hotel Policies"
          content={
            <Stack spacing={3}>
              {rate.policies.map((policy, index) => (
                <Box key={index}>
                  <Typography variant="subtitle1" color="primary.main" gutterBottom>
                    {policy.type}
                  </Typography>
                  <div dangerouslySetInnerHTML={{ __html: policy.text }} />
                </Box>
              ))}
            </Stack>
          }
        />

        {/* Hotel Description & Amenities */}
        <DetailAccordion
          title="Hotel Description & Amenities"
          content={
            <Stack spacing={3}>
              {staticContent.descriptions?.map((desc, index) => (
                <Box key={index}>
                  <Typography variant="subtitle1" color="primary.main" gutterBottom sx={{ textTransform: 'capitalize' }}>
                    {desc.type.replace(/_/g, ' ')}
                  </Typography>
                  <div dangerouslySetInnerHTML={{ __html: desc.text }} />
                </Box>
              ))}
            </Stack>
          }
        />

        {/* Nearby Attractions */}
        <DetailAccordion
          title="Nearby Attractions"
          content={
            <div dangerouslySetInnerHTML={{ __html: staticContent.descriptions.find(d => d.type === 'attractions')?.text || '' }} />
          }
        />

        {/* Additional Information */}
        <DetailAccordion
          title="Additional Information"
          content={
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="primary.main" gutterBottom>
                  Spoken Languages
                </Typography>
                <Typography variant="body2">{staticContent.spoken_languages}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="primary.main" gutterBottom>
                  Available Payment Methods
                </Typography>
                <Typography variant="body2">{staticContent.onsite_payments}</Typography>
              </Grid>
            </Grid>
          }
        />

        {/* Print Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }} className="print:hidden">
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handlePrint}
            size="large"
          >
            Download Voucher
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default HotelVoucher;