import { Button, Card, CardContent, CircularProgress, Typography } from '@mui/material';
import React, { useState } from 'react';

const HotelDetailModal = ({ 
    hotel, 
    onClose, 
    onAddHotel, 
    isLoading,
    itineraryToken, 
    inquiryToken,
    city, 
    date,
    existingHotelPrice 
  }) => {
  const [selectedRate, setSelectedRate] = useState(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [priceComparison, setPriceComparison] = useState(null);
  const [imageError, setImageError] = useState(false);

  if (!hotel) return null;

  const imageUrl = hotel.images?.url || '/api/placeholder/400/300';

  const handleRateSelect = (rate) => {
    setSelectedRate(rate);
  };

  const handlePriceCheck = async () => {
    if (!selectedRate) return;
  
    try {
      // Use the passed existingHotelPrice instead of making an API call
      if (existingHotelPrice) {
        const newPrice = selectedRate.price;
        const priceDifference = newPrice - existingHotelPrice;
        const percentageChange = ((priceDifference) / existingHotelPrice) * 100;
  
        setPriceComparison({
          existingPrice: existingHotelPrice,
          newPrice,
          priceDifference,
          percentageChange,
          currency: selectedRate.currency,
          rateChanged: selectedRate.price !== hotel.rate?.price
        });
      }
  
      setConfirmationOpen(true);
    } catch (error) {
      console.error('Error calculating price comparison:', error);
      setConfirmationOpen(true);
    }
  };

  const handleConfirm = () => {
    setConfirmationOpen(false);
    onAddHotel({
      ...hotel,
      selectedRate: {
        ...selectedRate,
        price: priceComparison?.newPrice || selectedRate.price  // Ensure we use the latest price
      },
      price_difference: priceComparison?.priceDifference || 0,  // Pass the calculated price difference
      searchId: hotel.search_id
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white z-10 p-4 border-b">
          <div className="flex justify-between items-center">
            <Typography variant="h5">{hotel.name}</Typography>
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Hotel Images and Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <img
                src={imageUrl}
                alt={hotel.name}
                className="w-full h-64 object-cover rounded"
                onError={(e) => {
                  setImageError(true);
                  e.target.src = '/api/placeholder/400/300';
                }}
              />
            </div>
            <div>
              <Typography variant="h6" gutterBottom>{hotel.name}</Typography>
              <div className="flex items-center mb-2">
                {[...Array(parseInt(hotel.category?.toString() || '0', 10))].map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
              </div>
              <Typography variant="body2" color="text.secondary" paragraph>
                {hotel.address}
              </Typography>
              <Typography variant="body2" paragraph>
                {hotel.description?.replace(/<[^>]*>/g, ' ')}
              </Typography>
            </div>
          </div>

          {/* Facilities */}
          {hotel.facilities && (
            <div>
              <Typography variant="h6" gutterBottom>Facilities</Typography>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {hotel.facilities.split(';').map((facility, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="text-blue-500">•</span>
                    <Typography variant="body2">{facility.trim()}</Typography>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Rates */}
          <div>
            <Typography variant="h6" gutterBottom>Available Room Types</Typography>
            <div className="space-y-4">
              {hotel.rates?.map((rate) => (
                <Card 
                  key={rate.rate_key}
                  onClick={() => handleRateSelect(rate)}
                  className={`cursor-pointer transition-all ${
                    selectedRate?.rate_key === rate.rate_key 
                      ? 'border-2 border-blue-500' 
                      : 'border hover:border-blue-200'
                  }`}
                >
                  <CardContent>
                    <div className="space-y-4">
                      {/* Rate Header */}
                      <div className="flex justify-between items-start">
                        <div>
                          <Typography variant="h6">
                            {rate.rooms[0].room_type}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Board: {rate.boarding_details?.join(', ')}
                          </Typography>
                        </div>
                        <Typography variant="h6" color="primary">
                          {rate.currency} {rate.price.toLocaleString()}
                        </Typography>
                      </div>

                      {/* Room Details */}
                      <div className="flex flex-wrap gap-4">
                        {rate.rooms.map((room, roomIndex) => (
                          <div key={roomIndex} className="bg-gray-50 p-3 rounded flex-1">
                            <Typography variant="subtitle2">Room {roomIndex + 1}</Typography>
                            <div className="mt-2 space-y-1">
                              <Typography variant="body2">
                                Adults: {room.no_of_adults}
                                {room.no_of_children > 0 && ` • Children: ${room.no_of_children}`}
                                {` • ${room.room_type}`}
                              </Typography>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Cancellation Policy */}
                      <div className="text-sm bg-gray-50 p-3 rounded">
                        <Typography variant="subtitle2" gutterBottom>
                          Cancellation Policy
                        </Typography>
                        {rate.non_refundable ? (
                          <Typography variant="body2" color="error">
                            Non-refundable
                          </Typography>
                        ) : (
                          <div className="space-y-1">
                            <Typography variant="body2" color="success.main">
                              Free cancellation until: {new Date(rate.cancellation_policy?.cancel_by_date).toLocaleDateString()}
                            </Typography>
                            {rate.cancellation_policy?.details?.[0] && (
                              <Typography variant="body2">
                                After that: {rate.cancellation_policy.details[0].currency} {rate.cancellation_policy.details[0].flat_fee} charge
                              </Typography>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Additional Information */}
                      <div className="text-sm">
                        {rate.rate_comments?.remarks && (
                          <Typography variant="body2" color="text.secondary">
                            {rate.rate_comments.remarks.replace(/<[^>]*>/g, ' ')}
                          </Typography>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Price Comparison Dialog */}
          {confirmationOpen && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full m-4">
                <h3 className="text-lg font-bold mb-4">Confirm Hotel Change</h3>
                
                {priceComparison ? (
                  <div className="space-y-3 mb-6">
                    <p>Current Hotel Price: {priceComparison.currency} {priceComparison.existingPrice.toLocaleString()}</p>
                    <p>New Hotel Price: {priceComparison.currency} {priceComparison.newPrice.toLocaleString()}</p>
                    <p className={`font-bold ${priceComparison.priceDifference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      Price {priceComparison.priceDifference > 0 ? 'Increase' : 'Decrease'}: {priceComparison.currency} {Math.abs(priceComparison.priceDifference).toLocaleString()} 
                      ({priceComparison.percentageChange.toFixed(1)}%)
                    </p>
                  </div>
                ) : (
                  <p className="mb-6">Would you like to proceed with changing the hotel?</p>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setConfirmationOpen(false)}
                    className="px-4 py-2 text-gray-600 border rounded hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Confirm Change
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-6 flex justify-end space-x-4">
            <Button 
              variant="outlined" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handlePriceCheck}
              disabled={isLoading || !selectedRate}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Select Room'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelDetailModal;