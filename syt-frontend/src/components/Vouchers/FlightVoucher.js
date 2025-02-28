import { Download, X } from 'lucide-react';
import React, { useMemo } from 'react';

const FlightVoucher = ({ 
  isOpen, 
  onClose, 
  voucherData, 
  fullItem,
  bookingData 
}) => {
  // Memoize processed data
  const processedData = useMemo(() => {
    // Combine voucher data and flight data
    const voucherDetails = voucherData?.results?.details?.[0] || {};
    const flightData = fullItem?.flightData || {};

    return {
      // Booking details directly from voucher response
      bookingId: voucherDetails.bmsBookingCode || bookingData?.bookingId || 'N/A',
      pnr: voucherDetails.pnr || 'N/A',
      issuedDate: new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      
      // Flight details
      flight: `${flightData.flightProvider} ${flightData.flightCode}`,
      status: voucherDetails.bookingStatus || flightData.bookingStatus || 'pending',
      route: `${flightData.originAirport?.name || 'N/A'} (${flightData.originAirport?.code || 'N/A'}) → ${flightData.arrivalAirport?.name || 'N/A'} (${flightData.arrivalAirport?.code || 'N/A'})`,
      departure: `${flightData.departureDate} at ${flightData.departureTime}`,
      arrival: `${new Date(flightData.landingTime).toLocaleDateString()} at ${flightData.arrivalTime}`,
      
      // Passengers
      passengers: bookingData?.rooms?.[0]?.travelers?.map(traveler => 
        `${traveler.title} ${traveler.firstName} ${traveler.lastName}` 
      ) || ['Passenger 1'],
      
      // Baggage
      baggage: `Checked: ${flightData.selectedBaggage?.[0]?.options?.[0]?.description || '0 Kg'} | Cabin: ${flightData.segments?.[0]?.cabinBaggage || '7 Kg'}`,
      
      // Meal
      meal: flightData.selectedMeal?.[0]?.options?.[0]?.description || 'No meal selected',
      
      // Fare Details
      fareDetails: {
        baseFare: `INR ${flightData.fareDetails?.baseFare || 'N/A'}`,
        taxAndSurcharge: `INR ${flightData.fareDetails?.taxAndSurcharge || 'N/A'}`,
        totalFare: `INR ${flightData.fareDetails?.finalFare || 'N/A'}`,
        isRefundable: flightData.fareDetails?.isRefundable ? 'No' : 'Yes'
      },
      
      // Fare Rules
      fareRules: flightData.fareRules || 'No specific fare rules available'
    };
  }, [voucherData, fullItem, bookingData]);

  // Early return if not open
  if (!isOpen) return null;

  // Download handler
  const handleDownload = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Flight Voucher</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; }
            .voucher-container { max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; }
          </style>
        </head>
        <body>
          <div class="voucher-container">
            <h1>Flight Voucher</h1>
            <!-- Download content -->
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Flight Voucher</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Voucher Body */}
        <div className="p-6 space-y-6">
          {/* Booking Details */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Booking ID</span>
                <span className="font-bold">{processedData.bookingId}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">PNR</span>
                <span className="font-bold">{processedData.pnr}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Issued Date</span>
                <span className="font-bold">{processedData.issuedDate}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Flight</span>
                <span className="font-bold">{processedData.flight}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status</span>
                <span className="font-bold text-green-600">{processedData.status}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Route</span>
                <span className="font-bold">{processedData.route}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Departure</span>
                <span className="font-bold">{processedData.departure}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Arrival</span>
                <span className="font-bold">{processedData.arrival}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <span className="text-gray-600">Passengers</span>
                <div className="font-bold">
                  {processedData.passengers.map((passenger, index) => (
                    <div key={index}>{passenger}</div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Baggage</span>
                <span className="font-bold">{processedData.baggage}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Meal</span>
                <span className="font-bold">{processedData.meal}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-gray-600">Fare Details</div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span>Base Fare</span>
                  <span className="font-bold">{processedData.fareDetails.baseFare}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Tax and Surcharge</span>
                  <span className="font-bold">{processedData.fareDetails.taxAndSurcharge}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Total Fare</span>
                  <span className="font-bold">{processedData.fareDetails.totalFare}</span>
                </div>
                <div className="flex justify-between">
                  <span>Refundable</span>
                  <span className="font-bold">{processedData.fareDetails.isRefundable}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-gray-600">Fare Rules</div>
              <div className="bg-gray-50 p-4 rounded-lg text-xs">
                <div dangerouslySetInnerHTML={{ __html: processedData.fareRules }} />
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t flex justify-end">
          <button
            onClick={handleDownload}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={20} />
            <span>Download Voucher</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlightVoucher;