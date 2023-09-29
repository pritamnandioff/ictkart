const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const productorderhistorySchema = new Schema({
    reason: {
        type: String,
        default: ""
    },
    buyProductOrderId: {
        type: Schema.Types.ObjectId,
        default: null
    },
    userId:{
        type: Schema.Types.ObjectId,
        default: null
    },
    orderStatus: {
        type: String,
        enum: ['ordered', 'shipped', 'outForDelivery', 'delivered', 'return', 'cancel'],
        default: 'ordered'
    },
    status: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});


module.exports = mongoose.model("productorderhistories", productorderhistorySchema);