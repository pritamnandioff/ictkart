const mongoose = require("mongoose");
const Schema = mongoose.Schema;

blogSchema = new Schema({
    type: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    urlKey: {
        type: String,
        default: ''
    },
    metaTitle: {
        type: String,
        default: ''
    },
    metaKewords: {
        type: String,
        default: ''
    },
    metaDescription: {
        type: String,
        default: ''
    },
    status: {
        type: Boolean,
        default: false
    },
    image: {
        type: String,
        default: ""
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});


module.exports = mongoose.model("blogs", blogSchema);