const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const bannerSchema = new Schema({
    first: {
        image: {
            type: String,
            default: ""
        },
        targetUrl: {
            type: String,
            default: ""
        },
    },
    second: {
        image: {
            type: String,
            default: ""
        },
        targetUrl: {
            type: String,
            default: ""
        },
    },
    third: {
        image: {
            type: String,
            default: ""
        },
        targetUrl: {
            type: String,
            default: ""
        },
    },
    fourth: {
        image: {
            type: String,
            default: ""
        },
        targetUrl: {
            type: String,
            default: ""
        },
    },
    displayAt: {
        type: String,
        default: "home"
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

module.exports = mongoose.model("pramotionalbanners", bannerSchema);