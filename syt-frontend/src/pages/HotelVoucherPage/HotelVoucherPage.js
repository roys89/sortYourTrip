import AccessTimeIcon from '@mui/icons-material/AccessTime';
import BedIcon from '@mui/icons-material/Bed';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import CreditCardIcon from '@mui/icons-material/CreditCard';
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
    Divider,
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
import React, { useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const HotelVoucher = () => {
  const location = useLocation();
  // Accept data directly or from voucherData property
  const voucherData = location.state?.voucherData || location.state;
  // Get hotel itinerary data from the response
  const hotelData = voucherData?.data?.results?.hotel_itinerary?.[0];
  const [expandedSection, setExpandedSection] = useState(false);
  const voucherRef = useRef(null);

  console.log('Voucher Data:', voucherData);

  if (!hotelData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <Typography variant="h6" color="text.secondary">No voucher data available</Typography>
      </Box>
    );
  }

  // Extract all necessary data from the API response
  const item = hotelData.items[0];
  const selectedRoomsAndRates = item.selectedRoomsAndRates || [];
  const roomDetails = selectedRoomsAndRates[0];
  const room = roomDetails?.room;
  const rate = roomDetails?.rate;
  const staticContent = hotelData.staticContent?.[0];
  const guestCollectionData = voucherData?.data?.results?.guestCollectionData?.[0];
  
  console.log('Room Details:', roomDetails);
  console.log('Guest Collection Data:', guestCollectionData);

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

  const handleDownloadPDF = () => {
    const voucherElement = voucherRef.current;
    if (!voucherElement) return;
    
    // Set the scale to improve quality
    const scale = 2;
    const options = {
      scale: scale,
      useCORS: true,
      logging: true,
      scrollX: 0,
      scrollY: 0
    };

    // Temporarily hide accordions for PDF
    const accordions = voucherElement.querySelectorAll('.print-hide-for-pdf');
    accordions.forEach(acc => acc.style.display = 'none');

    html2canvas(voucherElement, options).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 0;

      pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Hotel_Voucher_${hotelData.code || 'Booking'}.pdf`);

      // Restore accordions
      accordions.forEach(acc => acc.style.display = '');
    });
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpandedSection(isExpanded ? panel : false);
  };

  const DetailAccordion = ({ title, content, printHide = true }) => (
    <Accordion 
      expanded={expandedSection === title}
      onChange={handleAccordionChange(title)}
      className={printHide ? 'print:hidden print-hide-for-pdf' : ''}
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
      <Paper elevation={3} sx={{ p: 4, mb: 4 }} ref={voucherRef}>
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
                Booking Reference: {hotelData.code || 'N/A'}
              </Typography>
              <Typography variant="subtitle2">
                Provider Reference: {voucherData?.data?.results?.providerConfirmationNumber || 'N/A'}
              </Typography>
              <Typography variant="subtitle2">
                Total Amount: {formatCurrency(hotelData.totalAmount || 0)}
              </Typography>
              <Typography variant="subtitle2">
                Trace ID: {hotelData.traceId || 'N/A'}
              </Typography>
              {voucherData?.data?.results?.status && (
                <Chip 
                  label={voucherData.data.results.status} 
                  color="success" 
                  size="small"
                />
              )}
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
                        {rate?.dailyRates?.length > 0 ? (
                          <>
                            {formatDate(rate.dailyRates[0].date)} - 
                            {formatDate(rate.dailyRates[rate.dailyRates.length - 1].date)}
                          </>
                        ) : (
                          'Check dates with hotel'
                        )}
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
                        {rate?.policies?.find(p => p.type === 'Check-in')?.text?.replace('Check-in ', '') || 'Standard check-in time'} / 
                        {rate?.policies?.find(p => p.type === 'Check-out')?.text?.replace('Check-out ', '') || 'Standard check-out time'}
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
                {room?.beds?.map((bed, index) => (
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
                  {room?.facilities?.slice(0, 5).map((facility, index) => (
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
        <Paper elevation={1} sx={{ mb: 4 }}>
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
        </Paper>

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
                {hotelData.items[0].selectedRoomsAndRates.map((roomRate, roomIndex) => (
                roomRate.room.guests.map((guest, guestIndex) => (
                  <TableRow key={`${roomIndex}-${guestIndex}`}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Box>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {guest.title} {guest.firstName} {guest.lastName}
                          </Typography>
                          {guest.isLeadGuest && (
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
                ))
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
              {staticContent?.descriptions?.map((desc, index) => (
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
            <div dangerouslySetInnerHTML={{ __html: staticContent?.descriptions?.find(d => d.type === 'attractions')?.text || 'No attraction information available' }} />
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
                <Typography variant="body2">{staticContent?.descriptions?.find(d => d.type === 'spoken_languages')?.text || 'Information not available'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" color="primary.main" gutterBottom>
                  Available Payment Methods
                </Typography>
                <Typography variant="body2">{staticContent?.descriptions?.find(d => d.type === 'onsite_payments')?.text || 'Information not available'}</Typography>
              </Grid>
            </Grid>
          }
        />

        {/* Print and Download Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }} className="print:hidden print-hide-for-pdf">
          <Button
            variant="outlined"
            onClick={handlePrint}
            size="large"
          >
            Print Voucher
          </Button>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={handleDownloadPDF}
            size="large"
          >
            Download PDF
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default HotelVoucher;