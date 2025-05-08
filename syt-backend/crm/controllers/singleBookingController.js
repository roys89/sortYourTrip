// crm/controllers/singleBookingController.js
const { getModels } = require('../models/Index');

// Controller for handling single bookings (hotel, flight, activity, transfer)
const singleBookingController = {
  // Save hotel booking data
  saveHotelBooking: async (req, res) => {
    try {
      const { HotelBooking, User } = getModels();
      
      // Get booking data from request body
      const bookingData = req.body;
      
      // Validate required fields
      if (!bookingData.bookingRefId) {
        return res.status(400).json({
          success: false,
          message: 'Booking reference ID is required'
        });
      }

      if (!bookingData.providerBookingResponse) {
        return res.status(400).json({
          success: false,
          message: 'Provider booking response is required'
        });
      }

      // Check if booking already exists
      const existingBooking = await HotelBooking.findOne({ bookingRefId: bookingData.bookingRefId });
      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: 'Booking with this reference ID already exists'
        });
      }

      // Get agent details from user ID
      let agentDetails = {
        agentId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        employeeId: req.user.employeeId
      };

      // If agent details are provided in the request, use those
      if (bookingData.agentDetails && bookingData.agentDetails.agentId) {
        const agent = await User.findById(bookingData.agentDetails.agentId);
        if (agent) {
          agentDetails = {
            agentId: agent._id,
            name: agent.name,
            email: agent.email,
            employeeId: agent.employeeId
          };
        }
      }

      // Create new booking with agent details
      const newBooking = new HotelBooking({
        ...bookingData,
        agentDetails
      });

      // Save booking to database
      await newBooking.save();

      // Return success response
      return res.status(201).json({
        success: true,
        message: 'Hotel booking saved successfully',
        data: newBooking
      });
    } catch (error) {
      console.error('Error saving hotel booking:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to save hotel booking',
        error: error.message
      });
    }
  },

  // Get all hotel bookings
  getAllHotelBookings: async (req, res) => {
    try {
      const { HotelBooking, User } = getModels();
      
      // Get query parameters
      const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      // Build query
      const query = {};
      if (status) {
        query.status = status;
      }

      // --- ADDED: Agent/Admin Filtering ---
      // Assuming 'admin' role allows seeing all, otherwise filter by agentId
      // You might need to adjust role checking based on your actual User model/auth setup
      if (req.user.role !== 'admin') { 
        query['agentDetails.agentId'] = req.user.id; 
      }
      // --- END: Agent/Admin Filtering ---
      
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      // Get total count
      const total = await HotelBooking.countDocuments(query);
      
      // Get bookings with pagination
      const bookings = await HotelBooking.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('agentDetails.agentId', 'name email employeeId');
      
      // Return bookings
      return res.status(200).json({
        success: true,
        count: bookings.length,
        total,
        data: bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting hotel bookings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get hotel bookings',
        error: error.message
      });
    }
  },

  // Get hotel booking by ID
  getHotelBookingById: async (req, res) => {
    try {
      const { HotelBooking } = getModels();
      
      // Get booking ID from params
      const { id } = req.params;
      
      // Get booking by ID
      const booking = await HotelBooking.findById(id)
        .populate('agentDetails.agentId', 'name email employeeId');
      
      // Check if booking exists
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Hotel booking not found'
        });
      }
      
      // Return booking
      return res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.error('Error getting hotel booking:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get hotel booking',
        error: error.message
      });
    }
  },

  // Update hotel booking payment details 
  updateHotelBooking: async (req, res) => {
    try {
      const { HotelBooking } = getModels();
      
      // Get booking ID from params
      const { id } = req.params;
      
      // Get update data from request body
      const updateData = req.body;
      
      // If payment details are being updated, prepare the update object using $set
      const updatePayload = { $set: {} };
      
      if (updateData.paymentDetails) {
        // Use dot notation for updating nested fields within paymentDetails
        if (updateData.paymentDetails.paymentMethod !== undefined) {
          updatePayload.$set['paymentDetails.paymentMethod'] = updateData.paymentDetails.paymentMethod;
        }
        if (updateData.paymentDetails.transactionId !== undefined) {
          updatePayload.$set['paymentDetails.transactionId'] = updateData.paymentDetails.transactionId;
        }
        if (updateData.paymentDetails.paymentStatus !== undefined) {
          updatePayload.$set['paymentDetails.paymentStatus'] = updateData.paymentDetails.paymentStatus;
        }
        if (updateData.paymentDetails.amountPaid !== undefined) {
          updatePayload.$set['paymentDetails.amountPaid'] = updateData.paymentDetails.amountPaid;
        }
      }
      
      // Handle hotelDetails updates if provided
      if (updateData.hotelDetails) {
        // Update individual fields of hotelDetails using dot notation
        if (updateData.hotelDetails.hotelName !== undefined) {
          updatePayload.$set['hotelDetails.hotelName'] = updateData.hotelDetails.hotelName;
        }
        if (updateData.hotelDetails.hotelContactInfo !== undefined) {
          updatePayload.$set['hotelDetails.hotelContactInfo'] = updateData.hotelDetails.hotelContactInfo;
        }
        if (updateData.hotelDetails.checkIn !== undefined) {
          updatePayload.$set['hotelDetails.checkIn'] = updateData.hotelDetails.checkIn;
        }
        if (updateData.hotelDetails.checkOut !== undefined) {
          updatePayload.$set['hotelDetails.checkOut'] = updateData.hotelDetails.checkOut;
        }
        if (updateData.hotelDetails.roomsCount !== undefined) {
          updatePayload.$set['hotelDetails.roomsCount'] = updateData.hotelDetails.roomsCount;
        }
        if (updateData.hotelDetails.totalDays !== undefined) {
          updatePayload.$set['hotelDetails.totalDays'] = updateData.hotelDetails.totalDays;
        }
        if (updateData.hotelDetails.hotelRating !== undefined) {
          updatePayload.$set['hotelDetails.hotelRating'] = updateData.hotelDetails.hotelRating;
        }
        if (updateData.hotelDetails.hotelLocation !== undefined) {
          updatePayload.$set['hotelDetails.hotelLocation'] = updateData.hotelDetails.hotelLocation;
        }
        if (updateData.hotelDetails.specialRequests !== undefined) {
          updatePayload.$set['hotelDetails.specialRequests'] = updateData.hotelDetails.specialRequests;
        }
      }
      
      // If no specific fields to update, update the entire object
      if (Object.keys(updatePayload.$set).length === 0) {
        updatePayload.$set = updateData;
      }
      
      // Update booking
      const updatedBooking = await HotelBooking.findByIdAndUpdate(
        id,
        updatePayload,
        { new: true, runValidators: true }
      );
      
      // Check if booking exists
      if (!updatedBooking) {
        return res.status(404).json({
          success: false,
          message: 'Hotel booking not found'
        });
      }
      
      // Return updated booking
      return res.status(200).json({
        success: true,
        message: 'Hotel booking updated successfully',
        data: updatedBooking
      });
    } catch (error) {
      console.error('Error updating hotel booking:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update hotel booking',
        error: error.message
      });
    }
  },

  // Delete hotel booking
  deleteHotelBooking: async (req, res) => {
    try {
      const { HotelBooking } = getModels();
      
      // Get booking ID from params
      const { id } = req.params;
      
      // Delete booking
      const deletedBooking = await HotelBooking.findByIdAndDelete(id);
      
      // Check if booking exists
      if (!deletedBooking) {
        return res.status(404).json({
          success: false,
          message: 'Hotel booking not found'
        });
      }
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Hotel booking deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting hotel booking:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete hotel booking',
        error: error.message
      });
    }
  },

  // Save flight booking data
  saveFlightBooking: async (req, res) => {
    try {
      const { FlightBooking, User } = getModels();

      // Get booking data from request body
      const { 
        bookingRefId, 
        traceId, 
        flightType, 
        passengerDetails, 
        paymentDetails, // Expecting { currency, totalFlightAmount, totalAncillariesAmount } 
        // --- NEW: Expect origin/destination details ---
        originCode,
        destinationCode,
        originCity,
        destinationCity,
        stops
        // --- END NEW --- 
      } = req.body;

      // --- Basic Validation ---
      if (!bookingRefId) {
        return res.status(400).json({ success: false, message: 'Booking reference ID (bookingRefId) is required' });
      }
      if (!traceId) {
        return res.status(400).json({ success: false, message: 'Trace ID is required' });
      }
      if (!flightType) {
        return res.status(400).json({ success: false, message: 'Flight type is required' });
      }
       if (!passengerDetails || !Array.isArray(passengerDetails) || passengerDetails.length === 0) {
        return res.status(400).json({ success: false, message: 'Passenger details are required' });
      }
      if (!paymentDetails || typeof paymentDetails !== 'object') {
        return res.status(400).json({ success: false, message: 'Payment details object is required' });
      }
      if (paymentDetails.totalFlightAmount === undefined || paymentDetails.totalAncillariesAmount === undefined) {
        return res.status(400).json({ success: false, message: 'totalFlightAmount and totalAncillariesAmount are required in paymentDetails' });
      }
      // --- End Basic Validation ---

      // Check if booking already exists by bookingRefId
      const existingBooking = await FlightBooking.findOne({ bookingRefId });
      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: 'Booking with this reference ID already exists'
        });
      }

      // Get agent details from authenticated user
      const agentDetails = {
        agentId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        employeeId: req.user.employeeId
      };

      // Get the complete booking data from request body
      const bookingData = req.body;
      
      // Add agent details from authenticated user
      bookingData.agentDetails = agentDetails;
      
      // Create and save the booking directly using the request payload
      // --- NEW: Include origin/dest/stops/city in the data to save ---
      bookingData.originCode = originCode;
      bookingData.destinationCode = destinationCode;
      bookingData.originCity = originCity;
      bookingData.destinationCity = destinationCity;
      bookingData.stops = stops;
      // --- END NEW ---
      const newBooking = new FlightBooking(bookingData);
      await newBooking.save();

      // Return success response
      return res.status(201).json({
        success: true,
        message: 'Flight booking saved successfully (Pending Payment/Confirmation)',
        data: newBooking // Return the newly created booking document
      });

    } catch (error) {
      console.error('Error saving flight booking:', error);
       // Check for duplicate key error (though checked earlier, belt and suspenders)
      if (error.code === 11000) {
          return res.status(400).json({
              success: false,
              message: 'Duplicate booking reference ID or other unique field.'
          });
      }
      // Check for validation errors
      if (error.name === 'ValidationError') {
          return res.status(400).json({
              success: false,
              message: 'Validation Error: ' + error.message,
              errors: error.errors
          });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to save flight booking',
        error: error.message
      });
    }
  },

  // Get all flight bookings
  getAllFlightBookings: async (req, res) => {
    try {
      const { FlightBooking } = getModels();
      
      // Get query parameters
      const { page = 1, limit = 10, status, flightType, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      // Build query
      const query = {};
      if (status) {
        query.status = status;
      }
      if (flightType) {
        query.flightType = flightType;
      }

      // --- ADDED: Agent/Admin Filtering ---
      // Assuming 'admin' role allows seeing all, otherwise filter by agentId
      if (req.user.role !== 'admin') { 
        query['agentDetails.agentId'] = req.user.id; 
      }
      // --- END: Agent/Admin Filtering ---
      
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      // Get total count
      const total = await FlightBooking.countDocuments(query);
      
      // Get bookings with pagination
      const bookings = await FlightBooking.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('agentDetails.agentId', 'name email employeeId');
      
      // Return bookings
      return res.status(200).json({
        success: true,
        count: bookings.length,
        total,
        data: bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting flight bookings:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get flight bookings',
        error: error.message
      });
    }
  },

  // Get flight booking by ID
  getFlightBookingById: async (req, res) => {
    try {
      const { FlightBooking } = getModels();
      
      // Get booking ID from params
      const { id } = req.params;
      
      // Get booking by ID
      const booking = await FlightBooking.findById(id)
        .populate('agentDetails.agentId', 'name email employeeId');
      
      // Check if booking exists
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: 'Flight booking not found'
        });
      }
      
      // Return booking
      return res.status(200).json({
        success: true,
        data: booking
      });
    } catch (error) {
      console.error('Error getting flight booking:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get flight booking',
        error: error.message
      });
    }
  },

  // Update flight booking
  updateFlightBooking: async (req, res) => {
    try {
      const { FlightBooking } = getModels();

      // Get booking ID from params
      const { id } = req.params; // Assuming ID is the MongoDB ObjectId

      // Get update data from request body
      const updateData = req.body;

      // Prepare the update object using $set for precise updates
      const updatePayload = { $set: {} };
      let needsStatusRecalculation = false;

      // --- Check for Payment Update Fields ---
      if (updateData.paymentDetails) {
        // Use dot notation for updating nested fields within paymentDetails
        if (updateData.paymentDetails.paymentMethod !== undefined) {
          updatePayload.$set['paymentDetails.paymentMethod'] = updateData.paymentDetails.paymentMethod;
        }
        if (updateData.paymentDetails.transactionId !== undefined) {
          updatePayload.$set['paymentDetails.transactionId'] = updateData.paymentDetails.transactionId;
        }
        if (updateData.paymentDetails.paymentStatus !== undefined) {
          // Validate paymentStatus enum if necessary (Mongoose does this on save)
          updatePayload.$set['paymentDetails.paymentStatus'] = updateData.paymentDetails.paymentStatus;
          needsStatusRecalculation = true; // Payment status change might affect overall status
        }
        if (updateData.paymentDetails.amountPaid !== undefined) {
          updatePayload.$set['paymentDetails.amountPaid'] = updateData.paymentDetails.amountPaid;
        }
        if (updateData.paymentDetails.remarks !== undefined) {
          updatePayload.$set['paymentDetails.remarks'] = updateData.paymentDetails.remarks;
        }
        if (updateData.paymentDetails.currency !== undefined) {
          updatePayload.$set['paymentDetails.currency'] = updateData.paymentDetails.currency;
        }
      }

      // --- Check for Provider Response Update Fields ---
      if (updateData.providerBookingResponse) {
        // Update the whole subdocument
        updatePayload.$set['providerBookingResponse'] = updateData.providerBookingResponse;
        needsStatusRecalculation = true; // Provider response definitely affects overall status
      }

      // --- Check for Top-Level bmsBookingCode Update ---
      if (updateData.bmsBookingCode !== undefined) {
         updatePayload.$set['bmsBookingCode'] = updateData.bmsBookingCode;
         // Typically doesn't directly trigger status recalculation itself
      }
      
      // --- Check for direct overallBookingStatus update ---
      if (updateData.overallBookingStatus !== undefined) {
          updatePayload.$set['overallBookingStatus'] = updateData.overallBookingStatus;
          // If status is set directly, maybe skip recalculation? Or let it be overridden?
          // For now, let's assume direct setting overrides recalculation unless other triggers exist.
          needsStatusRecalculation = needsStatusRecalculation || true; 
      }

      // If only timestamp needs updating (no actual data change sent)
      if (Object.keys(updatePayload.$set).length === 0) {
           updatePayload.$set['updatedAt'] = new Date(); // Force update timestamp
      }

      // --- Update the booking --- Find and update in one step
      const updatedBooking = await FlightBooking.findByIdAndUpdate(
        id,
        updatePayload,
        { new: true, runValidators: true } // Return the modified document and run schema validators
      );

      // Check if booking exists
      if (!updatedBooking) {
        return res.status(404).json({
          success: false,
          message: 'Flight booking not found'
        });
      }
      
      // --- Recalculate Overall Status if needed (after the update) ---
      // Note: This is a simplified recalculation logic. Real-world might be more complex.
      let finalStatus = updatedBooking.overallBookingStatus; // Start with current/updated status
      if (needsStatusRecalculation && !updateData.overallBookingStatus) { // Recalculate only if not directly set
           const paymentStatus = updatedBooking.paymentDetails.paymentStatus;
           const providerResponse = updatedBooking.providerBookingResponse;
           let providerConfirmed = false;
           
           if (providerResponse && providerResponse.data && providerResponse.data.results && providerResponse.data.results.details) {
               // Check if *all* essential segments are confirmed by provider
               providerConfirmed = providerResponse.data.results.details.every(
                   detail => detail.isSuccessful && detail.bookingStatus === 'CONFIRMED'
               );
               // Check if *any* segment failed
                const providerFailed = providerResponse.data.results.details.some(
                   detail => !detail.isSuccessful
               );
               if(providerFailed) finalStatus = 'Failed';
           }

           if (paymentStatus === 'Paid' && providerConfirmed) {
               finalStatus = 'Confirmed';
           } else if (paymentStatus === 'Failed') {
               finalStatus = 'Failed';
           } else if (finalStatus !== 'Failed') { // Don't override a failure status unless confirming
               finalStatus = 'Pending'; // Default back to pending if not fully confirmed or failed
           }
           
            // If the status changed, save it
            if (finalStatus !== updatedBooking.overallBookingStatus) {
                updatedBooking.overallBookingStatus = finalStatus;
                await updatedBooking.save(); // Save the status update
            }
      }

      // Return updated booking
      return res.status(200).json({
        success: true,
        message: 'Flight booking updated successfully',
        data: updatedBooking
      });

    } catch (error) {
      console.error('Error updating flight booking:', error);
       // Check for validation errors
      if (error.name === 'ValidationError') {
          return res.status(400).json({
              success: false,
              message: 'Validation Error: ' + error.message,
              errors: error.errors
          });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to update flight booking',
        error: error.message
      });
    }
  },

  // Delete flight booking
  deleteFlightBooking: async (req, res) => {
    try {
      const { FlightBooking } = getModels();
      
      // Get booking ID from params
      const { id } = req.params;
      
      // Delete booking
      const deletedBooking = await FlightBooking.findByIdAndDelete(id);
      
      // Check if booking exists
      if (!deletedBooking) {
        return res.status(404).json({
          success: false,
          message: 'Flight booking not found'
        });
      }
      
      // Return success response
      return res.status(200).json({
        success: true,
        message: 'Flight booking deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting flight booking:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete flight booking',
        error: error.message
      });
    }
  },

  // --- Transfer Booking Controllers ---

  // Save transfer booking data
  saveTransferBooking: async (req, res) => {
    try {
      const { TransferBooking, User } = getModels();
      const bookingData = req.body;

      // Validate required fields
      if (!bookingData.bookingRefId) {
        return res.status(400).json({ success: false, message: 'Booking reference ID is required' });
      }
      if (!bookingData.providerBookingResponse) {
        return res.status(400).json({ success: false, message: 'Provider booking response is required' });
      }
      if (!bookingData.guestDetails) {
        return res.status(400).json({ success: false, message: 'Guest details are required' });
      }
      if (!bookingData.transferDetails) {
        return res.status(400).json({ success: false, message: 'Transfer details are required' });
      }
      if (!bookingData.paymentDetails) {
         return res.status(400).json({ success: false, message: 'Payment details are required' });
      }

      // Check if booking already exists
      const existingBooking = await TransferBooking.findOne({ bookingRefId: bookingData.bookingRefId });
      if (existingBooking) {
        return res.status(400).json({
          success: false,
          message: 'Transfer booking with this reference ID already exists'
        });
      }

      // Get agent details from authenticated user
      const agentDetails = {
        agentId: req.user.id,
        name: req.user.name,
        email: req.user.email,
        employeeId: req.user.employeeId
      };

      // Create new booking with agent details
      const newBooking = new TransferBooking({
        ...bookingData,
        agentDetails
      });

      // Save booking to database
      await newBooking.save();

      return res.status(201).json({
        success: true,
        message: 'Transfer booking saved successfully',
        data: newBooking
      });
    } catch (error) {
      console.error('Error saving transfer booking:', error);
       if (error.code === 11000) {
        return res.status(400).json({ success: false, message: 'Duplicate booking reference ID.' });
      }
      if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: 'Validation Error: ' + error.message, errors: error.errors });
      }
      return res.status(500).json({
        success: false,
        message: 'Failed to save transfer booking',
        error: error.message
      });
    }
  },

  // Get all transfer bookings
  getAllTransferBookings: async (req, res) => {
    try {
      const { TransferBooking } = getModels();
      const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
      
      const query = {};
      if (status) query.status = status;

      if (req.user.role !== 'admin') { 
        query['agentDetails.agentId'] = req.user.id; 
      }
      
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      const total = await TransferBooking.countDocuments(query);
      const bookings = await TransferBooking.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('agentDetails.agentId', 'name email employeeId');
      
      return res.status(200).json({
        success: true,
        count: bookings.length,
        total,
        data: bookings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Error getting transfer bookings:', error);
      return res.status(500).json({ success: false, message: 'Failed to get transfer bookings', error: error.message });
    }
  },

  // Get transfer booking by ID
  getTransferBookingById: async (req, res) => {
    try {
      const { TransferBooking } = getModels();
      const { id } = req.params;
      const booking = await TransferBooking.findById(id)
        .populate('agentDetails.agentId', 'name email employeeId');
      
      if (!booking) {
        return res.status(404).json({ success: false, message: 'Transfer booking not found' });
      }
      
      return res.status(200).json({ success: true, data: booking });
    } catch (error) {
      console.error('Error getting transfer booking:', error);
      return res.status(500).json({ success: false, message: 'Failed to get transfer booking', error: error.message });
    }
  },

  // Update transfer booking
  updateTransferBooking: async (req, res) => {
    try {
      const { TransferBooking } = getModels();
      const { id } = req.params;
      const updateData = req.body;

      // Prepare update payload using $set for specific fields
      const updatePayload = { $set: {} };

      // Example: Update payment details
      if (updateData.paymentDetails) {
        Object.keys(updateData.paymentDetails).forEach(key => {
          updatePayload.$set[`paymentDetails.${key}`] = updateData.paymentDetails[key];
        });
      }
      // Example: Update status
      if (updateData.status) {
         updatePayload.$set.status = updateData.status;
      }
       // Example: Update notes
      if (updateData.notes) {
         updatePayload.$set.notes = updateData.notes;
      }
      // Add other fields as needed

      // If no specific fields targeted, update the whole doc (less safe)
      if (Object.keys(updatePayload.$set).length === 0) {
         updatePayload.$set = updateData;
      }
      
      const updatedBooking = await TransferBooking.findByIdAndUpdate(
        id,
        updatePayload,
        { new: true, runValidators: true }
      );
      
      if (!updatedBooking) {
        return res.status(404).json({ success: false, message: 'Transfer booking not found' });
      }
      
      return res.status(200).json({
        success: true,
        message: 'Transfer booking updated successfully',
        data: updatedBooking
      });
    } catch (error) {
      console.error('Error updating transfer booking:', error);
       if (error.name === 'ValidationError') {
        return res.status(400).json({ success: false, message: 'Validation Error: ' + error.message, errors: error.errors });
      }
      return res.status(500).json({ success: false, message: 'Failed to update transfer booking', error: error.message });
    }
  },

  // Delete transfer booking
  deleteTransferBooking: async (req, res) => {
    try {
      const { TransferBooking } = getModels();
      const { id } = req.params;
      const deletedBooking = await TransferBooking.findByIdAndDelete(id);
      
      if (!deletedBooking) {
        return res.status(404).json({ success: false, message: 'Transfer booking not found' });
      }
      
      return res.status(200).json({ success: true, message: 'Transfer booking deleted successfully' });
    } catch (error) {
      console.error('Error deleting transfer booking:', error);
      return res.status(500).json({ success: false, message: 'Failed to delete transfer booking', error: error.message });
    }
  }
};

module.exports = singleBookingController;
