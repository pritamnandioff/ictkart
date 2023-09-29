const mongoose = require("mongoose");
const { Schema } = mongoose;
const productSchema = new Schema({
    buyproducts: {
        type: Schema.Types.ObjectId,
        ref: 'buyproducts',
        require: true
    },
    productInvoice: {
        type: String,
        require: true
    },
    currency: {
        type: String,
        default: "AED"
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        require: true
    },
    vendor: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        default: null
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        default: null
    },
    service: {
        type: Schema.Types.ObjectId,
        ref: 'services',
        default: null
    },
    items: {
        type: String,
        default: ""
    },
    reason: {
        type: String,
        default: ""
    },
    sellingPrice: {
        type: Number,
        default: 0
    },
    originalPrice: {
        type: Number,
        default: 0
    },
    status: {
        type: Boolean,
        default: true
    },
    ordered: {
        type: Date,
        default: Date.now()
    },
    shipped: {
        type: Date,
        default: ""
    },
    outForDelivery: {
        type: Date,
        default: ""
    },
    delivered: {
        type: Date,
        default: ""
    },
    orderStatus: {
        type: String,
        enum: ['ordered', 'shipped', 'outForDelivery', 'delivered', 'return', 'cancel'],
        default: 'ordered'
    },
    shippedStatus: {
        type: Array,
        default: []
    },
    type: {
        type: String,
        enum: ['product', 'service', 'solution'],
        default: 'product'
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
module.exports = mongoose.model("buyproductorders", productSchema);