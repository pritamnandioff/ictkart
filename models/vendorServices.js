const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');
const constants = require('../config/keys');
const vendorServiceSchema = new Schema({
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
    },
    title: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    about: {
        type: String,
        default: ""
    },
    serviceCategory: [{
        type: Schema.Types.ObjectId,
        ref: 'services',
        default: []
    }],
    basicPlan: [{
        price: {
            type: Number,
            default: ""
        },
        validFor: {
            type: String,
            default: ""
        }
    }],
    standardPlan: [{
        price: {
            type: Number,
            default: ""
        },
        validFor: {
            type: String,
            default: ""
        }
    }],
    premiumPlan: [{
        price: {
            type: Number,
            default: ""
        },
        validFor: {
            type: String,
            default: ""
        }
    }],
    status: {
        type: Boolean,
        default: true
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

module.exports = mongoose.model("vendorservices", vendorServiceSchema);