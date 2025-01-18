const ItineraryInquiry = require("../models/ItineraryInquiry");
const { v4: uuidv4 } = require('uuid');

// POST: Create a new itinerary inquiry
exports.createItineraryInquiry = async (req, res) => {
  try {
    const itineraryData = req.body;

    // Validate that necessary fields exist in the body
    if (!itineraryData || Object.keys(itineraryData).length === 0) {
      return res.status(400).json({ message: "Invalid input. Itinerary data is required." });
    }

    // Generate a unique token for the itinerary inquiry
    const itineraryInquiryToken = uuidv4();

    // Add the generated token to the itinerary data
    const itinerary = new ItineraryInquiry({
      ...itineraryData,
      itineraryInquiryToken,
    });

    // Save the inquiry to the database
    const savedItinerary = await itinerary.save();

    // Respond with the saved itinerary inquiry data
    res.status(201).json(savedItinerary);
  } catch (error) {
    console.error("Error creating itinerary inquiry:", error);
    res.status(500).json({ message: "Error creating itinerary inquiry", error });
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


exports.updateItineraryInquiry = async (req, res) => {
  try {
    const { token } = req.params;
    const updateData = req.body;

    const updatedInquiry = await ItineraryInquiry.findOneAndUpdate(
      { itineraryInquiryToken: token },
      updateData,
      { new: true }
    );

    if (!updatedInquiry) {
      return res.status(404).json({message: "Inquiry not found"});
    }

    res.status(200).json(updatedInquiry);
  } catch (error) {
    res.status(500).json({
      message: "Error updating inquiry",
      error: error.message
    });
  }
};