const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    transactionId: {
        type: String,
        default: ""
    },
    invoiceNumber: {
        type: String,
        require: true
    },
    orderId: {
        type: String,
        default: ""
    },
    paidAmount: {
        type: Number,
        default: 0
    },
    totalItems: {
        type: Number,
        default: 0
    },
    totalPrice: {
        type: Number,
        default: 0
    },
    totalDiscount: {
        type: Number,
        default: 0
    },
    deliveryCharges: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    appOrderId: {
        type: String,
        default: ""
    },
    shippingAddr: {
        type: Schema.Types.ObjectId,
        ref: 'addresses',
        default: null
    },
    from: {
        type: String,
        default: ""
    },
    paymentStatus: {
        type: Boolean,
        default: false
    },
    status: {
        type: Boolean,
        default: true
    },
    type:{
        type:String,
        enum: ['product','service','solution'],
        default:'product'
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

module.exports = mongoose.model("buyproducts", userSchema);