// controllers/activityController.js
const Activity = require('../models/itineraryModel/Activity');

// Get all activities with optional filtering
exports.getAllActivities = async (req, res) => {
    try {
        const { 
            activityType, 
            city, 
            country, 
            budget, 
            timeSlot,
            category,
            page = 1,
            limit = 10
        } = req.query;

        const query = {};
        
        // Add filters if provided
        if (activityType) query.activityType = activityType;
        if (city) query.city = new RegExp(city, 'i');
        if (country) query.country = new RegExp(country, 'i');
        if (budget) query.budget = budget;
        if (timeSlot) query.timeSlot = timeSlot;
        if (category) query.category = new RegExp(category, 'i');

        const skip = (page - 1) * limit;

        const activities = await Activity.find(query)
            .skip(skip)
            .limit(parseInt(limit))
            .sort({ ranking: 1 });

        const total = await Activity.countDocuments(query);

        res.status(200).json({
            success: true,
            count: activities.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / limit),
            data: activities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving activities",
            error: error.message
        });
    }
};

// Get activity by activity code
exports.getActivityByCode = async (req, res) => {
    try {
        const activity = await Activity.findOne({ activityCode: req.params.activityCode });
        
        if (!activity) {
            return res.status(404).json({
                success: false,
                message: "Activity not found"
            });
        }

        res.status(200).json({
            success: true,
            data: activity
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving activity",
            error: error.message
        });
    }
};

// Get activities by destination
exports.getActivitiesByDestination = async (req, res) => {
    try {
        const activities = await Activity.find({ 
            destinationCode: req.params.destinationCode 
        }).sort({ ranking: 1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving activities for destination",
            error: error.message
        });
    }
};

// Create new activity
exports.createActivity = async (req, res) => {
    try {
        const newActivity = new Activity(req.body);
        const savedActivity = await newActivity.save();

        res.status(201).json({
            success: true,
            message: "Activity created successfully",
            data: savedActivity
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error creating activity",
            error: error.message
        });
    }
};

// Update activity
exports.updateActivity = async (req, res) => {
    try {
        const updatedActivity = await Activity.findOneAndUpdate(
            { activityCode: req.params.activityCode },
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedActivity) {
            return res.status(404).json({
                success: false,
                message: "Activity not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Activity updated successfully",
            data: updatedActivity
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Error updating activity",
            error: error.message
        });
    }
};

// Delete activity
exports.deleteActivity = async (req, res) => {
    try {
        const deletedActivity = await Activity.findOneAndDelete({
            activityCode: req.params.activityCode
        });

        if (!deletedActivity) {
            return res.status(404).json({
                success: false,
                message: "Activity not found"
            });
        }

        res.status(200).json({
            success: true,
            message: "Activity deleted successfully"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error deleting activity",
            error: error.message
        });
    }
};

// Get activities by budget
exports.getActivitiesByBudget = async (req, res) => {
    try {
        const activities = await Activity.find({ 
            budget: req.params.budget 
        }).sort({ ranking: 1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving activities by budget",
            error: error.message
        });
    }
};

// Get activities by time slot
exports.getActivitiesByTimeSlot = async (req, res) => {
    try {
        const activities = await Activity.find({ 
            timeSlot: req.params.timeSlot 
        }).sort({ ranking: 1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving activities by time slot",
            error: error.message
        });
    }
};

// Get activities by category
exports.getActivitiesByCategory = async (req, res) => {
    try {
        const activities = await Activity.find({ 
            category: new RegExp(req.params.category, 'i')
        }).sort({ ranking: 1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving activities by category",
            error: error.message
        });
    }
};

// Get activities by duration range
exports.getActivitiesByDuration = async (req, res) => {
    try {
        const { minDuration, maxDuration } = req.params;
        const activities = await Activity.find({ 
            duration: { 
                $gte: parseInt(minDuration), 
                $lte: parseInt(maxDuration) 
            } 
        }).sort({ duration: 1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving activities by duration",
            error: error.message
        });
    }
};

// Get activities by minimum rating
exports.getActivitiesByRating = async (req, res) => {
    try {
        const activities = await Activity.find({ 
            rating: { $gte: parseFloat(req.params.minRating) } 
        }).sort({ rating: -1 });

        res.status(200).json({
            success: true,
            count: activities.length,
            data: activities
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error retrieving activities by rating",
            error: error.message
        });
    }
};