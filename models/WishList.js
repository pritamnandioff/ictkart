const mongoose = require("mongoose");
const { Schema } = mongoose;
const wishListSchema = new Schema({
    productId: [{
        type: Schema.Types.ObjectId,
        ref: 'products',
        default: null
    }],
    serviceId: [{
        type: Schema.Types.ObjectId,
        ref: 'services',
        default: null
    }],
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    type: {
        type: String,
        enum: ['view', 'wishlist'],
        default: "wishlist"
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
module.exports = mongoose.model("wishlists", wishListSchema);