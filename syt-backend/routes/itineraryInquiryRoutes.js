const express = require("express");
const router = express.Router();

const {
  createItineraryInquiry,
  getItineraryInquiryByToken,
  updateItineraryInquiry
} = require("../controllers/itineraryInquiryController");

// Middleware
const checkAuth = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }
  next();
};

// Routes
router.post("/", checkAuth, createItineraryInquiry);
router.get("/:token", getItineraryInquiryByToken);
router.put("/:token", checkAuth, updateItineraryInquiry);

module.exports = router;