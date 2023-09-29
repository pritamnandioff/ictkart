const mongoose = require("mongoose");
const { Schema } = mongoose;
const userSchema = new Schema({
    vendor: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    name: {
        type: String,
        default: ""
    },
    description: {
        type: String,
        default: ""
    },
    permissions: {
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
module.exports = mongoose.model("roles", userSchema);