const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        default: null
        // required: true
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        // required: true
        default: null
    },
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        // required: true
        default: null
    },
    ratingFor: {
        type: String,
        enum: ['vendor', 'product', 'service'],
        default: 'product'
    },
    rate: {
        type: Number,
        default: 0
    },
    title: {
        type: String,
        default: ""
    },
    comments: {
        type: String,
        default: ""
    },
    likes: [{
        type: Schema.Types.ObjectId,
        ref: 'users',
    }],
    images: [],
    status: {
        type: Boolean,
        default: true
    },
    approvedStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
module.exports = mongoose.model("reviewratings", userSchema);