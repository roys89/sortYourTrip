const ItineraryInquiry = require("../models/ItineraryInquiry");
const { v4: uuidv4 } = require('uuid');

// POST: Create a new itinerary inquiry (handles both B2C and CRM)
exports.createItineraryInquiry = async (req, res) => {
  try {
    const itineraryData = req.body;

    // Validate input
    if (!itineraryData || Object.keys(itineraryData).length === 0) {
      return res.status(400).json({ message: "Invalid input. Itinerary data is required." });
    }
    
    // Basic validation for core fields (can be expanded)
    const isCrmRequest = itineraryData.agents && itineraryData.agents.length > 0;
    if (!itineraryData.selectedCities || itineraryData.selectedCities.length === 0 || 
        !itineraryData.departureDates?.startDate || !itineraryData.departureDates?.endDate ||
        !itineraryData.travelersDetails?.type || !itineraryData.travelersDetails?.rooms ||
        !itineraryData.preferences?.selectedInterests || !itineraryData.preferences?.budget ||
        (!isCrmRequest && !itineraryData.userInfo?.email) // Check email only if NOT a CRM request
       ) { 
       return res.status(400).json({ message: "Missing required itinerary information." });
    }

   

    // Generate a unique token for the itinerary inquiry
    const itineraryInquiryToken = Math.random().toString(36).substring(2, 10).toUpperCase();

    // Prepare data for saving
    const inquiryToSave = {
      ...itineraryData,
      itineraryInquiryToken,
      // Ensure agents array exists, even if empty for B2C
      agents: itineraryData.agents || [] 
    };

    // If agents array has data (indicating CRM request)
    if (isCrmRequest) { 
        console.log(`CRM agent initiated inquiry: ${inquiryToSave.agents[0]?.agentId}`);
        // No need to warn about missing userInfo.userId if we explicitly allow it
    } else {
        console.log("B2C customer initiated inquiry.");
        // For B2C, ensure userInfo might contain userId if logged in
    }

    // Create the inquiry instance
    const itinerary = new ItineraryInquiry(inquiryToSave);

    // Save the inquiry to the database
    const savedItinerary = await itinerary.save();

    // Respond with the saved itinerary inquiry data
    res.status(201).json(savedItinerary);
  } catch (error) {
    console.error("Error creating itinerary inquiry:", error);
    // Provide more specific error messages if possible
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: "Validation Error", details: error.errors });
    }
    res.status(500).json({ message: "Error creating itinerary inquiry", error: error.message });
  }
};

// GET: Retrieve itinerary inquiry by token
exports.getItineraryInquiryByToken = async (req, res) => {
  try {
    const { token } = req.params;

    // Find the itinerary inquiry by its token
    const itineraryInquiry = await ItineraryInquiry.findOne({ itineraryInquiryToken: token });

    // Check if the inquiry exists
    if (!itineraryInquiry) {
      return res.status(404).json({ message: "Itinerary inquiry not found" });
    }

    // Return the itinerary inquiry data
    res.status(200).json(itineraryInquiry);
  } catch (error) {
    console.error("Error retrieving itinerary inquiry:", error);
    res.status(500).json({ message: "Error retrieving itinerary inquiry", error });
  }
};

// PUT: Update itinerary inquiry by token
exports.updateItineraryInquiry = async (req, res) => {
  try {
    const { token } = req.params;
    const updateData = req.body;

    const updatedInquiry = await ItineraryInquiry.findOneAndUpdate(
      { itineraryInquiryToken: token },
      updateData,
      { new: true, runValidators: true } // Ensure validators run on update
    );

    if (!updatedInquiry) {
      return res.status(404).json({message: "Inquiry not found"});
    }

    res.status(200).json(updatedInquiry);
  } catch (error) {
    console.error("Error updating itinerary inquiry:", error);
     if (error.name === 'ValidationError') {
        return res.status(400).json({ message: "Validation Error", details: error.errors });
    }
    res.status(500).json({
      message: "Error updating inquiry",
      error: error.message
    });
  }
};