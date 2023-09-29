const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const regionalSchema = new Schema({
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    brand: {
        type: Schema.Types.ObjectId,
        ref: 'brands',
        default: null
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'categories',
        default: null
    },
    country: {
        type: String,
        default: ""
    },
    iso2: {
        type: String,
        default: ""
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
module.exports = mongoose.model("regionalpresences", regionalSchema);
