const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const comapanyInfoSchema = new Schema({
    vendorId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    companyName: {
        type: String,
        default: ""
    },
    email: {
        type: String,
        default: ""
    },
    website: {
        type: String,
        default: ""
    },
    dialCode: {
        type: String,
        default: '91'
    },
    mobile: {
        type: String,
        default: ''
    },
    dnb: {
        type: String,
        default: ""
    },
    bussinessType: {
        type: String,
        default: ""
    },
    address: {
        type: String,
        default: ""
    },
    country: {
        type: String,
        default: ""
    },
    currency: {
        type: String,
        default: "AED"
    },
    gstNumber: {
        type: String,
        default: ""
    },
    state: {
        type: String,
        default: ""
    },
    city: {
        type: String,
        default: ""
    },
    dateOfEstablishment: {
        type: Date,
        default: ""
    },
    totalEmployees: {
        type: String,
        default: ""
    },
    categories: [{
        type: String,
        default: ""
    }],
    description: {
        type: String,
        default: ""
    },
    slogan: {
        type: String,
        default: ""
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
comapanyInfoSchema.statics.findVendorCurrency = function () {
    return this.find({}, { currency: 1, vendorId: 1 });
}
module.exports = mongoose.model("companyInfos", comapanyInfoSchema);
