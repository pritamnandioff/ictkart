const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema({
    specifications: [{
        label: {
            type: String,
            default: ""
        },
        value: {
            type: String,
            default: ""
        }
    }],
    generalSpecification:[],
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'products',
        default: null
    },
    description: {
        type: String,
        default: ""
    },
    status: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});
module.exports = mongoose.model("productspecifications", userSchema);