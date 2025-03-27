const express = require("express");
const router = express.Router();
const { getHotels } = require("../../controllers/hotelController/hotelControllerTC");

// Middleware
const checkAuth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }
  next();
};

const checkInquiryToken = (req, res, next) => {
  const inquiryToken = req.headers["x-inquiry-token"];
  if (!inquiryToken) {
    return res.status(401).json({ error: "Missing inquiry token" });
  }
  next();
};

router.post("/search", checkAuth, checkInquiryToken, async (req, res) => {
  try {
    const requestData = {
      ...req.body,
      inquiryToken: req.headers["x-inquiry-token"]
    };

    const hotels = await getHotels(requestData);
    res.json(hotels);
  } catch (error) {
    console.error("Error in hotel search:", error);
    res.status(500).json({
      success: false,
      error: "Hotel search failed",
      details: error.message
    });
  }
});

module.exports = router;