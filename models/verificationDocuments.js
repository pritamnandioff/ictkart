const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const verificationSchema = new Schema({
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    title: {
        type: String,
        default: ""
    },
    slug: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ['pending', 'rejected', 'approved'],
        default: "pending"
    },
    documentURL: {
        type: String,
        default: ""
    },
    expiryDate: {
        type: Date,
        default: ""
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
module.exports = mongoose.model("verificationDocs", verificationSchema);
