// utils/pdfGenerator.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateItineraryPDF = (itinerary) => {
  // Create PDF document
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Add fonts
  doc.setFont("helvetica");

  // Helper function for text wrapping
  const splitTextToSize = (text, maxWidth) => {
    return doc.splitTextToSize(text, maxWidth);
  };

  // Helper function to check page space and add new page if needed
  const checkAndAddPage = (requiredSpace) => {
    const pageHeight = doc.internal.pageSize.height;
    if (currentY + requiredSpace > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
      return true;
    }
    return false;
  };

  let currentY = 20;

  // Main Title
  doc.setFontSize(24);
  doc.setTextColor(0, 0, 139); // Dark blue
  doc.text('Your Itinerary', doc.internal.pageSize.width / 2, currentY, { align: 'center' });
  currentY += 15;

  // Process each city
  itinerary.cities.forEach((city, cityIndex) => {
    // City Header
    doc.setFillColor(240, 240, 240);
    doc.rect(10, currentY - 5, doc.internal.pageSize.width - 20, 15, 'F');
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(`${city.city}, ${city.country}`, 15, currentY + 5);
    currentY += 20;

    // Date Range
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    const dateRange = `${new Date(city.startDate).toLocaleDateString()} - ${new Date(city.endDate).toLocaleDateString()}`;
    doc.text(dateRange, 15, currentY);
    currentY += 10;

    // Process each day
    city.days.forEach((day, dayIndex) => {
      checkAndAddPage(40);

      // Day Header
      doc.setFontSize(14);
      doc.setTextColor(70, 130, 180); // Steel blue
      const dayDate = new Date(day.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      doc.text(dayDate, 15, currentY);
      currentY += 10;

      // Flights Section
      if (day.flights && day.flights.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('✈️ Flights:', 20, currentY);
        currentY += 7;

        day.flights.forEach(flight => {
          checkAndAddPage(25);
          const flightData = flight.flightData;
          
          // Flight details in a box
          doc.setFillColor(248, 248, 255);
          doc.rect(25, currentY - 4, doc.internal.pageSize.width - 50, 20, 'F');
          
          doc.setFontSize(11);
          doc.text(`${flightData.origin} → ${flightData.destination}`, 30, currentY);
          doc.text(`${flightData.airline} - ${flightData.flightCode}`, 30, currentY + 5);
          doc.text(`Departure: ${flightData.departureTime} | Arrival: ${flightData.arrivalTime}`, 30, currentY + 10);
          
          currentY += 25;
        });
      }

      // Hotels Section
      if (day.hotels && day.hotels.length > 0) {
        checkAndAddPage(20);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('🏨 Hotels:', 20, currentY);
        currentY += 7;

        day.hotels.forEach(hotel => {
          checkAndAddPage(20);
          
          // Hotel details in a box
          doc.setFillColor(248, 248, 255);
          doc.rect(25, currentY - 4, doc.internal.pageSize.width - 50, 15, 'F');
          
          doc.setFontSize(11);
          doc.text(`${hotel.name} - ${hotel.category}★`, 30, currentY);
          const address = splitTextToSize(hotel.address, doc.internal.pageSize.width - 65);
          doc.text(address, 30, currentY + 5);
          
          currentY += 20;
        });
      }

      // Activities Section
      if (day.activities && day.activities.length > 0) {
        checkAndAddPage(20);
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('🎯 Activities:', 20, currentY);
        currentY += 7;

        day.activities.forEach(activity => {
          checkAndAddPage(15);
          
          // Activity details in a box
          doc.setFillColor(248, 248, 255);
          doc.rect(25, currentY - 4, doc.internal.pageSize.width - 50, 10, 'F');
          
          doc.setFontSize(11);
          const activityName = splitTextToSize(activity.activityName, doc.internal.pageSize.width - 65);
          doc.text(activityName, 30, currentY);
          
          currentY += 15;
        });
      }

      // Add spacing between days
      currentY += 10;
    });

    // Add page break between cities if not the last city
    if (cityIndex < itinerary.cities.length - 1) {
      doc.addPage();
      currentY = 20;
    }
  });

  // Add footer with page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 10, {
      align: 'center'
    });
  }

  // Save the PDF
  doc.save('itinerary.pdf');
};