const mongoose = require('mongoose');

const cancellationFeeSchema = new mongoose.Schema({
    itemType: {
        type: String,
        required: true,
        enum: ['Flight', 'Hotel', 'Activity', 'Transfer'], // Ensure consistency with item types used in service
        unique: true // Only one setting per item type
    },
    feeType: {
        type: String,
        required: true,
        enum: ['Percentage', 'Fixed'] 
    },
    feeValue: {
        type: Number,
        required: true,
        min: 0
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Ensure unique itemType
cancellationFeeSchema.index({ itemType: 1 }, { unique: true });

cancellationFeeSchema.statics.getFeeSettings = async function() {
    // Helper static method to get active settings easily
    try {
        const fees = await this.find({ isActive: true });
        return fees;
    } catch (error) {
        console.error("Error fetching cancellation fee settings:", error);
        return []; // Return empty array on error
    }
};

const CancellationFee = mongoose.model('CancellationFee', cancellationFeeSchema);

module.exports = CancellationFee; 