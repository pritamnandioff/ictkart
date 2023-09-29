const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const brandPartnerShipSchema = new Schema({
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    brand: {
        type: Schema.Types.ObjectId,
        ref: 'brands',
        require: true
    },
    relationship: {
        type: String,
        default: ""
    },
    documentFile: {
        type: String,
        default: ""
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
module.exports = mongoose.model("brandPartenships", brandPartnerShipSchema);
