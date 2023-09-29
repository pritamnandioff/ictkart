const mongoose = require("mongoose");
const { Schema } = mongoose;
const bcrypt = require('bcryptjs');
const constants = require('../config/keys');
const serviceSchema = new Schema({
    vender: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    title: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    conditions: {
        type: String,
        default: ""
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        require: true
    },
    subcategory: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        require: true
    },
    images: [],
    thumbnail: {
        type: String,
        default: ""
    },
    basic: {
        originalPrice: {
            type: Number,
            default: 0
        },
        sellingPrice: {
            type: Number,
            default: 0
        },
        currency: {
            type: String,
            default: "AED"
        },
        chargesType: {
            type: String,
            enum: ['hourly', 'days', 'weekly', 'monthly'],
            default: 'days'
        },
        estimate: {
            type: Number,
            default: 0
        },
        estimateType: {
            type: String,
            enum: ['hourly', 'days', 'weekly', 'monthly'],
            default: 'days'
        }
    },
    status: {
        type: Boolean,
        default: true
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
serviceSchema.virtual('thumbnailImage').get(function () {
    return this.thumbnail ? IMG_URL + this.thumbnail : (this.images && this.images.length ? IMG_URL + this.images[0] : PRODUCT_URL);
});
module.exports = mongoose.model("services", serviceSchema);